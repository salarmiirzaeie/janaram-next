"use client";
import Image from "next/image";
import React, { useState } from "react";

const Page = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setPhoneNumber("");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-6xl min-h-screen items-center mt-28 mx-auto py-4 px-4 text-center">
        <div className="bg-green-100 text-green-700 p-6 rounded-xl max-w-md mx-auto">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="font-bold text-xl mb-2">شماره شما ثبت شد</h3>
          <p>به محض راه‌اندازی سرویس روانشناسی، به شما پیامک می‌زنیم.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 text-blue-600 underline"
          >
            ثبت شماره دیگر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl min-h-screen items-center mt-28 mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm mb-6">
          🔜 به زودی
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          مشاوره تلفنی با{" "}
          <span className="text-blue-600">روانشناسان متخصص جانارام</span>
        </h1>

        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
          به محض راه‌اندازی، اولین نفری باش که مطلع می‌شه
        </p>

        {/* <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8 text-right">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-blue-600 text-xl ml-2">🎧</span>
            <span className="text-gray-700">مشاوره تلفنی محرمانه</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-blue-600 text-xl ml-2">⏱️</span>
            <span className="text-gray-700">نوبت‌دهی آنلاین و سریع</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-blue-600 text-xl ml-2">💎</span>
            <span className="text-gray-700">همراه با اشتراک پرو پلاس</span>
          </div>
        </div> */}

        <Image
          alt="مشاوره روانشناسی آنلاین"
          height={200}
          priority
          className="max-w-[80vw] md:max-w-[50vw] mx-auto mb-8"
          width={350}
          src={require("@/public/images/psycho.png")}
        />

        {/* فرم ثبت شماره تلفن */}
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-2">
            📢 ثبت نام برای اطلاع‌رسانی
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            شماره تلفن خود را وارد کنید تا به محض راه‌اندازی به شما پیامک بزنیم
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
              className="w-full p-3 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "در حال ثبت..." : "به من یادآوری کن"}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          * همراه با اشتراک‌های پرو و پرو پلاس به زودی
        </p>
      </div>
    </div>
  );
};

export default Page;
