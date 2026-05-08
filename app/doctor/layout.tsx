"use client";
import "../globals.css";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("doctorToken");
    if (!token) {
      router.replace("/doctor/login");
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </head>
        <body>
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return <>{children}</>;
}
