import Image from "next/image";
import React from "react";

// Main App component

// TestimonialCard component
interface ReviewSectionProps {
  name: string;
  review: string;
  imageSrc: string;
  imageAlt: string;
  rating: string;
}
const TestimonialCard: React.FC<ReviewSectionProps> = ({ name, review, imageSrc, imageAlt, rating }) => {
  return (
    <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full md:max-w-xl lg:max-w-2xl xl:max-w-3xl">
      {/* Speech bubble tail */}
      <div className="absolute -bottom-3 left-1/4 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-white"></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">{name}</h2>
        <div className="flex space-x-1">
          {/* Star icons */}
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" viewBox="0 0 24 24">
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.908-7.416 3.908 1.48-8.279-6.064-5.828 8.332-1.151z" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-gray-700 text-base sm:text-lg text-right leading-relaxed">{review}</p>

      {/* Avatar with November text */}
      <div className="absolute -bottom-24 left-1/8 transform -translate-x-1/2">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
          {/* <Image
            src={`/testimonial/${imageSrc}.png`}
            alt="November"
            className="w-full h-full object-cover"
            width={100}
            height={100}
          /> */}
          <div className="w-full h-full  bg-green-300 rounded-full flex items-center justify-center">
            {name.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
