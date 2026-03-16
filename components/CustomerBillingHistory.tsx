
import React from 'react';
import { Invoice, RecentPayment } from '../types';
import { FileTextIcon, CreditCardIcon, ArrowRightLeftIcon } from './icons';
import InvoiceStatusBadge from './InvoiceStatusBadge';

interface CustomerBillingHistoryProps {
    invoices: Invoice[];
    payments: RecentPayment[];
}

const CustomerBillingHistory: React.FC<CustomerBillingHistoryProps> = ({ invoices, payments }) => {
    // Combine invoices and payments into a single timeline
    const historyItems = [
        ...invoices.map(inv => ({
            id: inv.id,
            date: inv.issueDate,
            type: 'invoice' as const,
            amount: inv.total,
            status: inv.status,
            description: `Invoice generated`
        })),
        ...payments.map(pay => ({
            id: pay.id,
            date: pay.date,
            type: 'payment' as const,
            amount: pay.amount,
            status: 'Paid',
            description: `Payment via ${pay.method} (Ref: ${pay.invoiceId})`
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (historyItems.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <ArrowRightLeftIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No billing activity recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyItems.map((item, idx) => (
                        <tr key={`${item.type}-${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                {item.date}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {item.type === 'invoice' ? (
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                            <FileTextIcon className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                    ) : (
                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                                            <CreditCardIcon className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                    )}
                                    <span className="capitalize font-medium">{item.type}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <p className="text-slate-900 dark:text-white font-medium">{item.description}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{item.id}</p>
                                </div>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${item.type === 'payment' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                                {item.type === 'payment' ? '-' : ''}KES {item.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {item.type === 'invoice' ? (
                                    <InvoiceStatusBadge status={item.status as any} />
                                ) : (
                                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                                        Processed
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CustomerBillingHistory;
