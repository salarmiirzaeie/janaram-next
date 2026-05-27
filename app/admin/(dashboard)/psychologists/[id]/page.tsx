"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Psychologist {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  specialties: string[];
  bio: string;
  experience: number;
  sessionPrice: number;
  avatar: string | null;
  categoryId: string;
  medicalLicenseNumber: string;
  successfulConsultations: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  schedule?: any;
}

export default function AdminPsychologistDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [psychologist, setPsychologist] = useState<Psychologist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPsychologist();
    }
  }, [id]);

  const fetchPsychologist = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const res = await fetch(`/api/admin/psychologists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPsychologist(data.data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error fetching psychologist:", error);
      alert("خطا در دریافت اطلاعات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (status: "approved" | "rejected") => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/psychologists/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          rejectionReason: status === "rejected" ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowRejectModal(false);
        fetchPsychologist(); // به‌روزرسانی صفحه
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">تأیید شده</span>;
      case "pending":
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">در انتظار تأیید</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">رد شده</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!psychologist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">روانشناس یافت نشد</p>
          <button
            onClick={() => router.push("/admin/psychologists")}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            بازگشت به لیست
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* وضعیت و عملیات */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium">وضعیت فعلی:</span>
              {getStatusBadge(psychologist.status)}
            </div>
            {psychologist.status === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify("approved")}
                  disabled={isSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                >
                  ✓ تأیید و فعال‌سازی
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                >
                  ✗ رد کردن
                </button>
              </div>
            )}
          </div>
          {psychologist.status === "rejected" && psychologist.rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-red-700 text-sm">
                <span className="font-bold">دلیل رد شدن:</span> {psychologist.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* اطلاعات شخصی */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-bold text-gray-800">اطلاعات شخصی</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-sm">نام کامل</label>
                <p className="text-gray-800 font-medium">{psychologist.name}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-sm">شماره تلفن</label>
                <p className="text-gray-800 font-medium dir-ltr">{psychologist.phone}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-sm">شماره نظام روانشناسی</label>
                <p className="text-gray-800 font-medium">{psychologist.medicalLicenseNumber || "-"}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-sm">تعداد مشاوره‌های موفق</label>
                <p className="text-gray-800 font-medium">{psychologist.successfulConsultations}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-sm">سال‌های تجربه</label>
                <p className="text-gray-800 font-medium">{psychologist.experience} سال</p>
              </div>
              <div>
                <label className="block text-gray-500 text-sm">قیمت هر جلسه</label>
                <p className="text-gray-800 font-medium">{psychologist.sessionPrice.toLocaleString()} تومان</p>
              </div>
              <div>
                <label className="block text-gray-500 text-sm">دسته‌بندی</label>
                <p className="text-gray-800 font-medium">{psychologist.categoryId || "-"}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-sm">تاریخ ثبت‌نام</label>
                <p className="text-gray-800 font-medium">{formatDate(psychologist.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* تخصص‌ها */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-bold text-gray-800">تخصص‌ها</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {psychologist.specialties && psychologist.specialties.length > 0 ? (
                psychologist.specialties.map((spec, index) => (
                  <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {spec}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">{psychologist.specialty || "تخصصی ثبت نشده"}</p>
              )}
            </div>
          </div>
        </div>

        {/* بیوگرافی */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-bold text-gray-800">بیوگرافی</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">{psychologist.bio || "بیوگرافی ثبت نشده است"}</p>
          </div>
        </div>

        {/* مودال رد کردن */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">رد کردن روانشناس</h2>
              <p className="text-gray-600 mb-4">لطفاً دلیل رد کردن این روانشناس را وارد کنید:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: مدارک ناقص، شماره نظام روانشناسی نامعتبر، ..."
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleVerify("rejected")}
                  disabled={!rejectionReason.trim() || isSubmitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : "رد کردن"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
