"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  ArrowRightLeft, 
  LogOut,
  MessageSquare
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function WorkerDailyViewPage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.id as string;
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkerData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workers/${workerId}?date=${selectedDate}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          console.error("Failed to fetch worker details");
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      fetchWorkerData();
    }
  }, [workerId, selectedDate]);

  const getActionDetails = (action: string) => {
    switch (action) {
      case "IN":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          color: "bg-green-500",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          label: "Checked In",
        };
      case "TRANSFER":
        return {
          icon: <ArrowRightLeft className="h-5 w-5 text-blue-600" />,
          color: "bg-blue-500",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          label: "Transferred",
        };
      case "OUT":
        return {
          icon: <LogOut className="h-5 w-5 text-orange-600" />,
          color: "bg-orange-500",
          bgColor: "bg-orange-100 dark:bg-orange-900/30",
          label: "Checked Out",
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          color: "bg-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          label: "Unknown Action",
        };
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header & Back Navigation */}
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => router.push("/dashboard/hr/daily-wagers")}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily View</h1>
      </div>

      {loading && !data ? (
        <div className="flex justify-center p-12">
          <Clock className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Top Section: Profile Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.worker.name}</h2>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {data.worker.skill} • Rate: ₹{data.worker.perHourRate}/hr
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase w-16">Daily</span>
                  <div className="flex gap-2">
                    <div className="rounded-lg bg-gray-50 px-4 py-2 text-center dark:bg-gray-800/50 min-w-[80px]">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Hours</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {data.logSummary.totalHours > 0 ? data.logSummary.totalHours : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-50 px-4 py-2 text-center dark:bg-green-900/10 min-w-[80px]">
                      <p className="text-[10px] text-green-600 dark:text-green-500">Pay</p>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        {data.logSummary.totalPayment > 0 ? `₹${data.logSummary.totalPayment}` : "-"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase w-16">Monthly</span>
                  <div className="flex gap-2">
                    <div className="rounded-lg bg-blue-50 px-4 py-2 text-center dark:bg-blue-900/20 min-w-[80px]">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400">Hours</p>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {data.monthlySummary?.totalHours > 0 ? data.monthlySummary.totalHours.toFixed(1) : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 px-4 py-2 text-center dark:bg-blue-900/20 min-w-[80px]">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400">Pay</p>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {data.monthlySummary?.totalPayment > 0 ? `₹${data.monthlySummary.totalPayment.toFixed(2)}` : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Date Picker */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CalendarIcon className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="w-full">
              <DatePicker
                selected={new Date(selectedDate + "T00:00:00")}
                onChange={(date: Date | null) => {
                  if (date) setSelectedDate(format(date, "yyyy-MM-dd"));
                }}
                dateFormat="dd/MM/yyyy"
                className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none dark:text-white cursor-pointer"
              />
            </div>
          </div>

          {/* Bottom Section: Zomato Style Vertical Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Clock className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : data.logSummary.logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-gray-50 p-4 dark:bg-gray-800">
                  <LogOut className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="mt-4 font-medium text-gray-900 dark:text-white">No Activity</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No logs found for this date.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 space-y-8">
                {data.logSummary.logs.map((log: any, index: number) => {
                  const details = getActionDetails(log.action);
                  
                  return (
                    <div key={log._id} className="relative pl-8 transition-all hover:pl-10 duration-300 ease-in-out">
                      {/* Timeline Dot (Icon) */}
                      <span className={`absolute -left-[17px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 ${details.bgColor}`}>
                        {details.icon}
                      </span>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">{details.label}</h4>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {format(new Date(log.time), "hh:mm a")}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{log.siteName}</span>
                        </div>
                        
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Updated by: <span className="font-medium text-gray-900 dark:text-gray-200">{log.updatedBy?.name || "System"}</span></span>
                        </div>

                        {log.remark && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            <p className="italic">"{log.remark}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="text-center p-12 text-gray-500">Worker not found.</div>
      )}
    </div>
  );
}
