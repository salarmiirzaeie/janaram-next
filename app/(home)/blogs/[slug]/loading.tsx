// app/(home)/blogs/[id]/loading.tsx
export default function LoadingBlog() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-2xl font-bold text-blue-500 mb-8">وبلاگ</h2>
      <p className="text-gray-500">در حال بارگذاری...</p>
    </div>
  );
}
