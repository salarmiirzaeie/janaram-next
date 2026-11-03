import jwt from "jsonwebtoken";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signJwt(payload: any): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, getSecret(), { expiresIn: "365d" }, (err, token) => {
      if (err) reject(err);
      else resolve(token as string);
    });
  });
}

export function verifyJwt(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getSecret(), (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}
