"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Save,
  CheckCircle,
  XCircle,
  Info,
  Calendar,
  CheckSquare,
  Square,
  LogOut,
} from "lucide-react";

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

  const [offDayInput, setOffDayInput] = useState("");

  const addOffDay = () => {
    if (!offDayInput || offDays.includes(offDayInput)) return;
    setOffDays((prev) => [...prev, offDayInput].sort());
    setOffDayInput("");
  };

  const removeOffDay = (date: string) => {
    setOffDays((prev) => prev.filter((d) => d !== date));
  };

  // آمار ساعات کاری
  const getStats = () => {
    let totalSlots = 0;
    let activeDays = 0;
    DAYS.forEach((day) => {
      const slots = schedule[day.id] || [];
      if (slots.length > 0) activeDays++;
      totalSlots += slots.length;
    });
    return { totalSlots, activeDays };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر صفحه */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تنظیم ساعت کاری</h1>
        <p className="text-gray-500 mt-1">
          مدیریت زمان‌های پذیرش و ویزیت بیماران
        </p>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">روزهای فعال در هفته</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.activeDays} از ۷ روز
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">کل ساعات کاری در هفته</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.totalSlots} نوبت
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* پیام موفقیت/خطا */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* توضیحات */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-800 text-sm font-medium">
              ساعت‌های کاری خود را انتخاب کنید
            </p>
            <p className="text-blue-600 text-sm mt-1">
              بیماران فقط در زمان‌های انتخابی شما می‌توانند نوبت بگیرند. روزهایی
              که هیچ ساعتی انتخاب نشده باشد، برای نوبت‌دهی بسته خواهد بود.
            </p>
          </div>
        </div>
      </div>

      {/* جدول ساعت‌های کاری */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-right">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-24">
                  روز
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  ساعت‌های کاری
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-32">
                  عملیات سریع
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {DAYS.map((day) => {
                const selectedTimes = schedule[day.id] || [];
                const isFullySelected =
                  selectedTimes.length === TIME_SLOTS.length;
                return (
                  <tr key={day.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4 text-sm font-medium text-gray-800 align-top">
                      <div className="flex items-center gap-2">
                        <span>{day.name}</span>
                        {selectedTimes.length > 0 && (
                          <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                            {selectedTimes.length} ساعت
                          </span>
                        )}
                      </div>
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
                                  ? "bg-blue-500 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => selectAllForDay(day.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs"
                        >
                          <CheckSquare className="w-3 h-3" />
                          انتخاب همه
                        </button>
                        <button
                          onClick={() => clearAllForDay(day.id)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
                        >
                          <Square className="w-3 h-3" />
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

      {/* روزهای تعطیل */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">روزهای تعطیل</h2>
        <p className="text-sm text-gray-500">
          تاریخ‌هایی که در آن‌ها نوبت‌دهی غیرفعال می‌شود (فرمت میلادی
          YYYY-MM-DD)
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={offDayInput}
            onChange={(e) => setOffDayInput(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={addOffDay}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
          >
            افزودن تعطیلی
          </button>
        </div>
        {offDays.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {offDays.map((d) => (
              <li
                key={d}
                className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm"
              >
                {d}
                <button
                  type="button"
                  onClick={() => removeOffDay(d)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="حذف"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">روز تعطیلی ثبت نشده است.</p>
        )}
      </div>

      {/* دکمه ذخیره */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "در حال ذخیره..." : "ذخیره ساعت کاری"}
        </button>
      </div>

      {/* راهنما */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          📌 راهنما:
        </h3>
        <ul className="text-gray-600 text-sm space-y-1 mr-6 list-disc">
          <li>
            روی هر ساعت کلیک کنید تا آن ساعت به برنامه کاری اضافه یا حذف شود.
          </li>
          <li>بیماران فقط در ساعت‌های انتخابی شما می‌توانند نوبت رزرو کنند.</li>
          <li>
            روزهایی که هیچ ساعتی انتخاب نشده باشد، برای نوبت‌دهی بسته خواهد بود.
          </li>
          <li>هر نوبت ۳۰ دقیقه در نظر گرفته شده است.</li>
        </ul>
      </div>
    </div>
  );
}
