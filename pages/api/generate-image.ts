import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // For demonstration, use placeholder image service
    // In a real app, you would use a proper image generation API like DALL-E or Stable Diffusion
    const seed = encodeURIComponent(prompt.slice(0, 30));
    const placeholderImageUrl = `https://picsum.photos/seed/${seed}/800/600`;

    return res.status(200).json({
      imageUrl: placeholderImageUrl,
      prompt
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ 
      message: 'Error generating image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
