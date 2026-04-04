export interface User {
  id: string;
  name: string;
  role: "admin" | "client";
  email: string;
}

export interface ProgressEntry {
  id: string;
  customerId: string;
  date: string;
  weight: number;
  fatPercentage: number;
}

export interface GymProject {
  id: string;
  clientId: string;
  clientName: string;
  projectName?: string;
  location: string;
  budget: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  timeline: string;
  status: "planning" | "ongoing" | "completed";
  progress: number;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number;
  date: string;
  type: "paid" | "pending";
  notes?: string | null;
}
