"use client";
import "../globals.css";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className="doctor-ui text-gray-900 bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
