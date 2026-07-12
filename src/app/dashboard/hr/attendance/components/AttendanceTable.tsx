"use client";

import React from "react";
import { MapPin, Edit2, AlertTriangle } from "lucide-react";
import { AttendanceRecord, MapModalState } from "../types";

interface AttendanceTableProps {
  attendances: AttendanceRecord[];
  setSelectedMap: (map: MapModalState | null) => void;
  openEditModal: (att: AttendanceRecord) => void;
  getStatusTheme: (status: string) => { wrapper: string; badge: string; icon: string; };
}

export function AttendanceTable({
  attendances,
  setSelectedMap,
  openEditModal,
  getStatusTheme,
}: AttendanceTableProps) {
  return (
    <div className="hidden md:block bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 tracking-wider">
            <th className="px-6 py-5 w-1/5">Employee</th>
            <th className="px-6 py-5">Status</th>
            <th className="px-6 py-5 w-1/4">Punch IN</th>
            <th className="px-6 py-5 w-1/4">Punch OUT</th>
            <th className="px-6 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-sm">
          {attendances.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                No records found for this date.
              </td>
            </tr>
          ) : (
            attendances.map((att) => {
              const theme = getStatusTheme(att.status);
              return (
                <tr key={att._id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{att.userId?.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                      {att.userId?.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${theme.badge}`}
                    >
                      {att.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {att.punchIn?.time ? (
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white tracking-wide">
                          {new Date(att.punchIn.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex items-start mt-1.5 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span className="leading-tight line-clamp-2">
                            {att.punchIn.location?.address || "Location fetched"}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedMap({
                              lat: att.punchIn!.location.latitude,
                              lng: att.punchIn!.location.longitude,
                              name: att.userId?.name || "",
                            })
                          }
                          className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center mt-1.5 bg-transparent border-none cursor-pointer"
                        >
                          View Map →
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-bold">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {att.punchOut?.time ? (
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white tracking-wide">
                          {new Date(att.punchOut.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex items-start mt-1.5 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span className="leading-tight line-clamp-2">
                            {att.punchOut.location?.address || "Location fetched"}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedMap({
                              lat: att.punchOut!.location.latitude,
                              lng: att.punchOut!.location.longitude,
                              name: att.userId?.name || "",
                            })
                          }
                          className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center mt-1.5 bg-transparent border-none cursor-pointer"
                        >
                          View Map →
                        </button>
                        {att.isEditedByHR && (
                          <span className="text-[10px] text-orange-400 flex items-center mt-1.5 font-bold tracking-wider bg-orange-500/10 px-2 py-0.5 rounded w-fit">
                            <Edit2 className="h-2.5 w-2.5 mr-1" /> HR Fixed
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`text-xs font-bold flex items-center ${theme.icon}`}>
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Missing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(att)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-650 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center ml-auto transition-all shadow-sm cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
