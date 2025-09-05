export interface Breathing {
  _id: string; // ObjectId رشته‌ای در MongoDB
  title: string; // عنوان تمرین تنفس
  description?: string; // توضیح کوتاه درباره تمرین
  duration: number; // مدت زمان تمرین بر حسب دقیقه
  type: "light" | "calm" | "deep" | "box" | "478" | "custom"; // نوع تنفس
  url?: string; // فایل صوتی برای تمرین
  imageUrl?: string; // تصویر یا کاور تمرین
  createdAt?: Date;
  updatedAt?: Date;
}
