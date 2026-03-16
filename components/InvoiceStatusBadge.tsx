
import React from 'react';
import { InvoiceStatus } from '../types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full inline-flex items-center";
    let specificClasses = "";
    let dotClasses = "w-2 h-2 rounded-full mr-2";

    switch (status) {
        case 'Paid':
            specificClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            dotClasses += " bg-green-500";
            break;
        case 'Overdue':
            specificClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            dotClasses += " bg-yellow-500";
            break;
        case 'Due':
            specificClasses = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            dotClasses += " bg-blue-500";
            break;
    }
    return (
        <span className={`${baseClasses} ${specificClasses}`}>
            <span className={dotClasses}></span>
            {status}
        </span>
    )
}

export default InvoiceStatusBadge;
