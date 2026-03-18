import React, { useState } from 'react';
import { Meter, MeterReading, MeterStatus, MeterStatusEvent } from '../types';
import StatusBadge from './StatusBadge';
import { WrenchIcon, PlusIcon, EditIcon, ChevronRightIcon, CheckCircleIcon } from './icons';
import AddReadingForm from './AddReadingForm';
import { ReadingFormData } from '../lib/schemas';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './ui/Sheet';
import { Button } from './ui/Button';

interface MeterDetailsProps {
    meter: Meter;
    readings: MeterReading[];
    statusHistory: MeterStatusEvent[];
    onUpdateMeter: (meter: Meter) => void;
    onAddReading: (meterId: string, data: ReadingFormData) => void;
    onClose: () => void;
    onEdit: (meter: Meter) => void;
}

const DetailItem: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-medium text-slate-800 dark:text-slate-200">{value || 'N/A'}</p>
    </div>
);

const MeterDetails: React.FC<MeterDetailsProps> = ({ meter, readings, statusHistory, onUpdateMeter, onAddReading, onClose, onEdit }) => {
    const [isAddingReading, setIsAddingReading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    const handleStatusChange = (newStatus: MeterStatus) => {
        onUpdateMeter({ ...meter, status: newStatus });
    }

    const handleSaveReading = (data: ReadingFormData) => {
        onAddReading(meter.id, data);
        setIsAddingReading(false);
    };

    const sortedReadings = readings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastReading = sortedReadings.length > 0 ? sortedReadings[0].reading : 0;

    return (
        <Sheet open={true} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{meter.serialNumber}</SheetTitle>
                    <SheetDescription>
                        <StatusBadge status={meter.status} />
                    </SheetDescription>
                </SheetHeader>

                <div className="my-4 border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-4 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`${activeTab === 'details' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`${activeTab === 'history' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            History
                        </button>
                    </nav>
                </div>
                
                <div className="flex-1 px-6 py-2 overflow-y-auto">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Meter Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Assigned Customer" value={meter.customerAccount} />
                                <DetailItem label="Installation Date" value={meter.installationDate} />
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Actions</p>
                                    {meter.status === 'Needs Maintenance' ? (
                                        <button
                                            onClick={() => handleStatusChange('Active')}
                                            className="flex items-center text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-medium"
                                        >
                                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                                            Mark as Active
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStatusChange('Needs Maintenance')}
                                            className="flex items-center text-sm text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 font-medium"
                                        >
                                            <WrenchIcon className="h-4 w-4 mr-2" />
                                            Mark for Maintenance
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Reading History</h4>
                                    {!isAddingReading && (
                                        <button
                                            onClick={() => setIsAddingReading(true)}
                                            className="flex items-center bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            Add Reading
                                        </button>
                                    )}
                                </div>
                                
                                {isAddingReading && (
                                    <AddReadingForm 
                                        onSave={handleSaveReading} 
                                        onCancel={() => setIsAddingReading(false)}
                                        lastReading={lastReading}
                                    />
                                )}

                                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-96">
                                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">Date</th>
                                                <th scope="col" className="px-6 py-3 text-right">Reading (m³)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {sortedReadings.length > 0 ? (
                                                sortedReadings.map(reading => (
                                                <tr key={reading.id} className="bg-white dark:bg-slate-800">
                                                    <td className="px-6 py-4">{reading.date}</td>
                                                    <td className="px-6 py-4 text-right font-mono">{reading.reading.toLocaleString()}</td>
                                                </tr>
                                            ))) : (
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-4 text-center text-slate-500">
                                                        No readings found for this meter.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Status Change History</h4>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    {statusHistory.length > 0 ? (
                                        <ul className="space-y-3">
                                            {statusHistory.map(event => (
                                                <li key={event.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">{event.date}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <StatusBadge status={event.fromStatus} />
                                                        <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                                                        <StatusBadge status={event.toStatus} />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-slate-500 text-sm">
                                            No status changes recorded.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onEdit(meter)}>
                        <EditIcon className="w-4 h-4 mr-2" /> Edit Meter
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default MeterDetails;