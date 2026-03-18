
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Invoice, Customer, CreateInvoiceFormData, InvoiceStatus } from '../types';
import { SearchIcon, DownloadIcon, XIcon, FileTextIcon, ZapIcon } from './icons';
import InvoiceTable from './InvoiceTable';
import InvoiceDetails from './InvoiceDetails';
import PaginationControls from './PaginationControls';
import CreateInvoiceForm from './CreateInvoiceForm';
import BulkBillingWizard from './BulkBillingWizard';
import { fetchFromApi } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import ConfirmModal from './ui/ConfirmModal';

interface InvoicesProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const ITEMS_PER_PAGE = 10;
type SortConfig = {
    key: keyof Invoice;
    direction: 'ascending' | 'descending';
} | null;

const Invoices: React.FC<InvoicesProps> = ({ showToast }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [isBulkBilling, setIsBulkBilling] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<Invoice | null>(null);
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issueDate', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const debouncedFilterText = useDebounce(filterText, 300);

    const fetchInvoices = useCallback(async () => {
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
            const data = await fetchFromApi(`invoices?${params.toString()}`);
            setInvoices(data?.invoices ?? []);
            setTotalItems(data?.totalItems ?? 0);
            setError(null);
        } catch (err: unknown) {
            setError('Failed to load invoices. Please ensure the API server is running.');
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedFilterText, sortConfig, showToast]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);
    
    // Fetch customers for the create/edit invoice form
    useEffect(() => {
        const fetchCustomers = async () => {
             try {
                // Fetch all customers for the dropdown to avoid re-fetching
                const data = await fetchFromApi('customers?limit=1000');
                setCustomers(data.customers);
            } catch (err: unknown) {
                showToast('Could not fetch customers for the invoice form.', 'error');
                console.error("Could not fetch customers for form", err);
            }
        };
        // Fetch customers only if the form is open and the list is empty
        if ((isCreatingInvoice || editingInvoice) && customers.length === 0) {
            fetchCustomers();
        }
    }, [isCreatingInvoice, editingInvoice, customers.length, showToast]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedFilterText, sortConfig]);

    const handleSaveInvoice = async (data: CreateInvoiceFormData & { status: InvoiceStatus }, id?: string) => {
        try {
            const endpoint = id ? `invoices/${id}` : 'invoices';
            const method = id ? 'PUT' : 'POST';
            await fetchFromApi(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            showToast(`Invoice ${id ? 'updated' : 'created'} successfully!`, 'success');
            setIsCreatingInvoice(false);
            setEditingInvoice(null);
            fetchInvoices(); // Refresh data
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : `Failed to ${id ? 'update' : 'create'} invoice.`;
            showToast(message, 'error');
        }
    };

    const handleEditInvoice = (invoice: Invoice) => {
        setViewingInvoice(null);
        setEditingInvoice(invoice);
    };

    const handleMarkAsPaid = async () => {
        if (!invoiceToMarkPaid) return;
        try {
            await fetchFromApi(`invoices/${invoiceToMarkPaid.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'Manual' }),
            });
            showToast(`Invoice ${invoiceToMarkPaid.id} marked as paid.`, 'success');
            setViewingInvoice(null);
            fetchInvoices();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to mark invoice as paid.';
            showToast(message, 'error');
        } finally {
            setInvoiceToMarkPaid(null);
        }
    };
    
    const handleViewInvoice = async (invoice: Invoice) => {
        try {
            const data = await fetchFromApi(`invoices/${invoice.id}`);
            if (data && data.invoice) {
                setViewingInvoice({
                    ...data.invoice,
                    items: data.items || []
                });
            } else {
                setViewingInvoice(invoice);
            }
        } catch (err) {
            console.error("Failed to fetch full invoice details", err);
            setViewingInvoice(invoice); // Fallback to partial invoice
        }
    };

    const handleSort = (key: keyof Invoice) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleExportCSV = () => {
        showToast('CSV export should be handled by the backend.', 'success');
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="relative">
             <Card>
                <CardHeader>
                     <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                        <div>
                           <CardTitle>Invoice Management</CardTitle>
                           <CardDescription>View, create, and manage all customer invoices.</CardDescription>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Button variant="outline" onClick={() => setIsBulkBilling(true)}>
                                <ZapIcon className="h-4 w-4 mr-2" />
                                Bulk Generate
                            </Button>
                            <Button variant="primary" onClick={() => setIsCreatingInvoice(true)}>
                                <FileTextIcon className="h-4 w-4 mr-2" />
                                Create Invoice
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by Invoice ID, Customer Name, or Account No..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="pl-10"
                                aria-label="Search invoices"
                            />
                            {filterText && (
                                <button
                                    onClick={() => setFilterText('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                    aria-label="Clear search"
                                >
                                    <XIcon className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                                </button>
                            )}
                        </div>
                    </div>
                    {loading ? (
                        <div className="text-center py-10">Loading invoices...</div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">{error}</div>
                    ) : (
                        <>
                            <InvoiceTable
                                invoices={invoices}
                                onViewInvoice={handleViewInvoice}
                                onSort={handleSort}
                                sortConfig={sortConfig}
                                onCreateInvoice={() => setIsCreatingInvoice(true)}
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
                </CardContent>
            </Card>
            
            {(isCreatingInvoice || editingInvoice) && (
                <CreateInvoiceForm
                    customers={customers}
                    onSave={handleSaveInvoice}
                    onCancel={() => {
                        setIsCreatingInvoice(false);
                        setEditingInvoice(null);
                    }}
                    showToast={showToast}
                    invoiceToEdit={editingInvoice}
                />
            )}

            {isBulkBilling && (
                <BulkBillingWizard 
                    onClose={() => setIsBulkBilling(false)}
                    onComplete={() => {
                        setIsBulkBilling(false);
                        fetchInvoices();
                    }}
                    showToast={showToast}
                />
            )}

            {viewingInvoice && (
                <InvoiceDetails 
                    invoice={viewingInvoice} 
                    onClose={() => setViewingInvoice(null)}
                    onEdit={handleEditInvoice}
                    onMarkAsPaid={setInvoiceToMarkPaid}
                />
            )}

            {invoiceToMarkPaid && (
                <ConfirmModal
                    title="Mark Invoice as Paid"
                    message={`Are you sure you want to mark invoice ${invoiceToMarkPaid.id} as paid for ${invoiceToMarkPaid.total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}?`}
                    onConfirm={handleMarkAsPaid}
                    onCancel={() => setInvoiceToMarkPaid(null)}
                    confirmText="Mark as Paid"
                />
            )}
        </div>
    );
};

export default Invoices;
