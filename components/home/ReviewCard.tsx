"use client";
import React from "react";

interface ReviewSectionProps {
  name: string;
  review: string;
  imageSrc: string;
  imageAlt: string;
  rating: string;
}

const TestimonialCard: React.FC<ReviewSectionProps> = ({ name, review }) => {
  return (
    <div className="flex flex-col h-full bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 shrink-0 bg-green-300 rounded-full flex items-center justify-center text-lg font-semibold text-gray-800">
          {name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {name}
          </h3>
          <div className="flex gap-0.5 mt-1" aria-label="۵ ستاره">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 text-yellow-400 fill-current"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.908-7.416 3.908 1.48-8.279-6.064-5.828 8.332-1.151z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
      <p className="text-gray-700 text-base text-right leading-relaxed flex-1">
        {review}
      </p>
    </div>
  );
};

export default TestimonialCard;
