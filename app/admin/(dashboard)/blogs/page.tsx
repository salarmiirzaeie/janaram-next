"use client";

import { BASE_URL_IMAGES } from "@/lib/constants";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

interface Blog {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogForm {
  _id?: string;
  title: string;
  content: string;
  authorId: string;
  image?: FileList;
}

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BlogForm>({
    defaultValues: {
      authorId: "6898d5e1bd209f8e85e72877", // Replace with authenticated user ID
    },
  });

  const fetchBlogs = async (): Promise<void> => {
    try {
      const response = await fetch("/api/admin/blogs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
      } else {
        console.error("Failed to fetch blogs");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleEdit = (blog: Blog): void => {
    if (!blog._id || !/^[0-9a-f]{24}$/.test(blog._id)) {
      console.error("Invalid blog ID:", blog._id);
      return;
    }
    setMode("edit");
    setEditingBlog(blog);
    setShowForm(true);
    setValue("_id", blog._id);
    setValue("title", blog.title);
    setValue("content", blog.content);
    setValue("authorId", blog.authorId);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const response = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (response.ok) {
        await fetchBlogs();
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  const onSubmit: SubmitHandler<BlogForm> = async (data) => {
    if (mode === "add" && !data.image?.[0]) {
      console.error("Image is required for new blogs");
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("authorId", data.authorId);
    if (data.image?.[0]) formData.append("image", data.image[0]);

    try {
      const url = mode === "add" ? "/api/admin/blogs" : `/api/admin/blogs/${data._id}`;
      const method = mode === "add" ? "POST" : "PUT";
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });
      if (response.ok) {
        await fetchBlogs();
        reset({ title: "", content: "", authorId: "6898d5e1bd209f8e85e72877" });
        setShowForm(false);
        setMode("add");
        setEditingBlog(null);
      }
    } catch (error) {
      console.error("Error submitting blog:", error);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Manage Blogs</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setMode("add");
            setEditingBlog(null);
            reset({ title: "", content: "", authorId: "6898d5e1bd209f8e85e72877" });
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full sm:w-auto"
        >
          {showForm ? "Cancel" : "Add Blog"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-8 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {mode === "edit" && <input type="hidden" {...register("_id")} />}

          {/* Title */}
          <div className="col-span-1">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Blog Title
            </label>
            <input
              id="title"
              type="text"
              {...register("title", { required: "Title is required" })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Image */}
          <div className="col-span-1">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Image {mode === "edit" && "(optional)"}
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              {...register("image", { required: mode === "add" ? "Image is required" : false })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
          </div>

          {/* Content */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              {...register("content", { required: "Content is required" })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              rows={4}
            />
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
          </div>

          {/* Submit */}
          <div className="col-span-1 md:col-span-2">
            <button
              type="submit"
              className="w-full md:w-auto bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition"
            >
              {mode === "add" ? "Submit" : "Update"}
            </button>
          </div>
        </form>
      )}

      {/* Table / Mobile Cards */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm md:text-base bg-white border border-gray-200">
          {/* Desktop header */}
          <thead className="hidden sm:table-header-group bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b text-left text-gray-600">Title</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Content</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Image</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
            </tr>
          </thead>

          {/* Hybrid body */}
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                  No blogs added yet.
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr
                  key={blog._id}
                  className="block sm:table-row border sm:border-0 rounded-md sm:rounded-none mb-4 sm:mb-0 shadow sm:shadow-none"
                >
                  {/* Title */}
                  <td className="block sm:table-cell py-2 px-4 sm:border-b">
                    <span className="sm:hidden font-bold text-gray-600">Title: </span>
                    {blog.title}
                  </td>

                  {/* Content */}
                  <td className="block sm:table-cell py-2 px-4 sm:border-b">
                    <span className="sm:hidden font-bold text-gray-600">Content: </span>
                    {blog.content.length > 50 ? blog.content.substring(0, 50) + "..." : blog.content}
                  </td>

                  {/* Image */}
                  <td className="block sm:table-cell py-2 px-4 sm:border-b">
                    <span className="sm:hidden font-bold text-gray-600">Image: </span>
                    {blog.imageUrl ? (
                      <img
                        src={BASE_URL_IMAGES + blog.imageUrl}
                        alt={blog.title}
                        className="w-12 h-12 md:w-16 md:h-16 object-cover rounded mx-auto sm:mx-0"
                      />
                    ) : (
                      "No image"
                    )}
                  </td>

                  {/* Actions */}
                  <td className="block sm:table-cell py-2 px-4 sm:border-b flex flex-col sm:flex-row gap-2">
                    <span className="sm:hidden font-bold text-gray-600">Actions: </span>
                    <button
                      onClick={() => handleEdit(blog)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition w-full sm:w-auto"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition w-full sm:w-auto"
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

export default BlogsPage;
