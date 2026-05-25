"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DoctorRow = {
  doctorId: string;
  doctorName: string;
  phone?: string;
  sessionCount: number;
  totalGross: number;
  platformFee: number;
  doctorShare: number;
  settledToday: number;
  pendingPayout: number;
  bankAccount: {
    accountName?: string;
    cardNumber?: string;
    sheba?: string;
  } | null;
};

type PaymentRow = {
  paymentId: string;
  refId?: string;
  doctorName: string;
  patientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  gross: number;
  platformFee: number;
  doctorShare: number;
};

type DailyReport = {
  date: string;
  totals: {
    paymentCount: number;
    totalGross: number;
    platformFee: number;
    doctorShare: number;
    settled: number;
    pendingToDoctors: number;
  };
  doctors: DoctorRow[];
  payments: PaymentRow[];
};

function todayLocal(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AdminFinancialPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayLocal());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settlingDoctorId, setSettlingDoctorId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReport = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/financial/daily?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      } else {
        alert(data.message || "خطا در دریافت گزارش");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  }, [date, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const openSettle = (doctor: DoctorRow) => {
    setSettlingDoctorId(doctor.doctorId);
    setSettleAmount(String(doctor.pendingPayout));
    setSettleNote(`تسویه ${doctor.doctorName} — ${date}`);
  };

  const submitSettlement = async () => {
    if (!settlingDoctorId) return;
    const amount = parseInt(settleAmount.replace(/,/g, ""), 10);
    if (!amount || amount < 1) {
      alert("مبلغ نامعتبر است");
      return;
    }

    const token = localStorage.getItem("authToken");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/financial/settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: settlingDoctorId,
          amount,
          note: settleNote,
          settlementDate: date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("تسویه ثبت شد. پس از واریز دستی از زرین‌پال، این رکورد به‌عنوان انجام‌شده باقی می‌ماند.");
        setSettlingDoctorId(null);
        setSettleAmount("");
        setSettleNote("");
        fetchReport();
      } else {
        alert(data.message || "خطا در ثبت تسویه");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runSyncDeposits = async () => {
    if (!confirm("همگام‌سازی واریزهای روانشناسان از پرداخت‌های موفق قبلی انجام شود؟")) {
      return;
    }
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch("/api/admin/financial/sync-deposits", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message || "انجام شد");
      fetchReport();
    } catch (e) {
      alert("خطا");
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مالی و تسویه</h1>
          <p className="text-gray-500 mt-1 text-sm">
            کارمزد پلتفرم از تنظیمات ادمین خوانده می‌شود (فعلاً ۰٪). پس از واریز دستی به روانشناس، تسویه را اینجا ثبت کنید.
          </p>
          <Link
            href="/admin/refunds"
            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
          >
            صف بازپرداخت مراجعان (لغو توسط روانشناس / لغو با حق بازگشت)
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            بروزرسانی
          </button>
          <button
            onClick={runSyncDeposits}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800"
          >
            همگام‌سازی پرداخت‌های قدیمی
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "پرداخت‌های موفق",
                value: report.totals.paymentCount,
                suffix: "مورد",
              },
              {
                label: "کل دریافتی (ناخالص)",
                value: report.totals.totalGross.toLocaleString(),
                suffix: "تومان",
              },
              {
                label: "سهم شما (۲۰٪)",
                value: report.totals.platformFee.toLocaleString(),
                suffix: "تومان",
                highlight: "green",
              },
              {
                label: "سهم روانشناسان (۸۰٪)",
                value: report.totals.doctorShare.toLocaleString(),
                suffix: "تومان",
              },
              {
                label: "تسویه ثبت‌شده امروز",
                value: report.totals.settled.toLocaleString(),
                suffix: "تومان",
              },
              {
                label: "باقی‌مانده واریز به پزشکان",
                value: report.totals.pendingToDoctors.toLocaleString(),
                suffix: "تومان",
                highlight: "orange",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`bg-white rounded-xl shadow-sm p-4 border-r-4 ${
                  card.highlight === "green"
                    ? "border-green-500"
                    : card.highlight === "orange"
                      ? "border-orange-500"
                      : "border-blue-500"
                }`}
              >
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-lg font-bold mt-1 text-gray-900">
                  {card.value} <span className="text-xs font-normal text-gray-500">{card.suffix}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-bold text-gray-800">تسویه با روانشناسان — {date}</h2>
              <p className="text-sm text-gray-500 mt-1">
                مبلغ «باقی‌مانده» را از حساب زرین‌پال به شبای پزشک واریز کنید، سپس «ثبت تسویه» را بزنید.
              </p>
            </div>
            {report.doctors.length === 0 ? (
              <p className="p-8 text-center text-gray-500 text-sm">در این تاریخ پرداخت موفقی ثبت نشده است.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right">روانشناس</th>
                      <th className="px-4 py-3">جلسات</th>
                      <th className="px-4 py-3">ناخالص</th>
                      <th className="px-4 py-3">۲۰٪ پلتفرم</th>
                      <th className="px-4 py-3">۸۰٪ پزشک</th>
                      <th className="px-4 py-3">تسویه شده</th>
                      <th className="px-4 py-3">باقی‌مانده</th>
                      <th className="px-4 py-3">حساب بانکی</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.doctors.map((d) => (
                      <tr key={d.doctorId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{d.doctorName}</div>
                          {d.phone && <div className="text-xs text-gray-500 dir-ltr text-right">{d.phone}</div>}
                        </td>
                        <td className="px-4 py-3">{d.sessionCount}</td>
                        <td className="px-4 py-3">{d.totalGross.toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-700">{d.platformFee.toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium">{d.doctorShare.toLocaleString()}</td>
                        <td className="px-4 py-3 text-blue-600">{d.settledToday.toLocaleString()}</td>
                        <td className="px-4 py-3 text-orange-600 font-bold">{d.pendingPayout.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px]">
                          {d.bankAccount?.sheba ? (
                            <>
                              <div dir="ltr">{d.bankAccount.sheba}</div>
                              <div>{d.bankAccount.accountName}</div>
                            </>
                          ) : (
                            <span className="text-red-500">ثبت نشده</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {d.pendingPayout > 0 && (
                            <button
                              onClick={() => openSettle(d)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 whitespace-nowrap"
                            >
                              ثبت تسویه
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-bold text-gray-800">جزئیات پرداخت‌های روز</h2>
            </div>
            {report.payments.length === 0 ? (
              <p className="p-8 text-center text-gray-500 text-sm">پرداختی یافت نشد</p>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right">پزشک</th>
                      <th className="px-4 py-2">بیمار</th>
                      <th className="px-4 py-2">تاریخ نوبت</th>
                      <th className="px-4 py-2">ساعت</th>
                      <th className="px-4 py-2">مبلغ</th>
                      <th className="px-4 py-2">۲۰٪</th>
                      <th className="px-4 py-2">۸۰٪</th>
                      <th className="px-4 py-2">پیگیری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.payments.map((p) => (
                      <tr key={p.paymentId}>
                        <td className="px-4 py-2">{p.doctorName}</td>
                        <td className="px-4 py-2">{p.patientName || "—"}</td>
                        <td className="px-4 py-2">{p.appointmentDate}</td>
                        <td className="px-4 py-2">{p.appointmentTime}</td>
                        <td className="px-4 py-2">{p.gross.toLocaleString()}</td>
                        <td className="px-4 py-2 text-green-700">{p.platformFee.toLocaleString()}</td>
                        <td className="px-4 py-2">{p.doctorShare.toLocaleString()}</td>
                        <td className="px-4 py-2 text-xs dir-ltr">{p.refId || p.paymentId.slice(-8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {settlingDoctorId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">ثبت تسویه دستی</h3>
            <p className="text-sm text-gray-600">پس از واریز از حساب زرین‌پال به شبای پزشک، مبلغ را ثبت کنید.</p>
            <div>
              <label className="text-sm text-gray-600">مبلغ (تومان)</label>
              <input
                type="number"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">یادداشت</label>
              <input
                type="text"
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSettlingDoctorId(null)} className="flex-1 py-2 border rounded-lg">
                انصراف
              </button>
              <button
                onClick={submitSettlement}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "..." : "ثبت تسویه"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
