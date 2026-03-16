import React, { useState, useMemo } from 'react';
import { RecentPayment } from '../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReceiptTemplate from './pdf/ReceiptTemplate';
import { DownloadIcon, ChevronsUpDownIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface RecentPaymentsProps {
  payments: RecentPayment[];
  setActiveView: (view: string) => void;
}

type SortConfig = {
    key: keyof RecentPayment;
    direction: 'ascending' | 'descending';
} | null;

const PaymentMethodBadge: React.FC<{ method: RecentPayment['method'] }> = ({ method }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    let specificClasses = "";

    switch (method) {
        case 'M-Pesa':
            specificClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            break;
        case 'Bank':
            specificClasses = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            break;
        case 'Cash':
            specificClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            break;
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{method}</span>
}


const RecentPayments: React.FC<RecentPaymentsProps> = ({ payments, setActiveView }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });

  const handleSort = (key: keyof RecentPayment) => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
      }
      setSortConfig({ key, direction });
  };

  const sortedPayments = useMemo(() => {
      let sortableItems = [...payments];
      if (sortConfig !== null) {
          sortableItems.sort((a, b) => {
              const aValue = a[sortConfig.key];
              const bValue = b[sortConfig.key];
              let comparison = 0;

              if (sortConfig.key === 'amount') {
                  comparison = (aValue as number) - (bValue as number);
              } else if (sortConfig.key === 'date') {
                  comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
              } else {
                  comparison = String(aValue).localeCompare(String(bValue));
              }
              
              return sortConfig.direction === 'ascending' ? comparison : -comparison;
          });
      }
      return sortableItems;
  }, [payments, sortConfig]);

  const SortableHeader: React.FC<{
      columnKey: keyof RecentPayment;
      label: string;
      className?: string;
  }> = ({ columnKey, label, className = '' }) => {
      const isSorted = sortConfig?.key === columnKey;
      const sortDirection = isSorted ? sortConfig.direction : null;

      const getIcon = () => {
          if (!isSorted) return <ChevronsUpDownIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
          if (sortDirection === 'ascending') return <ChevronUpIcon className="h-4 w-4" />;
          return <ChevronDownIcon className="h-4 w-4" />;
      };
      
      const buttonAlignmentClass = className.includes('text-right') ? 'justify-end' : 'justify-start';

      return (
          <th scope="col" className={`px-6 py-4 ${className}`}>
               <button onClick={() => handleSort(columnKey)} className={`group flex items-center space-x-2 w-full ${buttonAlignmentClass}`}>
                  <span className="font-medium">{label}</span>
                  {getIcon()}
              </button>
          </th>
      );
  };

  return (
    <Card>
      <CardHeader>
         <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions</CardTitle>
            <button onClick={() => setActiveView('Payments')} className="text-sm font-medium text-primary hover:underline">View All</button>
        </div>
      </CardHeader>
      <CardContent>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-800 dark:text-slate-300">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                        <SortableHeader columnKey="customerName" label="Customer" />
                        <SortableHeader columnKey="date" label="Date" />
                        <SortableHeader columnKey="amount" label="Amount" className="text-right" />
                        <th scope="col" className="px-6 py-4 font-medium">Method</th>
                        <th scope="col" className="px-6 py-4 font-medium text-center">Receipt</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {sortedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{payment.customerName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{payment.date}</td>
                        <td className="px-6 py-4 font-semibold text-right">KES {payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-4"><PaymentMethodBadge method={payment.method} /></td>
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
                    ))}
                </tbody>
            </table>
         </div>
      </CardContent>
    </Card>
  );
};

export default RecentPayments;