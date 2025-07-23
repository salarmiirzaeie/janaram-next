import Image from "next/image";
import React from "react";

const HeroBox = () => {
  return (
    <div className="bg-white p-4 flex-1 shadow-2xl">
      <Image src="/heroChart.webp" alt="Hero Chart" width={100} height={100} />
    </div>
  );
};

export default HeroBox;
