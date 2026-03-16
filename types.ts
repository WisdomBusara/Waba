
import React from 'react';
import { z } from 'zod';
import { createInvoiceSchema, recordPaymentSchema, userSchema, CreateInvoiceFormData, RecordPaymentFormData, UserFormData } from './lib/schemas';

export interface KpiData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
}

export interface RevenueData {
  month: string;
  billed: number;
  collected: number;
}

export interface AgingData {
  name: string;
  value: number;
  fill: string;
}

export interface Defaulter {
  id: string;
  name: string;
  account: string;
  amountDue: number;
  daysOverdue: number;
}

export interface RecentPayment {
  id: string;
  customerName: string;
  amount: number;
  method: 'M-Pesa' | 'Cash' | 'Bank';
  date: string;
  invoiceId: string;
}

export interface NRWData {
  day: string;
  percentage: number;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export type InvoiceStatus = 'Paid' | 'Due' | 'Overdue';

export interface Invoice {
    id: string;
    customerName: string;
    customerAccount: string;
    customerAddress: string;
    issueDate: string;
    generationDate: string;
    dueDate: string;
    items: InvoiceItem[];
    subtotal: number;
    penalties: number;
    total: number;
    status: InvoiceStatus;
}

export type MeterStatus = 'Active' | 'Inactive' | 'Needs Maintenance';

export interface Meter {
  id: string;
  serialNumber: string;
  customerAccount: string | null;
  status: MeterStatus;
  installationDate: string;
}

export interface MeterReading {
  id: string;
  meterId: string;
  reading: number;
  date: string;
}

export interface MeterStatusEvent {
    id: string;
    meterId: string;
    date: string;

    fromStatus: MeterStatus;
    toStatus: MeterStatus;
}

export interface BillingSettings {
  frequency: 'monthly' | 'bi-monthly';
  generationDay: number; // 1-28
  readingCutoffDays: number;
}

export interface Customer {
  id: string;
  accountNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
}

export interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
}

// Re-exporting from schemas to maintain single source of truth
export type { CreateInvoiceFormData, RecordPaymentFormData, UserFormData };

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Agent';
  lastActive: string;
  status?: 'Active' | 'Inactive';
}

export interface PdfSettings {
  logo?: string | null;
  themeColor?: string;
  footerText?: string;
}

export interface MapDataPoint {
    id: string;
    name: string;
    value: number; // e.g., number of customers or revenue
    x: number; // percentage for left position
    y: number; // percentage for top position
}

export interface TopCustomer {
    id: string;
    name: string;
    billed: number;
    avatar: string;
}
