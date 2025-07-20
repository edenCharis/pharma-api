import { UserRole } from "@prisma/client";
import { User } from "../models/user.model";



export type CreateUserData = {
  password: string;
  username: string;
  role: UserRole;
}


export type  LoginData = {
  username: string;
  password: string;
}

export type AuthResponse = {
  user: Omit<User, 'password'>;
  token: string;
  
}

export type JWTPayload =  {
  id: string;
  userRole: string;
  iat: number;
  exp: number;
}
