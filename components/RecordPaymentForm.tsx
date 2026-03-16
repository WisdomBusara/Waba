import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Invoice } from '../types';
import { recordPaymentSchema, RecordPaymentFormData } from '../lib/schemas';
import { SaveIcon } from './icons';
import Modal from './ui/Modal';

interface RecordPaymentFormProps {
    customers: Customer[];
    unpaidInvoices: Invoice[];
    onSave: (data: RecordPaymentFormData) => Promise<void>;
    onCancel: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const RecordPaymentForm: React.FC<RecordPaymentFormProps> = ({ customers, unpaidInvoices, onSave, onCancel, showToast }) => {
    const [formData, setFormData] = useState<RecordPaymentFormData>({
        customerId: '',
        invoiceId: '',
        amount: 0,
        method: 'M-Pesa',
        date: new Date().toISOString().split('T')[0],
    });
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
    const [isSaving, setIsSaving] = useState(false);

    const availableInvoices = useMemo(() => {
        if (!formData.customerId) return [];
        const customer = customers.find(c => c.id === formData.customerId);
        if (!customer) return [];
        return unpaidInvoices.filter(inv => inv.customerAccount === customer.accountNumber);
    }, [formData.customerId, customers, unpaidInvoices]);

    useEffect(() => {
        // Reset invoiceId and amount if customer changes
        setFormData(prev => ({ ...prev, invoiceId: '', amount: 0 }));
    }, [formData.customerId]);
    
    useEffect(() => {
        // Pre-fill amount when invoice is selected
        const selectedInvoice = unpaidInvoices.find(inv => inv.id === formData.invoiceId);
        setFormData(prev => ({ ...prev, amount: selectedInvoice?.total || 0 }));
    }, [formData.invoiceId, unpaidInvoices]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const result = recordPaymentSchema.safeParse(formData);
        if (!result.success) {
            const newErrors: { [key: string]: string } = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0];
                if (typeof path === 'string') {
                    newErrors[path] = issue.message;
                }
            });
            setErrors(newErrors);
            showToast('Please fix the errors in the form.', 'error');
            setIsSaving(false);
            return;
        }
        setErrors({});
        await onSave(result.data);
        setIsSaving(false);
    };

    return (
        <Modal title="Record New Payment" onClose={onCancel} className="max-w-lg">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="overflow-y-auto p-6 space-y-4 flex-1">
                    <div>
                        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                        <select id="customerId" name="customerId" value={formData.customerId} onChange={handleInputChange} className={`mt-1 block w-full input-field ${errors.customerId ? 'border-red-500' : ''}`}>
                            <option value="" disabled>Select a customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.accountNumber}</option>)}
                        </select>
                        {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId}</p>}
                    </div>

                    <div>
                        <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice</label>
                        <select id="invoiceId" name="invoiceId" value={formData.invoiceId} onChange={handleInputChange} className={`mt-1 block w-full input-field ${errors.invoiceId ? 'border-red-500' : ''}`} disabled={!formData.customerId}>
                            <option value="" disabled>Select an invoice</option>
                            {availableInvoices.map(inv => <option key={inv.id} value={inv.id}>{inv.id} - Due: {inv.total.toLocaleString()}</option>)}
                        </select>
                        {errors.invoiceId && <p className="mt-1 text-xs text-red-500">{errors.invoiceId}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (KES)</label>
                            <input type="number" step="any" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} className={`mt-1 block w-full input-field ${errors.amount ? 'border-red-500' : ''}`} />
                            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                        </div>
                        <div>
                            <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Method</label>
                            <select id="method" name="method" value={formData.method} onChange={handleInputChange} className={`mt-1 block w-full input-field ${errors.method ? 'border-red-500' : ''}`}>
                                <option>M-Pesa</option>
                                <option>Cash</option>
                                <option>Bank</option>
                            </select>
                            {errors.method && <p className="mt-1 text-xs text-red-500">{errors.method}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} className={`mt-1 block w-full input-field ${errors.date ? 'border-red-500' : ''}`} />
                        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="secondary-button">Cancel</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="primary-button">
                        {isSaving && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        <SaveIcon className={`w-5 h-5 mr-2 ${isSaving ? 'hidden' : 'block'}`} />
                        {isSaving ? 'Saving...' : 'Save Payment'}
                    </button>
                </div>
            </form>
            <style>{`
                .input-field { padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
                .dark .input-field { background-color: #374151; border-color: #4b5563; }
                .input-field:focus { outline: none; --tw-ring-color: #3b82f6; box-shadow: 0 0 0 2px var(--tw-ring-color); border-color: #3b82f6; }
                .input-field.border-red-500 { border-color: #ef4444; }
                .primary-button { display: flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: 0.375rem; font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed; }
                .secondary-button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600; }
            `}</style>
        </Modal>
    );
};

export default RecordPaymentForm;
