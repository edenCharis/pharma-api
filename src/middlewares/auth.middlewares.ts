import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';
import { User } from '../models/user.model';
import { AuthService } from '../core/auth/auth.service';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'> & { user_role: UserRole };
    }
  }
}

   
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.authToken ?? req.headers['authorization']?.split(' ')[1];
  console.log('Token received:', token);
  const decoded = jwt.decode(token);
  console.log('Decoded Token:', decoded);
  // Debugging line

  if (!token) {
    res.status(401).json({ message: 'Token not provided' });
    return;
  }


    const payload = verifyToken(token);
    if (!payload) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }

 

  const user =  AuthService.getUserById(payload.id);

  try{
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        if (!('user_role' in user)) {
          return res.status(500).json({ message: 'User role missing in user object' });
        }
        // Ensure user_role is of type UserRole
        const { user_role, ...rest } = user;
     
        next();
    
  } catch (err: any) {
    console.error('Token verification error:', err.message);
    res.status(403).json({ message: 'Token verification failed' });
    return;
  }};
