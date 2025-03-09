import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
    });
    
    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return res.status(500).json({ error: 'File upload failed' });
        }
        
        const file = files.file;
        if (!file || Array.isArray(file)) {
          return res.status(400).json({ error: 'Invalid file' });
        }
        
        const fileName = file.newFilename;
        const filePath = `/uploads/${fileName}`;
        
        resolve(true);
        return res.status(200).json({ 
          fileName, 
          filePath,
          url: `${req.headers.host}${filePath}`
        });
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
}
