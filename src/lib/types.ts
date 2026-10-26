export type InvoiceStatus = "PAID" | "PARTIAL" | "UNPAID";

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Course {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: CourseLevel;
  actualPrice: number;
  discountedPrice: number;
  active: boolean;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  note?: string;
}

export interface InvoiceStudent {
  name: string;
  email: string;
  phone: string;
}

export interface InvoiceCourse {
  id: string;
  title: string;
  category: string;
  level: CourseLevel;
}

export interface Invoice {
  id: string;
  number: string;
  student: InvoiceStudent;
  course: InvoiceCourse;
  actualPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paymentMethod: string;
  notes: string;
  payments: Payment[];
  createdAt: string;
}

export interface Settings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  gstin: string;
  currency: string;
  invoicePrefix: string;
  nextNumber: number;
  signatoryName: string;
  signatoryTitle: string;
  signatureUrl: string;
  logoUrl: string;
  footerNote: string;
}

export interface Database {
  settings: Settings;
  courses: Course[];
  invoices: Invoice[];
}

export interface InvoiceInput {
  studentName: string;
  email: string;
  phone: string;
  courseId: string;
  actualPrice: number;
  finalPrice: number;
  amountPaid: number;
  issueDate: string;
  dueDate: string;
  paymentMethod: string;
  notes: string;
}
