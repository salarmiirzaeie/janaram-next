"use client";

import { useEffect, useState } from "react";

type Schedule = {
  [key: number]: string[];
};

const DAYS = [
  { id: 0, name: "شنبه" },
  { id: 1, name: "یکشنبه" },
  { id: 2, name: "دوشنبه" },
  { id: 3, name: "سه‌شنبه" },
  { id: 4, name: "چهارشنبه" },
  { id: 5, name: "پنجشنبه" },
  { id: 6, name: "جمعه" },
];

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

export default function DoctorSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [offDays, setOffDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    try {
      const res = await fetch("/api/v2/doctor/schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSchedule(data.data.schedule || {});
        setOffDays(data.data.offDays || []);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v2/doctor/schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedule, offDays }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "ساعت کاری با موفقیت ذخیره شد" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: "error",
          text: data.message || "خطا در ذخیره سازی",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "خطا در ارتباط با سرور" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimeSlot = (dayId: number, time: string) => {
    setSchedule((prev) => {
      const currentSlots = prev[dayId] || [];
      if (currentSlots.includes(time)) {
        return {
          ...prev,
          [dayId]: currentSlots.filter((t) => t !== time),
        };
      } else {
        return {
          ...prev,
          [dayId]: [...currentSlots, time].sort(),
        };
      }
    });
  };

  const selectAllForDay = (dayId: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: [...TIME_SLOTS],
    }));
  };

  const clearAllForDay = (dayId: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: [],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    window.location.href = "/doctor/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* هدر */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a
              href="/doctor/dashboard"
              className="text-blue-500 hover:text-blue-700"
            >
              ← بازگشت به داشبورد
            </a>
            <h1 className="text-xl font-bold text-gray-800">تنظیم ساعت کاری</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* پیام موفقیت/خطا */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-center ${
              message.type === "success"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* توضیحات */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-700 text-sm">
            ⏰ ساعت‌های کاری خود را انتخاب کنید. بیماران فقط در زمان‌های انتخابی
            شما می‌توانند نوبت بگیرند.
          </p>
        </div>

        {/* جدول ساعت‌های کاری */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-24">
                    روز
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    ساعت‌های کاری
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-32">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {DAYS.map((day) => {
                  const selectedTimes = schedule[day.id] || [];
                  return (
                    <tr key={day.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-800">
                        {day.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {TIME_SLOTS.map((time) => {
                            const isSelected = selectedTimes.includes(time);
                            return (
                              <button
                                key={time}
                                onClick={() => toggleTimeSlot(day.id, time)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                                  isSelected
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => selectAllForDay(day.id)}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                          >
                            انتخاب همه
                          </button>
                          <button
                            onClick={() => clearAllForDay(day.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            حذف همه
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* دکمه ذخیره */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50"
          >
            {isSaving ? "در حال ذخیره..." : "ذخیره ساعت کاری"}
          </button>
        </div>

        {/* راهنما */}
        <div className="mt-8 bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-2">📌 راهنما:</h3>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>
              • روی هر ساعت کلیک کنید تا آن ساعت به برنامه کاری اضافه یا حذف
              شود.
            </li>
            <li>
              • بیماران فقط در ساعت‌های انتخابی شما می‌توانند نوبت رزرو کنند.
            </li>
            <li>
              • روزهایی که هیچ ساعتی انتخاب نشده باشد، برای نوبت‌دهی بسته خواهد
              بود.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
