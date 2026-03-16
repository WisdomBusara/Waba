import React from 'react';
import { RecentPayment } from '../types';
import { ChevronsUpDownIcon, ChevronUpIcon, ChevronDownIcon, DownloadIcon } from './icons';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReceiptTemplate from './pdf/ReceiptTemplate';

type SortConfig = {
    key: keyof RecentPayment;
    direction: string;
} | null;

interface PaymentsTableProps {
    payments: RecentPayment[];
    onSort: (key: keyof RecentPayment) => void;
    sortConfig: SortConfig;
}

const SortableHeader: React.FC<{
    columnKey: keyof RecentPayment;
    label: string;
    onSort: (key: keyof RecentPayment) => void;
    sortConfig: SortConfig;
    className?: string;
}> = ({ columnKey, label, onSort, sortConfig, className = '' }) => {
    const isSorted = sortConfig?.key === columnKey;
    const sortDirection = isSorted ? sortConfig.direction : null;

    const getIcon = () => {
        if (!isSorted) return <ChevronsUpDownIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
        if (sortDirection === 'ascending') return <ChevronUpIcon className="h-4 w-4 text-gray-800 dark:text-gray-200" />;
        return <ChevronDownIcon className="h-4 w-4 text-gray-800 dark:text-gray-200" />;
    };

    return (
        <th scope="col" className={`px-6 py-4 ${className}`}>
            <button onClick={() => onSort(columnKey)} className="group flex items-center space-x-2 w-full text-left">
                <span className="font-medium">{label}</span>
                {getIcon()}
            </button>
        </th>
    );
};

const PaymentMethodBadge: React.FC<{ method: RecentPayment['method'] }> = ({ method }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    let specificClasses = "";
    switch (method) {
        case 'M-Pesa': specificClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"; break;
        case 'Bank': specificClasses = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"; break;
        case 'Cash': specificClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"; break;
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{method}</span>
}


const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, onSort, sortConfig }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-800 dark:text-slate-300">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                        <SortableHeader columnKey="date" label="Date" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="customerName" label="Customer" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="invoiceId" label="Invoice ID" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="method" label="Method" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="amount" label="Amount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                        <th scope="col" className="px-6 py-4 font-medium text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {payments.length > 0 ? (
                        payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{payment.date}</td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{payment.customerName}</td>
                                <td className="px-6 py-4 font-mono">{payment.invoiceId}</td>
                                <td className="px-6 py-4"><PaymentMethodBadge method={payment.method} /></td>
                                <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                                    {payment.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <PDFDownloadLink
                                      document={<ReceiptTemplate payment={payment} />}
                                      fileName={`Receipt-${payment.invoiceId}.pdf`}
                                      className="text-gray-400 hover:text-blue-500"
                                      title="Download Receipt"
                                    >
                                      {({ loading }) => (loading ? '...' : <DownloadIcon className="h-5 w-5 mx-auto" />)}
                                    </PDFDownloadLink>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                No payments found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PaymentsTable;