"use client";
import React from "react";

const Users = () => {
  const colors = ["green", "red", "yellow", "purple", "blue"];
  const avatars = [
    { label: "م", color: "skyblue" },
    { label: "س", color: "brown" },
    { label: "ث", color: "orange" },
    { label: "ز", color: "pink" },
    { label: "ح", color: "green" },
  ];
  return (
    <div className="flex items-center shadow-lg rounded-2xl p-2 pr-4 space-x-3">
      {/* Avatar Group */}
      <div className="flex  rounded-2xl">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full -ml-3 justify-center items-end  object-cover`}
            style={{ backgroundColor: avatar.color }}
          >
            <p className="text-center font-semibold text-white">
              {avatar.label}
            </p>
          </div>
        ))}
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-start justify-center">
        <span className="text-xl font-semibold text-gray-800">5K +</span>
        <span className="text-sm text-gray-600">کاربر فعال</span>
      </div>
    </div>
  );
};

export default Users;
