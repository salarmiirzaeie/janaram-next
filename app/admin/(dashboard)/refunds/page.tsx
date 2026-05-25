"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PendingRefundRow = {
  appointmentId: string;
  date: string;
  time: string;
  sessionWhenFa: string;
  sessionPriceToman: number;
  cancelReason?: string;
  cancelledAt?: string;
  patient: { id: string; name?: string; phone?: string };
  doctor: { id: string; name?: string; phone?: string };
  payment: {
    paymentId: string;
    refId?: string;
    amountToman: number;
    amountRial: number;
  } | null;
};

export default function AdminRefundsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PendingRefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    row: PendingRefundRow;
    action: "processed" | "rejected";
  } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRows = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/refunds", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRows(data.data);
      else alert(data.message || "خطا در دریافت لیست");
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openModal = (row: PendingRefundRow, action: "processed" | "rejected") => {
    setNote("");
    setModal({ row, action });
  };

  const submitResolve = async () => {
    if (!modal) return;
    const token = localStorage.getItem("authToken");
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/refunds/${modal.row.appointmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: modal.action,
            note: note.trim() || undefined,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setModal(null);
        fetchRows();
      } else {
        alert(data.message || "خطا");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">صف بازپرداخت</h1>
        <p className="text-gray-600 mt-1 text-sm">
          وقتی مراجع بیش از ۱ ساعت قبل از جلسه لغو کند، اینجا نمایش داده می‌شود.
          پس از تماس و بازگرداندن مبلغ، «بازپرداخت انجام شد» را بزنید.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
          درخواست بازپرداخت در انتظاری وجود ندارد.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">زمان جلسه</th>
                  <th className="px-4 py-3 font-medium text-gray-600">دلیل لغو</th>
                  <th className="px-4 py-3 font-medium text-gray-600">مراجع</th>
                  <th className="px-4 py-3 font-medium text-gray-600">روانشناس</th>
                  <th className="px-4 py-3 font-medium text-gray-600">مبلغ (تومان)</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Ref زرین‌پال</th>
                  <th className="px-4 py-3 font-medium text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.appointmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {r.sessionWhenFa}
                      </div>
                      <div className="text-xs text-gray-400">{r.date} {r.time}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[140px]">
                      {r.cancelReason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.patient.name || "—"}</div>
                      <div className="text-xs dir-ltr text-left text-gray-500">
                        {r.patient.phone || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.doctor.name || "—"}</div>
                      <div className="text-xs dir-ltr text-left text-gray-500">
                        {r.doctor.phone || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {(r.payment?.amountToman ?? r.sessionPriceToman).toLocaleString(
                        "fa-IR"
                      )}
                    </td>
                    <td className="px-4 py-3 dir-ltr text-left font-mono text-xs">
                      {r.payment?.refId || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openModal(r, "processed")}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700"
                        >
                          بازپرداخت انجام شد
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(r, "rejected")}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-800 text-xs hover:bg-gray-300"
                        >
                          رد درخواست
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-right">
            <h2 className="text-lg font-bold text-gray-900">
              {modal.action === "processed"
                ? "تأیید بازپرداخت انجام‌شده"
                : "رد درخواست بازپرداخت"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {modal.action === "processed"
                ? "پس از واریز واقعی به مراجع، تأیید کنید. در صورت تنظیم قالب پیامک، به مراجع اطلاع داده می‌شود."
                : "درخواست به‌عنوان ردشده ثبت می‌شود (مثلاً خارج از شرایط بازپرداخت)."}
            </p>
            <label className="block mt-4 text-sm font-medium text-gray-700">
              یادداشت داخلی (اختیاری)
            </label>
            <textarea
              className="mt-1 w-full border rounded-lg p-2 text-sm min-h-[80px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="شماره پیگیری واریز، تاریخ، ..."
            />
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border text-sm"
                onClick={() => setModal(null)}
                disabled={submitting}
              >
                انصراف
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm text-white ${
                  modal.action === "processed"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-700 hover:bg-gray-800"
                }`}
                onClick={submitResolve}
                disabled={submitting}
              >
                {submitting ? "…" : "ثبت"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
