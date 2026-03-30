import { z } from 'zod';

const baseInvoiceSchema = z.object({
  customerId: z.string().min(1, { message: "A customer must be selected." }),
  issueDate: z.string().min(1, { message: "Issue date is required." }),
  dueDate: z.string().min(1, { message: "Due date is required." }),
  items: z.array(z.object({
    description: z.string().min(3, { message: "Description must be at least 3 characters." }),
    quantity: z.coerce.number().min(0.01, { message: "Quantity must be positive." }),
    unitPrice: z.coerce.number().min(0, { message: "Unit price must be non-negative." }),
  })).min(1, { message: "At least one item is required." }),
});

const step2Schema = baseInvoiceSchema.pick({ items: true });

const formData = {
    customerId: 'CUST-001',
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    status: 'Due'
};

const result = step2Schema.safeParse(formData);
console.log(result.success);
if (!result.success) {
    console.log(result.error.issues);
}
