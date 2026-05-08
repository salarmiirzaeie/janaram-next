import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "your-secret-key";

export function signJwt(payload: any): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, SECRET, { expiresIn: "30d" }, (err, token) => {
      if (err) reject(err);
      else resolve(token as string);
    });
  });
}

export function verifyJwt(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}
