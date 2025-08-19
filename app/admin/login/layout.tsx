import React from "react";
import Head from "next/head";
import localFont from "next/font/local";
import "../../globals.css";

const LoginLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={` antialiased bg-gray-100 min-h-screen flex items-center justify-center`}>
        <Head>
          <meta name="description" content="Login to the Admin Panel" />
        </Head>
        {children}
      </body>
    </html>
  );
};

export default LoginLayout;
