"use client";
import React from "react";

const Users = () => {
  const avatars = [
    "https://placehold.co/40x40/FF6347/FFFFFF?text=A", // Example placeholder for avatar 1
    "https://placehold.co/40x40/4682B4/FFFFFF?text=B", // Example placeholder for avatar 2
    "https://placehold.co/40x40/32CD32/FFFFFF?text=C", // Example placeholder for avatar 3
    "https://placehold.co/40x40/FFD700/FFFFFF?text=D", // Example placeholder for avatar 4
    "https://placehold.co/40x40/8A2BE2/FFFFFF?text=E", // Example placeholder for avatar 5
  ];
  return (
    <div className="flex items-center shadow-lg rounded-2xl p-2 pr-4 space-x-3">
      {/* Avatar Group */}
      <div className="flex -space-x-3 rounded-2xl">
        {avatars.map((avatar, index) => (
          <img
            key={index}
            className="w-8 h-8 rounded-full border-2 border-white object-cover"
            src={avatar}
            alt={`User Avatar ${index + 1}`}
          />
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
