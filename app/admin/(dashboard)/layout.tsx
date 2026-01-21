"use client"; // Add this to mark the component as client-side

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import "../../globals.css";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin/login");
    }
  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased bg-gray-100 min-h-screen flex flex-col md:flex-row-reverse">
        <Head>
          <title>Admin Panel</title>
          <meta name="description" content="Admin Panel for My App" />
        </Head>
        {/* Hamburger Menu Button for Mobile */}
        <button
          className="md:hidden p-4 bg-gray-800 text-white fixed top-0 left-0 z-50"
          onClick={toggleSidebar}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </button>
        {/* Sidebar */}
        <aside
          className={`w-64 bg-gray-800 text-white flex-shrink-0 fixed md:static top-0 left-0 h-full md:h-full z-40 transition-transform transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <button className="md:hidden text-white" onClick={toggleSidebar}>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
          <nav className="mt-4">
            <a
              href="/admin"
              className="block py-2 text-right px-4 hover:bg-gray-700"
            >
              داشبورد
            </a>
            <a
              href="/admin/meditation"
              className="block text-right py-2 px-4 hover:bg-gray-700"
            >
              مدیتیشن
            </a>
            <a
              href="/admin/blogs"
              className="block text-right py-2 px-4 hover:bg-gray-700"
            >
              بلاگ ها
            </a>
            <a
              href="/admin/notifications"
              className="block text-right py-2 px-4 hover:bg-gray-700"
            >
              نوتیفیکیشن
            </a>
            <button
              onClick={() => {
                localStorage.removeItem("authToken"); // Clear token
                router.push("/admin/login"); // Redirect to login
              }}
              className="w-full py-2 px-4 text-right hover:bg-gray-700 bg-none border-none cursor-pointer"
            >
              Logout
            </button>
          </nav>
        </aside>
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}
        <main className="flex-1 p-6 max-w-7xl mx-auto mt-16 md:mt-0">
          {children}
        </main>
      </body>
    </html>
  );
};

export default AdminLayout;
