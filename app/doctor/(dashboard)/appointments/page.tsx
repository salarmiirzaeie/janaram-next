"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import moment from "moment-jalaali";
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, Filter, AlertCircle } from "lucide-react";
import { canDoctorMarkCompleted, canDoctorMarkNoShow, NO_SHOW_GRACE_MINUTES } from "@/lib/booking-lifecycle";
import { useFeedbackModal } from "@/components/doctor/useFeedbackModal";

// تنظیم moment-jalaali
moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  user: {
    name: string;
    phone: string;
  };
}

// تبدیل تاریخ میلادی به شمسی برای نمایش
const formatDatePersian = (gregorianDateStr: string) => {
  const m = moment(gregorianDateStr);
  return m.format("jD jMMMM jYYYY");
};

// تبدیل تاریخ میلادی به فرمت عددی شمسی برای مقایسه (YYYYMMDD)
const toJalaaliNumber = (gregorianDateStr: string): number => {
  const m = moment(gregorianDateStr);
  const jYear = m.jYear();
  const jMonth = m.jMonth() + 1;
  const jDay = m.jDate();
  return jYear * 10000 + jMonth * 100 + jDay;
};

// گرفتن تاریخ امروز به شمسی (برای فیلتر)
const getTodayJalaaliNumber = (): number => {
  const now = moment();
  const jYear = now.jYear();
  const jMonth = now.jMonth() + 1;
  const jDay = now.jDate();
  return jYear * 10000 + jMonth * 100 + jDay;
};

const DATE_FILTERS = ["all", "today", "upcoming", "past"] as const;

function AppointmentActions({
  app,
  onStatusChange,
}: {
  app: Appointment;
  onStatusChange: (id: string, status: string) => void;
}) {
  if (app.status !== "confirmed") return null;

  const slot = {
    status: "confirmed" as const,
    date: app.date,
    time: app.time,
  };
  const showComplete = canDoctorMarkCompleted(slot);
  const showNoShow = canDoctorMarkNoShow(slot);

  return (
    <div className="flex flex-col gap-1.5 items-stretch sm:items-start w-full">
      <div className="flex flex-wrap gap-2">
        {showComplete && (
          <button
            type="button"
            onClick={() => onStatusChange(app.id, "completed")}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1 min-h-[36px] flex-1 sm:flex-initial"
          >
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            انجام شد
          </button>
        )}
        {showNoShow && (
          <button
            type="button"
            onClick={() => onStatusChange(app.id, "no-show")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1 min-h-[36px] flex-1 sm:flex-initial"
          >
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            حضور نیافت
          </button>
        )}
      </div>
      {!showComplete && (
        <p className="text-[11px] text-gray-500 leading-relaxed">
          «انجام شد» پس از شروع زمان نوبت فعال می‌شود.
        </p>
      )}
      {showComplete && !showNoShow && (
        <p className="text-[11px] text-gray-500 leading-relaxed">
          «حضور نیافت» از {NO_SHOW_GRACE_MINUTES} دقیقه پس از شروع زمان نوبت فعال می‌شود.
        </p>
      )}
      {showNoShow && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 leading-relaxed">
          توصیه: ابتدا با مراجع تماس بگیرید و در صورت امکان برای زمان دیگر جلسه هماهنگ کنید. در صورت عدم پاسخ، «حضور
          نیافت» را بزنید — مبلغ جلسه به سهم شما واریز می‌شود.
        </p>
      )}
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const searchParams = useSearchParams();
  const initialDateFilter = searchParams.get("filter");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(() =>
    DATE_FILTERS.includes(initialDateFilter as (typeof DATE_FILTERS)[number])
      ? (initialDateFilter as string)
      : "all"
  );
  const [statusFilter, setStatusFilter] = useState("all"); // all, confirmed, completed, cancelled
  /** Re-render so session action buttons unlock when Tehran time passes thresholds */
  const [, setNowTick] = useState(0);
  const { modal, showSuccess, showError } = useFeedbackModal();

  useEffect(() => {
    fetchAppointments();
  }, []);

  // useEffect(() => {
  //   const id = setInterval(() => setNowTick((n) => n + 1), 30_000);
  //   return () => clearInterval(id);
  // }, []);

  const fetchAppointments = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    try {
      // دریافت نوبت‌های امروز و آینده با هم
      const [todayRes, upcomingRes] = await Promise.all([
        fetch("/api/v2/doctor/appointments/today", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/v2/doctor/appointments/upcoming", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const todayData = await todayRes.json();
      const upcomingData = await upcomingRes.json();

      let allAppointments: Appointment[] = [];

      if (todayData.success) {
        const todayDate = todayData.data.date;
        allAppointments = todayData.data.appointments.map((app: Appointment) => ({
          ...app,
          date: app.date || todayDate,
        }));
      }
      if (upcomingData.success) {
        allAppointments = [...allAppointments, ...upcomingData.data.appointments];
      }

      setAppointments(allAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    const confirmMessages: Record<string, string> = {
      completed:
        "جلسه برگزار شد؟ مبلغ جلسه (منهای کارمزد پلتفرم در صورت وجود) در گزارش مالی شما ثبت می‌شود.",
      "no-show": `قبل از ثبت «حضور نیافت»، با مراجع تماس گرفته و برای زمان دیگر هماهنگ کرده‌اید؟\n\nاگر مراجع پاسخ نداد: با تأیید، حضور نیافت ثبت می‌شود و کل مبلغ جلسه به سهم شما در گزارش مالی واریز می‌شود.`,
    };
    if (!window.confirm(confirmMessages[newStatus] || "وضعیت تغییر کند؟")) {
      return;
    }

    try {
      const res = await fetch(`/api/v2/doctor/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
        const successMessages: Record<string, string> = {
          completed:
            "جلسه به «انجام شده» ثبت شد. مبلغ در گزارش مالی شما منظور می‌شود.",
          "no-show":
            "«حضور نیافت» ثبت شد. مبلغ جلسه طبق قوانین به سهم شما ثبت می‌شود.",
        };
        showSuccess(
          successMessages[newStatus] || "وضعیت نوبت با موفقیت به‌روزرسانی شد."
        );
      } else {
        showError(data.message || "خطا در به‌روزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showError("خطا در ارتباط با سرور");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending_payment: "bg-orange-100 text-orange-700",
      confirmed: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      "no-show": "bg-gray-100 text-gray-700",
    };
    const texts: Record<string, string> = {
      pending_payment: "در انتظار پرداخت",
      confirmed: "تأیید شده",
      completed: "انجام شده",
      cancelled: "لغو شده",
      "no-show": "حضور نیافت",
    };
    const icons: Record<string, React.ReactNode> = {
      pending_payment: <Clock className="w-3 h-3 ml-1" />,
      confirmed: <AlertCircle className="w-3 h-3 ml-1" />,
      completed: <CheckCircle className="w-3 h-3 ml-1" />,
      cancelled: <XCircle className="w-3 h-3 ml-1" />,
      "no-show": <XCircle className="w-3 h-3 ml-1" />,
    };
    return (
      <span
        className={`inline-flex items-center shrink-0 ${
          badges[status] || "bg-gray-100 text-gray-700"
        } px-2 py-1 rounded-full text-xs`}
      >
        {icons[status]}
        {texts[status] || status}
      </span>
    );
  };

  // فیلتر کردن نوبت‌ها با استفاده از تاریخ شمسی
  const filteredAppointments = appointments.filter((app) => {
    const todayNumber = getTodayJalaaliNumber();
    const appDateNumber = toJalaaliNumber(app.date);

    let matchesDateFilter = true;
    if (filter === "today") {
      matchesDateFilter = appDateNumber === todayNumber;
    } else if (filter === "upcoming") {
      matchesDateFilter = appDateNumber > todayNumber;
    } else if (filter === "past") {
      matchesDateFilter = appDateNumber < todayNumber;
    }

    const matchesStatusFilter = statusFilter === "all" || app.status === statusFilter;

    return matchesDateFilter && matchesStatusFilter;
  });

  // آمار برای نمایش
  const stats = {
    total: filteredAppointments.length,
    today: appointments.filter((app) => toJalaaliNumber(app.date) === getTodayJalaaliNumber()).length,
    upcoming: appointments.filter((app) => toJalaaliNumber(app.date) > getTodayJalaaliNumber()).length,
    completed: appointments.filter((app) => app.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {modal}
      {/* هدر صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">مدیریت نوبت‌ها</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">مشاهده و مدیریت نوبت‌های بیماران</p>
          <p className="text-amber-700 text-xs mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
            مراجع هنگام رزرو پرداخت می‌کند. مبلغ تا مشخص شدن وضعیت جلسه (انجام‌شده، حضور نیافت، یا لغو دیرهنگام توسط
            مراجع) در گزارش مالی شما ثبت نمی‌شود. شما نمی‌توانید نوبت را لغو کنید؛ قبل از «حضور نیافت» با مراجع تماس
            بگیرید؛ پس از شروع وقت، «انجام شد» یا «حضور نیافت» را بزنید.
          </p>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border-r-4 border-blue-500 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">کل نوبت‌ها</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border-r-4 border-yellow-500 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">نوبت‌های امروز</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{stats.today}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border-r-4 border-green-500 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">نوبت‌های آینده</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{stats.upcoming}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border-r-4 border-purple-500 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">انجام شده</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 sm:flex-wrap sm:overflow-visible">
            <button
              onClick={() => setFilter("all")}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "today" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              امروز
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              آینده
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "past" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              گذشته
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-initial min-w-0 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending_payment">در انتظار پرداخت</option>
              <option value="confirmed">تأیید شده</option>
              <option value="completed">انجام شده</option>
              <option value="cancelled">لغو شده</option>
              <option value="no-show">حضور نیافته</option>
            </select>
          </div>
        </div>
      </div>

      {/* لیست نوبت‌ها */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">نوبتی با این فیلترها یافت نشد</p>
          </div>
        ) : (
          <>
            {/* نمای موبایل — کارت */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredAppointments.map((app) => (
                <div key={app.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <p className="font-semibold text-gray-900 truncate">{app.user.name || "نامشخص"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {formatDatePersian(app.date)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {app.time}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  {app.user.phone ? (
                    <a
                      href={`tel:${app.user.phone}`}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dir-ltr"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{app.user.phone}</span>
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">شماره تماس نامشخص</p>
                  )}

                  <AppointmentActions app={app} onStatusChange={handleStatusChange} />
                </div>
              ))}
            </div>

            {/* نمای دسکتاپ — جدول */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-right">
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">ساعت</th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">نام بیمار</th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">شماره تماس</th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                    <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                        {formatDatePersian(app.date)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {app.time}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-800">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {app.user.name || "نامشخص"}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 dir-ltr">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {app.user.phone || "نامشخص"}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">{getStatusBadge(app.status)}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <AppointmentActions app={app} onStatusChange={handleStatusChange} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
