import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../core/database/prisma';
import config from '../config/index';

import { AuthResponse, JWTPayload, LoginData } from '../types/admin.type';
import { UserRole } from '@prisma/client';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: { id: string; userRole: string }): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '24h' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
    console.log('Token verified successfully:', payload); // Add this
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error); // Add this
    return null;
  }
};

export const registerUser = async (   password: string , name : string, role: UserRole): Promise<AuthResponse> => {
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      passwordHash: hashedPassword,
      role: role,
      username: name,
    },
  });

  const token = generateToken({ id: user.id, userRole: user.role });

  return {
    user: {
      id: user.id,
      username: user.username ?? '',
      role: user.role as UserRole,
    },
    token,
  };
};

export const loginUser = async (user_data:  LoginData): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { username : user_data.username },
  });

  if (!user || !(await comparePassword(user_data.password, user.passwordHash))) {
    throw new Error('Mot de passe invalide');
  }

  const token = generateToken({ id: user.id, userRole: user.role });

  return {
    user: {
      id: user.id,
      username: user.username ?? '',
      role: user.role as UserRole,
    },
    token,
  };
};
