import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      io?: any;
      user?: {
        id: string;
        email: string;
        username: string;
        isAdmin: boolean;
        isBanned: boolean;
      };
    }
  }
}
