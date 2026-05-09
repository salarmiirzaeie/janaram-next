"use client";

import { useEffect, useState } from "react";
import moment from "moment-jalaali";

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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, today, upcoming, past
  const [statusFilter, setStatusFilter] = useState("all"); // all, confirmed, completed, cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

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
        allAppointments = [...todayData.data.appointments];
      }
      if (upcomingData.success) {
        allAppointments = [
          ...allAppointments,
          ...upcomingData.data.appointments,
        ];
      }

      setAppointments(allAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: string
  ) => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    try {
      const res = await fetch(
        `/api/v2/doctor/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      confirmed: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      "no-show": "bg-gray-100 text-gray-700",
    };
    const texts: Record<string, string> = {
      confirmed: "تأیید شده",
      completed: "انجام شده",
      cancelled: "لغو شده",
      "no-show": "حضور نیافته",
    };
    return (
      <span
        className={`${
          badges[status] || "bg-gray-100 text-gray-700"
        } px-2 py-1 rounded-full text-xs`}
      >
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

    const matchesStatusFilter =
      statusFilter === "all" || app.status === statusFilter;

    return matchesDateFilter && matchesStatusFilter;
  });

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
            <h1 className="text-xl font-bold text-gray-800">مدیریت نوبت‌ها</h1>
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
        {/* فیلترها */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setFilter("today")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "today"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                امروز
              </button>
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "upcoming"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                آینده
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "past"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                گذشته
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="confirmed">تأیید شده</option>
              <option value="completed">انجام شده</option>
              <option value="cancelled">لغو شده</option>
              <option value="no-show">حضور نیافته</option>
            </select>
          </div>
        </div>

        {/* لیست نوبت‌ها */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              نوبتی با این فیلترها یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      ساعت
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      نام بیمار
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      شماره تماس
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {formatDatePersian(app.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {app.time}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {app.user.name || "نامشخص"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dir-ltr">
                        {app.user.phone || "نامشخص"}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4">
                        {app.status === "confirmed" && (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() =>
                                handleStatusChange(app.id, "completed")
                              }
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs transition"
                            >
                              انجام شد
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(app.id, "no-show")
                              }
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-xs transition"
                            >
                              حضور نیافت
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(app.id, "cancelled")
                              }
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition"
                            >
                              لغو
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
