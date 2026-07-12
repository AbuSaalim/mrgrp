export interface PayrollAdjustment {
  type: "BONUS" | "PENALTY" | "ALLOWANCE" | "OTHER";
  amount: number;
  reason: string;
  addedBy: string;
  createdAt: string;
}

export interface PayrollRecord {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: any;
  };
  periodMonth: string;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalWorkingHours: number;
  averageWorkingDays: number;
  overtimeHours: number;
  approvedLeavesCount?: number;
  paidLeaveDays?: number;
  lwpDays?: number;
  dailyRate: number;
  overtimeRate: number;
  baseCalculatedEarnings: number;
  overtimeEarnings: number;
  absentPenaltyDeductions: number;
  adjustments: PayrollAdjustment[];
  netPayableAmount: number;
  status: "DRAFT" | "APPROVED_LOCKED";
}

export interface PayrollSummary {
  totalEmployees: number;
  totalPayrollCost: number;
  totalHoursWorked: number;
  lockedRecordsCount: number;
  draftRecordsCount: number;
  avgEnterpriseWorkingDays: number;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface ActionMessageState {
  type: "success" | "error";
  text: string;
}

export interface RateFormState {
  dailyRate: number;
  overtimeRate: number;
  monthlyFixedSalary: number;
  standardShiftHours: number;
}

export interface AdjustmentFormState {
  type: string;
  amount: string;
  reason: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: any;
}
