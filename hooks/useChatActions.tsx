import { useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { useChatContext, Message, ChatMode } from '../contexts/ChatContext';
import { saveUsername } from '../utils/userStorage';

export const useChatActions = () => {
  const { t } = useTranslation('common');
  const {
    messages,
    setMessages,
    input,
    setInput,
    model,
    isLoading,
    setIsLoading,
    chatMode,
    setChatMode,
    settings,
    setSettings,
    username,
    setUsername,
    setIsRegenerating,
    setRegeneratingId
  } = useChatContext();

  // Chat mode configuration with description and parameters
  const chatModes = {
    standard: {
      name: t('standardMode'),
      description: t('standardModeDesc'),
      temperature: 0.7,
      responseLength: 'medium' as const,
    },
    creative: {
      name: t('creativeMode'),
      description: t('creativeModeDesc'),
      temperature: 0.9,
      responseLength: 'medium' as const,
    },
    precise: {
      name: t('preciseMode'),
      description: t('preciseModeDesc'),
      temperature: 0.3,
      responseLength: 'medium' as const,
    },
    coding: {
      name: t('codingMode'),
      description: t('codingModeDesc'),
      temperature: 0.5,
      responseLength: 'medium' as const,
    },
    learning: {
      name: t('learningMode'),
      description: t('learningModeDesc'),
      temperature: 0.6,
      responseLength: 'long' as const,
    },
    concise: {
      name: t('conciseMode'),
      description: t('conciseModeDesc'),
      temperature: 0.4,
      responseLength: 'short' as const,
    }
  };

  // Handle chat mode change
  const handleChatModeChange = useCallback((mode: ChatMode) => {
    setChatMode(mode);
    // Update temperature and responseLength based on the selected mode
    setSettings(prev => ({
      ...prev,
      chatMode: mode,
      temperature: chatModes[mode].temperature,
      responseLength: chatModes[mode].responseLength
    }));
  }, [setChatMode, setSettings, chatModes]);

  // Send message
  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input, 
      timestamp: Date.now(), 
      model 
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Add system prompt prefix based on the chat mode
    const currentMode = settings.chatMode;
    let systemPrompt = '';
    switch(currentMode) {
      case 'creative':
        systemPrompt = "I want you to be creative, imaginative and expressive in your responses. Feel free to explore interesting ideas and unique angles.";
        break;
      case 'precise':
        systemPrompt = "I want you to be factual, precise, and concise. Focus on accuracy and clarity in your responses.";
        break;
      case 'coding':
        systemPrompt = "I want you to focus on providing code, technical explanations, and programming help. Use proper formatting for code blocks.";
        break;
      case 'learning':
        systemPrompt = "I want you to explain concepts thoroughly in an educational manner. Break down complex topics and provide examples to help understanding.";
        break;
      case 'concise':
        systemPrompt = "I want you to be brief and to the point. Provide short, direct answers without unnecessary details.";
        break;
      default: // standard
        systemPrompt = ""; // No special prompt for standard mode
    }

    // Create the full message with system prompt if needed
    const fullMessage = systemPrompt ? `${systemPrompt}\n\nUser query: ${input}` : input;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: fullMessage,
          model,
          responseLength: chatModes[currentMode].responseLength,
          temperature: chatModes[currentMode].temperature,
          chatMode: currentMode,
          apiKey: settings.apiKeys[model as keyof typeof settings.apiKeys] || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (model === 'claude') {
        // Handle streaming response for Claude
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        setMessages((prev) => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: '', 
          timestamp: Date.now(), 
          model 
        }]);

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.text) {
                  fullText += data.text;
                  setMessages((prev) => [
                    ...prev.slice(0, -1),
                    { 
                      id: Date.now().toString(), 
                      role: 'assistant', 
                      content: fullText, 
                      timestamp: Date.now(), 
                      model 
                    }
                  ]);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } else {
        // Handle regular responses for other models
        const data = await response.json();
        const assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.text || 'Sorry, I could not process that.',
          timestamp: Date.now(),
          model
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Something went wrong'}`,
        timestamp: Date.now(),
        model
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, model, settings.chatMode, settings.apiKeys, setIsLoading, setMessages, setInput, chatModes]);

  // Clear chat
  const clearChat = useCallback(() => {
    if (window.confirm(t('clearConfirmation'))) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
  }, [t, setMessages]);

  // Function to regenerate an assistant response
  const regenerateResponse = useCallback(async (messageId: string) => {
    // Find the user message that triggered the assistant response
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    let userMessageIndex = messageIndex - 1;
    
    // Make sure we find a user message
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex < 0) return;
    
    const userMessage = messages[userMessageIndex];
    
    // Set regenerating state
    setIsRegenerating(true);
    setRegeneratingId(messageId);
    
    // Remove the assistant message to be regenerated
    const newMessages = [...messages.slice(0, messageIndex)];
    setMessages(newMessages);
    
    // Create a new input with the user message content and send it
    const savedInput = input;
    setInput(userMessage.content);
    
    // We need to manually call sendMessage with the user's original message
    await sendMessage();
    
    // Restore the input
    setInput(savedInput);
    
    // Clear regenerating state
    setIsRegenerating(false);
    setRegeneratingId(null);
  }, [messages, input, setInput, setIsRegenerating, setRegeneratingId, setMessages, sendMessage]);

  // Update username
  const updateUsername = useCallback((newUsername: string) => {
    setUsername(newUsername);
    saveUsername(newUsername);
  }, [setUsername]);

  return {
    handleChatModeChange,
    sendMessage,
    clearChat,
    regenerateResponse,
    updateUsername,
    chatModes
  };
};
