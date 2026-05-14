"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface Appointment {
  id: string;
  time: string;
  status: string;
  date: string;
  user: {
    name: string;
    phone: string;
  };
}

interface MonthlyStats {
  month: string;
  appointments: number;
  completed: number;
  cancelled: number;
}

export default function DoctorDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token) return;

    try {
      // دریافت اطلاعات پزشک
      const profileRes = await fetch("/api/v2/doctor/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setDoctorName(profileData.data.name);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
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
      {/* خوش آمدید */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          خوش آمدید، دکتر {doctorName || "عزیز"}
        </h1>
        <p className="text-blue-100">
          امروز {new Date().toLocaleDateString("fa-IR")} - آماده ارائه خدمات
          بهتر به بیماران هستیم
        </p>
      </div>
    </div>
  );
}
