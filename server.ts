import app from './src/server/app';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// ==========================================
// STATIC ASSETS & VITE INTEGRATION (LOCAL DEV & STANDALONE)
// ==========================================
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SkillPulse] Labour-market intelligence server running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch HTTP listener when running standalone as main script (not when imported or in Vercel serverless)
const isMain = Boolean(
  !process.env.VERCEL &&
  process.argv[1] &&
  (path.resolve(process.argv[1]) === path.resolve(__filename) ||
   process.argv[1].endsWith('server.ts') ||
   process.argv[1].endsWith('server.js'))
);

if (isMain) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

export default app;
export { app };
