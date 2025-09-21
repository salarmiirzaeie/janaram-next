"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

type NotificationForm = {
  title: string;
  message: string;
  meditationId?: string; // optional: attach meditation id
};

const NotificationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotificationForm>({
    defaultValues: {
      title: "",
      message: "",
      meditationId: "",
    },
  });

  const onSubmit: SubmitHandler<NotificationForm> = async (data) => {
    try {
      setLoading(true);
      setSuccessMsg(null);
      setErrorMsg(null);

      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccessMsg("Notification sent successfully!");
        reset();
      } else {
        const resData = await response.json();
        setErrorMsg(resData.message || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setErrorMsg("Internal server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Send Notification</h2>

      {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}
      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            {...register("title", { required: true })}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">Title is required</p>}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            {...register("message", { required: true })}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
          {errors.message && <p className="text-red-500 text-sm mt-1">Message is required</p>}
        </div>

        {/* Optional Meditation ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Attach Meditation ID (optional)</label>
          <input
            type="text"
            {...register("meditationId")}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g., 649f6c1d..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white px-4 py-2 rounded transition ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
        >
          {loading ? "Sending..." : "Send Notification"}
        </button>
      </form>
    </div>
  );
};

export default NotificationPage;
