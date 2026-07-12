export interface LeaveItem {
  _id: string;
  userId?: {
    _id?: string;
    name?: string;
    role?: string;
  };
  date: string;
  endDate?: string;
  type: string;
  status: "Pending" | "Approved" | "Rejected";
  reason?: string;
  approvedLeavesThisMonth?: number;
  isPaidLeaveQuotaUsed?: boolean;
  payImpactText?: string;
  createdAt?: string;
}

export interface LeaveKPIs {
  pendingCount: number;
  onLeaveTodayCount: number;
  rejectedThisMonthCount: number;
  approvedThisMonthCount: number;
}

export interface LeaveBalance {
  quota: number;
  used: number;
  remaining: number;
}

export interface EmployeeLeaveStats {
  empName: string;
  clBalance: LeaveBalance;
  slBalance: LeaveBalance;
  elBalance: LeaveBalance;
  history: LeaveItem[];
}
