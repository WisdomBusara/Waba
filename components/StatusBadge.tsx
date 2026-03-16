import React from 'react';
import { MeterStatus } from '../types';

interface StatusBadgeProps {
  status: MeterStatus;
  large?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, large = false }) => {
    const baseClasses = "font-semibold rounded-full inline-flex items-center";
    const sizeClasses = large ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
    let specificClasses = "";
    let dotClasses = "w-2 h-2 rounded-full mr-2";

    switch (status) {
        case 'Active':
            specificClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            dotClasses += " bg-green-500";
            break;
        case 'Needs Maintenance':
            specificClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            dotClasses += " bg-yellow-500";
            break;
        case 'Inactive':
            specificClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
            dotClasses += " bg-gray-500";
            break;
    }
    return (
        <span className={`${baseClasses} ${sizeClasses} ${specificClasses}`}>
            <span className={dotClasses}></span>
            {status}
        </span>
    )
}

export default StatusBadge;
