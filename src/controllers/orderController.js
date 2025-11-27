const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Obtener todas las órdenes del usuario actual
 * GET /api/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('items.productId', 'name img')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      message: 'Órdenes obtenidas exitosamente',
      statusCode: 200,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las órdenes (solo admin/trabajador)
 * GET /api/orders/all
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('items.productId', 'name img')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      message: 'Órdenes obtenidas exitosamente',
      statusCode: 200,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener orden por ID
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const filter = { _id: id };
    // Si no es admin/trabajador, solo puede ver sus propias órdenes
    if (userRole !== 'admin' && userRole !== 'trabajador') {
      filter.userId = userId;
    }

    const order = await Order.findOne(filter)
      .populate('userId', 'firstName lastName email')
      .populate('items.productId', 'name img category');

    if (!order) {
      return res.status(404).json({
        message: 'Orden no encontrada',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Orden obtenida exitosamente',
      statusCode: 200,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nueva orden (checkout)
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      items,
      customerInfo,
      deliveryDate,
      deliveryTime,
      paymentMethod,
      specialInstructions,
      couponCode
    } = req.body;

    // Validar campos requeridos
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Debe incluir al menos un producto',
        statusCode: 400
      });
    }

    if (!customerInfo || !deliveryDate || !deliveryTime || !paymentMethod) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: customerInfo, deliveryDate, deliveryTime, paymentMethod',
        statusCode: 400
      });
    }

    // Validar y procesar items
    const processedItems = [];
    let total = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          message: `Producto no encontrado: ${item.productId}`,
          statusCode: 404
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          message: `Producto no disponible: ${product.name}`,
          statusCode: 400
        });
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      processedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.img
      });
    }

    // Aplicar cupón si existe (simplificado)
    if (couponCode) {
      const validCoupons = {
        'DULCE10': 0.1,
        'PASTEL5': 0.05,
        'BIENVENIDO': 0.15
      };
      
      if (validCoupons[couponCode.toUpperCase()]) {
        const discount = total * validCoupons[couponCode.toUpperCase()];
        total = total - discount;
      }
    }

    // Crear la orden
    const order = await Order.create({
      userId,
      items: processedItems,
      customerInfo,
      deliveryDate: new Date(deliveryDate),
      deliveryTime,
      paymentMethod,
      specialInstructions,
      couponCode,
      total,
      status: 'pending'
    });

    // Poblar para la respuesta
    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId', 'name img category');

    res.status(201).json({
      message: 'Orden creada exitosamente',
      statusCode: 201,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        order: populatedOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar estado de orden (solo admin/trabajador)
 * PUT /api/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Estado inválido',
        statusCode: 400
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        message: 'Orden no encontrada',
        statusCode: 404
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: 'Estado de orden actualizado exitosamente',
      statusCode: 200,
      data: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar orden
 * PUT /api/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const filter = { _id: id };
    // Si no es admin/trabajador, solo puede cancelar sus propias órdenes
    if (userRole !== 'admin' && userRole !== 'trabajador') {
      filter.userId = userId;
    }

    const order = await Order.findOne(filter);
    if (!order) {
      return res.status(404).json({
        message: 'Orden no encontrada',
        statusCode: 404
      });
    }

    // Solo se pueden cancelar órdenes pending o confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        message: 'No se puede cancelar esta orden en su estado actual',
        statusCode: 400
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      message: 'Orden cancelada exitosamente',
      statusCode: 200,
      data: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder
};