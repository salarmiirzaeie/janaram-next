"use client";

import { useState } from "react";
import { DoctorTermsModal } from "@/components/doctor/DoctorTermsModal";
import { DOCTOR_TERMS_VERSION } from "@/lib/doctor-terms";
import {
  doctorInputClassLtr,
  doctorInputClassRight,
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

// تابع تبدیل و دریافت عدد از ورودی فارسی
const getEnglishNumberFromInput = (value: string): number => {
  const englishStr = toEnglishNumber(value);
  const num = parseInt(englishStr, 10);
  return isNaN(num) ? 0 : num;
};

export default function DoctorRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    specialties: [] as string[],
    experience: "",
    sessionPrice: "",
    bio: "",
    categoryId: "individual",
    medicalLicenseNumber: "",
    baleId: "",
  });

  const specialtiesList = [
    { id: "clinical", name: "روانشناس بالینی" },
    { id: "child", name: "روانشناس کودک و نوجوان" },
    { id: "couple", name: "متخصص زوج درمانی" },
    { id: "family", name: "مشاور خانواده" },
    { id: "addiction", name: "متخصص ترک اعتیاد" },
    { id: "phobia", name: "درمانگر فوبیا و استرس" },
    { id: "sexual", name: "مشاور جنسی" },
  ];

  const categories = [
    { id: "individual", name: "مشاور فردی" },
    { id: "couple", name: "زوج درمانی" },
    { id: "family", name: "خانواده" },
    { id: "children", name: "کودکان" },
    { id: "addiction", name: "ترک اعتیاد" },
    { id: "phobia", name: "فوبیا و استرس" },
    { id: "sexual", name: "مشاور جنسی" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // برای فیلدهای عددی، ابتدا اعداد فارسی را به انگلیسی تبدیل کن
    if (name === "experience" || name === "sessionPrice") {
      const englishValue = toEnglishNumber(value);
      setFormData({ ...formData, [name]: englishValue });
    } else if (name === "phone" || name === "medicalLicenseNumber") {
      // شماره تلفن و نظام پزشکی: فقط اعداد انگلیسی و بدون کاراکتر غیرمجاز
      const englishValue = toEnglishNumber(value).replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: englishValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError("");
  };

  const handleSpecialtyToggle = (specialtyName: string) => {
    setFormData((prev) => {
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
    setError("");
  };

  const validateForm = (): { ok: true; experienceNum: number; sessionPriceNum: number } | { ok: false } => {
    setError("");
    setSuccess("");

    if (!formData.name || !formData.phone || !formData.password) {
      setError("نام، شماره تلفن و رمز عبور الزامی هستند");
      return { ok: false };
    }

    if (!formData.medicalLicenseNumber) {
      setError("شماره نظام پزشکی الزامی است");
      return { ok: false };
    }

    if (formData.password !== formData.confirmPassword) {
      setError("رمز عبور و تکرار آن مطابقت ندارند");
      return { ok: false };
    }

    if (formData.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return { ok: false };
    }

    if (formData.phone.length < 11) {
      setError("شماره تلفن نامعتبر است");
      return { ok: false };
    }

    if (formData.specialties.length === 0) {
      setError("حداقل یک تخصص را انتخاب کنید");
      return { ok: false };
    }

    const experienceNum = getEnglishNumberFromInput(formData.experience);
    const sessionPriceNum = getEnglishNumberFromInput(formData.sessionPrice);

    if (sessionPriceNum <= 0) {
      setError(
        "قیمت هر جلسه نمی‌تواند صفر یا منفی باشد. لطفاً مبلغ معتبر وارد کنید."
      );
      return { ok: false };
    }

    return { ok: true, experienceNum, sessionPriceNum };
  };

  const submitRegistration = async (
    experienceNum: number,
    sessionPriceNum: number
  ) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/v2/doctor/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
          specialty: formData.specialties[0],
          specialties: formData.specialties,
          experience: experienceNum,
          sessionPrice: sessionPriceNum,
          bio: formData.bio,
          categoryId: formData.categoryId,
          medicalLicenseNumber: formData.medicalLicenseNumber,
          baleId: formData.baleId || null,
          termsAccepted: true,
          termsVersion: DOCTOR_TERMS_VERSION,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShowTermsModal(false);
        setSuccess(
          "ثبت‌نام با موفقیت انجام شد. پس از تأیید ادمین می‌توانید وارد پنل شوید."
        );
        setFormData({
          name: "",
          phone: "",
          password: "",
          confirmPassword: "",
          specialty: "",
          specialties: [],
          experience: "",
          sessionPrice: "",
          bio: "",
          categoryId: "individual",
          medicalLicenseNumber: "",
          baleId: "",
        });
      } else {
        setError(data.message || "خطا در ثبت‌نام");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.ok) return;
    setShowTermsModal(true);
  };

  const handleTermsAccept = async () => {
    const validation = validateForm();
    if (!validation.ok) {
      setShowTermsModal(false);
      return;
    }
    await submitRegistration(validation.experienceNum, validation.sessionPriceNum);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <DoctorTermsModal
        open={showTermsModal}
        onClose={() => !isLoading && setShowTermsModal(false)}
        onAccept={handleTermsAccept}
        isSubmitting={isLoading}
      />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-500"
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
          <h1 className="text-2xl font-bold text-gray-800">ثبت‌نام روانشناس</h1>
          <p className="text-gray-500 text-sm mt-1">
            اطلاعات خود را تکمیل کنید
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                نام کامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="دکتر سارا محمدی"
                className={doctorInputClassRight}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                شماره تلفن <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09123456789"
                dir="ltr"
                className={doctorInputClassLtr}
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                با این شماره وارد پنل خواهید شد (فقط اعداد انگلیسی)
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                شماره نظام پزشکی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="medicalLicenseNumber"
                value={formData.medicalLicenseNumber}
                onChange={handleChange}
                placeholder="مثال: ۱۲۳۴۵۶"
                dir="ltr"
                className={doctorInputClassLtr}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                آیدی بله (Bale ID)
              </label>
              <input
                type="text"
                name="baleId"
                value={formData.baleId}
                onChange={handleChange}
                placeholder="@username یا username"
                dir="ltr"
                className={doctorInputClassLtr}
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                برای ارتباط با بیماران، آیدی خود را در پیام‌رسان بله وارد کنید
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                رمز عبور <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className={doctorInputClassLtr}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                تکرار رمز عبور <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                className={doctorInputClassLtr}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                تخصص‌ها <span className="text-red-500">*</span>
                <span className="text-gray-400 text-xs mr-2">
                  (می‌توانید چند مورد را انتخاب کنید)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {specialtiesList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSpecialtyToggle(item.name)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      formData.specialties.includes(item.name)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              {formData.specialties.length > 0 && (
                <p className="text-green-600 text-xs mt-2 text-right">
                  تخصص‌های انتخاب شده: {formData.specialties.join("، ")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                دسته‌بندی
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={doctorSelectClass}
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                سال‌های تجربه
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="مثال: ۱۲"
                className={doctorInputClassRight}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                قیمت هر جلسه (تومان)(نیم ساعت){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="sessionPrice"
                value={formData.sessionPrice}
                onChange={handleChange}
                placeholder="مثال: ۲۵۰۰۰۰"
                className={doctorInputClassRight}
                dir="ltr"
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                قیمت هر جلسه مشاوره به تومان (حداقل ۱ تومان)
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                بیوگرافی
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="توضیحات درباره خود، تخصص‌ها و روش درمانی..."
                className={doctorTextareaClass}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-center text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-center text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </button>

            <div className="text-center">
              <a
                href="/doctor/login"
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                قبلاً ثبت‌نام کرده‌اید؟ وارد شوید
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
