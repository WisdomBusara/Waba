import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().regex(/^\+254\d{9}$/, { message: "Phone must be in the format +2547XXXXXXXX." }),
  address: z.string().min(10, { message: "Address must be at least 10 characters long." }),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export const readingSchema = z.object({
    reading: z.coerce.number().min(0, { message: "Reading must be a non-negative number." }),
    date: z.string().min(1, { message: "Date is required." }),
});

export type ReadingFormData = z.infer<typeof readingSchema>;

const baseMeterSchema = z.object({
  serialNumber: z.string().min(5, { message: "Serial number must be at least 5 characters." }),
  customerAccount: z.string().optional().nullable(),
  installationDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format." })
    .refine((date) => new Date(date) <= new Date(), { message: "Installation date cannot be in the future." }),
});

export const addMeterSchema = baseMeterSchema.extend({
    initialReading: z.coerce.number().min(0, { message: "Initial reading must be non-negative." }),
});

export const editMeterSchema = baseMeterSchema;

export type AddMeterFormData = z.infer<typeof addMeterSchema>;
export type EditMeterFormData = z.infer<typeof editMeterSchema>;

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, { message: "A customer must be selected." }),
  issueDate: z.string().min(1, { message: "Issue date is required." }),
  dueDate: z.string().min(1, { message: "Due date is required." }),
  items: z.array(z.object({
    description: z.string().min(3, { message: "Description must be at least 3 characters." }),
    quantity: z.coerce.number().min(0.01, { message: "Quantity must be positive." }),
    unitPrice: z.coerce.number().min(0, { message: "Unit price must be non-negative." }),
  })).min(1, { message: "At least one item is required." }),
}).refine(data => new Date(data.dueDate) >= new Date(data.issueDate), {
  message: "Due date cannot be before the issue date.",
  path: ["dueDate"],
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export const recordPaymentSchema = z.object({
  customerId: z.string().min(1, { message: "A customer must be selected." }),
  invoiceId: z.string().min(1, { message: "An invoice must be selected." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  // Fix: Removed invalid_type_error and used the required params for z.enum
  method: z.enum(['M-Pesa', 'Cash', 'Bank'], { errorMap: () => ({ message: "Payment method is required." }) }),
  date: z.string().min(1, { message: "Payment date is required." }),
});

export type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;

export const userSchema = z.object({
  name: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  // Fix: Removed invalid_type_error and used the required params for z.enum
  role: z.enum(['Admin', 'Manager', 'Agent'], { errorMap: () => ({ message: "Role is required." }) }),
});

export type UserFormData = z.infer<typeof userSchema>;