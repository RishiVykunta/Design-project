import fs from 'fs';
import path from 'path';

/**
 * Streams sample image files from local disk repository.
 */
export default function handler(req, res) {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Filename is required' });
  }

  // Sanitize name to prevent directory traversal
  const safeName = path.basename(name);

  const candidatePaths = [
    path.resolve(process.cwd(), `../examples/${safeName}`),
    path.resolve(process.cwd(), `../SID_Set/test/real/${safeName}`),
    path.resolve(process.cwd(), `../SID_Set/test/full_synthetic/${safeName}`),
    path.resolve(process.cwd(), `../SID_Set/test/tampered/${safeName}`),
  ];

  let targetPath = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    return res.status(404).json({ error: 'Sample image not found on disk' });
  }

  const ext = path.extname(safeName).toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.webp') contentType = 'image/webp';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  const stream = fs.createReadStream(targetPath);
  return stream.pipe(res);
}
