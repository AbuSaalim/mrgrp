export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface PunchDetails {
  time: string;
  location: LocationCoordinates;
}

export interface AttendanceRecord {
  _id: string;
  userId?: {
    _id?: string;
    name?: string;
    role?: string;
  };
  date: string;
  status: "Present" | "Absent" | "Missed Out" | "In Progress" | string;
  punchIn?: PunchDetails;
  punchOut?: PunchDetails;
  isEditedByHR?: boolean;
  hrNotes?: string;
}

export interface MapModalState {
  lat: number;
  lng: number;
  name: string;
}

export interface EditFormState {
  date: string;
  punchInTime: string;
  punchOutTime: string;
  status: string;
  hrNotes: string;
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 10 + i);
