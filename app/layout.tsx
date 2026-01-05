import './globals.css';
import React from 'react';

export const metadata = {
  title: 'მოსავალი',
  description: 'Farm Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
