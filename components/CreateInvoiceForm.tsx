import React, { useState, useMemo, useEffect } from 'react';
import { Customer, CreateInvoiceFormData, Invoice, InvoiceStatus } from '../types';
import { createInvoiceSchema } from '../lib/schemas';
import { XIcon, PlusIcon, AlertTriangleIcon } from './icons';
import Stepper from './Stepper';
import Modal from './ui/Modal';

interface CreateInvoiceFormProps {
    customers: Customer[];
    onSave: (data: CreateInvoiceFormData & { status: InvoiceStatus }, id?: string) => void;
    onCancel: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    invoiceToEdit?: Invoice | null;
}

type FormErrors = { [key: string]: any };

const STEPS = ['Customer & Dates', 'Line Items', 'Review'];

const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({ customers, onSave, onCancel, showToast, invoiceToEdit }) => {
    const isEditMode = !!invoiceToEdit;
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<CreateInvoiceFormData & { status: InvoiceStatus }>({
        customerId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        status: 'Due',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [errorSummary, setErrorSummary] = useState<string[]>([]);


    useEffect(() => {
        if (isEditMode && invoiceToEdit && customers.length > 0) {
            const customer = customers.find(c => c.accountNumber === invoiceToEdit.customerAccount);
            setFormData({
                customerId: customer?.id || '',
                issueDate: invoiceToEdit.issueDate,
                dueDate: invoiceToEdit.dueDate,
                items: invoiceToEdit.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                status: invoiceToEdit.status,
            });
        }
    }, [invoiceToEdit, isEditMode, customers]);
    
    const { subtotal, total } = useMemo(() => {
        const sub = formData.items.reduce((acc, item) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            const lineTotal = (isNaN(quantity) || isNaN(unitPrice)) ? 0 : quantity * unitPrice;
            return acc + lineTotal;
        }, 0);
        const penalties = isEditMode && invoiceToEdit ? invoiceToEdit.penalties : 0;
        return { subtotal: sub, total: sub + penalties };
    }, [formData.items, isEditMode, invoiceToEdit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: 'New Service/Item', quantity: 1, unitPrice: 0 }],
        }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length <= 1) {
            showToast('An invoice must have at least one item.', 'error');
            return;
        }
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const parseErrors = (issues: any[]) => {
        const newErrors: FormErrors = {};
        issues.forEach(issue => {
            const path = issue.path;
            let current = newErrors;
            path.forEach((key: string | number, index: number) => {
                if (index === path.length - 1) {
                    current[key] = issue.message;
                } else {
                    current[key] = current[key] || (typeof path[index + 1] === 'number' ? [] : {});
                    current = current[key];
                }
            });
        });
        setErrors(newErrors);
        
        const uniqueMessages = [...new Set(issues.map(issue => issue.message))];
        setErrorSummary(uniqueMessages);
        
        showToast('Please fix the errors before proceeding.', 'error');
    };

    const handleNext = () => {
        if (currentStep === 1) {
            const step1Schema = createInvoiceSchema.pick({ customerId: true, issueDate: true, dueDate: true });
            const result = step1Schema.safeParse(formData);
            if (!result.success) {
                parseErrors(result.error.issues);
                return;
            }
        }
        if (currentStep === 2) {
             const step2Schema = createInvoiceSchema.pick({ items: true });
             const result = step2Schema.safeParse(formData);
             if(!result.success){
                parseErrors(result.error.issues);
                return;
             }
        }
        setErrors({});
        setErrorSummary([]);
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setErrors({});
        setErrorSummary([]);
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = createInvoiceSchema.safeParse(formData);
        if (result.success) {
            setErrors({});
            setErrorSummary([]);
            const dataToSave = { ...result.data, status: formData.status };
            onSave(dataToSave, invoiceToEdit?.id);
        } else {
            parseErrors(result.error.issues);
        }
    };
    
    const renderErrorSummary = () => {
        if (errorSummary.length === 0) return null;
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-md" role="alert">
                <div className="flex">
                    <AlertTriangleIcon className="h-5 w-5 mr-3 mt-0.5 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Please correct {errorSummary.length} error{errorSummary.length > 1 ? 's' : ''}:</p>
                        <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                            {errorSummary.map((msg, i) => <li key={i}>{msg}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="md:col-span-3">
                            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                            <select id="customerId" name="customerId" value={formData.customerId} onChange={handleInputChange} className={`mt-1 block w-full input-field ${errors.customerId ? 'border-red-500' : ''}`}>
                                <option value="" disabled>Select a customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.accountNumber}</option>)}
                            </select>
                            {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                                <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleInputChange} className={`mt-1 block w-full input-field ${errors.issueDate ? 'border-red-500' : ''}`} />
                                {errors.issueDate && <p className="mt-1 text-xs text-red-500">{errors.issueDate}</p>}
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                                <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className={`mt-1 block w-full input-field ${errors.dueDate ? 'border-red-500' : ''}`} />
                                {errors.dueDate && <p className="mt-1 text-xs text-red-500">{errors.dueDate}</p>}
                            </div>
                        </div>
                        {isEditMode && (
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full input-field">
                                    <option value="Due">Due</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </div>
                        )}
                    </div>
                );
            case 2:
                 return (
                    <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <div className="col-span-5">Description</div>
                            <div className="col-span-2 text-right">Quantity</div>
                            <div className="col-span-2 text-right">Unit Price</div>
                            <div className="col-span-2 text-right">Total (KES)</div>
                            <div className="col-span-1"></div> {/* For action button column */}
                        </div>
                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start">
                                <div className="col-span-5">
                                    <input type="text" placeholder="e.g., Water Usage" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className={`w-full input-field text-sm ${errors.items?.[index]?.description ? 'border-red-500' : ''}`} />
                                     {errors.items?.[index]?.description && <p className="mt-1 text-xs text-red-500">{errors.items[index].description}</p>}
                                </div>
                                <div className="col-span-2">
                                    <input type="number" placeholder="Qty" min="0" step="any" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className={`w-full input-field text-sm text-right ${errors.items?.[index]?.quantity ? 'border-red-500' : ''}`} />
                                    {errors.items?.[index]?.quantity && <p className="mt-1 text-xs text-red-500">{errors.items[index].quantity}</p>}
                                </div>
                                <div className="col-span-2">
                                    <input type="number" placeholder="Price" min="0" step="any" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className={`w-full input-field text-sm text-right ${errors.items?.[index]?.unitPrice ? 'border-red-500' : ''}`} />
                                    {errors.items?.[index]?.unitPrice && <p className="mt-1 text-xs text-red-500">{errors.items[index].unitPrice}</p>}
                                </div>
                                <div className="col-span-2 flex items-center justify-end text-sm pt-2 text-gray-800 dark:text-gray-200 font-medium">
                                    {(() => {
                                        const quantity = Number(item.quantity);
                                        const unitPrice = Number(item.unitPrice);
                                        const total = (isNaN(quantity) || isNaN(unitPrice)) ? 0 : quantity * unitPrice;
                                        return total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}
                                </div>
                                <div className="col-span-1 flex items-center justify-center pt-1">
                                    <button type="button" onClick={() => removeItem(index)} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {errors.items && typeof errors.items === 'string' && <p className="mt-1 text-xs text-red-500">{errors.items}</p>}
                        <button type="button" onClick={addItem} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 pt-2">
                            <PlusIcon className="w-4 h-4 mr-1" /> Add Item
                        </button>
                    </div>
                );
            case 3:
                const selectedCustomer = customers.find(c => c.id === formData.customerId);
                return (
                     <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold">Review Invoice Details</h4>
                            <p className="text-sm text-gray-500">Please confirm the details below before saving.</p>
                        </div>
                        <div className="p-4 border rounded-lg dark:border-gray-600 space-y-2">
                            <div className="flex justify-between"><span className="text-gray-500">Customer:</span> <span className="font-medium">{selectedCustomer?.name}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">Account:</span> <span className="font-medium">{selectedCustomer?.accountNumber}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Issue Date:</span> <span className="font-medium">{formData.issueDate}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Due Date:</span> <span className="font-medium">{formData.dueDate}</span></div>
                            {isEditMode && <div className="flex justify-between"><span className="text-gray-500">Status:</span> <span className="font-medium">{formData.status}</span></div>}
                        </div>
                        <div className="border rounded-lg dark:border-gray-600 divide-y dark:divide-gray-600">
                             {formData.items.map((item, index) => (
                                <div key={index} className="p-3 flex justify-between text-sm">
                                    <span>{item.description} ({item.quantity} @ {Number(item.unitPrice).toFixed(2)})</span>
                                    <span className="font-medium">{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                                </div>
                             ))}
                        </div>
                     </div>
                );
            default: return null;
        }
    }

    return (
        <Modal
            title={isEditMode ? `Edit Invoice ${invoiceToEdit?.id}` : 'Create New Invoice'}
            onClose={onCancel}
        >
            <div className="p-6">
                <Stepper steps={STEPS} currentStep={currentStep} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {renderErrorSummary()}
                {renderStepContent()}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <div className="w-full md:w-1/3 space-y-1">
                            <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{subtotal.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total Due</span>
                            <span>{total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        {currentStep > 1 && <button type="button" onClick={handleBack} className="secondary-button">Back</button>}
                        {currentStep < STEPS.length && <button type="button" onClick={handleNext} className="primary-button">Next</button>}
                        {currentStep === STEPS.length && <button type="button" onClick={handleSubmit} className="primary-button">{isEditMode ? 'Update Invoice' : 'Save Invoice'}</button>}
                    </div>
                </div>
            </div>
            <style>{`
                .input-field { padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
                .dark .input-field { background-color: #374151; border-color: #4b5563; }
                .input-field:focus { outline: none; --tw-ring-color: #3b82f6; box-shadow: 0 0 0 2px var(--tw-ring-color); border-color: #3b82f6; }
                .input-field.border-red-500 { border-color: #ef4444; }
                .primary-button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed; }
                .secondary-button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600; }
            `}</style>
        </Modal>
    );
};

export default CreateInvoiceForm;
