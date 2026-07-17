import { Router, Request, Response } from 'express';

export function createAuthRouter(userRepository?: any): Router {
  const router = Router();
  const AUTH_URL = (process.env.AUTH_SERVICE_URL || 'http://localhost:3001').trim();

  // Helper to forward requests to the auth microservice
  const forwardRequest = async (req: Request, res: Response, path: string, method: string) => {
    try {
      const url = `${AUTH_URL}${path}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        headers['Authorization'] = String(authHeader);
      }

      const fetchOptions: any = {
        method,
        headers
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error(`Error forwarding request to auth service at ${path}:`, error);
      res.status(502).json({ error: 'No se pudo conectar con el servicio de autenticación.' });
    }
  };

  router.post('/register', (req, res) => forwardRequest(req, res, '/api/auth/register', 'POST'));
  router.post('/login', (req, res) => forwardRequest(req, res, '/api/auth/login', 'POST'));
  router.get('/users', (req, res) => forwardRequest(req, res, '/api/auth/users', 'GET'));
  router.delete('/users/:id', (req, res) => forwardRequest(req, res, `/api/auth/users/${req.params.id}`, 'DELETE'));

  return router;
}
