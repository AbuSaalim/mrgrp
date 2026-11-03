"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Fingerprint, 
  CalendarDays,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Smartphone,
  WifiOff
} from "lucide-react";
import CalendarModal from "./attendance/CalendarModal";

interface DiagnosticError {
  code: "PERMISSION_DENIED" | "TIMEOUT" | "POSITION_UNAVAILABLE" | "OFFLINE" | "SERVER_ERROR" | "GENERIC";
  title: string;
  message: string;
  guidance: string[];
}

export default function AttendanceCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false); 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // States from Backend
  const [hasPunchedIn, setHasPunchedIn] = useState(false);
  const [hasPunchedOut, setHasPunchedOut] = useState(false);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [leaveStatus, setLeaveStatus] = useState("");
  
  // Diagnostic error handling
  const [diagnosticError, setDiagnosticError] = useState<DiagnosticError | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetch("/api/attendance/today")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or server error");
        return res.json();
      })
      .then((data) => {
        setHasPunchedIn(Boolean(data.hasPunchedIn));
        setHasPunchedOut(Boolean(data.hasPunchedOut));
        setIsOnLeave(Boolean(data.isOnLeave));
        if (data.leaveStatus) setLeaveStatus(data.leaveStatus);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch attendance:", err);
        setIsLoading(false);
      });
  }, []);

  // 🚀 Helper function to get text address from coordinates with 4s timeout fallback
  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) return "Map coordinates logged";
      
      const data = await response.json();
      
      // Smart location formatting (e.g. "Virani Petrol Pump, Mumbra")
      const specificArea = data.address?.amenity || data.address?.road || data.address?.neighbourhood || data.address?.suburb || "";
      const city = data.address?.city || data.address?.town || data.address?.village || "";
      
      if (specificArea && city) return `${specificArea}, ${city}`;
      if (data.display_name) return data.display_name.split(",").slice(0, 3).join(", "); // Fallback short name
      
      return "Map coordinates logged";
    } catch (error) {
      return "Map coordinates logged"; // Fallback so attendance doesn't fail
    }
  };

  const handleCopyDiagnostic = () => {
    if (!diagnosticError) return;
    const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = typeof window !== "undefined" && /Android/.test(navigator.userAgent);
    const deviceName = isIOS ? "Apple iPhone / iOS (Safari)" : isAndroid ? "Android Device (Chrome/Browser)" : "Desktop Browser";

    const report = [
      `🚨 *MR Group ERP - Attendance Error Report*`,
      `• *Error Code:* [${diagnosticError.code}]`,
      `• *Issue:* ${diagnosticError.title}`,
      `• *Details:* ${diagnosticError.message}`,
      `• *Device:* ${deviceName}`,
      `• *Internet:* ${typeof navigator !== "undefined" && navigator.onLine ? "Connected (Online)" : "Disconnected (Offline)"}`,
      `• *Time:* ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date())}`,
      `• *URL:* ${typeof window !== "undefined" ? window.location.href : "N/A"}`
    ].join("\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(report);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handlePunch = async (action: "IN" | "OUT") => {
    setIsPunching(true);
    setDiagnosticError(null);

    // 0. Check Online Network Connectivity
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setDiagnosticError({
        code: "OFFLINE",
        title: "No Internet Connection",
        message: "Your phone is currently offline. Internet is required to securely submit attendance.",
        guidance: [
          "Check if your Mobile Data or Wi-Fi is switched ON.",
          "Toggle Airplane Mode ON for 5 seconds and turn it OFF to refresh mobile signal.",
          "Once internet is restored, tap 'Try Again'."
        ]
      });
      setIsPunching(false);
      return;
    }

    // 1. Request Geolocation from Browser/Mobile
    if (!navigator.geolocation) {
      setDiagnosticError({
        code: "GENERIC",
        title: "Geolocation Unsupported",
        message: "Your browser or device does not support GPS location tracking.",
        guidance: ["Please open this application in Google Chrome or Apple Safari."]
      });
      setIsPunching(false);
      return;
    }

    const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Fetch readable address with fallback
          const addressText = await getAddressFromCoords(latitude, longitude);

          const location = {
            latitude,
            longitude,
            address: addressText
          };

          // 2. Send Data to Backend API
          const res = await fetch("/api/attendance/punch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, location }),
          });

          if (res.ok) {
            if (action === "IN") setHasPunchedIn(true);
            if (action === "OUT") setHasPunchedOut(true);
          } else {
            const data = await res.json();
            setDiagnosticError({
              code: "SERVER_ERROR",
              title: "Punch Request Rejected",
              message: data.message || "Failed to punch. Please try again.",
              guidance: [
                data.message || "Action could not be validated by server.",
                "Ensure you have not already punched for this date.",
                "If problem continues, tap 'Copy Report' below and send to Admin."
              ]
            });
          }
        } catch (err) {
          setDiagnosticError({
            code: "SERVER_ERROR",
            title: "Network / Server Unreachable",
            message: "Unable to connect to ERP server. Please verify your data connection.",
            guidance: [
              "Check your internet connectivity.",
              "Wait 5 seconds and tap 'Try Again' button below."
            ]
          });
        } finally {
          setIsPunching(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setDiagnosticError({
            code: "PERMISSION_DENIED",
            title: "Location Permission Blocked on Device",
            message: "This browser is blocked from accessing GPS location. Strict company policy requires verified site location.",
            guidance: isIOS ? [
              "In Safari, tap 'aA' (or Page Settings) in the bottom/top address bar.",
              "Tap 'Website Settings' -> set 'Location' to 'Allow'.",
              "Open iPhone Settings -> Privacy & Security -> Location Services -> Safari Websites -> choose 'While Using the App' & enable 'Precise Location'.",
              "Make sure Safari is not in 'Private Browsing' mode, then tap 'Try Again'."
            ] : [
              "In Chrome, tap the 🔒 (Lock icon) in the top URL address bar.",
              "Tap 'Permissions' -> set 'Location' to 'Allow'.",
              "Open Phone Settings -> Apps -> Chrome -> Permissions -> Location -> choose 'Allow while using app' and turn ON 'Use precise location'.",
              "Phone Settings -> Location -> Location Services -> turn ON 'Google Location Accuracy'."
            ]
          });
        } else if (error.code === error.TIMEOUT) {
          setDiagnosticError({
            code: "TIMEOUT",
            title: "GPS Satellite Lock Timed Out (>20s)",
            message: "Your phone took longer than 20 seconds to acquire high-accuracy GPS coordinates.",
            guidance: [
              "If you are indoors or in a basement, step closer to a window, door, or open site area.",
              "Turn ON 'Google Location Accuracy' (on Android) or 'Precise Location' (on iPhone).",
              "Tip: Open Google Maps / Apple Maps for 3 seconds to jumpstart device GPS, then return and tap 'Try Again'."
            ]
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setDiagnosticError({
            code: "POSITION_UNAVAILABLE",
            title: "Phone GPS / Location is Turned OFF",
            message: "Hardware GPS positioning is currently disabled on your device.",
            guidance: [
              "Pull down your phone's notification panel or Control Center.",
              "Turn ON the main 'Location / GPS' toggle.",
              "Ensure Battery Saver or Power Saving mode is not restricting GPS sensors."
            ]
          });
        } else {
          setDiagnosticError({
            code: "GENERIC",
            title: "Location Verification Failed",
            message: error.message || "Could not retrieve GPS coordinates.",
            guidance: ["Ensure GPS is enabled and tap 'Try Again'."]
          });
        }
        setIsPunching(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse flex flex-col items-center justify-center h-48">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
        <div className="h-12 w-48 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      </div>
    );
  }

  if (isOnLeave) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-500/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-200 dark:border-yellow-500/20 shadow-sm text-center">
        <CalendarDays className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">You are on Leave Today</h3>
        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-1">Status: {leaveStatus}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md dark:shadow-lg relative overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
        <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none transition-colors duration-1000 ${hasPunchedOut ? 'bg-slate-400 dark:bg-slate-500' : hasPunchedIn ? 'bg-rose-400 dark:bg-rose-500' : 'bg-emerald-400 dark:bg-emerald-500'}`}></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center justify-center md:justify-start">
              <Clock className="mr-2 h-6 w-6 text-blue-500" />
              Daily Attendance
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center md:justify-start">
              <MapPin className="mr-1 h-4 w-4" /> Device location tracking active
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full md:w-auto">
            {hasPunchedIn && hasPunchedOut ? (
              <div className="flex items-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full px-4 py-1.5 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" />
                Shift Completed
              </div>
            ) : (
              <button
                onClick={() => handlePunch(hasPunchedIn ? "OUT" : "IN")}
                disabled={isPunching}
                className={`relative group flex items-center justify-center w-full md:w-64 px-8 py-4 text-white font-bold text-lg rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:hover:translate-y-0
                  ${hasPunchedIn 
                    ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-rose-500/30" 
                    : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/30"
                  }
                `}
              >
                {isPunching ? (
                  <span className="flex items-center animate-pulse">
                    <MapPin className="mr-2 h-5 w-5 animate-bounce" /> Locating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Fingerprint className="mr-2 h-6 w-6 opacity-80 group-hover:scale-110 transition-transform" /> 
                    {hasPunchedIn ? "PUNCH OUT" : "PUNCH IN"}
                  </span>
                )}
              </button>
            )}

            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400/80 hover:text-blue-700 dark:hover:text-blue-400 mt-2 flex items-center transition-colors"
            >
              🌴 Request Leave / View Calendar
            </button>
          </div>
        </div>

        {diagnosticError && (
          <div className="mt-6 p-4 sm:p-5 bg-rose-50 dark:bg-rose-950/30 backdrop-blur-md rounded-2xl border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/60 dark:border-rose-500/20 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex-shrink-0">
                  {diagnosticError.code === "OFFLINE" ? <WifiOff className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </span>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-rose-900 dark:text-rose-100 flex items-center gap-2 flex-wrap">
                    {diagnosticError.title}
                    <span className="text-[10px] font-mono uppercase bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded font-bold">
                      {diagnosticError.code}
                    </span>
                  </h4>
                  <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                    {diagnosticError.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCopyDiagnostic}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy technical diagnosis to send to Admin"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handlePunch(hasPunchedIn ? "OUT" : "IN")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>

            {/* Expandable Step-by-Step Fix Guide */}
            <div>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between text-xs font-bold text-rose-900/90 dark:text-rose-200 hover:text-rose-950 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-rose-500" />
                  How to fix this on your phone:
                </span>
                {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showGuide && (
                <ul className="mt-2.5 space-y-1.5 text-xs text-rose-800 dark:text-rose-200/90 pl-5 list-disc font-medium">
                  {diagnosticError.guidance.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        {/* <LeaveBalancesWidget /> */}
      </div>

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />
    </>
  );
}
