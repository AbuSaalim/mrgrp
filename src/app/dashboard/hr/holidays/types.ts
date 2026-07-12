export interface PublicHolidayItem {
  _id: string;
  name: string;
  dateString: string;
  type: "National" | "Regional" | "Religious";
  isActive: boolean;
  description?: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface HolidayFormState {
  name: string;
  dateString: string;
  type: "National" | "Regional" | "Religious";
  isActive: boolean;
  description: string;
}

export interface NotificationState {
  type: "success" | "error";
  text: string;
}
