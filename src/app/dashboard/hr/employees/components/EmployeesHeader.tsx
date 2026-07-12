"use client";

import React from "react";
import { Users } from "lucide-react";

export function EmployeesHeader() {
  return (
    <div className="font-sans">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center tracking-tight">
        <Users className="mr-3 h-6 w-6 text-blue-500" /> Staff & Labor Directory
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
        Access corporate directory metrics and track historical attendance maps.
      </p>
    </div>
  );
}
