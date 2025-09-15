export function createSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\u200c]/g, "-") // نیم‌فاصله → خط تیره
    .replace(/\s+/g, "-") // فاصله → خط تیره
    .replace(/[^\u0600-\u06FFa-z0-9\-]+/g, "") // حذف کاراکترهای غیرمجاز (فقط فارسی، انگلیسی و عدد)
    .replace(/-+/g, "-") // چند خط تیره پشت سر هم → یکی
    .replace(/^-|-$/g, ""); // حذف خط تیره اول و آخر
}
