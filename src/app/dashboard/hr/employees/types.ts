export interface EmployeeItem {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface DayMetric {
  type: "present" | "missed" | "leave" | "empty";
  tag: string | null;
  status: string | null;
  rawData: any | null;
}

export interface HistoryData {
  attendances: any[];
  leaves: any[];
}

export interface NeonThemeStyle {
  wrapper: string;
  badge: string;
  button: string;
}

export const NEON_THEMES: NeonThemeStyle[] = [
  {
    wrapper: "bg-white dark:bg-amber-500/5 border-amber-500/30 dark:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-500/10 hover:border-amber-500/80 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.05)]",
    badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm dark:shadow-none",
    button: "bg-white/50 dark:bg-slate-900/40 hover:bg-amber-50 dark:hover:bg-amber-500/20 border-amber-500/30 dark:border-slate-700 hover:border-amber-500 text-slate-650 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400"
  },
  {
    wrapper: "bg-white dark:bg-emerald-500/5 border-emerald-500/30 dark:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/10 hover:border-emerald-500/80 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.05)]",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none",
    button: "bg-white/50 dark:bg-slate-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 border-emerald-500/30 dark:border-slate-700 hover:border-emerald-500 text-slate-650 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
  },
  {
    wrapper: "bg-white dark:bg-rose-500/5 border-rose-500/30 dark:border-rose-500/40 hover:bg-rose-50/30 dark:hover:bg-rose-500/10 hover:border-rose-500/80 shadow-sm dark:shadow-[0_0_15px_rgba(244,63,94,0.05)]",
    badge: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm dark:shadow-none",
    button: "bg-white/50 dark:bg-slate-900/40 hover:bg-rose-50 dark:hover:bg-rose-500/20 border-rose-500/30 dark:border-slate-700 hover:border-rose-500 text-slate-650 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
  },
  {
    wrapper: "bg-white dark:bg-blue-500/5 border-blue-500/30 dark:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 hover:border-blue-500/80 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.05)]",
    badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm dark:shadow-none",
    button: "bg-white/50 dark:bg-slate-900/40 hover:bg-blue-50 dark:hover:bg-blue-500/20 border-blue-500/30 dark:border-slate-700 hover:border-blue-500 text-slate-650 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
  },
  {
    wrapper: "bg-white dark:bg-purple-500/5 border-purple-500/30 dark:border-purple-500/40 hover:bg-purple-50/30 dark:hover:bg-purple-500/10 hover:border-purple-500/80 shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.05)]",
    badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shadow-sm dark:shadow-none",
    button: "bg-white/50 dark:bg-slate-900/40 hover:bg-purple-50 dark:hover:bg-purple-500/20 border-purple-500/30 dark:border-slate-700 hover:border-purple-500 text-slate-650 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400"
  }
];
