"use client";

import { BASE_URL_IMAGES } from "@/lib/constants";
import { breathingTypes } from "@/lib/mood";
import { PlayIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

type Breathing = {
  id: string;
  title: string;
  type: string;
  file: string;
  image: string;
  duration: string;
  isSuggested: boolean;
  isPremium: boolean;
  listenCount: number;
};

type MeditationForm = {
  id?: string;
  title: string;
  type: string;
  file?: FileList;
  image?: FileList;
  duration: string;
  isPremium: boolean;
};

const BreathingsPage: React.FC = () => {
  const [breathings, setBreathings] = useState<Breathing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MeditationForm>({
    defaultValues: {
      title: "",
      type: "",
      duration: "",
      isPremium: false,
    },
  });

  const fetchMeditations = async () => {
    try {
      const res = await fetch("/api/admin/breathings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBreathings(data.breathings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeditations();
  }, []);

  const handleEdit = (b: Breathing) => {
    setMode("edit");
    setShowForm(true);
    setValue("id", b.id);
    setValue("title", b.title);
    setValue("type", b.type);
    setValue("duration", b.duration);
    setValue("isPremium", b.isPremium);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      setDeleteLoadingId(id);
      await fetch(`/api/admin/breathings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      await fetchMeditations();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const onSubmit: SubmitHandler<MeditationForm> = async (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("type", data.type);
    if (data.file?.length) formData.append("file", data.file[0]);
    if (data.image?.length) formData.append("image", data.image[0]);
    formData.append("duration", data.duration);
    formData.append("isPremium", data.isPremium.toString());

    try {
      setLoading(true);
      const url =
        mode === "add"
          ? "/api/admin/breathings/add"
          : `/api/admin/breathings/${data.id}`;
      const method = mode === "add" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });
      if (res.ok) {
        await fetchMeditations();
        reset();
        setShowForm(false);
        setMode("add");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Manage Breathings</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setMode("add");
            reset();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition w-full sm:w-auto"
        >
          Add Breathing
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg shadow-sm"
        >
          {mode === "edit" && <input type="hidden" {...register("id")} />}

          <FormField label="Title" error={errors.title?.message}>
            <input
              type="text"
              {...register("title", { required: "Title required" })}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="Type" error={errors.type?.message}>
            <select
              {...register("type", { required: "Type required" })}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a type</option>
              {breathingTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Duration" error={errors.duration?.message}>
            <input
              type="text"
              {...register("duration", { required: "Duration required" })}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="Upload File">
            <input
              type="file"
              {...register("file", { required: mode === "add" })}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="Upload Image">
            <input
              type="file"
              {...register("image", { required: mode === "add" })}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="Is Premium" error={errors.isPremium?.message}>
            <select
              {...register("isPremium", { required: "Required" })}
              className="w-full p-2 border rounded"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </FormField>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading
                ? mode === "add"
                  ? "Adding..."
                  : "Updating..."
                : mode === "add"
                ? "Submit"
                : "Update"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Title",
                "Type",
                "File",
                "Image",
                "Duration",
                "is Pro",
                "listen Count",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {breathings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No Breathings yet.
                </td>
              </tr>
            ) : (
              breathings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{b.title}</td>
                  <td className="px-4 py-2">{b.type}</td>
                  <td className="px-4 py-2">
                    <a
                      href={BASE_URL_IMAGES + b.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      <PlayIcon />
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <img
                      src={BASE_URL_IMAGES + b.image}
                      alt={b.title}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-2">{b.duration}</td>
                  <td className="px-4 py-2">
                    {b.isPremium ? "true" : "false"}
                  </td>
                  <td className="px-4 py-2">{b.listenCount}</td>
                  <td className="px-4 py-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleEdit(b)}
                      disabled={deleteLoadingId === b.id}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition"
                    >
                      {deleteLoadingId === b.id ? "Processing..." : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deleteLoadingId === b.id}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                    >
                      {deleteLoadingId === b.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Form Field Wrapper
const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="flex flex-col">
    <label className="text-gray-700 font-medium">{label}</label>
    {children}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default BreathingsPage;
