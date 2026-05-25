"use client";
import React from "react";

const Users = () => {
  const avatars = [
    { label: "م", color: "skyblue" },
    { label: "س", color: "brown" },
    { label: "ث", color: "orange" },
    { label: "ز", color: "pink" },
    { label: "ح", color: "green" },
  ];
  return (
    <div className="flex items-center shadow-lg rounded-2xl p-2 pr-4 gap-3 bg-white">
      <div className="flex rounded-2xl -space-x-2">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shrink-0"
            style={{ backgroundColor: avatar.color }}
          >
            <span className="text-xs font-semibold text-white">
              {avatar.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start justify-center text-right">
        <span className="text-xl font-semibold text-gray-800">10K +</span>
        <span className="text-sm text-gray-600">کاربر فعال</span>
      </div>
    </div>
  );
};

export default Users;
