"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../globals.css";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) router.push("/admin/login");
  }, [router]);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div className="min-h-screen bg-gray-100 flex">
          {/* Sidebar */}
          <aside
            className={`fixed md:static inset-y-0 right-0 z-40 w-72 bg-gradient-to-b from-gray-900 to-gray-800
        text-white transform transition-transform duration-300 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0`}
          >
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-wide">Admin Panel</h1>
              <button
                className="md:hidden text-gray-300 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                ✕
              </button>
            </div>

            <nav className="p-4 space-y-2 text-right">
              {[
                ["داشبورد", "/admin"],
                ["مدیتیشن", "/admin/meditation"],
                ["تنفس‌ها", "/admin/breathings"],
                ["بلاگ‌ها", "/admin/blogs"],
                ["نوتیفیکیشن", "/admin/notifications"],
                ["روانشناس", "/admin/psychologists"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  {label}
                </a>
              ))}

              <button
                onClick={() => {
                  localStorage.removeItem("authToken");
                  router.push("/admin/login");
                }}
                className="w-full mt-6 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
              >
                خروج
              </button>
            </nav>
          </aside>

          {/* Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Mobile header */}
            <header className="md:hidden h-14 bg-white shadow flex items-center px-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-700 text-2xl"
              >
                ☰
              </button>
              <span className="ml-4 font-semibold">Admin Panel</span>
            </header>

            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
};

export default AdminLayout;
