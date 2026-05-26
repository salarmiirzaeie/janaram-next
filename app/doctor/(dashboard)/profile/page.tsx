"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Stethoscope,
  Award,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  Trash2,
  Save,
  Info,
  MessageCircle,
} from "lucide-react";
import { useFeedbackModal } from "@/components/doctor/useFeedbackModal";
import {
  doctorInputClassLtr,
  doctorInputClassRight,
  doctorInputDisabledClass,
  doctorSelectClass,
  doctorTextareaClass,
} from "@/lib/doctor-form-styles";

// تابع تبدیل اعداد فارسی/عربی به انگلیسی
const toEnglishNumber = (str: string): string => {
  if (!str) return str;
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianNumbers[i], "g"), i.toString());
    result = result.replace(new RegExp(arabicNumbers[i], "g"), i.toString());
  }
  return result;
};

// تابع تبدیل عدد ورودی (ممکن است فارسی باشد) به عدد انگلیسی
const parsePersianNumber = (value: string): number => {
  const englishStr = toEnglishNumber(value);
  const num = parseInt(englishStr, 10);
  return isNaN(num) ? 0 : num;
};

interface DoctorProfile {
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
  status: string;
  rejectionReason: string | null;
  baleId: string | null;
}

const SPECIALTIES_LIST = [
  { id: "clinical", name: "روانشناس بالینی" },
  { id: "child", name: "روانشناس کودک و نوجوان" },
  { id: "couple", name: "متخصص زوج درمانی" },
  { id: "family", name: "مشاور خانواده" },
  { id: "addiction", name: "متخصص ترک اعتیاد" },
  { id: "phobia", name: "درمانگر فوبیا و استرس" },
  { id: "sexual", name: "مشاور جنسی" },
];

const CATEGORIES = [
  { id: "individual", name: "مشاور فردی" },
  { id: "couple", name: "زوج درمانی" },
  { id: "family", name: "خانواده" },
  { id: "children", name: "کودکان" },
  { id: "addiction", name: "ترک اعتیاد" },
  { id: "phobia", name: "فوبیا و استرس" },
  { id: "sexual", name: "مشاور جنسی" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
          <CheckCircle className="w-3 h-3" />
          تأیید شده
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
          <AlertCircle className="w-3 h-3" />
          در انتظار تأیید
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
          <XCircle className="w-3 h-3" />
          رد شده
        </span>
      );
    default:
      return null;
  }
};

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile>({
    name: "",
    phone: "",
    specialty: "",
    specialties: [],
    bio: "",
    experience: 0,
    sessionPrice: 0,
    avatar: null,
    categoryId: "",
    medicalLicenseNumber: "",
    successfulConsultations: 0,
    status: "pending",
    rejectionReason: null,
    baleId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [priceError, setPriceError] = useState<string>("");
  const { modal, showSuccess, showError } = useFeedbackModal();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    try {
      const res = await fetch("/api/v2/doctor/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyToggle = (specialtyName: string) => {
    setProfile((prev) => {
      const currentSpecialties = [...prev.specialties];
      if (currentSpecialties.includes(specialtyName)) {
        return {
          ...prev,
          specialties: currentSpecialties.filter((s) => s !== specialtyName),
        };
      } else {
        return {
          ...prev,
          specialties: [...currentSpecialties, specialtyName],
        };
      }
    });
  };

  // هندلر تغییر قیمت با تبدیل خودکار فارسی به انگلیسی
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const englishValue = toEnglishNumber(rawValue);
    const numValue = parseInt(englishValue, 10);

    setProfile({ ...profile, sessionPrice: isNaN(numValue) ? 0 : numValue });

    // اعتبارسنجی لحظه‌ای
    if (numValue === 0 || (isNaN(numValue) && rawValue !== "")) {
      setPriceError("قیمت جلسه نمی‌تواند صفر باشد");
    } else {
      setPriceError("");
    }
  };

  // هندلر تغییر سال تجربه با تبدیل خودکار فارسی به انگلیسی
  const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const englishValue = toEnglishNumber(rawValue);
    const numValue = parseInt(englishValue, 10);
    setProfile({ ...profile, experience: isNaN(numValue) ? 0 : numValue });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    // اعتبارسنجی قیمت قبل از ارسال
    if (profile.sessionPrice <= 0) {
      showError(
        "قیمت هر جلسه نمی‌تواند صفر یا منفی باشد. لطفاً مبلغ معتبر وارد کنید."
      );
      return;
    }

    setIsSaving(true);

    // اطمینان از انگلیسی بودن تمام اعداد قبل از ارسال
    const payload = {
      name: profile.name,
      specialty: profile.specialties[0] || "",
      specialties: profile.specialties,
      bio: profile.bio,
      experience: profile.experience, // قبلاً عدد انگلیسی است
      sessionPrice: profile.sessionPrice, // قبلاً عدد انگلیسی است
      categoryId: profile.categoryId,
      baleId: profile.baleId,
    };

    try {
      const res = await fetch("/api/v2/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message || "پروفایل با موفقیت به‌روزرسانی شد.");
        fetchProfile();
      } else {
        showError(data.message || "خطا در ذخیره سازی");
      }
    } catch {
      showError("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {modal}
      {/* هدر صفحه */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">پروفایل من</h1>
        <p className="text-gray-500 mt-1">
          مشاهده و ویرایش اطلاعات حرفه‌ای شما
        </p>
      </div>

      {/* وضعیت حساب */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">وضعیت حساب:</span>
          {getStatusBadge(profile.status)}
        </div>
        {profile.status === "rejected" && profile.rejectionReason && (
          <div className="text-red-600 text-sm flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            دلیل: {profile.rejectionReason}
          </div>
        )}
      </div>

      {/* فرم پروفایل */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* نام کامل */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <User className="inline w-4 h-4 ml-1" />
              نام کامل
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className={doctorInputClassRight}
              placeholder="دکتر سارا محمدی"
              disabled={profile.status === "pending"}
            />
          </div>

          {/* شماره تلفن */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <Phone className="inline w-4 h-4 ml-1" />
              شماره تلفن
            </label>
            <input
              type="tel"
              value={profile.phone}
              disabled
              className={doctorInputDisabledClass}
              dir="ltr"
            />
            <p className="text-gray-400 text-xs mt-1 text-right flex items-center gap-1">
              <Info className="w-3 h-3" />
              شماره تلفن قابل ویرایش نیست
            </p>
          </div>

          {/* آپلود عکس */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              عکس پروفایل
            </label>
            <div className="flex flex-wrap items-center gap-4">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="پروفایل"
                  className="w-20 h-20 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  انتخاب عکس
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const token = localStorage.getItem("doctorToken");
                      const formData = new FormData();
                      formData.append("avatar", file);
                      try {
                        const res = await fetch(
                          "/api/v2/doctor/upload-avatar",
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData,
                          }
                        );
                        const data = await res.json();
                        if (data.success) {
                          setProfile({
                            ...profile,
                            avatar: data.data.avatar,
                          });
                          showSuccess("عکس پروفایل با موفقیت آپلود شد.");
                        } else {
                          showError(data.message || "خطا در آپلود عکس");
                        }
                      } catch {
                        showError("خطا در آپلود عکس");
                      }
                    }}
                  />
                </label>
                {profile.avatar && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("doctorToken");
                      try {
                        const res = await fetch(
                          "/api/v2/doctor/upload-avatar",
                          {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        const data = await res.json();
                        if (data.success) {
                          setProfile({ ...profile, avatar: null });
                          showSuccess("عکس پروفایل حذف شد.");
                        } else {
                          showError(data.message || "خطا در حذف عکس");
                        }
                      } catch {
                        showError("خطا در حذف عکس");
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف عکس
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-2 text-right">
              فرمت‌های مجاز: JPEG، PNG، WEBP (حداکثر ۲ مگابایت)
            </p>
          </div>

          {/* شماره نظام پزشکی */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <Award className="inline w-4 h-4 ml-1" />
              شماره نظام پزشکی
            </label>
            <input
              type="text"
              value={profile.medicalLicenseNumber}
              disabled
              className={doctorInputDisabledClass}
              dir="ltr"
            />
            <p className="text-gray-400 text-xs mt-1 text-right">
              شماره نظام پزشکی قابل ویرایش نیست
            </p>
          </div>

          {/* آیدی بله */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <MessageCircle className="inline w-4 h-4 ml-1" />
              آیدی بله (Bale ID)
            </label>
            <input
              type="text"
              value={profile.baleId || ""}
              onChange={(e) =>
                setProfile({ ...profile, baleId: e.target.value })
              }
              disabled={profile.status === "pending"}
              className={doctorInputClassLtr}
              placeholder="@username یا username"
              dir="ltr"
            />
            <p className="text-gray-400 text-xs mt-1 text-right">
              برای ارتباط با بیماران، آیدی خود را در پیام‌رسان بله وارد کنید
            </p>
          </div>

          {/* تعداد مشاوره‌های موفق */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <CheckCircle className="inline w-4 h-4 ml-1" />
              تعداد مشاوره‌های موفق
            </label>
            <input
              type="text"
              value={profile.successfulConsultations}
              disabled
              className={doctorInputDisabledClass}
            />
          </div>

          {/* تخصص‌ها */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <Stethoscope className="inline w-4 h-4 ml-1" />
              تخصص‌ها <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs mr-2">
                (می‌توانید چند مورد را انتخاب کنید)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES_LIST.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSpecialtyToggle(item.name)}
                  disabled={profile.status === "pending"}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    profile.specialties.includes(item.name)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${
                    profile.status === "pending"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            {profile.specialties.length > 0 && (
              <p className="text-green-600 text-xs mt-2 text-right">
                تخصص‌های انتخاب شده: {profile.specialties.join("، ")}
              </p>
            )}
          </div>

          {/* دسته‌بندی */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              دسته‌بندی
            </label>
            <select
              value={profile.categoryId}
              onChange={(e) =>
                setProfile({ ...profile, categoryId: e.target.value })
              }
              disabled={profile.status === "pending"}
              className={doctorSelectClass}
            >
              <option value="">انتخاب دسته‌بندی</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* سال تجربه */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <Calendar className="inline w-4 h-4 ml-1" />
              سال‌های تجربه
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={profile.experience === 0 ? "" : profile.experience}
              onChange={handleExperienceChange}
              disabled={profile.status === "pending"}
              className={doctorInputClassLtr}
              placeholder="مثال: ۱۲"
              dir="ltr"
            />
          </div>

          {/* قیمت هر جلسه */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <CreditCard className="inline w-4 h-4 ml-1" />
              قیمت هر جلسه (تومان)(نیم ساعت)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={profile.sessionPrice === 0 ? "" : profile.sessionPrice}
              onChange={handlePriceChange}
              disabled={profile.status === "pending"}
              className={`${doctorInputClassLtr} ${
                priceError ? "border-red-500 focus:ring-red-500" : ""
              }`}
              placeholder="مثال: ۲۵۰۰۰۰"
              dir="ltr"
            />
            {priceError && (
              <p className="text-red-500 text-xs mt-1 text-right flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {priceError}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-1 text-right">
              قیمت هر جلسه مشاوره به تومان (حداقل ۱ تومان)
            </p>
          </div>

          {/* بیوگرافی */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-right">
              <FileText className="inline w-4 h-4 ml-1" />
              بیوگرافی
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={profile.status === "pending"}
              rows={5}
              className={doctorTextareaClass}
              placeholder="توضیحات درباره خود، تخصص‌ها و روش درمانی..."
            />
          </div>
        </div>

        {profile.status !== "pending" && (
          <div className="border-t border-gray-100 p-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || priceError !== ""}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        )}
      </div>

      {/* راهنما */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          📌 راهنما:
        </h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>
            • اطلاعات پروفایل شما در صفحه جزئیات روانشناس به کاربران نشان داده
            می‌شود.
          </li>
          <li>• می‌توانید چند تخصص را همزمان انتخاب کنید.</li>
          <li>
            • قیمت هر جلسه را بر اساس تعرفه خود وارد کنید (حداقل ۱ تومان).
          </li>
          <li>• بیوگرافی خوب باعث افزایش اعتماد کاربران می‌شود.</li>
          <li>
            • پس از ویرایش تخصص‌ها، حساب شما دوباره نیاز به تأیید ادمین دارد.
          </li>
        </ul>
      </div>
    </div>
  );
}
