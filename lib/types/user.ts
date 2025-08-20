import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId; // Make _id optional to allow creation before insertion
  phoneNumber: string | null;
  email: string | null;
  googleId: string | null;
  name: string | null;
  picture: string | null;
  plan: "free" | "unlimited" | "premium" | "pro";
  conversationCount: {
    date: string; // ISO date string (e.g., "2025-07-27")
    count: number; // Number of conversations on that date
  };
  createdAt: Date;
  updatedAt: Date | null;
  messages: { user: string; ai: string; timestamp: Date }[];
  subscriptionDuration?: number; // Duration in months (1, 3, 6)
  subscriptionEndDate?: Date; // Expiration date for unlimited plan
  pushToken?: string;
}
