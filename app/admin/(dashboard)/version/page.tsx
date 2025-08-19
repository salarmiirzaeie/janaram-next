"use client";
import { useState, useEffect } from "react";
import semver from "semver";
import { useRouter, useSearchParams } from "next/navigation";

export default function VersionUpdateForm() {
  const [latestVersion, setLatestVersion] = useState("");
  const [minimumVersion, setMinimumVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const versionId = searchParams.get("id"); // Get version ID from URL query

  // Fetch version details if editing
  useEffect(() => {
    if (versionId) {
      const fetchVersion = async () => {
        try {
          const res = await fetch(`/api/admin/version/update/${versionId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
          const data = await res.json();
          if (data.success) {
            setLatestVersion(data.data.latestVersion);
            setMinimumVersion(data.data.minimumVersion);
            setReleaseNotes(data.data.releaseNotes);
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError("خطا در بارگذاری اطلاعات نسخه");
          console.error(err);
        }
      };
      fetchVersion();
    }
  }, [versionId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate version formats
    if (!semver.valid(latestVersion)) {
      setError("فرمت نسخه جدید نامعتبر است (مثال: 1.2.0)");
      return;
    }
    if (!semver.valid(minimumVersion)) {
      setError("فرمت حداقل نسخه نامعتبر است (مثال: 1.0.0)");
      return;
    }

    try {
      const url = versionId ? `/api/admin/version/update/${versionId}` : "/api/admin/version/update";
      const method = versionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ latestVersion, minimumVersion, releaseNotes }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(versionId ? "نسخه با موفقیت به‌روزرسانی شد" : "نسخه جدید با موفقیت ثبت شد");
        setLatestVersion("");
        setMinimumVersion("");
        setReleaseNotes("");
        if (!versionId) {
          router.push("/admin/version"); // Clear query params after creating new version
        }
      } else {
        setError(data.message || "خطا در ثبت/به‌روزرسانی نسخه");
      }
    } catch (err) {
      setError("خطای سرور در ثبت/به‌روزرسانی نسخه");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{versionId ? "ویرایش نسخه" : "تنظیم نسخه جدید"}</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="latestVersion" className="block text-sm font-medium text-gray-700">
              نسخه جدید (مثال: 1.2.0)
            </label>
            <input
              id="latestVersion"
              type="text"
              value={latestVersion}
              onChange={(e) => setLatestVersion(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="1.2.0"
            />
          </div>
          <div>
            <label htmlFor="minimumVersion" className="block text-sm font-medium text-gray-700">
              حداقل نسخه (مثال: 1.0.0)
            </label>
            <input
              id="minimumVersion"
              type="text"
              value={minimumVersion}
              onChange={(e) => setMinimumVersion(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="1.0.0"
            />
          </div>
          <div>
            <label htmlFor="releaseNotes" className="block text-sm font-medium text-gray-700">
              یادداشت‌های نسخه (اختیاری)
            </label>
            <textarea
              id="releaseNotes"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="ویژگی‌های جدید یا تغییرات..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {versionId ? "به‌روزرسانی نسخه" : "ثبت نسخه جدید"}
          </button>
        </form>
      </div>
    </div>
  );
}
