
import React, { useState, useEffect, useCallback } from 'react';
import { Meter, MeterReading, MeterStatusEvent, MeterStatus } from '../types';
import MeterList from './MeterList';
import MeterDetails from './MeterDetails';
import AddMeterForm from './AddMeterForm';
import { PlusIcon, UploadCloudIcon, SearchIcon, XIcon } from './icons';
import { ReadingFormData, AddMeterFormData, EditMeterFormData } from '../lib/schemas';
import MeterImportWizard from './MeterImportWizard';
import { fetchFromApi } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

interface MetersProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
    initialMeterId?: string | null;
}

const Meters: React.FC<MetersProps> = ({ showToast, initialMeterId }) => {
    const [meters, setMeters] = useState<Meter[]>([]);
    const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
    const [statusHistory, setStatusHistory] = useState<MeterStatusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAddingMeter, setIsAddingMeter] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [viewingMeter, setViewingMeter] = useState<Meter | null>(null);
    const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
    const [filterText, setFilterText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | MeterStatus>('all');
    const debouncedFilterText = useDebounce(filterText, 300);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ q: debouncedFilterText });
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            const data = await fetchFromApi(`meters?${params.toString()}`);
            const fetchedMeters = data?.meters ?? [];
            setMeters(fetchedMeters);
            setMeterReadings(data?.readings ?? []);
            setStatusHistory(data?.history ?? []);
            setError(null);

            // Handle pre-selection from navigation params
            if (initialMeterId) {
                const targetMeter = fetchedMeters.find((m: Meter) => m.id === initialMeterId);
                if (targetMeter) setViewingMeter(targetMeter);
            }

        } catch (err: any) {
            setError('Failed to load meter data. Please ensure the API server is running.');
            showToast(err.message || 'Failed to fetch meter data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [debouncedFilterText, statusFilter, showToast, initialMeterId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleSaveMeter = async (data: AddMeterFormData | EditMeterFormData, id?: string) => {
        try {
            if (id) { // Editing
                await fetchFromApi(`meters/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                showToast('Meter updated successfully!', 'success');
            } else { // Adding
                await fetchFromApi('meters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                showToast('Meter added successfully!', 'success');
            }
            setIsAddingMeter(false);
            setEditingMeter(null);
            fetchData(); // Refresh list
        } catch (err: any) {
             showToast(err.message || 'Failed to save meter.', 'error');
        }
    };

    const handleUpdateMeterStatus = async (updatedMeter: Meter) => {
        try {
            await fetchFromApi(`meters/${updatedMeter.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: updatedMeter.status }),
            });
            showToast('Meter status updated!', 'success');
            if (viewingMeter?.id === updatedMeter.id) {
                setViewingMeter(updatedMeter);
            }
            fetchData(); // Refresh list
        } catch (err: any) {
            showToast(err.message || 'Failed to update status.', 'error');
        }
    };
    
    const handleEdit = (meter: Meter) => {
        setViewingMeter(null);
        setEditingMeter(meter);
    };

    const handleCancelForm = () => {
        setIsAddingMeter(false);
        setEditingMeter(null);
    };

    const handleAddReading = async (meterId: string, data: ReadingFormData) => {
        try {
            await fetchFromApi(`meters/${meterId}/readings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            showToast('Reading added successfully!', 'success');
            fetchData(); // Refresh data to show new reading
        } catch (err: any) {
            showToast(err.message || 'Failed to add reading.', 'error');
        }
    };

    const handleImportMeters = (importedData: AddMeterFormData[]) => {
        // This should be a single backend endpoint for bulk insertion
        console.log("Importing:", importedData);
        // Simulate API call
        Promise.all(importedData.map(meter => handleSaveMeter(meter)))
            .then(() => {
                showToast(`${importedData.length} meters imported successfully!`, 'success');
                setIsImporting(false);
                fetchData();
            })
            .catch(() => {
                 showToast('An error occurred during import.', 'error');
            });
    };
    
    if (isAddingMeter || editingMeter) {
        return <AddMeterForm onSave={handleSaveMeter} onCancel={handleCancelForm} meterToEdit={editingMeter} showToast={showToast} />;
    }
    
    if (isImporting) {
        return <MeterImportWizard onComplete={handleImportMeters} onCancel={() => setIsImporting(false)} />;
    }

    return (
        <div className="relative">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Meters & Readings</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage all installed and available meters.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setIsImporting(true)}
                            className="flex items-center bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <UploadCloudIcon className="h-5 w-5 mr-2" />
                            Import
                        </button>
                        <button 
                            onClick={() => setIsAddingMeter(true)}
                            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Meter
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter by Serial or Account..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-8 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {filterText && (
                            <button onClick={() => setFilterText('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Clear search">
                                <XIcon className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"/>
                            </button>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                         <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | MeterStatus)}
                            className="w-full md:w-56 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Filter by meter status"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Needs Maintenance">Needs Maintenance</option>
                        </select>
                    </div>
                </div>

                 {loading ? (
                    <div className="text-center py-10">Loading meters...</div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                ) : (
                    <MeterList meters={meters} onSelectMeter={setViewingMeter} selectedMeterId={viewingMeter?.id} />
                )}
            </div>
            {viewingMeter && (
                <MeterDetails
                    meter={viewingMeter}
                    readings={meterReadings.filter(r => r.meterId === viewingMeter.id)}
                    statusHistory={statusHistory.filter(h => h.meterId === viewingMeter.id)}
                    onUpdateMeter={handleUpdateMeterStatus}
                    onAddReading={handleAddReading}
                    onClose={() => setViewingMeter(null)}
                    onEdit={handleEdit}
                />
            )}
        </div>
    );
};

export default Meters;
