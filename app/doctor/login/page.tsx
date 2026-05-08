"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone || !password) {
      setError("شماره تلفن و رمز عبور را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v2/doctor/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("doctorToken", data.data.token);
        router.push("/doctor/dashboard");
      } else {
        setError(data.message || "خطا در ورود");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* هدر */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ورود روانشناسان</h1>
          <p className="text-gray-500 text-sm mt-1">
            لطفاً اطلاعات خود را وارد کنید
          </p>
        </div>

        {/* فرم */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              شماره تلفن
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "در حال ورود..." : "ورود به پنل"}
          </button>
          <Link className="text-right underline" href={"/doctor/register"}>
            ثبت نام به عنوان روانشناس
          </Link>
        </form>
      </div>
    </div>
  );
}
