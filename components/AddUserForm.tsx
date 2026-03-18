
import React, { useState, useMemo, useEffect } from 'react';
import { userSchema, UserFormData } from '../lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import Modal from './ui/Modal';
import { User } from '../types';

interface UserFormProps {
    onSave: (data: UserFormData & { status?: string }) => void;
    onCancel: () => void;
    userToEdit?: User | null;
}

const UserForm: React.FC<UserFormProps> = ({ onSave, onCancel, userToEdit }) => {
    const isEditMode = !!userToEdit;
    const [formData, setFormData] = useState<UserFormData & { status?: string }>({
        name: '',
        email: '',
        role: 'Agent',
        status: 'Active'
    });
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name,
                email: userToEdit.email,
                role: userToEdit.role as any,
                status: userToEdit.status
            });
        }
    }, [userToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = userSchema.safeParse(formData);
        if (!result.success) {
            const newErrors: { [key: string]: string } = {};
            result.error.issues.forEach(issue => {
                if (typeof issue.path[0] === 'string') {
                    newErrors[issue.path[0]] = issue.message;
                }
            });
            setErrors(newErrors);
        } else {
            onSave({ ...result.data, status: formData.status });
        }
    };

    const isFormValid = useMemo(() => userSchema.safeParse(formData).success, [formData]);

    return (
        <Modal title={isEditMode ? "Edit System User" : "Create System User"} onClose={onCancel} className="max-w-md">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <Input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
                        <Input 
                            type="email" 
                            name="email" 
                            id="email" 
                            value={formData.email} 
                            onChange={handleChange}
                            placeholder="john@splashdash.co.ke"
                            className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Access Role</label>
                        <select 
                            id="role" 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <option value="Admin">Administrator (Full Access)</option>
                            <option value="Manager">Manager (Reports & Billing)</option>
                            <option value="Agent">Agent (Meter Readings Only)</option>
                        </select>
                        <p className="mt-2 text-[10px] text-slate-500">Role defines the level of system features the user can access.</p>
                    </div>

                    {isEditMode && (
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                            <select 
                                id="status" 
                                name="status" 
                                value={formData.status} 
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={!isFormValid}>{isEditMode ? 'Update Account' : 'Create Account'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default UserForm;
