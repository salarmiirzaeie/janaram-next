"use client";

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
};

const MeditationPage: React.FC = () => {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingMeditation, setEditingMeditation] = useState<Meditation | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Meditation>();

  const fetchMeditations = async () => {
    try {
      const response = await fetch("/api/admin/meditations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched meditations:", data.meditations);
        setMeditations(data.meditations || []);
      } else {
        console.error("Failed to fetch meditations");
      }
    } catch (error) {
      console.error("Error fetching meditations:", error);
    }
  };

  useEffect(() => {
    fetchMeditations();
  }, []);

  const handleEdit = (meditation: Meditation) => {
    if (!meditation.id || !/^[0-9a-f]{24}$/.test(meditation.id)) {
      console.error("Invalid meditation ID:", meditation.id);
      return;
    }
    setMode("edit");
    setEditingMeditation(meditation);
    setShowForm(true);
    setValue("id", meditation.id);
    setValue("title", meditation.title);
    setValue("type", meditation.type);
    setValue("description", meditation.description);
    setValue("duration", meditation.duration);
    setValue("isSuggested", meditation.isSuggested);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meditation?")) return;

    try {
      const response = await fetch(`/api/admin/meditations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (response.ok) {
        await fetchMeditations();
      } else {
        const errorData = await response.json();
        console.error("Failed to delete meditation:", errorData);
      }
    } catch (error) {
      console.error("Error deleting meditation:", error);
    }
  };

  const onSubmit: SubmitHandler<Meditation> = async (data) => {
    if (mode === "add" && (!data.file[0] || !data.image[0])) {
      console.error("File or image is missing");
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("type", data.type);
    if (data.file && data.file[0]) formData.append("file", data.file[0]);
    if (data.image && data.image[0]) formData.append("image", data.image[0]);
    formData.append("description", data.description);
    formData.append("duration", data.duration.toString());
    formData.append("isSuggested", data.isSuggested.toString());

    console.log("Submitting form with ID:", data.id);
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    try {
      const url = mode === "add" ? "/api/admin/meditations/add" : `/api/admin/meditations/${data.id}`;
      const method = mode === "add" ? "POST" : "PUT";
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });
      console.log("Response:", response);
      if (response.ok) {
        await fetchMeditations();
        reset();
        setShowForm(false);
        setMode("add");
        setEditingMeditation(null);
      } else {
        const errorData = await response.json();
        console.error(`Failed to ${mode === "add" ? "create" : "update"} meditation:`, errorData);
      }
    } catch (error) {
      console.error(`Error ${mode === "add" ? "submitting" : "updating"} form:`, error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Meditations</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setMode("add");
            setEditingMeditation(null);
            reset();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          {showForm ? "Cancel" : "Add Meditation"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-8 space-y-4">
          {mode === "edit" && <input type="hidden" {...register("id")} />}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Meditation Title
            </label>
            <input
              id="title"
              type="text"
              {...register("title", { required: "Title is required" })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Meditation Type
            </label>
            <select
              id="type"
              {...register("type", { required: "Type is required" })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
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
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Meditation Duration
            </label>
            <input
              id="duration"
              type="text"
              {...register("duration", { required: "Duration is required" })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
              Upload File {mode === "edit" && "(optional)"}
            </label>
            <input
              id="file"
              type="file"
              {...register("file", { required: mode === "add" ? "File is required" : false })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>}
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Upload Image {mode === "edit" && "(optional)"}
            </label>
            <input
              id="image"
              type="file"
              {...register("image", { required: mode === "add" ? "Image is required" : false })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              {...register("description", { required: "Description is required" })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Suggested</label>
            <div className="mt-2 flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register("isSuggested", { required: "Please select if meditation is suggested" })}
                  value="true"
                  className="form-radio text-blue-500"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register("isSuggested", { required: "Please select if meditation is suggested" })}
                  value="false"
                  className="form-radio text-blue-500"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
            {errors.isSuggested && <p className="text-red-500 text-sm mt-1">{errors.isSuggested.message}</p>}
          </div>

          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
            {mode === "add" ? "Submit" : "Update"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full  bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {/* <th className="py-2 px-4 border-b text-left text-gray-600">ID</th> */}
              <th className="py-2 px-4 border-b text-left text-gray-600">Title</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Type</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">File</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Image</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Description</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Duration (min)</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Suggested</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meditations.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-4 px-4 text-center text-gray-500">
                  No meditations added yet.
                </td>
              </tr>
            ) : (
              meditations.map((meditation) => (
                <tr key={meditation.id} className="hover:bg-gray-50">
                  {/* <td className="py-2 px-4 border-b">{meditation.id}</td> */}
                  <td className="py-2 px-4 border-b">{meditation.title}</td>
                  <td className="py-2 px-4 border-b">{meditation.type}</td>
                  <td className="py-2 px-4 border-b">
                    <a
                      href={meditation.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View File
                    </a>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <img src={meditation.image} alt={meditation.title} className="w-16 h-16 object-cover rounded" />
                  </td>
                  <td className="py-2 px-4 border-b">{meditation.description}</td>
                  <td className="py-2 px-4 border-b">{meditation.duration}</td>
                  <td className="py-2 px-4 border-b">{meditation.isSuggested ? "Yes" : "No"}</td>
                  <td className="py-2 px-4 border-b flex space-x-2">
                    <button
                      onClick={() => handleEdit(meditation)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(meditation.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
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

export default MeditationPage;
