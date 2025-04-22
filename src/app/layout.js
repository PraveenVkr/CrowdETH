"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { StateContextProvider } from "../context/StateContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "./globals.css";

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThirdwebProvider clientId={clientId} activeChain="sepolia">
          <StateContextProvider>
            <div className="relative sm:p-8 p-4 bg-[#13131a] min-h-screen flex flex-row">
              <div className="sm:flex hidden mr-10 relative">
                <Sidebar />
              </div>
              <div className="flex-1 max-sm:w-full max-w-[1280px] mx-auto sm:pr-5">
                <Navbar />
                <main>{children}</main>
              </div>
            </div>
          </StateContextProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
