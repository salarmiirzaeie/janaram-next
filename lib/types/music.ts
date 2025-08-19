// lib/types/music.ts
import { ObjectId } from "mongodb";

export interface Music {
  _id?: ObjectId;
  name: string;
  type: string; // e.g., 'mp3', 'wav'
  filename: string; // GridFS filename
  uploadDate: Date;
  uploadedBy: ObjectId; // Admin ID
}
