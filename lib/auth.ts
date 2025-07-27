import jwt from "jsonwebtoken";

export interface AuthUser {
  sub: string;
  phoneNumber?: string;
  email?: string;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    return decoded;
  } catch (err) {
    return null;
  }
}
