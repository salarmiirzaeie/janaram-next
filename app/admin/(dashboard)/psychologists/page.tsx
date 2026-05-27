"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Psychologist {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  specialties: string[];
  medicalLicenseNumber: string;
  experience: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  avatar?: string;
}

export default function AdminPsychologistsPage() {
  const router = useRouter();
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPsychologists();
  }, [statusFilter, searchQuery]);

  const fetchPsychologists = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/psychologists?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPsychologists(data.data);
      }
    } catch (error) {
      console.error("Error fetching psychologists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">تأیید شده</span>;
      case "pending":
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">در انتظار تأیید</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">رد شده</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR").format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* هدر */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* فیلترها و جستجو */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === "pending" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                در انتظار تأیید
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === "approved" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                تأیید شده
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === "rejected" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                رد شده
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="جستجوی نام، تلفن یا شماره نظام روانشناسی..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* لیست روانشناسان */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : psychologists.length === 0 ? (
            <div className="p-12 text-center text-gray-500">روانشناسی یافت نشد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-right">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">نام</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">تخصص</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">شماره نظام روانشناسی</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">تاریخ ثبت</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {psychologists.map((psych) => (
                    <tr key={psych.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {psych.avatar ? (
                            <img src={psych.avatar} alt={psych.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-gray-500"
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
                          )}
                          <span className="text-sm font-medium text-gray-800">{psych.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {psych.specialties && psych.specialties.length > 0
                          ? psych.specialties.slice(0, 2).join("، ")
                          : psych.specialty || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dir-ltr">{psych.medicalLicenseNumber || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(psych.createdAt)}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(psych.status)}
                        {psych.status === "rejected" && psych.rejectionReason && (
                          <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate">
                            {psych.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/admin/psychologists/${psych.id}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition"
                        >
                          مشاهده جزئیات
                        </button>
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
