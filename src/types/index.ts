import app from '../server';

export default function handler(req: any, res: any) {
  // Ensure request URL starts with /api so Express routes match correctly regardless of Vercel rewrite handling
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
