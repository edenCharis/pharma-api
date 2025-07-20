
import { comparePassword, generateToken, registerUser } from '../../lib/auth';
import prisma from '../database/prisma';
import { AuthResponse, CreateUserData, LoginData } from '../../types/admin.type';

export class AuthService {

  
  static async register(userData: CreateUserData): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    return await registerUser(userData.password, userData.username);
  }

  static async login(login_data: LoginData): Promise<AuthResponse> {
    const { username, password } = login_data;

    const user = await prisma.user.findUnique({
      where: { username : username },
      select: {
        id: true,
        username: true,
        role: true,
        passwordHash: true,
      },
    });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({ id: user.id, userRole: user.role });

    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      token,
    };


    return response;
  }



  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

   return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } catch (error) {
      throw new Error(`Failed to fetch user: ${(error as Error).message}`);
    }
  }
}
