import { Router, Request, Response } from 'express';
import { ManageOrders } from '../../../application/use-cases/ManageOrders';
import { OrderRepository } from '../../../domain/repositories/OrderRepository';
import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { queryAll } from '../../database/mysql';

export function createOrderRouter(
  orderRepository: OrderRepository,
  productRepository: ProductRepository
): Router {
  const router = Router();
  const manageOrders = new ManageOrders(orderRepository, productRepository);

  const getStoreId = (req: Request) => String(req.headers['x-store-id'] || req.query.storeId || process.env.DEFAULT_STORE_ID || 'tienda1');

  router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Acceso no autorizado.' });
      }

      let targetUserId = user.role === 'admin' ? undefined : user.id;
      const storeId = getStoreId(req);

      if (user.role === 'admin' && req.query.userId) {
        targetUserId = String(req.query.userId);
      }

      const orders = await manageOrders.getOrders(targetUserId, storeId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const storeId = getStoreId(req);
      const order = await manageOrders.getOrderDetails(req.params.id, storeId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Evitar que un cliente vea la orden de otro cliente
      if (req.user?.role !== 'admin' && order.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Acceso denegado a este pedido.' });
      }

      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Para el checkout simulado (offline)
  router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    if (process.env.DISABLE_PURCHASES !== 'false') {
      return res.status(503).json({ error: 'Las compras están deshabilitadas temporalmente por mantenimiento.' });
    }

    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required to create an order' });
      }
      const orderId = `order-${Date.now()}`;
      const storeId = getStoreId(req);
      const order = await manageOrders.createOrder(orderId, { items }, req.user?.id, storeId);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // API 1: Obtener Estadísticas del Servidor (Admin)
  router.get('/stats/dashboard', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
      }

      const storeId = getStoreId(req);
      const ordersCount = await queryAll<any>('SELECT COUNT(*) as count FROM orders');
      const revenue = await queryAll<any>('SELECT SUM(total) as sum FROM orders WHERE status = "PAID"');
      const usersCount = await queryAll<any>('SELECT COUNT(*) as count FROM users');
      const productsCount = await queryAll<any>('SELECT COUNT(*) as count FROM products');

      res.json({
        totalOrders: ordersCount[0]?.count || 0,
        totalRevenue: parseFloat(revenue[0]?.sum || '0'),
        totalUsers: usersCount[0]?.count || 0,
        totalProducts: productsCount[0]?.count || 0
      });
    } catch (error: any) {
      console.error('Error en estadísticas:', error);
      res.status(500).json({ error: error.message || 'Error al obtener estadísticas.' });
    }
  });

  // API: Exportar todas las ventas a CSV
  router.get('/export/csv', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
      }

      const storeId = getStoreId(req);
      const orders = await orderRepository.findAll(storeId);
      
      let csvContent = 'ID Pedido,ID Usuario,Fecha,Total,Estado,Productos\n';
      
      for (const order of orders) {
        const productsList = order.items.map(i => `${i.productName} (x${i.quantity})`).join('; ');
        csvContent += `"${order.id}","${order.userId}","${order.createdAt.toISOString()}",${order.total},"${order.status}","${productsList}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ventas_reporte.csv');
      res.status(200).send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
