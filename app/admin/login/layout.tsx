import React from "react";
import Head from "next/head";
import "../../globals.css";

const LoginLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Head>
          <title>Admin Login</title>
          <meta name="description" content="Login to the Admin Panel" />
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 antialiased">
          {children}
        </div>
      </body>
    </html>
  );
};

export default LoginLayout;
