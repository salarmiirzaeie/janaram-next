import { ObjectId } from "mongodb";

export interface Admin {
  _id?: ObjectId; // Optional for creation before insertion
  email: string;
  password: string; // Hashed password
  name: string | null;
  role: "admin"; // Fixed role for admins
  createdAt: Date;
  updatedAt: Date | null;
}
