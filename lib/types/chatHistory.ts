import { ObjectId } from "mongodb";

export interface ChatHistory {
  _id?: ObjectId;
  userId: ObjectId;
  conversationId: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
