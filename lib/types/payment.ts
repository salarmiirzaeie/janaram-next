// lib/types/payment.ts
import { ObjectId } from "mongodb";

export interface Payment {
  _id: ObjectId;
  userId: ObjectId;
  planId: string;
  amount: number;
  description: string;
  authority?: string;
  refId?: number;
  cardPan?: string;
  fee?: number;
  feeType?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
}
