const Product = require('../models/Product');

/**
 * Listar productos
 * GET /api/products
 */
const getProducts = async (req, res, next) => {
  try {
    const { isActive, category, search, page = 1, limit = 20 } = req.query;

    // Filtro base
    const filter = {};

    // Filtro opcional por isActive
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Filtro por categoría
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Búsqueda por nombre o descripción
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Paginación
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      message: 'Productos obtenidos exitosamente',
      statusCode: 200,
      data: {
        products,
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
 * Obtener producto por ID
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Producto obtenido exitosamente',
      statusCode: 200,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear producto (solo admin/trabajador)
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, img, category, stock } = req.body;

    // Log para debugging: verificar quién está intentando crear el producto
    console.log('📝 Creando producto - Usuario:', req.user?.email, 'Rol:', req.user?.role);
    console.log('📦 Datos del producto:', { name, price, category });

    // Validar campos requeridos
    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: name, price, category',
        statusCode: 400
      });
    }

    // Validar que el precio sea válido
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número mayor a 0',
        statusCode: 400
      });
    }

    console.log('💾 Intentando guardar en MongoDB...');
    
    const product = await Product.create({
      name,
      description,
      price,
      img: img || '/imagenes/tortas/default.png',
      category,
      stock: stock || 0,
      isActive: true
    });

    console.log('✅ Producto creado exitosamente en la BD:', product._id);
    console.log('📊 Producto completo:', JSON.stringify(product, null, 2));

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      statusCode: 201,
      data: product
    });
  } catch (error) {
    console.error('❌ Error al crear producto:', error.message);
    console.error('❌ Stack completo:', error.stack);
    
    // Si es un error de validación de Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        error: error.message,
        statusCode: 400
      });
    }
    
    next(error);
  }
};

/**
 * Actualizar producto (solo admin/trabajador)
 * PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, img, category, stock, isActive } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado',
        statusCode: 404
      });
    }

    // Actualizar campos
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (img !== undefined) product.img = img;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    res.status(200).json({
      message: 'Producto actualizado exitosamente',
      statusCode: 200,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar/Desactivar producto (solo admin)
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado',
        statusCode: 404
      });
    }

    // Delete real - eliminar de la base de datos
    await Product.deleteOne({ _id: id });

    res.status(200).json({
      message: 'Producto eliminado permanentemente',
      statusCode: 200,
      data: { _id: id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
