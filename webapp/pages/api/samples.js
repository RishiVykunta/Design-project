import fs from 'fs';
import path from 'path';

/**
 * Returns available benchmark and test samples for quick evaluation.
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const samples = [
    {
      id: 'figure1.png',
      name: 'figure1.png',
      label: 'Figure 1 — Localized Splicing',
      type: 'Tampered',
      typeLabel: 'Suspected Manipulation',
      badgeColor: '#FB7185',
      description: 'Benchmark composite sample with localized boundary discontinuities and facial splicing.',
      dimensions: '512 × 512',
      hasMask: true,
    },
    {
      id: 'test_0001.jpg',
      name: 'test_0001.jpg',
      label: 'Test 0001 — Genuine Photograph',
      type: 'Real',
      typeLabel: 'Likely Authentic',
      badgeColor: '#34D399',
      description: 'Authentic camera capture with natural Bayer sensor noise and coherent optical illumination.',
      dimensions: '1024 × 768',
      hasMask: false,
    },
    {
      id: 'test_0000.png',
      name: 'test_0000.png',
      label: 'Test 0000 — Generative AI Synthesis',
      type: 'Full Synthetic',
      typeLabel: 'Likely AI-Generated',
      badgeColor: '#A78BFA',
      description: 'Diffusion model generation with global latent smoothing and characteristic specular highlights.',
      dimensions: '512 × 512',
      hasMask: false,
    },
    {
      id: 'figure2.png',
      name: 'figure2.png',
      label: 'Figure 2 — Inpainted Object',
      type: 'Tampered',
      typeLabel: 'Suspected Manipulation',
      badgeColor: '#FB7185',
      description: 'Benchmark inpainting sample with localized noise variance mismatches.',
      dimensions: '512 × 512',
      hasMask: true,
    },
  ];

  return res.status(200).json({ samples });
}
