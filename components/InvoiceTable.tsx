import React from 'react';
import { Invoice } from '../types';
import { ChevronsUpDownIcon, ChevronUpIcon, ChevronDownIcon, FileTextIcon, PlusIcon } from './icons';
import InvoiceStatusBadge from './InvoiceStatusBadge';

type SortConfig = {
    key: keyof Invoice;
    direction: string;
} | null;

interface InvoiceTableProps {
    invoices: Invoice[];
    onViewInvoice: (invoice: Invoice) => void;
    onSort: (key: keyof Invoice) => void;
    sortConfig: SortConfig;
    onCreateInvoice: () => void;
}

const SortableHeader: React.FC<{
    columnKey: keyof Invoice;
    label: string;
    onSort: (key: keyof Invoice) => void;
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

    const buttonAlignmentClass = className.includes('text-right') ? 'justify-end' : 'justify-start';

    return (
        <th scope="col" className={`px-6 py-4 ${className}`}>
            <button onClick={() => onSort(columnKey)} className={`group flex items-center space-x-2 w-full ${buttonAlignmentClass}`}>
                <span className="font-medium">{label}</span>
                {getIcon()}
            </button>
        </th>
    );
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onViewInvoice, onSort, sortConfig, onCreateInvoice }) => {
    const renderInvoiceId = (id: string) => {
        if (!id) return '';
        const parts = id.split('-');
        if (parts.length === 3) {
            const prefix = `${parts[0]}-${parts[1]}-`;
            const number = parts[2];
            return (
                <>
                    <span className="text-gray-400 dark:text-gray-500">{prefix}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{number}</span>
                </>
            );
        }
        return id;
    };
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-800 dark:text-slate-300">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                        <SortableHeader columnKey="id" label="Invoice ID" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="customerName" label="Customer" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="issueDate" label="Issued" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="dueDate" label="Due" onSort={onSort} sortConfig={sortConfig} />
                        <SortableHeader columnKey="total" label="Amount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                        <SortableHeader columnKey="status" label="Status" onSort={onSort} sortConfig={sortConfig} />
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <tr
                                key={invoice.id}
                                onClick={() => onViewInvoice(invoice)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono font-medium">{renderInvoiceId(invoice.id)}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900 dark:text-white">{invoice.customerName}</div>
                                    <div className="text-xs text-gray-500">{invoice.customerAccount}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{invoice.issueDate}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{invoice.dueDate}</td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                                    {invoice.total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                </td>
                                <td className="px-6 py-4">
                                    <InvoiceStatusBadge status={invoice.status} />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6}>
                                <div className="text-center py-16 px-6">
                                    <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No invoices found</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new invoice.</p>
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            onClick={onCreateInvoice}
                                            className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                        >
                                            <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
                                            Create New Invoice
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default InvoiceTable;