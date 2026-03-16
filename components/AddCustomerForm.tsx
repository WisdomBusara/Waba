import React, { useState, useEffect, useMemo } from 'react';
import { customerSchema, CustomerFormData } from '../lib/schemas';
import { Customer } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface CustomerFormProps {
    onSave: (data: CustomerFormData, id?: string) => void;
    onCancel: () => void;
    customerToEdit?: Customer | null;
}

type FormErrors = { [key: string]: string | undefined };

const AddCustomerForm: React.FC<CustomerFormProps> = ({ onSave, onCancel, customerToEdit }) => {
    const isEditMode = !!customerToEdit;
    
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        email: '',
        phone: '+254',
        address: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (isEditMode && customerToEdit) {
            setFormData({
                name: customerToEdit.name,
                email: customerToEdit.email,
                phone: customerToEdit.phone,
                address: customerToEdit.address,
            });
        }
    }, [customerToEdit, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = customerSchema.safeParse(formData);
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
            onSave(result.data, customerToEdit?.id);
        }
    };

    const isFormValid = useMemo(() => {
        return customerSchema.safeParse(formData).success;
    }, [formData]);

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>{isEditMode ? 'Edit Customer' : 'Create New Customer'}</CardTitle>
                <CardDescription>
                    {isEditMode ? `Update the details for ${customerToEdit?.name}.` : 'Enter the details below to add a new customer account.'}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <Input type="text" name="name" id="name" value={formData.name} onChange={handleChange}
                               className={`${errors.name ? 'border-red-500' : ''}`} />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <Input type="email" name="email" id="email" value={formData.email} onChange={handleChange}
                                  className={`${errors.email ? 'border-red-500' : ''}`} />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                            <Input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} placeholder="+254712345678"
                                  className={`${errors.phone ? 'border-red-500' : ''}`} />
                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
                        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3}
                                  className={`block w-full text-sm rounded-md border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.address ? 'border-red-500' : ''}`}></textarea>
                        {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={!isFormValid}>
                        {isEditMode ? 'Update Customer' : 'Save Customer'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default AddCustomerForm;
