import { Router, Request, Response } from 'express';
import { ManageProducts } from '../../../application/use-cases/ManageProducts';
import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { runQuery } from '../../database/mysql';

export function createProductRouter(productRepository: ProductRepository): Router {
  const router = Router();
  const manageProducts = new ManageProducts(productRepository);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const catalog = await manageProducts.getCatalog();
      res.json(catalog);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const product = await manageProducts.getProductDetails(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { id, name, description, price, stock } = req.body;
      if (!id || !name || !price || stock === undefined) {
        return res.status(400).json({ error: 'Missing required fields: id, name, price, stock' });
      }
      const product = await manageProducts.addProduct(id, name, description || '', Number(price), Number(stock));
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {

    try {
      await manageProducts.deleteProduct(req.params.id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      const status = error.message.includes('Product not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  // API 3: Actualizar Producto (solo para Admin)
  router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
      }

      const prodId = req.params.id;
      const { name, description, price, stock } = req.body;

      if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: name, price, stock.' });
      }

      await runQuery(
        'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?',
        [name, description || '', Number(price), Number(stock), prodId]
      );

      res.json({ success: true, message: 'Producto actualizado correctamente.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al actualizar producto.' });
    }
  });

  return router;
}

