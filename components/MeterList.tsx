import React from 'react';
import { Meter } from '../types';
import { ChevronRightIcon } from './icons';
import StatusBadge from './StatusBadge';


interface MeterListProps {
    meters: Meter[];
    onSelectMeter: (meter: Meter) => void;
    selectedMeterId?: string;
}

const MeterList: React.FC<MeterListProps> = ({ meters, onSelectMeter, selectedMeterId }) => {
    if (meters.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No meters found.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search query.</p>
            </div>
        );
    }
    
    return (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {meters.map(meter => (
                <li key={meter.id}>
                    <button 
                        onClick={() => onSelectMeter(meter)}
                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedMeterId === meter.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{meter.serialNumber}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {meter.customerAccount || 'Unassigned'}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <StatusBadge status={meter.status} />
                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default MeterList;