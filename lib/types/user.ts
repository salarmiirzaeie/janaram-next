import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId; // Make _id optional to allow creation before insertion
  phoneNumber: string | null;
  email: string | null;
  googleId: string | null;
  name: string | null;
  picture: string | null;
  plan: "free" | "unlimited" | "unlimited_plus";
  conversationCount: {
    date: string; // ISO date string (e.g., "2025-07-27")
    count: number; // Number of conversations on that date
  };
  createdAt: Date;
  updatedAt: Date | null;
}
