"use client";

import { BASE_URL_IMAGES } from "@/lib/constants";
import { Icon, PlayIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

type Meditation = {
  id: string;
  title: string;
  type: string;
  file: string;
  image: string;
  description: string;
  duration: string;
  isSuggested: boolean;
  accessLevel: "free" | "unlimited";
  listenCount: number;
};

type MeditationForm = {
  id?: string;
  title: string;
  type: string;
  file?: FileList;
  image?: FileList;
  description: string;
  duration: string;
  isSuggested: boolean;
  accessLevel: "free" | "unlimited";
};

const MeditationPage: React.FC = () => {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingMeditation, setEditingMeditation] = useState<Meditation | null>(
    null
  );
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
      description: "",
      duration: "",
      isSuggested: false,
      accessLevel: "free",
    },
  });

  const fetchMeditations = async () => {
    try {
      const res = await fetch("/api/admin/meditations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMeditations(data.meditations || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeditations();
  }, []);

  const handleEdit = (med: Meditation) => {
    setMode("edit");
    setEditingMeditation(med);
    setShowForm(true);
    setValue("id", med.id);
    setValue("title", med.title);
    setValue("type", med.type);
    setValue("description", med.description);
    setValue("duration", med.duration);
    setValue("isSuggested", med.isSuggested);
    setValue("accessLevel", med.accessLevel);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      setDeleteLoadingId(id);
      await fetch(`/api/admin/meditations/${id}`, {
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
    formData.append("description", data.description);
    formData.append("duration", data.duration);
    formData.append("isSuggested", data.isSuggested.toString());
    formData.append("accessLevel", data.accessLevel);

    try {
      setLoading(true);
      const url =
        mode === "add"
          ? "/api/admin/meditations/add"
          : `/api/admin/meditations/${data.id}`;
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
        setEditingMeditation(null);
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
        <h2 className="text-2xl font-bold text-gray-800">Manage Meditations</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setMode("add");
            setEditingMeditation(null);
            reset();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition w-full sm:w-auto"
        >
          Add Meditation
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
              <option value="calm">آرامش</option>
              <option value="love">عشق</option>
              <option value="instrumental">بی کلام</option>
              <option value="sleep">خواب</option>
              <option value="nature">طبیعت</option>
              <option value="story">قصه</option>
              <option value="sleep-music">موسیقی خواب</option>
            </select>
          </FormField>

          <FormField label="Duration" error={errors.duration?.message}>
            <input
              type="text"
              {...register("duration", { required: "Duration required" })}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="File">
            <input
              type="file"
              {...register("file", { required: mode === "add" })}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="Image">
            <input
              type="file"
              {...register("image", { required: mode === "add" })}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <textarea
              {...register("description", { required: "Description required" })}
              rows={3}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="Access Level" error={errors.accessLevel?.message}>
            <select
              {...register("accessLevel", { required: "Required" })}
              className="w-full p-2 border rounded"
            >
              <option value="free">Free</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </FormField>

          <FormField label="Suggested" error={errors.isSuggested?.message}>
            <div className="flex gap-4 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="true"
                  {...register("isSuggested", { required: true })}
                  className="form-radio text-blue-500"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="false"
                  {...register("isSuggested", { required: true })}
                  className="form-radio text-blue-500"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
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
                "Access",
                "Suggested",
                "listenCount",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {meditations.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-4 text-center text-gray-500">
                  No meditations yet.
                </td>
              </tr>
            ) : (
              meditations.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{med.title}</td>
                  <td className="px-4 py-2">{med.type}</td>
                  <td className="px-4 py-2">
                    <a
                      href={BASE_URL_IMAGES + med.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      <PlayIcon />
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <img
                      src={BASE_URL_IMAGES + med.image}
                      alt={med.title}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                    />
                  </td>

                  <td className="px-4 py-2">{med.duration}</td>
                  <td className="px-4 py-2">{med.accessLevel}</td>
                  <td className="px-4 py-2">
                    {med.isSuggested ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-2">{med.listenCount}</td>
                  <td className="px-4 py-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleEdit(med)}
                      disabled={deleteLoadingId === med.id}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition"
                    >
                      {deleteLoadingId === med.id ? "Processing..." : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDelete(med.id)}
                      disabled={deleteLoadingId === med.id}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                    >
                      {deleteLoadingId === med.id ? "Deleting..." : "Delete"}
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

export default MeditationPage;
