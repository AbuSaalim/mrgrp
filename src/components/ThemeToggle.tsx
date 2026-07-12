"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-between w-16 h-8 p-1 bg-slate-200 dark:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute w-6 h-6 bg-white dark:bg-blue-500 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isDark ? "translate-x-8" : "translate-x-0"
        }`}
      />
      
      <div className="flex w-full justify-between px-1.5 z-10">
        <Sun className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-amber-500"} transition-colors`} />
        <Moon className={`w-4 h-4 ${isDark ? "text-blue-100" : "text-slate-400"} transition-colors`} />
      </div>
    </button>
  );
}
