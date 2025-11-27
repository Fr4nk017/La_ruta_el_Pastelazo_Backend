const User = require('../models/User');

/**
 * Obtener todos los usuarios (solo admin)
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      message: 'Usuarios obtenidos exitosamente',
      statusCode: 200,
      data: {
        users,
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
 * Obtener usuario por ID
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Usuario obtenido exitosamente',
      statusCode: 200,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear usuario (solo admin)
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: firstName, lastName, email, password, phone',
        statusCode: 400
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'El email ya está registrado',
        statusCode: 409
      });
    }

    // Definir permisos según el rol
    let permissions = [];
    const userRole = role || 'cliente';
    
    switch (userRole) {
      case 'admin':
        permissions = [
          'view_products', 'place_orders', 'manage_users', 'manage_products',
          'view_reports', 'manage_system', 'update_prices', 'add_products',
          'delete_products', 'manage_orders'
        ];
        break;
      case 'trabajador':
        permissions = [
          'view_products', 'place_orders', 'manage_orders', 'view_inventory',
          'update_order_status', 'manage_products', 'update_prices', 'add_products'
        ];
        break;
      default:
        permissions = ['view_products', 'place_orders', 'view_own_orders', 'update_profile'];
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: userRole,
      permissions,
      isActive: true,
      preferences: {
        newsletter: true,
        promotions: true
      }
    });

    // Respuesta sin password
    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      statusCode: 201,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar usuario (admin o propio perfil)
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, permissions, isActive, preferences } = req.body;
    const currentUser = req.user;

    // Verificar permisos: admin puede editar cualquier usuario, otros solo su perfil
    if (currentUser.role !== 'admin' && currentUser.userId !== id) {
      return res.status(403).json({
        message: 'No tienes permisos para actualizar este usuario',
        statusCode: 403
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
        statusCode: 404
      });
    }

    // Actualizar campos permitidos
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    
    // Solo admin puede cambiar rol, permisos y estado
    if (currentUser.role === 'admin') {
      if (role !== undefined) user.role = role;
      if (permissions !== undefined) user.permissions = permissions;
      if (isActive !== undefined) user.isActive = isActive;
    }
    
    // Actualizar preferencias
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    const updatedUser = await User.findById(id).select('-password');

    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      statusCode: 200,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar/Desactivar usuario (solo admin)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // No permitir que el admin se elimine a sí mismo
    if (currentUser.userId === id) {
      return res.status(400).json({
        message: 'No puedes eliminar tu propio usuario',
        statusCode: 400
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
        statusCode: 404
      });
    }

    // Soft delete - marcar como inactivo
    user.isActive = false;
    await user.save();

    res.status(200).json({
      message: 'Usuario desactivado exitosamente',
      statusCode: 200,
      data: { id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario actual
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Perfil obtenido exitosamente',
      statusCode: 200,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar perfil del usuario actual
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, preferences } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
        statusCode: 404
      });
    }

    // Actualizar campos del perfil
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      statusCode: 200,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile
};