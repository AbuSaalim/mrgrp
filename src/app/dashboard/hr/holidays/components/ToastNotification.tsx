"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { NotificationState } from "../types";

interface ToastNotificationProps {
  notification: NotificationState | null;
}

export function ToastNotification({ notification }: ToastNotificationProps) {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md ${
        notification.type === "success"
          ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400"
          : "bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-400"
      }`}
    >
      {notification.type === "success" ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-bold tracking-wide font-sans">{notification.text}</span>
    </div>
  );
}
