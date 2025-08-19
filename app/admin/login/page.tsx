"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";

interface LoginFormInputs {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();
  const [error, setError] = React.useState("");
  const router = useRouter();

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("authToken", responseData.token);
        router.push("/admin");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700">Username</label>
            <input
              {...register("email", { required: "Username is required" })}
              className={`w-full p-2 border rounded ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className={`w-full p-2 border rounded ${errors.password ? "border-red-500" : ""}`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
