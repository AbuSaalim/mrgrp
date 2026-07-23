"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if splash screen was already shown in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // Completely remove from DOM after 2.5 seconds (allowing 500ms for fade out transition)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("hasSeenSplash", "true");
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Avoid hydration mismatch by not rendering anything until mounted
  if (!isMounted || !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1121] transition-opacity duration-500 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center justify-center animate-pulse">
        <div className="relative w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl">
          <Image
            src="/logo.png"
            alt="MR App Logo"
            fill
            className="object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
            priority
          />
        </div>
        <h1 className="mt-6 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 opacity-90">
          MR Group
        </h1>
        <div className="mt-8 flex gap-2 justify-center items-center">
          <div className="w-2.5 h-2.5 bg-yellow-400 dark:bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2.5 h-2.5 bg-yellow-400 dark:bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2.5 h-2.5 bg-yellow-400 dark:bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}
