"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar,
  CalendarClock,
  Wallet,
  UserCircle,
  ClipboardList,
  ChevronRight,
  Clock,
  Banknote,
  ListChecks,
  ArrowLeft,
} from "lucide-react";

type QuickStat = {
  todayCount: number;
  confirmedToday: number;
  pendingPayout: number;
  nextTime: string | null;
  nextPatient: string | null;
};

const quickLinks = [
  // {
  //   title: "نوبت‌های امروز",
  //   description: "مشاهده و ثبت انجام‌شده / حضور نیافت",
  //   href: "/doctor/appointments?filter=today",
  //   icon: Calendar,
  //   accent: "from-blue-500 to-blue-600",
  //   ring: "ring-blue-100",
  // },
  {
    title: "همه نوبت‌ها",
    description: "فیلتر بر اساس تاریخ و وضعیت",
    href: "/doctor/appointments",
    icon: ClipboardList,
    accent: "from-indigo-500 to-indigo-600",
    ring: "ring-indigo-100",
  },
  {
    title: "جدول زمانی",
    description: "ساعات کاری و روزهای تعطیل",
    href: "/doctor/schedule",
    icon: CalendarClock,
    accent: "from-violet-500 to-violet-600",
    ring: "ring-violet-100",
  },
  {
    title: "مالی و تسویه",
    description: " درآمد جلسات و  اطلاعات بانکی",
    href: "/doctor/payment",
    icon: Wallet,
    accent: "from-emerald-500 to-emerald-600",
    ring: "ring-emerald-100",
  },
  {
    title: "پروفایل",
    description: "اطلاعات حرفه‌ای   ",
    href: "/doctor/profile",
    icon: UserCircle,
    accent: "from-slate-600 to-slate-700",
    ring: "ring-slate-100",
  },
];

type ScheduleSummary = {
  activeDays: number;
  totalSlots: number;
};

export default function DoctorDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary>({
    activeDays: 0,
    totalSlots: 0,
  });
  const [stats, setStats] = useState<QuickStat>({
    todayCount: 0,
    confirmedToday: 0,
    pendingPayout: 0,
    nextTime: null,
    nextPatient: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, todayRes, financialRes, scheduleRes] = await Promise.all([
        fetch("/api/v2/doctor/profile", { headers }),
        fetch("/api/v2/doctor/appointments/today", { headers }),
        fetch("/api/v2/doctor/financial/stats", { headers }),
        fetch("/api/v2/doctor/schedule", { headers }),
      ]);

      const profileData = await profileRes.json();
      if (profileData.success) {
        setDoctorName(profileData.data.name);
      }

      let todayCount = 0;
      let confirmedToday = 0;
      let nextTime: string | null = null;
      let nextPatient: string | null = null;

      const todayData = await todayRes.json();
      if (todayData.success) {
        const apps = todayData.data.appointments as Array<{
          time: string;
          status: string;
          user?: { name?: string };
        }>;
        todayCount = todayData.data.count ?? apps.length;
        confirmedToday = apps.filter((a) => a.status === "confirmed").length;

        const now = new Date();
        const upcoming = apps
          .filter((a) => a.status === "confirmed" || a.status === "pending_payment")
          .filter((a) => {
            const [h, m] = a.time.split(":").map(Number);
            const slot = new Date();
            slot.setHours(h, m, 0, 0);
            return slot >= now;
          })
          .sort((a, b) => a.time.localeCompare(b.time));

        if (upcoming.length > 0) {
          nextTime = upcoming[0].time;
          nextPatient = upcoming[0].user?.name || null;
        }
      }

      let pendingPayout = 0;
      const financialData = await financialRes.json();
      if (financialData.success) {
        pendingPayout = financialData.data.pendingPayout ?? 0;
      }

      const scheduleData = await scheduleRes.json();
      if (scheduleData.success) {
        const sched = scheduleData.data.schedule as Record<string, string[]>;
        let activeDays = 0;
        let totalSlots = 0;
        Object.values(sched || {}).forEach((slots) => {
          if (Array.isArray(slots) && slots.length > 0) {
            activeDays++;
            totalSlots += slots.length;
          }
        });
        setScheduleSummary({ activeDays, totalSlots });
      }

      setStats({
        todayCount,
        confirmedToday,
        pendingPayout,
        nextTime,
        nextPatient,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">خوش آمدید، دکتر {doctorName || "عزیز"}</h1>
        <p className="text-blue-100 text-sm">
          {new Date().toLocaleDateString("fa-IR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div
        className={`rounded-2xl border p-5 ${
          scheduleSummary.totalSlots === 0 ? "bg-violet-50 border-violet-200" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              scheduleSummary.totalSlots === 0 ? "bg-violet-600 text-white" : "bg-blue-50 text-blue-600"
            }`}
          >
            <ListChecks className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base">
              {scheduleSummary.totalSlots === 0 ? "برای شروع: ساعت کاری را تنظیم کنید" : "راهنمای شروع کار در جانارام"}
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {scheduleSummary.totalSlots === 0
                ? "تا زمانی که روز و ساعت پذیرش را مشخص نکنید، مراجعان نمی‌توانند برای شما نوبت رزرو کنند."
                : `ساعت کاری شما فعال است (${scheduleSummary.activeDays.toLocaleString("fa-IR")} روز، ${scheduleSummary.totalSlots.toLocaleString("fa-IR")} نوبت در هفته). در صورت نیاز به‌روزرسانی کنید.`}
            </p>
            <ol className="text-sm text-gray-700 mt-3 space-y-2 list-decimal mr-5 leading-relaxed">
              <li>
                <strong>ساعت کاری:</strong> روزهای هفته و بازه‌های ۳۰ دقیقه‌ای را انتخاب و ذخیره کنید.
              </li>
              <li>
                <strong>پروفایل:</strong> در صورت نیاز تکمیل کنید.
              </li>
              <li>
                <strong>نوبت‌ها:</strong> پس از رزرو، وضعیت جلسه را بعد از زمان مقرر ثبت کنید.
              </li>
            </ol>
            <Link
              href="/doctor/schedule"
              className={`inline-flex items-center gap-2 mt-4 font-bold text-sm px-4 py-2.5 rounded-xl transition ${
                scheduleSummary.totalSlots === 0
                  ? "bg-violet-600 hover:bg-violet-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {scheduleSummary.totalSlots === 0 ? "تنظیم ساعت کاری" : "ویرایش جدول زمانی"}
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">نوبت امروز</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayCount.toLocaleString("fa-IR")}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">تأییدشده امروز</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.confirmedToday.toLocaleString("fa-IR")}</p>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">در انتظار واریز</p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                {stats.pendingPayout.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-gray-500">تومان</span>
              </p>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl shrink-0 mr-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">نوبت بعدی امروز</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {stats.nextTime
                  ? `${stats.nextTime}${stats.nextPatient ? ` — ${stats.nextPatient}` : ""}`
                  : "نوبت فعالی باقی نمانده"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">دسترسی سریع</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 ring-2 ${item.ring} ring-transparent hover:ring-opacity-100`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`bg-gradient-to-br ${item.accent} p-3 rounded-xl text-white shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors rotate-180" />
                </div>
                <h3 className="font-bold text-gray-900 mt-4 text-base">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-900 leading-relaxed">
        <strong>یادآوری:</strong> مبلغ جلسات پس از مشخص شدن وضعیت (انجام‌شده، حضور نیافت، یا لغو دیرهنگام مراجع) در بخش
        مالی ثبت می‌شود. قبل از «حضور نیافت» با مراجع تماس بگیرید.
      </div>
    </div>
  );
}
