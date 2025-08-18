"use client"; // Add this to mark the component as client-side

import React, { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin/login");
    }
  }, [router]);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </head>
      <body className={`antialiased bg-gray-100 min-h-screen flex flex-row-reverse`}>
        <Head>
          <title>Admin Panel</title>
          <meta name="description" content="Admin Panel for My App" />
        </Head>
        <aside className="w-64 bg-gray-800 text-white flex-shrink-0">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <nav className="mt-4">
            <a href="/admin" className="block py-2 text-right px-4 hover:bg-gray-700">
              داشبورد
            </a>

            <a href="/admin/meditation" className="block  text-right py-2 px-4 hover:bg-gray-700">
              مدیتیشن
            </a>
            <button
              onClick={() => {
                localStorage.removeItem("authToken"); // Clear token
                router.push("/admin/login"); // Redirect to login
              }}
              className="w-full  py-2 px-4  text-right hover:bg-gray-700 bg-none border-none cursor-pointer"
            >
              Logout
            </button>
          </nav>
        </aside>
        <main className="flex-1 p-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
};

export default AdminLayout;
