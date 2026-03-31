"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type OverviewData = {
  totalUsers: number;
  activeUsersToday: number;
  paidUsers: number;
  conversionRate: number;
  totalConversationsToday: number;
};

type UserGrowthData = { date: string; count: number };
type PaidUserData = { date: string; count: number; revenue: number };
type ConversationData = { date: string; conversations: number };

const DashboardPage = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [paidUsersData, setPaidUsersData] = useState<PaidUserData[]>([]);
  const [conversationsData, setConversationsData] = useState<
    ConversationData[]
  >([]);
  const [moodUsageData, setMoodUsageData] = useState<ConversationData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const fetchJSON = async (url: string) => {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          return json.success ? json.data : [];
        };
        setOverview(await fetchJSON("/api/admin/analytics/overview"));
        setUserGrowth(
          await fetchJSON("/api/admin/analytics/user-growth?days=30")
        );
        setPaidUsersData(
          await fetchJSON("/api/admin/analytics/paid-users?days=30")
        );
        setConversationsData(
          await fetchJSON("/api/admin/analytics/conversations?days=30")
        );
        setMoodUsageData(
          await fetchJSON("/api/admin/analytics/daily-mood?days=30")
        );
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading)
    return <div className="mt-10 text-center">Loading dashboard...</div>;
  if (error || !overview)
    return (
      <div className="mt-10 text-center text-red-500">
        Failed to load dashboard data
      </div>
    );
  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Users" value={overview.totalUsers} />
        <StatCard
          title="Active Users Today"
          value={overview.activeUsersToday}
        />
        <StatCard title="Paid Users" value={overview.paidUsers} />
        <StatCard
          title="Conversion Rate"
          value={`${overview.conversionRate}%`}
        />
        <StatCard
          title="Conversations Today"
          value={overview.totalConversationsToday}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ChartCard
          title="User Growth (Last 30 Days)"
          data={userGrowth}
          dataKey="count"
          stroke="#4f46e5"
        />
        <ChartCard
          title="Paid Users & Revenue (Last 30 Days)"
          data={paidUsersData}
          dataKey="count"
          stroke="#8884d8"
          secondLineKey="revenue"
          secondStroke="#82ca9d"
        />
        <ChartCard
          title="Daily Conversations (Last 30 Days)"
          data={conversationsData}
          dataKey="conversations"
          stroke="#ff7300"
        />
        <ChartCard
          title="Daily Mood Usage (Last 30 Days)"
          data={moodUsageData}
          dataKey="conversations"
          stroke="#ff7300"
        />
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
  <div className="rounded-xl bg-white p-4 shadow">
    <p className="mb-1 text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const ChartCard = ({
  title,
  data,
  dataKey,
  stroke,
  secondLineKey,
  secondStroke,
  xKey = "date",
}: {
  title: string;
  data: any;
  dataKey: string;
  stroke: string;
  secondLineKey?: string;
  secondStroke?: string;
  xKey?: string;
}) => {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          {secondLineKey && secondStroke ? (
            <>
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={stroke}
                strokeWidth={3}
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey={secondLineKey}
                stroke={secondStroke}
                strokeWidth={3}
                yAxisId="right"
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={3}
            />
          )}
          {secondLineKey && <Legend />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const BarChartCard = ({
  title,
  data,
  dataKey,
  xKey = "feature",
  barColor = "#6366f1",
}: {
  title: string;
  data: any;
  dataKey: string;
  xKey?: string;
  barColor?: string;
}) => {
  const chartData = Array.isArray(data) ? data : [];
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const PieChartCard = ({
  title,
  data,
  dataKey,
  nameKey = "stage",
  colors = ["#4f46e5", "#10b981", "#f59e0b", "#e11d48"],
}: {
  title: string;
  data: any;
  dataKey: string;
  nameKey?: string;
  colors?: string[];
}) => {
  const chartData = Array.isArray(data) ? data : [];
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={dataKey}
            nameKey={nameKey}
            outerRadius={100}
            label
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardPage;
