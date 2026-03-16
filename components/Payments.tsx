
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RecentPayment, Customer, Invoice } from '../types';
import { SearchIcon, DownloadIcon, XIcon, CreditCardIcon } from './icons';
import PaymentsTable from './PaymentsTable';
import PaginationControls from './PaginationControls';
import RecordPaymentForm from './RecordPaymentForm';
import { RecordPaymentFormData } from '../lib/schemas';
import { fetchFromApi } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

const ITEMS_PER_PAGE = 10;

type SortConfig = {
    key: keyof RecentPayment;
    direction: 'ascending' | 'descending';
} | null;


const Payments: React.FC<{ showToast: (message: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [payments, setPayments] = useState<RecentPayment[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isRecordingPayment, setIsRecordingPayment] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);

    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const debouncedFilterText = useDebounce(filterText, 300);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: String(ITEMS_PER_PAGE),
                q: debouncedFilterText,
            });
            if (sortConfig) {
                params.append('sortKey', sortConfig.key);
                params.append('sortDir', sortConfig.direction);
            }
            const data = await fetchFromApi(`payments?${params.toString()}`);
            setPayments(data?.payments ?? []);
            setTotalItems(data?.totalItems ?? 0);
            setError(null);
        } catch (err: any) {
            setError('Failed to load payments. Please ensure the API server is running.');
            showToast(err.message || 'Failed to fetch payments.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedFilterText, sortConfig, showToast]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);
    
    useEffect(() => {
        // Fetch data needed for the payment form when it's opened
        const fetchFormData = async () => {
            if (isRecordingPayment) {
                try {
                    // Fetch all customers for the dropdown
                    const customerData = await fetchFromApi('customers?limit=1000');
                    setCustomers(customerData.customers);
                    
                    // Fetch all unpaid invoices
                    const invoiceData = await fetchFromApi('invoices?limit=all&status=Due,Overdue');
                    setUnpaidInvoices(invoiceData.invoices);
                } catch (err) {
                    showToast('Could not fetch data for the payment form.', 'error');
                    setIsRecordingPayment(false); // Close form if data fails
                }
            }
        };
        fetchFormData();
    }, [isRecordingPayment, showToast]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedFilterText, sortConfig]);

    const handleSort = (key: keyof RecentPayment) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleExportCSV = () => {
        showToast('CSV export should be handled by the backend for all results.', 'success');
    };
    
    const handleSavePayment = async (data: RecordPaymentFormData) => {
        try {
            await fetchFromApi('payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            showToast('Payment recorded successfully!', 'success');
            setIsRecordingPayment(false);
            fetchPayments(); // Refresh payments list
        } catch (err: any) {
            showToast(err.message || 'Failed to record payment.', 'error');
        }
    };
    
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View, search, and manage all customer payments.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleExportCSV} className="secondary-button">
                            <DownloadIcon className="h-5 w-5 mr-2" />
                            Export
                        </button>
                        <button className="primary-button" onClick={() => setIsRecordingPayment(true)}>
                            <CreditCardIcon className="h-5 w-5 mr-2" />
                            Record Payment
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Customer Name or Invoice ID..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-8 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {filterText && (
                            <button onClick={() => setFilterText('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Clear search">
                                <XIcon className="h-4 w-4 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>
                {loading ? (
                    <div className="text-center py-10">Loading payments...</div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                ) : (
                    <>
                        <PaymentsTable
                            payments={payments}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                        />
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                <style>{`
                    .primary-button { display: flex; align-items: center; background-color: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s; }
                    .primary-button:hover { background-color: #2563eb; }
                    .secondary-button { display: flex; align-items: center; background-color: #f3f4f6; color: #374151; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s; }
                    .dark .secondary-button { background-color: #374151; color: #d1d5db; }
                    .dark .secondary-button:hover { background-color: #4b5563; }
                `}</style>
            </div>
            {isRecordingPayment && (
                <RecordPaymentForm
                    customers={customers}
                    unpaidInvoices={unpaidInvoices}
                    onSave={handleSavePayment}
                    onCancel={() => setIsRecordingPayment(false)}
                    showToast={showToast}
                />
            )}
        </>
    );
};

export default Payments;