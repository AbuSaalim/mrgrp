"use client";

import React from "react";
import { Edit2, AlertTriangle } from "lucide-react";
import { AttendanceRecord, MapModalState } from "../types";

interface AttendanceMobileCardsProps {
  attendances: AttendanceRecord[];
  setSelectedMap: (map: MapModalState | null) => void;
  openEditModal: (att: AttendanceRecord) => void;
  getStatusTheme: (status: string) => { wrapper: string; badge: string; icon: string; };
}

export function AttendanceMobileCards({
  attendances,
  setSelectedMap,
  openEditModal,
  getStatusTheme,
}: AttendanceMobileCardsProps) {
  return (
    <div className="md:hidden space-y-4 font-sans">
      {attendances.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 font-medium">
          No records found.
        </div>
      ) : (
        attendances.map((att) => {
          const theme = getStatusTheme(att.status);
          return (
            <div
              key={att._id}
              className={`bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-300 ${theme.wrapper}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-wide">
                    {att.userId?.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                    {att.userId?.role}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider flex-shrink-0 ${theme.badge}`}
                >
                  {att.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-200 dark:border-slate-800/50">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Punch In</p>
                  {att.punchIn?.time ? (
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(att.punchIn.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-[9px] leading-tight text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {att.punchIn.location?.address}
                      </div>
                      <button
                        onClick={() =>
                          setSelectedMap({
                            lat: att.punchIn!.location.latitude,
                            lng: att.punchIn!.location.longitude,
                            name: att.userId?.name || "",
                          })
                        }
                        className="text-[10px] text-blue-400 font-bold flex items-center mt-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded w-fit cursor-pointer"
                      >
                        📍 View Map
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-500">-</span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans">
                    Punch Out
                  </p>
                  {att.punchOut?.time ? (
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(att.punchOut.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-[9px] leading-tight text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {att.punchOut.location?.address}
                      </div>
                      <button
                        onClick={() =>
                          setSelectedMap({
                            lat: att.punchOut!.location.latitude,
                            lng: att.punchOut!.location.longitude,
                            name: att.userId?.name || "",
                          })
                        }
                        className="text-[10px] text-blue-400 font-bold flex items-center mt-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded w-fit cursor-pointer"
                      >
                        📍 View Map
                      </button>
                      {att.isEditedByHR && (
                        <span className="text-[9px] text-orange-400 font-bold flex items-center mt-1.5 uppercase tracking-wider">
                          <Edit2 className="h-2.5 w-2.5 mr-1" /> Fixed
                        </span>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`text-[10px] font-bold flex items-center mt-1 px-2 py-1 rounded w-fit uppercase tracking-wider ${theme.badge}`}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" /> Missing
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50">
                <button
                  onClick={() => openEditModal(att)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-650 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" /> Manual Edit
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
