import { ObjectId } from "mongodb";

export interface Meditation {
  _id?: ObjectId;
  title: string;
  type:
    | "calm"
    | "love"
    | "instrumental"
    | "sleep"
    | "sleep music"
    | "nature"
    | "story"
    | "self";

  url: string;
  imageUrl: string; // اضافه کردن فیلد URL تصویر
  duration: number;
  description: string;
  accessLevel: "free" | "unlimited";
  createdAt: Date;
  updatedAt: Date;
  fileUrl: string;
  isSuggested?: boolean;
}
