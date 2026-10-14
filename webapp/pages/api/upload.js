import { put } from '@vercel/blob';
import multer from 'multer';
import { Pool } from 'pg';

// Configure Multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize Neon PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const config = {
  api: {
    bodyParser: false, // needed for multer
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Parse multipart form data
    await new Promise((resolve, reject) => {
      upload.single('image')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file received in request' });
    }

    // 2. Upload to Vercel Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is missing. Connect a Vercel Blob store in your Vercel project storage tab.');
    }

    const blob = await put(file.originalname, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // 3. Store record in Neon Database
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL environment variable is missing in Vercel settings.');
    }

    const client = await pool.connect();
    const query = `
      INSERT INTO images (filename, url, uploaded_at) 
      VALUES ($1, $2, NOW()) 
      RETURNING id, filename, url, uploaded_at
    `;
    const result = await client.query(query, [file.originalname, blob.url]);
    client.release();

    return res.status(200).json({
      success: true,
      id: result.rows[0].id,
      url: blob.url,
      filename: result.rows[0].filename,
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
