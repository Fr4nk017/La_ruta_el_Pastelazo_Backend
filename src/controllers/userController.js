import bcrypt from 'bcryptjs';
import { signToken } from '../middlewares/auth.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { withTenantFilter } from '../middlewares/tenantIsolation.js';
import User from '../models/user.js';
import Role from '../models/role.js';
import Tenant from '../models/tenant.js';

/**
 * Registrar nuevo usuario
 * POST /api/:tenantSlug/users/register
 * Body: { firstName, lastName, email, password, phone, roleSlug? }
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, roleSlug = 'customer' } = req.body;
  
  // Validar que tenemos tenantId (debería venir del middleware tenantIsolation)
  if (!req.tenantId) {
    throw new AppError('TenantId no especificado', 400);
  }
  
  // Verificar si el usuario ya existe en este tenant
  const existingUser = await User.findOne({ 
    tenantId: req.tenantId,
    email: email.toLowerCase() 
  });
  
  if (existingUser) {
    throw new AppError('El email ya está registrado en este tenant', 409);
  }
  
  // Buscar el rol por slug dentro del tenant
  const role = await Role.findOne({
    tenantId: req.tenantId,
    slug: roleSlug.toLowerCase(),
    isActive: true
  });
  
  if (!role) {
    throw new AppError(`Rol '${roleSlug}' no encontrado para este tenant`, 404);
  }
  
  // Hashear la contraseña
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Crear nuevo usuario
  const newUser = new User({
    tenantId: req.tenantId,
    roleId: role._id,
    firstName,
    lastName,
    email: email.toLowerCase(),
    passwordHash,
    phone
  });
  
  await newUser.save();
  
  // Generar token JWT con tenantId, roleId
  const token = signToken(
    {
      id: newUser._id,
      tenantId: newUser.tenantId,
      roleId: newUser.roleId,
      email: newUser.email
    },
    process.env.JWT_SECRET,
    '24h'
  );
  
  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    data: {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        tenantId: newUser.tenantId,
        roleId: newUser.roleId
      },
      token
    }
  });
});

/**
 * Iniciar sesión
 * POST /api/:tenantSlug/users/login
 * Body: { email, password }
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!req.tenantId) {
    throw new AppError('TenantId no especificado', 400);
  }
  
  // Buscar usuario por email e incluir passwordHash
  const user = await User.findOne({ 
    tenantId: req.tenantId,
    email: email.toLowerCase()
  })
    .select('+passwordHash')
    .populate('roleId');
  
  if (!user) {
    throw new AppError('Credenciales inválidas', 401);
  }
  
  // Verificar que el usuario esté activo
  if (!user.isActive) {
    throw new AppError('Usuario inactivo. Contacte al administrador.', 403);
  }
  
  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Credenciales inválidas', 401);
  }
  
  // Actualizar último login
  await user.updateLastLogin();
  
  // Generar token
  const token = signToken(
    { 
      id: user._id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      email: user.email
    },
    process.env.JWT_SECRET,
    '24h'
  );
  
  res.json({
    message: 'Inicio de sesión exitoso',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        tenantId: user.tenantId,
        role: {
          id: user.roleId._id,
          name: user.roleId.name,
          slug: user.roleId.slug
        },
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

/**
 * Obtener perfil del usuario autenticado
 * GET /api/:tenantSlug/users/profile
 * Requiere: auth + tenantIsolation + verifyTenantUser
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne(
    withTenantFilter(req, { _id: req.user.id })
  ).populate('roleId');
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  
  res.json({
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      isActive: user.isActive,
      tenantId: user.tenantId,
      role: {
        id: user.roleId._id,
        name: user.roleId.name,
        slug: user.roleId.slug,
        permissions: user.roleId.permissions
      },
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

/**
 * Actualizar perfil del usuario autenticado
 * PUT /api/:tenantSlug/users/profile
 * Requiere: auth + tenantIsolation + verifyTenantUser
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, profileImage } = req.body;
  
  const allowedUpdates = { firstName, lastName, phone, profileImage };
  
  // Filtrar valores undefined
  Object.keys(allowedUpdates).forEach(key => 
    allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );
  
  const updatedUser = await User.findOneAndUpdate(
    withTenantFilter(req, { _id: req.user.id }),
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  ).populate('roleId');
  
  if (!updatedUser) {
    throw new AppError('Usuario no encontrado', 404);
  }
  
  res.json({
    message: 'Perfil actualizado exitosamente',
    data: {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profileImage: updatedUser.profileImage,
      role: {
        id: updatedUser.roleId._id,
        name: updatedUser.roleId.name,
        slug: updatedUser.roleId.slug
      }
    }
  });
});

/**
 * Listar todos los usuarios del tenant (con paginación)
 * GET /api/:tenantSlug/users?page=1&limit=10&role=customer&search=john
 * Requiere: auth + tenantIsolation + verifyTenantUser + permission('users', 'view')
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search, isActive } = req.query;
  
  const filter = withTenantFilter(req);
  
  if (role) {
    const roleDoc = await Role.findOne({ 
      tenantId: req.tenantId,
      slug: role.toLowerCase() 
    });
    if (roleDoc) {
      filter.roleId = roleDoc._id;
    }
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('roleId', 'name slug')
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);
  
  res.json({
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * Obtener un usuario por ID
 * GET /api/:tenantSlug/users/:id
 * Requiere: auth + tenantIsolation + verifyTenantUser + permission('users', 'view')
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findOne(
    withTenantFilter(req, { _id: id })
  ).populate('roleId');
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  
  res.json({
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      isActive: user.isActive,
      role: {
        id: user.roleId._id,
        name: user.roleId.name,
        slug: user.roleId.slug
      },
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

/**
 * Actualizar un usuario (admin)
 * PUT /api/:tenantSlug/users/:id
 * Requiere: auth + tenantIsolation + verifyTenantUser + permission('users', 'edit')
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, profileImage, roleSlug, isActive } = req.body;
  
  const updates = {};
  
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (profileImage !== undefined) updates.profileImage = profileImage;
  if (isActive !== undefined) updates.isActive = isActive;
  
  // Si se actualiza el rol, buscar el roleId
  if (roleSlug) {
    const role = await Role.findOne({
      tenantId: req.tenantId,
      slug: roleSlug.toLowerCase()
    });
    if (!role) {
      throw new AppError(`Rol '${roleSlug}' no encontrado`, 404);
    }
    updates.roleId = role._id;
  }
  
  const updatedUser = await User.findOneAndUpdate(
    withTenantFilter(req, { _id: id }),
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('roleId');
  
  if (!updatedUser) {
    throw new AppError('Usuario no encontrado', 404);
  }
  
  res.json({
    message: 'Usuario actualizado exitosamente',
    data: {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isActive: updatedUser.isActive,
      role: {
        id: updatedUser.roleId._id,
        name: updatedUser.roleId.name,
        slug: updatedUser.roleId.slug
      }
    }
  });
});

/**
 * Eliminar un usuario (soft delete)
 * DELETE /api/:tenantSlug/users/:id
 * Requiere: auth + tenantIsolation + verifyTenantUser + permission('users', 'delete')
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // No permitir auto-eliminación
  if (id === req.user.id.toString()) {
    throw new AppError('No puedes eliminar tu propia cuenta', 400);
  }
  
  const user = await User.findOneAndUpdate(
    withTenantFilter(req, { _id: id }),
    { isActive: false },
    { new: true }
  );
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  
  res.json({
    message: 'Usuario desactivado exitosamente',
    data: {
      id: user._id,
      email: user.email,
      isActive: user.isActive
    }
  });
});

export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
