
import React, { useState } from 'react';
import { readingSchema, ReadingFormData } from '../lib/schemas';

interface AddReadingFormProps {
    onSave: (data: ReadingFormData) => void;
    onCancel: () => void;
    lastReading?: number;
}

type FormErrors = { [key: string]: string | undefined };

const AddReadingForm: React.FC<AddReadingFormProps> = ({ onSave, onCancel, lastReading }) => {
    const [formData, setFormData] = useState<ReadingFormData>({
        reading: lastReading ?? 0,
        date: new Date().toISOString().split('T')[0],
    });
    const [errors, setErrors] = useState<FormErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationSchema = readingSchema.refine(data => data.reading >= (lastReading ?? 0), {
            message: `Reading must be >= last reading (${lastReading?.toLocaleString()}).`,
            path: ['reading'],
        });

        const result = validationSchema.safeParse(formData);

        if (!result.success) {
            const newErrors: FormErrors = {};
            for (const issue of result.error.issues) {
                const path = issue.path[0];
                if (typeof path === 'string') {
                    newErrors[path] = issue.message;
                }
            }
            setErrors(newErrors);
        } else {
            setErrors({});
            onSave(result.data);
        }
    };
    
    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 my-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h5 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Add New Reading</h5>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="reading" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reading (m³)</label>
                        <input
                            type="number"
                            name="reading"
                            id="reading"
                            value={formData.reading}
                            onChange={handleChange}
                            min={lastReading ?? 0}
                            step="any"
                            className={`mt-1 block w-full input-field ${errors.reading ? 'border-red-500' : ''}`}
                        />
                        {errors.reading && <p className="mt-1 text-xs text-red-500">{errors.reading}</p>}
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                        <input
                            type="date"
                            name="date"
                            id="date"
                            value={formData.date}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className={`mt-1 block w-full input-field ${errors.date ? 'border-red-500' : ''}`}
                        />
                         {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                        Cancel
                    </button>
                    <button type="submit" className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                        Save Reading
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
            `}</style>
        </div>
    );
};

export default AddReadingForm;