"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { doctorInputClassLtr } from "@/lib/doctor-form-styles";

type Step = "phone" | "reset";

export default function DoctorForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!phone.trim()) {
      setError("شماره تلفن را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v2/doctor/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setInfo(data.message || "کد تایید ارسال شد");
        setStep("reset");
      } else {
        setError(data.message || "خطا در ارسال کد");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/v2/doctor/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo(data.message || "کد تایید مجدداً ارسال شد");
      } else {
        setError(data.message || "خطا در ارسال مجدد کد");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!otp.trim()) {
      setError("کد تایید را وارد کنید");
      return;
    }

    if (!password) {
      setError("رمز عبور جدید را وارد کنید");
      return;
    }

    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v2/doctor/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (data.success) {
        router.replace("/doctor/login?reset=success");
      } else {
        setError(data.message || "خطا در تغییر رمز عبور");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">بازیابی رمز عبور</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === "phone"
              ? "شماره تلفن ثبت‌شده را وارد کنید"
              : "کد پیامک‌شده و رمز عبور جدید را وارد کنید"}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">شماره تلفن</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className={doctorInputClassLtr}
                dir="ltr"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-center text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "در حال ارسال..." : "ارسال کد تایید"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">کد تایید</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={doctorInputClassLtr}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">رمز عبور جدید</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={doctorInputClassLtr}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">تکرار رمز عبور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                className={doctorInputClassLtr}
                dir="ltr"
              />
            </div>

            {info && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-center text-sm">{info}</div>
            )}
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-center text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "در حال ذخیره..." : "تغییر رمز عبور"}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleResendOtp}
              className="w-full text-blue-500 text-sm hover:text-blue-600 disabled:opacity-50"
            >
              ارسال مجدد کد
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
                setInfo("");
              }}
              className="w-full text-gray-500 text-sm hover:text-gray-700"
            >
              تغییر شماره تلفن
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/doctor/login" className="text-blue-500 hover:text-blue-600 text-sm">
            بازگشت به ورود
          </Link>
        </div>
      </div>
    </div>
  );
}
