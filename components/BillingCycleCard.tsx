
import React, { useState, useEffect, useRef } from 'react';
import { BillingSettings } from '../types';

interface BillingCycleCardProps {
    settings: BillingSettings;
    onSave: (newSettings: BillingSettings) => Promise<boolean>;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const BillingCycleCard: React.FC<BillingCycleCardProps> = ({ settings, onSave, showToast }) => {
    const [formState, setFormState] = useState<BillingSettings>(settings);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const isInitialMount = useRef(true);

    useEffect(() => {
        setFormState(settings);
    }, [settings]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const hasChanged = JSON.stringify(formState) !== JSON.stringify(settings);
        if (!hasChanged) {
            return;
        }

        setAutoSaveStatus('saving');
        const timer = setTimeout(async () => {
            const success = await onSave(formState);
            if (success) {
                setAutoSaveStatus('saved');
                showToast('Billing settings saved automatically.', 'success');
                setTimeout(() => setAutoSaveStatus('idle'), 2000);
            } else {
                setAutoSaveStatus('idle');
                showToast('Failed to save settings.', 'error');
            }
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [formState, settings, onSave, showToast]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: name === 'frequency' ? value : Number(value),
        }));
    };

    const getStatusIndicator = () => {
        switch (autoSaveStatus) {
            case 'saving':
                return <span className="text-yellow-500">Saving...</span>;
            case 'saved':
                return <span className="text-green-500">✓ All changes saved</span>;
            default:
                return null;
        }
    };

    const dayOptions = Array.from(
        { length: formState.frequency === 'bi-monthly' ? 14 : 28 }, 
        (_, i) => i + 1
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Billing Cycle</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure how and when invoices are generated. Changes save automatically.
                    </p>
                </div>
                <div className="text-sm italic min-w-[150px] text-right">
                    {getStatusIndicator()}
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <label htmlFor="frequency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Frequency
                    </label>
                    <div className="sm:col-span-2">
                        <select
                            id="frequency"
                            name="frequency"
                            value={formState.frequency}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="bi-monthly">Bi-Monthly</option>
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <label htmlFor="generationDay" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Invoice Generation Day
                    </label>
                    <div className="sm:col-span-2">
                         <select
                            id="generationDay"
                            name="generationDay"
                            value={formState.generationDay}
                            onChange={handleChange}
                             className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            {dayOptions.map(day => <option key={day} value={day}>{day}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <label htmlFor="readingCutoffDays" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        Reading Cut-off
                        <span className="group relative flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs cursor-help">
                            ?
                            <span className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                Days before invoice generation to finalize readings
                            </span>
                        </span>
                    </label>
                    <div className="sm:col-span-2">
                         <input
                            type="number"
                            id="readingCutoffDays"
                            name="readingCutoffDays"
                            value={formState.readingCutoffDays}
                            onChange={handleChange}
                            min="0"
                            max="15"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingCycleCard;
