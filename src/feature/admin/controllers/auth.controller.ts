
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRole } from '@prisma/client';
import { CreateUserData } from '../../../types/admin.type';


export class AuthController {

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { password, name, role }: { password: string; name: string; role: UserRole } = req.body;

      if (!name || !password || !role) {
        res.status(400).json({ error: 'username, password and role are required' });
        return;
      }
    const login_dta: CreateUserData = { password: '', username: '', role: role };
    login_dta.username = name;
    login_dta.password = password;

    
      const result = await AuthService.register(login_dta);

      res.json({ user: result.user, message: 'Registration successful', token: result.token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'username and password are required' });
        return;
      }

      const result = await AuthService.login({ username, password });
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400000,
      });
      res.json({
        user: result.user,
        message: 'Login successful',
        token: result.token,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

}


