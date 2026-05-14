"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Eye,
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: "success" | "pending" | "failed";
  type: "deposit" | "withdrawal" | "refund";
  description: string;
  patientName?: string;
  referenceId?: string;
}

interface Earning {
  year: number;
  month: number;
  persianMonth: string;
  amount: number;
  commission: number;
  net: number;
  appointments: number;
}

interface BankAccount {
  accountName: string;
  bankName: string;
  cardNumber: string;
  sheba: string;
}

interface FinancialStats {
  totalEarnings: number;
  pendingBalance: number;
  totalAppointments: number;
  todayAppointments: number;
  currentMonthEarnings: number;
}

export default function DoctorPaymentsPage() {
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    accountName: "",
    bankName: "",
    cardNumber: "",
    sheba: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccount, setEditedAccount] = useState<BankAccount>(bankAccount);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const itemsPerPage = 10;

  const fetchBankAccount = async () => {
    const token = localStorage.getItem("doctorToken");
    try {
      const res = await fetch("/api/v2/doctor/bank-account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBankAccount(data.data);
        setEditedAccount(data.data);
      }
    } catch (error) {
      console.error("Error fetching bank account:", error);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem("doctorToken");
    try {
      const res = await fetch("/api/v2/doctor/financial/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchEarnings = async () => {
    const token = localStorage.getItem("doctorToken");
    try {
      const res = await fetch("/api/v2/doctor/earnings/monthly", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEarnings(data.data);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  const fetchTransactions = async () => {
    const token = localStorage.getItem("doctorToken");
    try {
      const res = await fetch(
        `/api/v2/doctor/transactions?status=${filterStatus}&type=${filterType}&page=${currentPage}&limit=${itemsPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchBankAccount(),
        fetchStats(),
        fetchEarnings(),
        fetchTransactions(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [currentPage, filterStatus, filterType]);

  const handleSaveBankAccount = async () => {
    const token = localStorage.getItem("doctorToken");
    try {
      const res = await fetch("/api/v2/doctor/bank-account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedAccount),
      });
      const data = await res.json();
      if (data.success) {
        setBankAccount(editedAccount);
        setIsEditing(false);
        alert("اطلاعات بانکی با موفقیت ذخیره شد");
      } else {
        alert(data.message || "خطا در ذخیره اطلاعات");
      }
    } catch (error) {
      console.error("Error saving bank account:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleWithdrawRequest = async () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < 50000) {
      alert("حداقل مبلغ تسویه ۵۰,۰۰۰ تومان است");
      return;
    }

    const token = localStorage.getItem("doctorToken");
    setIsWithdrawing(true);
    try {
      const res = await fetch("/api/v2/doctor/withdraw-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        alert("درخواست تسویه با موفقیت ثبت شد");
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        fetchTransactions();
        fetchStats();
      } else {
        alert(data.message || "خطا در ثبت درخواست");
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
            موفق
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
            در انتظار
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
            ناموفق
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
            <TrendingUp className="w-3 h-3" />
            واریز
          </span>
        );
      case "withdrawal":
        return (
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
            <TrendingDown className="w-3 h-3" />
            برداشت
          </span>
        );
      case "refund":
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
            عودت
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر صفحه */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مدیریت مالی</h1>
        <p className="text-gray-500 mt-1">
          مدیریت حساب بانکی، مشاهده تراکنش‌ها و درآمدها
        </p>
      </div>

      {/* کارت‌های آمار کل */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">کل درآمد (خالص)</p>
              <p className="text-3xl font-bold mt-2">
                {stats?.totalEarnings?.toLocaleString() || 0} تومان
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">مبلغ در انتظار تسویه</p>
              <p className="text-3xl font-bold mt-2">
                {stats?.pendingBalance?.toLocaleString() || 0} تومان
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <RefreshCw className="w-6 h-6" />
            </div>
          </div>
          {stats?.pendingBalance && stats.pendingBalance > 50000 && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm transition"
            >
              درخواست تسویه
            </button>
          )}
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">کل جلسات مشاوره</p>
              <p className="text-3xl font-bold mt-2">
                {stats?.totalAppointments || 0} جلسه
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <CalendarIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* بخش اطلاعات بانکی */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              اطلاعات حساب بانکی
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              برای دریافت تسویه حساب، شماره شبا و کارت خود را وارد کنید
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ویرایش اطلاعات
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                نام دارنده حساب
              </label>
              <input
                type="text"
                value={editedAccount.accountName}
                onChange={(e) =>
                  setEditedAccount({
                    ...editedAccount,
                    accountName: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="نام کامل"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                نام بانک
              </label>
              <select
                value={editedAccount.bankName}
                onChange={(e) =>
                  setEditedAccount({
                    ...editedAccount,
                    bankName: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              >
                <option>بانک ملی ایران</option>
                <option>بانک ملت</option>
                <option>بانک صادرات</option>
                <option>بانک تجارت</option>
                <option>بانک رفاه</option>
                <option>بانک سپه</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                شماره کارت
              </label>
              <input
                type="text"
                value={editedAccount.cardNumber}
                onChange={(e) =>
                  setEditedAccount({
                    ...editedAccount,
                    cardNumber: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="6037991234567890"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-right">
                شماره شبا (IBAN)
              </label>
              <input
                type="text"
                value={editedAccount.sheba}
                onChange={(e) =>
                  setEditedAccount({ ...editedAccount, sheba: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="IR820540123456789012345678"
                dir="ltr"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveBankAccount}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                ذخیره اطلاعات
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">نام دارنده حساب:</span>
              <span className="font-medium text-gray-800">
                {bankAccount.accountName || "ثبت نشده"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">نام بانک:</span>
              <span className="font-medium text-gray-800">
                {bankAccount.bankName || "ثبت نشده"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">شماره کارت:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-800">
                  {bankAccount.cardNumber || "ثبت نشده"}
                </span>
                {bankAccount.cardNumber && (
                  <button
                    onClick={() => copyToClipboard(bankAccount.cardNumber)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">شماره شبا:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-800">
                  {bankAccount.sheba || "ثبت نشده"}
                </span>
                {bankAccount.sheba && (
                  <button
                    onClick={() => copyToClipboard(bankAccount.sheba)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* جدول درآمد ماهانه */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">درآمد ماهانه</h2>
          <p className="text-sm text-gray-500 mt-1">
            گزارش درآمدهای شما در ماه‌های گذشته
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-right">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  ماه
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  جلسات
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  کل درآمد
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  کارمزد (۱۰٪)
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  خالص دریافتی
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {earnings.map((earning, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {earning.persianMonth}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {earning.appointments} جلسه
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {earning.amount.toLocaleString()} تومان
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    -{earning.commission.toLocaleString()} تومان
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    {earning.net.toLocaleString()} تومان
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      جزئیات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-sm font-bold text-gray-800"
                >
                  مجموع کل
                </td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">
                  {stats?.totalEarnings?.toLocaleString() || 0} تومان
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* لیست تراکنش‌ها */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                لیست تراکنش‌ها
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                تاریخچه کامل واریز و برداشت‌های شما
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="success">موفق</option>
                <option value="pending">در انتظار</option>
                <option value="failed">ناموفق</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">همه نوع‌ها</option>
                <option value="deposit">واریز</option>
                <option value="withdrawal">برداشت</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-right">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  کد تراکنش
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  تاریخ
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  شرح
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  مبلغ
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  نوع
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  وضعیت
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {transaction.referenceId || transaction.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {transaction.amount.toLocaleString()} تومان
                  </td>
                  <td className="px-6 py-4">
                    {getTypeBadge(transaction.type)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(transaction.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* پیجینیشن */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              صفحه {currentPage} از {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* مودال درخواست تسویه */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-right">
              درخواست تسویه حساب
            </h2>
            <p className="text-gray-600 text-sm mb-4 text-right">
              موجودی قابل تسویه:{" "}
              <span className="font-bold text-green-600">
                {stats?.pendingBalance?.toLocaleString()} تومان
              </span>
            </p>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="مبلغ مورد نظر (تومان)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                انصراف
              </button>
              <button
                onClick={handleWithdrawRequest}
                disabled={isWithdrawing}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isWithdrawing ? "در حال ثبت..." : "ثبت درخواست"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* راهنما */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="font-bold text-blue-800 mb-2">📌 راهنمای مالی:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• کارمزد پلتفرم ۱۰٪ از هر جلسه مشاوره می‌باشد.</li>
          <li>• تسویه حساب‌ها هر ماه در تاریخ ۱ تا ۵ انجام می‌شود.</li>
          <li>• واریز به حساب شما بین ۲ تا ۳ روز کاری زمان نیاز دارد.</li>
          <li>• حداقل مبلغ برای درخواست تسویه ۵۰,۰۰۰ تومان است.</li>
        </ul>
      </div>
    </div>
  );
}
