"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    specialties: [] as string[], // آرایه تخصص‌ها (چندتایی)
    experience: "",
    sessionPrice: "",
    bio: "",
    categoryId: "individual",
    medicalLicenseNumber: "", // شماره نظام پزشکی
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // اعتبارسنجی
    if (!formData.name || !formData.phone || !formData.password) {
      setError("نام، شماره تلفن و رمز عبور الزامی هستند");
      return;
    }

    if (!formData.medicalLicenseNumber) {
      setError("شماره نظام پزشکی الزامی است");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("رمز عبور و تکرار آن مطابقت ندارند");
      return;
    }

    if (formData.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    if (formData.phone.length < 11) {
      setError("شماره تلفن نامعتبر است");
      return;
    }

    if (formData.specialties.length === 0) {
      setError("حداقل یک تخصص را انتخاب کنید");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v2/doctor/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
          specialty: formData.specialties[0], // تخصص اصلی (اولین)
          specialties: formData.specialties,
          experience: parseInt(formData.experience) || 0,
          sessionPrice: parseInt(formData.sessionPrice) || 0,
          bio: formData.bio,
          categoryId: formData.categoryId,
          medicalLicenseNumber: formData.medicalLicenseNumber,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(
          "ثبت‌نام با موفقیت انجام شد. پس از تأیید ادمین می‌توانید وارد پنل شوید."
        );
        setTimeout(() => {
          router.push("/doctor/login");
        }, 2000);
      } else {
        setError(data.message || "خطا در ثبت‌نام");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* هدر */}
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

        {/* فرم */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* نام کامل */}
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>

            {/* شماره تلفن */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                شماره تلفن <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09123456789"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                با این شماره وارد پنل خواهید شد
              </p>
            </div>

            {/* شماره نظام پزشکی */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                شماره نظام پزشکی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="medicalLicenseNumber"
                value={formData.medicalLicenseNumber}
                onChange={handleChange}
                placeholder="مثال: ۱۲۳۴۵۶"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* رمز عبور */}
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* تکرار رمز عبور */}
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* تخصص‌ها (چند انتخابی) */}
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

            {/* دسته‌بندی */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                دسته‌بندی
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* سال تجربه */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                سال‌های تجربه
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="مثال: ۱۲"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                min="0"
                max="100"
              />
            </div>

            {/* بیوگرافی */}
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>

            {/* پیام‌ها */}
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

            {/* دکمه ثبت‌نام */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </button>

            {/* لینک ورود */}
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
