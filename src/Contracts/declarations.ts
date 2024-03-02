import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload; // Assuming you are using JwtPayload from 'jsonwebtoken'
    }
  }
}
