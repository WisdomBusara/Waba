
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFromApi } from '../lib/api';
import { XIcon, ZapIcon, AlertTriangleIcon, CheckCircleIcon, DropletIcon } from './icons';
import Stepper from './Stepper';
import Modal from './ui/Modal';
import { Button } from './ui/Button';

interface BulkBillingWizardProps {
    onClose: () => void;
    onComplete: () => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface BillableItem {
    customerId: string;
    name: string;
    accountNumber: string;
    address: string;
    meterId: string;
    serialNumber: string;
    currentReading: number;
    previousReading: number;
    consumption: number;
    total: number;
    isSelected: boolean;
}

const STEPS = ['Configuration', 'Preview Batch', 'Execution'];

const BulkBillingWizard: React.FC<BulkBillingWizardProps> = ({ onClose, onComplete, showToast }) => {
    const [step, setStep] = useState(1);
    const [billableItems, setBillableItems] = useState<BillableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const [config, setConfig] = useState({
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        unitPrice: 110,
    });

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const data = await fetchFromApi('invoices/bulk/preview');
            setBillableItems(data.map((item: any) => ({ ...item, isSelected: true })));
            setStep(2);
        } catch (err: any) {
            showToast(err.message || 'Failed to fetch billing preview.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRunBilling = async () => {
        const selected = billableItems.filter(item => item.isSelected);
        if (selected.length === 0) {
            showToast('No customers selected for billing.', 'error');
            return;
        }

        setStep(3);
        setProcessing(true);
        setProgress(10);

        try {
            // Simulated progress steps
            await new Promise(r => setTimeout(r, 800));
            setProgress(40);
            
            await fetchFromApi('invoices/bulk/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: selected,
                    issueDate: config.issueDate,
                    dueDate: config.dueDate,
                    unitPrice: config.unitPrice
                }),
            });

            setProgress(100);
            showToast(`Successfully generated ${selected.length} invoices.`, 'success');
            setTimeout(onComplete, 1000);
        } catch (err: any) {
            showToast(err.message || 'Bulk generation failed.', 'error');
            setProcessing(false);
        }
    };

    const toggleSelection = (index: number) => {
        const newItems = [...billableItems];
        newItems[index].isSelected = !newItems[index].isSelected;
        setBillableItems(newItems);
    };

    const totalSelected = billableItems.filter(i => i.isSelected).length;
    const totalAmount = billableItems.filter(i => i.isSelected).reduce((sum, i) => sum + i.total, 0);

    return (
        <Modal title="Bulk Billing Engine" onClose={onClose} className="max-w-4xl">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <Stepper steps={STEPS} currentStep={step} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 max-w-xl mx-auto py-8"
                        >
                            <div className="text-center space-y-2">
                                <ZapIcon className="w-12 h-12 text-blue-500 mx-auto" />
                                <h3 className="text-xl font-bold">Automated Billing Run</h3>
                                <p className="text-slate-500 text-sm">System will analyze latest meter readings against previous invoice dates to calculate consumption.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Billing Date</label>
                                    <input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="w-full input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                                    <input type="date" value={config.dueDate} onChange={e => setConfig({...config, dueDate: e.target.value})} className="w-full input-field" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Consumption Rate (KES per m³)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KES</span>
                                        <input type="number" value={config.unitPrice} onChange={e => setConfig({...config, unitPrice: Number(e.target.value)})} className="w-full input-field pl-12" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-full text-white">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-blue-900 dark:text-blue-100">{totalSelected} Customers Billable</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300">Total Projected Revenue: KES {totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setBillableItems(billableItems.map(i => ({...i, isSelected: true})))}>Select All</Button>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3 text-center">Bill?</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Meter</th>
                                            <th className="px-4 py-3 text-right">Consumption</th>
                                            <th className="px-4 py-3 text-right">Estimated Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                        {billableItems.map((item, idx) => (
                                            <tr key={item.customerId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${!item.isSelected && 'opacity-50'}`}>
                                                <td className="px-4 py-3 text-center">
                                                    <input type="checkbox" checked={item.isSelected} onChange={() => toggleSelection(idx)} className="rounded text-blue-600 focus:ring-blue-500" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-[10px] font-mono text-slate-400">{item.accountNumber}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <DropletIcon className="w-3 h-3 text-slate-400" />
                                                        <span className="font-mono text-xs">{item.serialNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold">
                                                    {item.consumption} m³
                                                    <p className="text-[10px] font-normal text-slate-400">Prev: {item.previousReading}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-blue-600">
                                                    KES {item.total.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 space-y-6"
                        >
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle className="text-slate-200 dark:text-slate-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                                    <circle className="text-blue-500 stroke-current transition-all duration-500" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * progress) / 100}></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">{progress}%</div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold">Generating Batch Invoices</h3>
                                <p className="text-sm text-slate-500">Creating records, calculating taxes, and preparing PDF manifests...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                <Button variant="ghost" onClick={onClose} disabled={processing}>Cancel</Button>
                <div className="flex gap-3">
                    {step === 2 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}
                    {step === 1 && (
                        <Button variant="primary" onClick={fetchPreview} disabled={loading}>
                            {loading ? 'Analyzing...' : 'Identify Billable Customers'}
                        </Button>
                    )}
                    {step === 2 && (
                        <Button variant="primary" onClick={handleRunBilling}>
                            Execute Generation ({totalSelected})
                        </Button>
                    )}
                </div>
            </div>

            <style>{`
                .input-field { 
                    display: block; width: 100%; border-radius: 0.5rem; border: 1px solid #cbd5e1; 
                    background-color: #f8fafc; padding: 0.5rem 0.75rem; font-size: 0.875rem; 
                }
                .dark .input-field { background-color: #1e293b; border-color: #475569; color: #fff; }
            `}</style>
        </Modal>
    );
};

export default BulkBillingWizard;
