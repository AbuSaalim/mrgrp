"use client";

import React from "react";
import { Map, X } from "lucide-react";
import { MapModalState } from "../types";

interface MapModalProps {
  selectedMap: MapModalState | null;
  onClose: () => void;
}

export function MapModal({ selectedMap, onClose }: MapModalProps) {
  if (!selectedMap) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-700/50 rounded-3xl w-full max-w-xl overflow-hidden shadow-md dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
          <h3 className="font-bold flex items-center text-slate-900 dark:text-white tracking-wide">
            <Map className="mr-2 h-5 w-5 text-blue-500" /> Location: {selectedMap.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors cursor-pointer border-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="w-full h-[400px]">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://maps.google.com/maps?q=${selectedMap.lat},${selectedMap.lng}&z=15&output=embed`}
            className="filter contrast-125 dark:invert dark:grayscale dark:brightness-75 dark:hue-rotate-180"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
