import React, { useState, useEffect, useMemo } from 'react';
import { Meter } from '../types';
import { addMeterSchema, editMeterSchema, AddMeterFormData, EditMeterFormData } from '../lib/schemas';

interface MeterFormProps {
    onSave: (data: AddMeterFormData | EditMeterFormData, id?: string) => void;
    onCancel: () => void;
    meterToEdit?: Meter | null;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

type FormData = {
    serialNumber: string;
    customerAccount: string;
    installationDate: string;
    initialReading: number;
};

type FormErrors = { [K in keyof FormData]?: string };

const AddMeterForm: React.FC<MeterFormProps> = ({ onSave, onCancel, meterToEdit, showToast }) => {
    const isEditMode = !!meterToEdit;
    
    const [formData, setFormData] = useState<FormData>({
        serialNumber: '',
        customerAccount: '',
        installationDate: new Date().toISOString().split('T')[0],
        initialReading: 0,
    });
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (isEditMode && meterToEdit) {
            setFormData({
                serialNumber: meterToEdit.serialNumber,
                customerAccount: meterToEdit.customerAccount || '',
                installationDate: meterToEdit.installationDate,
                initialReading: 0, // Not used in edit mode, but part of state shape
            });
        }
    }, [meterToEdit, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name as keyof FormErrors]: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataToValidate = {
            ...formData,
            // Zod expects null for optional fields that are empty strings
            customerAccount: formData.customerAccount === '' ? null : formData.customerAccount,
        };
        
        const schema = isEditMode ? editMeterSchema : addMeterSchema;
        const result = schema.safeParse(dataToValidate);

        if (!result.success) {
            const newErrors: FormErrors = {};
            for (const issue of result.error.issues) {
                const path = issue.path[0] as keyof FormErrors;
                newErrors[path] = issue.message;
            }
            setErrors(newErrors);
            showToast('Please fix the errors in the form.', 'error');
        } else {
            setErrors({});
            onSave(result.data, meterToEdit?.id);
        }
    };

    const isFormValid = useMemo(() => {
        const dataToValidate = {
            ...formData,
            customerAccount: formData.customerAccount === '' ? null : formData.customerAccount,
        };
        const schema = isEditMode ? editMeterSchema : addMeterSchema;
        return schema.safeParse(dataToValidate).success;
    }, [formData, isEditMode]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Meter' : 'Add New Meter'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Serial Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="serialNumber"
                        id="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        className={`mt-1 block w-full input-field ${errors.serialNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.serialNumber && <p className="mt-1 text-xs text-red-500">{errors.serialNumber}</p>}
                </div>
                <div>
                    <label htmlFor="customerAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Customer Account (Optional)
                    </label>
                    <input
                        type="text"
                        name="customerAccount"
                        id="customerAccount"
                        value={formData.customerAccount}
                        onChange={handleChange}
                        placeholder="e.g., CUST-00123"
                        className={`mt-1 block w-full input-field ${errors.customerAccount ? 'border-red-500' : ''}`}
                    />
                    {errors.customerAccount && <p className="mt-1 text-xs text-red-500">{errors.customerAccount}</p>}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           Installation Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="installationDate"
                            id="installationDate"
                            value={formData.installationDate}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className={`mt-1 block w-full input-field ${errors.installationDate ? 'border-red-500' : ''}`}
                        />
                        {errors.installationDate && <p className="mt-1 text-xs text-red-500">{errors.installationDate}</p>}
                    </div>
                    {!isEditMode && (
                        <div>
                            <label htmlFor="initialReading" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                               Initial Reading (m³) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="initialReading"
                                id="initialReading"
                                value={formData.initialReading}
                                onChange={handleChange}
                                min="0"
                                className={`mt-1 block w-full input-field ${errors.initialReading ? 'border-red-500' : ''}`}
                            />
                            {errors.initialReading && <p className="mt-1 text-xs text-red-500">{errors.initialReading}</p>}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!isFormValid}
                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
                    >
                        {isEditMode ? 'Update Meter' : 'Save Meter'}
                    </button>
                </div>
            </form>
             <style>{`
                .input-field {
                    padding: 0.5rem 0.75rem;
                    background-color: white;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .dark .input-field {
                    background-color: #374151;
                    border-color: #4b5563;
                }
                .input-field:focus {
                    outline: none;
                    --tw-ring-color: #3b82f6;
                    box-shadow: 0 0 0 2px var(--tw-ring-color);
                    border-color: #3b82f6;
                }
                .input-field.border-red-500 {
                    border-color: #ef4444;
                }
                .input-field.border-red-500:focus {
                     --tw-ring-color: #ef4444;
                    border-color: #ef4444;
                }
            `}</style>
        </div>
    );
};

export default AddMeterForm;