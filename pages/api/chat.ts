import { NextApiRequest, NextApiResponse } from 'next';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, model, responseLength = 'medium', temperature = 0.7, chatMode = 'standard', apiKey } = req.body;
  
  // Calculate max tokens based on response length setting
  const getMaxTokens = () => {
    switch (responseLength) {
      case 'short': return 300;
      case 'medium': return 1000;
      case 'long': return 2000;
      default: return 1000;
    }
  };

  const maxTokens = getMaxTokens();

  // Optional: Add specialized model parameters based on chat mode
  const getModeSpecificParams = (modelType: string) => {
    // Base settings
    const params: any = { 
      temperature: parseFloat(temperature.toString()),
      max_tokens: maxTokens
    };
    
    // Add model-specific adjustments for each chat mode
    switch (chatMode) {
      case 'coding':
        // Optimal for code generation
        if (modelType === 'gemini') {
          params.topP = 0.95;
          params.topK = 40;
        } else if (modelType === 'mistral') {
          params.top_p = 0.95;
        }
        break;
        
      case 'precise':
        // Lower temperature already set, but add other precision parameters
        if (modelType === 'gemini') {
          params.topP = 0.75;
        } else if (modelType === 'mistral') {
          params.top_p = 0.75;
        }
        break;
        
      case 'creative':
        // Higher temperature already set, can add other creativity parameters
        if (modelType === 'gemini') {
          params.topP = 0.98;
          params.topK = 60;
        } else if (modelType === 'mistral') {
          params.top_p = 0.98;
        }
        break;
        
      // Add any other mode-specific parameter adjustments
    }
    
    return params;
  };

  try {
    switch (model) {
      case 'gemini': {
        // Use user's API key if provided, otherwise use environment variable
        const currentApiKey = apiKey || process.env.GEMINI_API_KEY;

        if (!currentApiKey) {
          return res.status(400).json({ 
            error: 'Missing API key for Gemini',
            requiresApiKey: true
          });
        }

        // Test that the Gemini API key is roughly valid (it should be a non-empty string)
        if (typeof currentApiKey !== 'string' || !currentApiKey.trim()) {
          return res.status(401).json({ 
            error: 'Invalid Gemini API key format',
            invalidApiKey: true
          });
        }

        // Apply chat mode specific parameters
        const modeParams = getModeSpecificParams('gemini');
        
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${currentApiKey}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: message
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: modeParams.temperature,
              topP: modeParams.topP || undefined,
              topK: modeParams.topK || undefined
            }
          }),
        });

        // Handle error responses
        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error('Gemini API Error:', errorText);
          return res.status(geminiResponse.status).json({ 
            error: `Gemini API error: ${geminiResponse.statusText}`,
            details: errorText,
            invalidApiKey: geminiResponse.status === 400 || geminiResponse.status === 401
          });
        }

        const geminiData = await geminiResponse.json();
        
        if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
          return res.status(500).json({ error: 'Invalid response structure from Gemini' });
        }

        return res.status(200).json({
          text: geminiData.candidates[0].content.parts[0].text,
          chatMode: chatMode // Return the chat mode used
        });
      }

      case 'claude': {
        // Use user's API key if provided, otherwise use environment variable
        const currentApiKey = apiKey || process.env.CLAUDE_API_KEY;

        if (!currentApiKey) {
          return res.status(400).json({ 
            error: 'Missing API key for Claude',
            requiresApiKey: true
          });
        }

        // Test that the Claude API key is roughly valid (it should be a non-empty string)
        if (typeof currentApiKey !== 'string' || !currentApiKey.trim()) {
          return res.status(401).json({ 
            error: 'Invalid Claude API key format',
            invalidApiKey: true
          });
        }

        // Apply chat mode specific parameters
        const modeParams = getModeSpecificParams('claude');
        
        const claudeResponse = await fetch(CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': currentApiKey,
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            messages: [{ role: 'user', content: message }],
            stream: true,
            max_tokens: maxTokens,
            temperature: modeParams.temperature,
          }),
        });

        if (!claudeResponse.ok) {
          const errorText = await claudeResponse.text();
          console.error('Claude API Error:', errorText);
          return res.status(claudeResponse.status).json({ 
            error: `Claude API error: ${claudeResponse.statusText}`,
            details: errorText,
            invalidApiKey: claudeResponse.status === 400 || claudeResponse.status === 401
          });
        }

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = claudeResponse.body?.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'content_block_delta' && data.delta?.text) {
                    res.write(`data: ${JSON.stringify({ 
                      text: data.delta.text,
                      chatMode: chatMode // Add the chat mode to stream data
                    })}\n\n`);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        } finally {
          reader?.releaseLock();
          res.end();
        }
        return;
      }

      case 'mistral': {
        // Use user's API key if provided, otherwise use environment variable
        const currentApiKey = apiKey || process.env.MISTRAL_API_KEY;

        if (!currentApiKey) {
          return res.status(400).json({ 
            error: 'Missing API key for Mistral',
            requiresApiKey: true
          });
        }

        // Test that the Mistral API key is roughly valid (it should be a non-empty string)
        if (typeof currentApiKey !== 'string' || !currentApiKey.trim()) {
          return res.status(401).json({ 
            error: 'Invalid Mistral API key format',
            invalidApiKey: true
          });
        }

        // Apply chat mode specific parameters
        const modeParams = getModeSpecificParams('mistral');
        
        const mistralResponse = await fetch(MISTRAL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentApiKey}`
          },
          body: JSON.stringify({
            model: 'mistral-tiny',
            messages: [{ role: 'user', content: message }],
            max_tokens: maxTokens,
            temperature: modeParams.temperature,
            top_p: modeParams.top_p || undefined
          }),
        });

        if (!mistralResponse.ok) {
          const errorText = await mistralResponse.text();
          console.error('Mistral API Error:', errorText);
          return res.status(mistralResponse.status).json({ 
            error: `Mistral API error: ${mistralResponse.statusText}`,
            details: errorText,
            invalidApiKey: mistralResponse.status === 400 || mistralResponse.status === 401
          });
        }

        const mistralData = await mistralResponse.json();
        return res.status(200).json({
          text: mistralData.choices?.[0]?.message?.content || 'No response from Mistral',
          chatMode: chatMode
        });
      }

      default:
        return res.status(400).json({ message: 'Invalid model specified' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
