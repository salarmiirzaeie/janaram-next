"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Appointment {
  id: string;
  time: string;
  status: string;
  user: {
    name: string;
    phone: string;
  };
}

interface Stats {
  totalToday: number;
  totalUpcoming: number;
  totalCompleted: number;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    try {
      // دریافت نوبت‌های امروز
      const todayRes = await fetch("/api/v2/doctor/appointments/today", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const todayData = await todayRes.json();
      if (todayData.success) {
        setTodayAppointments(todayData.data.appointments || []);
      }

      // دریافت نوبت‌های آینده برای شمارش
      const upcomingRes = await fetch("/api/v2/doctor/appointments/upcoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const upcomingData = await upcomingRes.json();
      if (upcomingData.success) {
        setUpcomingCount(upcomingData.data.count || 0);
      }

      // دریافت اطلاعات پزشک
      const profileRes = await fetch("/api/v2/doctor/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setDoctorName(profileData.data.name);
      }

      // آمار نوبت‌های انجام شده (از تاریخچه - ساده)
      // می‌توانی بعداً API جداگانه برای آمار بسازی
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
        // به‌روزرسانی لیست
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
            تأیید شده
          </span>
        );
      case "completed":
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
            انجام شده
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
            لغو شده
          </span>
        );
      case "no-show":
        return (
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            حضور نیافته
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    router.push("/doctor/login");
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">پنل روانشناس</h1>
            <span className="text-sm text-gray-500">
              خوش آمدید، {doctorName || "دکتر"}
            </span>
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
        {/* کارت‌های آمار */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-blue-500">
            <div className="text-gray-500 text-sm">نوبت‌های امروز</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">
              {todayAppointments.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-green-500">
            <div className="text-gray-500 text-sm">نوبت‌های آینده</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">
              {upcomingCount}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-purple-500">
            <div className="text-gray-500 text-sm">
              نوبت‌های انجام شده (این ماه)
            </div>
            <div className="text-3xl font-bold text-gray-800 mt-1">
              {completedCount}
            </div>
          </div>
        </div>

        {/* نوبت‌های امروز */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">نوبت‌های امروز</h2>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              نوبتی برای امروز وجود ندارد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-right">
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
                  {todayAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
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
                          <div className="flex gap-2">
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

        {/* لینک‌های سریع */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <a
            href="/doctor/appointments"
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition border border-gray-100"
          >
            <div className="text-blue-500 text-2xl mb-2">📋</div>
            <div className="font-medium text-gray-800">مشاهده همه نوبت‌ها</div>
          </a>
          <a
            href="/doctor/schedule"
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition border border-gray-100"
          >
            <div className="text-green-500 text-2xl mb-2">⏰</div>
            <div className="font-medium text-gray-800">تنظیم ساعت کاری</div>
          </a>
          <a
            href="/doctor/profile"
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition border border-gray-100"
          >
            <div className="text-purple-500 text-2xl mb-2">👤</div>
            <div className="font-medium text-gray-800">ویرایش پروفایل</div>
          </a>
        </div>
      </main>
    </div>
  );
}
