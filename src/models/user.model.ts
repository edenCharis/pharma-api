import { UserRole } from "@prisma/client";


export class User {
  id: string;
  username: string;
  role: UserRole;

  constructor(id: string, name: string, user_role: UserRole = UserRole.ADMIN) {
    this.id = id;
    this.username = name;
    this.role = user_role;
  }
}
