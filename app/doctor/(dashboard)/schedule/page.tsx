"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Save,
  Info,
  Calendar,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { useFeedbackModal } from "@/components/doctor/useFeedbackModal";

type Schedule = {
  [key: number]: string[];
};

const DAYS = [
  { id: 0, name: "شنبه", short: "ش" },
  { id: 1, name: "یکشنبه", short: "ی" },
  { id: 2, name: "دوشنبه", short: "د" },
  { id: 3, name: "سه‌شنبه", short: "س" },
  { id: 4, name: "چهارشنبه", short: "چ" },
  { id: 5, name: "پنجشنبه", short: "پ" },
  { id: 6, name: "جمعه", short: "ج" },
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

const TIME_GROUPS = [
  {
    id: "morning",
    label: "صبح",
    icon: Sun,
    from: "09:00",
    to: "12:30",
  },
  {
    id: "afternoon",
    label: "بعدازظهر",
    icon: Sunset,
    from: "13:00",
    to: "17:30",
  },
  {
    id: "evening",
    label: "عصر",
    icon: Moon,
    from: "18:00",
    to: "20:00",
  },
] as const;

function slotsInRange(from: string, to: string) {
  const fromIdx = TIME_SLOTS.indexOf(from);
  const toIdx = TIME_SLOTS.indexOf(to);
  return TIME_SLOTS.filter((_, i) => i >= fromIdx && i <= toIdx);
}

function formatOffDayPersian(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("fa-IR", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DoctorSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [offDays, setOffDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [offDaysOpen, setOffDaysOpen] = useState(false);
  const [offDayInput, setOffDayInput] = useState("");
  const { modal, showSuccess, showError } = useFeedbackModal();

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
        showSuccess("ساعت کاری و روزهای تعطیل ذخیره شد.");
      } else {
        showError(data.message || "خطا در ذخیره سازی");
      }
    } catch {
      showError("خطا در ارتباط با سرور");
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
      }
      return {
        ...prev,
        [dayId]: [...currentSlots, time].sort(),
      };
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

  const applyPreset = (dayId: number, from: string, to: string) => {
    const preset = slotsInRange(from, to);
    setSchedule((prev) => {
      const current = new Set(prev[dayId] || []);
      const allInPreset = preset.every((t) => current.has(t));
      if (allInPreset) {
        preset.forEach((t) => current.delete(t));
      } else {
        preset.forEach((t) => current.add(t));
      }
      return {
        ...prev,
        [dayId]: Array.from(current).sort(),
      };
    });
  };

  const addOffDay = () => {
    if (!offDayInput || offDays.includes(offDayInput)) return;
    setOffDays((prev) => [...prev, offDayInput].sort());
    setOffDayInput("");
  };

  const removeOffDay = (date: string) => {
    setOffDays((prev) => prev.filter((d) => d !== date));
  };

  const stats = useMemo(() => {
    let totalSlots = 0;
    let activeDays = 0;
    DAYS.forEach((day) => {
      const slots = schedule[day.id] || [];
      if (slots.length > 0) activeDays++;
      totalSlots += slots.length;
    });
    return { totalSlots, activeDays };
  }, [schedule]);

  const selectedDayMeta = DAYS.find((d) => d.id === selectedDay)!;
  const selectedSlots = schedule[selectedDay] || [];
  const isScheduleEmpty = stats.totalSlots === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 lg:pb-6" dir="rtl">
      {modal}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ساعت کاری</h1>
        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
          روز و ساعت پذیرش را مشخص کنید تا مراجعان بتوانند نوبت رزرو کنند.
        </p>
      </div>

      {isScheduleEmpty && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
          <p className="font-bold text-violet-900 text-sm">هنوز ساعتی ثبت نشده</p>
          <p className="text-violet-800 text-sm mt-1 leading-relaxed">
            از نوار روزها یک روز را انتخاب کنید، ساعت‌ها را بزنید و در پایین «ذخیره» را بزنید.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5">
          <p className="text-xs text-gray-500">روزهای فعال</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {stats.activeDays.toLocaleString("fa-IR")}
            <span className="text-sm font-normal text-gray-500"> / ۷</span>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5">
          <p className="text-xs text-gray-500">نوبت ۳۰ دقیقه‌ای در هفته</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.totalSlots.toLocaleString("fa-IR")}</p>
        </div>
      </div>

      {/* انتخاب روز — اسکرول افقی موبایل */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-gray-50/95 backdrop-blur-sm lg:static lg:mx-0 lg:px-0 lg:bg-transparent lg:py-0">
        <p className="text-xs font-medium text-gray-500 mb-2">روز هفته</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DAYS.map((day) => {
            const count = (schedule[day.id] || []).length;
            const active = selectedDay === day.id;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDay(day.id)}
                className={`shrink-0 flex flex-col items-center min-w-[3.25rem] px-3 py-2.5 rounded-xl border-2 transition ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-md"
                    : count > 0
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <span className="text-sm font-bold">{day.short}</span>
                <span className="text-[10px] mt-0.5 opacity-90">{count > 0 ? `${count} ساعت` : "خالی"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ویرایش روز انتخاب‌شده */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedDayMeta.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedSlots.length > 0
                  ? `${selectedSlots.length.toLocaleString("fa-IR")} نوبت فعال — هر نوبت ۳۰ دقیقه`
                  : "این روز برای رزرو بسته است"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selectAllForDay(selectedDay)}
                className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                همه ساعات
              </button>
              <button
                type="button"
                onClick={() => clearAllForDay(selectedDay)}
                className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg"
              >
                <Square className="w-3.5 h-3.5" />
                پاک کردن
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {TIME_GROUPS.map((group) => {
              const presetSlots = slotsInRange(group.from, group.to);
              const allOn = presetSlots.every((t) => selectedSlots.includes(t));
              const Icon = group.icon;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => applyPreset(selectedDay, group.from, group.to)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition ${
                    allOn ? "border-violet-300 bg-violet-100 text-violet-800" : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {group.label}
                  <span className="text-gray-400 font-normal">
                    {group.from.slice(0, 5)}–{group.to.slice(0, 5)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 space-y-5">
          {TIME_GROUPS.map((group) => {
            const groupSlots = slotsInRange(group.from, group.to);
            const Icon = group.icon;
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{group.label}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {groupSlots.map((time) => {
                    const isSelected = selectedSlots.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => toggleTimeSlot(selectedDay, time)}
                        className={`py-3 rounded-xl text-sm font-medium transition active:scale-95 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* خلاصه هفته — دسکتاپ و مرور سریع */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          خلاصه هفته
        </h3>
        <ul className="space-y-2">
          {DAYS.map((day) => {
            const slots = schedule[day.id] || [];
            const first = slots[0];
            const last = slots[slots.length - 1];
            return (
              <li key={day.id}>
                <button
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl text-right transition ${
                    selectedDay === day.id ? "bg-blue-50 ring-2 ring-blue-200" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span className="font-medium text-gray-900">{day.name}</span>
                  <span className="text-sm text-gray-500">
                    {slots.length === 0
                      ? "بسته"
                      : slots.length === 1
                        ? `ساعت ${first}`
                        : `${first} تا ${last} (${slots.length} نوبت)`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* روزهای تعطیل */}
      {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setOffDaysOpen((o) => !o)}
          className="w-full flex items-center justify-between p-4 text-right"
        >
          <div>
            <h2 className="text-base font-bold text-gray-900">روزهای تعطیل</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {offDays.length > 0
                ? `${offDays.length.toLocaleString("fa-IR")} تاریخ ثبت‌شده`
                : "تعطیلی یک‌باره (مثلاً تعطیلات)"}
            </p>
          </div>
          {offDaysOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {offDaysOpen && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              در این تاریخ‌ها حتی با ساعت کاری فعال، نوبت‌دهی غیرفعال می‌شود.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={offDayInput}
                onChange={(e) => setOffDayInput(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-base min-h-[48px]"
              />
              <button
                type="button"
                onClick={addOffDay}
                disabled={!offDayInput}
                className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white font-medium px-5 py-3 rounded-xl text-sm min-h-[48px]"
              >
                افزودن
              </button>
            </div>
            {offDays.length > 0 ? (
              <ul className="space-y-2">
                {offDays.map((d) => (
                  <li
                    key={d}
                    className="flex items-center justify-between gap-2 bg-red-50 text-red-800 px-4 py-3 rounded-xl text-sm"
                  >
                    <span>
                      <span className="font-medium block">
                        {formatOffDayPersian(d)}
                      </span>
                      <span className="text-xs text-red-600/80">{d}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOffDay(d)}
                      className="shrink-0 text-red-600 font-bold px-3 py-1 rounded-lg hover:bg-red-100"
                      aria-label="حذف"
                    >
                      حذف
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-2">
                روز تعطیلی ثبت نشده
              </p>
            )}
          </div>
        )}
      </div> */}

      <div className="hidden lg:flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "در حال ذخیره..." : "ذخیره ساعت کاری"}
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600 space-y-2 leading-relaxed">
        <p className="font-bold text-gray-800 flex items-center gap-2">
          <Info className="w-4 h-4" />
          نکات
        </p>
        <ul className="list-disc mr-5 space-y-1">
          <li>هر خانه = یک نوبت ۳۰ دقیقه‌ای.</li>
          <li>روز بدون ساعت = مراجع نمی‌تواند رزرو کند.</li>
          <li>پس از تغییر حتماً ذخیره کنید.</li>
        </ul>
      </div>

      {/* نوار ذخیره ثابت موبایل */}
      <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "در حال ذخیره..." : "ذخیره ساعت کاری"}
        </button>
      </div>
    </div>
  );
}
