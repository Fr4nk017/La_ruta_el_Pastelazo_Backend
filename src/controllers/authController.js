const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Registro de nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: firstName, lastName, email, password, phone',
        statusCode: 400
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'El email ya está registrado',
        statusCode: 409
      });
    }

    // Definir permisos según el rol
    let permissions = ['view_products', 'place_orders'];
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

    // Crear usuario (password se hashea automáticamente por el middleware pre-save)
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

    // Generar token JWT
    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email,
      permissions: user.permissions
    });

    // Respuesta sin password
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      statusCode: 201,
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login de usuario
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: email, password',
        statusCode: 400
      });
    }

    // Buscar usuario (incluir password con select)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'Email o contraseña incorrectos',
        statusCode: 401
      });
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo',
        error: 'La cuenta ha sido desactivada',
        statusCode: 403
      });
    }

    // Verificar password usando el método del modelo
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'Email o contraseña incorrectos',
        statusCode: 401
      });
    }

    // Generar token JWT
    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email,
      permissions: user.permissions
    });

    // Respuesta sin password
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      preferences: user.preferences
    };

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      statusCode: 200,
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout de usuario
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // En JWT stateless, el logout se maneja en el frontend eliminando el token
    res.status(200).json({
      success: true,
      message: 'Logout exitoso',
      statusCode: 200
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout
};
