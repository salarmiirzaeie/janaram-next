"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  commissionRate: number;
  commissionPercentLabel: string;
  doctorSharePercentLabel: string;
  updatedAt?: string;
};

export default function AdminPlatformSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [percentInput, setPercentInput] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setPercentInput(String(Math.round(data.data.commissionRate * 100)));
      } else {
        alert(data.message || "خطا");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const save = async () => {
    const pct = parseInt(percentInput, 10);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      alert("درصد کارمزد باید بین ۰ تا ۱۰۰ باشد");
      return;
    }
    const token = localStorage.getItem("authToken");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ commissionRate: pct / 100 }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setPercentInput(String(Math.round(data.data.commissionRate * 100)));
        alert("ذخیره شد");
      } else {
        alert(data.message || "خطا");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تنظیمات مالی پلتفرم</h1>
        <p className="text-gray-600 mt-1 text-sm">
          کارمزد سایت از هر جلسه پرداخت‌شده کسر می‌شود؛ مابقی به روانشناس تعلق می‌گیرد. فعلاً ۰٪ است.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            کارمزد پلتفرم (درصد)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-2">
            سهم روانشناس:{" "}
            <strong>{100 - (parseInt(percentInput, 10) || 0)}٪</strong> — سهم
            پلتفرم: <strong>{percentInput || 0}٪</strong>
          </p>
        </div>

        {settings?.updatedAt && (
          <p className="text-xs text-gray-400">
            آخرین به‌روزرسانی:{" "}
            {new Date(settings.updatedAt).toLocaleString("fa-IR")}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "در حال ذخیره…" : "ذخیره"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 max-w-2xl">
        <p className="font-medium mb-2">قوانین جاری (ثابت در کد)</p>
        <ul className="list-disc pr-5 space-y-1 text-blue-800">
          <li>لغو مراجع بیش از ۱ ساعت قبل از جلسه → بازپرداخت کامل (صف ادمین)</li>
          <li>لغو کمتر از ۱ ساعت قبل → مبلغ به روانشناس</li>
          <li>روانشناس نمی‌تواند نوبت را لغو کند</li>
          <li>عدم پاسخ مراجع (۱۵ دقیقه پس از شروع) → مبلغ به روانشناس</li>
          <li>واریز به روانشناس فقط پس از مشخص شدن وضعیت نهایی جلسه</li>
        </ul>
      </div>
    </div>
  );
}
