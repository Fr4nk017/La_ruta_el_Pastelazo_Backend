const mongoose = require('mongoose');
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
 * Obtener orden pública por ID
 * GET /api/orders/track/:orderId
 */
const getOrderPublic = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: 'ID de orden inválido',
        statusCode: 400
      });
    }

    const order = await Order.findById(orderId)
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
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        items: order.items,
        customerInfo: order.customerInfo,
        paymentMethod: order.paymentMethod,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
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
    // Permitir órdenes tanto con usuario autenticado como invitados
    // Asegurar que userId solo se asigne si el usuario está autenticado
    let userId = null;
    if (req.user && req.user.userId) {
      userId = req.user.userId;
    }
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

    if (!customerInfo) {
      return res.status(400).json({
        message: 'Falta customerInfo',
        statusCode: 400,
        receivedData: req.body
      });
    }

    if (!deliveryDate) {
      return res.status(400).json({
        message: 'Falta deliveryDate',
        statusCode: 400
      });
    }

    if (!deliveryTime) {
      return res.status(400).json({
        message: 'Falta deliveryTime',
        statusCode: 400
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        message: 'Falta paymentMethod',
        statusCode: 400
      });
    }

    // Validar campos requeridos en customerInfo
    const requiredCustomerFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'comuna'];
    const missingFields = requiredCustomerFields.filter(field => !customerInfo[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Faltan campos en customerInfo: ${missingFields.join(', ')}`,
        statusCode: 400,
        missingFields
      });
    }

    // Validar y procesar items
    const processedItems = [];
    let total = 0;

    for (const item of items) {
      let product = null;
      
      console.log(`🔍 Buscando producto con ID: "${item.productId}" (tipo: ${typeof item.productId})`);
      
      // Verificar que productId no esté vacío
      if (!item.productId) {
        return res.status(400).json({
          message: 'El productId no puede estar vacío en los items',
          statusCode: 400,
          item
        });
      }
      
      // Intentar buscar por ObjectId primero (más rápido)
      try {
        if (typeof item.productId === 'string' && item.productId.match(/^[0-9a-fA-F]{24}$/)) {
          console.log('🎯 Buscando por ObjectId...');
          product = await Product.findById(item.productId).lean();
          if (product) {
            console.log(`✅ Producto encontrado por ObjectId: ${product.name}`);
          }
        }
      } catch (error) {
        console.log('⚠️ Error en búsqueda por ObjectId:', error.message);
      }
      
      if (!product) {
        console.log('❌ No se encontró producto por ObjectId, intentando búsqueda por nombre/slug');
        
        // Fallback: buscar por nombre exacto o similar
        product = await Product.findOne({
          $or: [
            { name: item.productId },
            { name: { $regex: item.productId, $options: 'i' } },
            { slug: item.productId }
          ]
        }).lean();
        
        if (product) {
          console.log(`✅ Producto encontrado por nombre: ${product.name}`);
        }
      }
      
      if (!product) {
        console.error(`❌ Producto no encontrado: "${item.productId}"`);
        return res.status(404).json({
          message: `Producto no encontrado: ${item.productId}`,
          statusCode: 404,
          receivedProductId: item.productId,
          receivedType: typeof item.productId
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
    // Solo incluir userId si existe (usuario autenticado)
    const orderData = {
      items: processedItems,
      customerInfo,
      deliveryDate: new Date(deliveryDate),
      deliveryTime,
      paymentMethod,
      specialInstructions,
      couponCode,
      total,
      status: 'pending'
    };
    if (userId) {
      orderData.userId = userId;
    }
    const order = await Order.create(orderData);

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
  getOrderPublic,
  createOrder,
  updateOrderStatus,
  cancelOrder
};