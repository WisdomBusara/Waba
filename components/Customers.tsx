
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Customer, CustomerFormData } from '../types';
import { UserPlusIcon, SearchIcon, DownloadIcon, XIcon } from './icons';
import AddCustomerForm from './AddCustomerForm';
import CustomerTable from './CustomerTable';
import CustomerProfile from './CustomerProfile';
import PaginationControls from './PaginationControls';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { fetchFromApi } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

const ITEMS_PER_PAGE = 10;

type SortConfig = {
    key: keyof Customer;
    direction: 'ascending' | 'descending';
} | null;

interface CustomersProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
    onNavigate: (view: string, params?: any) => void;
}

const Customers: React.FC<CustomersProps> = ({ showToast, onNavigate }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'joinDate', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);

    const debouncedFilterText = useDebounce(filterText, 300);

    const fetchCustomers = useCallback(async () => {
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
            const data = await fetchFromApi(`customers?${params.toString()}`);
            setCustomers(data?.customers ?? []);
            setTotalItems(data?.totalItems ?? 0);
            setError(null);
        } catch (err: any) {
            setError('Failed to load customers. Please ensure the API server is running.');
            showToast(err.message || 'Failed to fetch customers.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedFilterText, sortConfig, showToast]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedFilterText, sortConfig]);

    const handleSaveCustomer = async (data: CustomerFormData, id?: string) => {
        try {
            const endpoint = id ? `customers/${id}` : 'customers';
            const method = id ? 'PUT' : 'POST';
            await fetchFromApi(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            showToast(`Customer ${id ? 'updated' : 'added'} successfully!`, 'success');
            setIsAddingCustomer(false);
            setEditingCustomer(null);
            if (id) {
                // If editing, force a refresh of the profile view
                setSelectedCustomerId(null);
                setTimeout(() => setSelectedCustomerId(id), 0);
            }
            fetchCustomers(); // Refresh data
        } catch (err: any) {
            showToast(err.message || 'Failed to save customer.', 'error');
        }
    };
    
    const handleEdit = (customer: Customer) => {
        setSelectedCustomerId(null);
        setEditingCustomer(customer);
    };

    const handleCancelForm = () => {
        setIsAddingCustomer(false);
        setEditingCustomer(null);
        // If we were editing from the profile page, go back to it
        if (editingCustomer) {
            setSelectedCustomerId(editingCustomer.id);
        }
    };

    const handleSort = (key: keyof Customer) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleExportCSV = () => {
        showToast('CSV export should be handled by the backend for all results.', 'success');
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (selectedCustomerId) {
        return <CustomerProfile customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} showToast={showToast} onEditRequest={handleEdit} onNavigate={onNavigate} />
    }

    if (isAddingCustomer || editingCustomer) {
        return (
            <AddCustomerForm
                onSave={handleSaveCustomer}
                onCancel={handleCancelForm}
                customerToEdit={editingCustomer}
            />
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <CardTitle>Customer Management</CardTitle>
                        <CardDescription>View, add, and manage customer accounts.</CardDescription>
                    </div>
                        <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={handleExportCSV}>
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="primary" onClick={() => setIsAddingCustomer(true)}>
                            <UserPlusIcon className="h-4 w-4 mr-2" />
                            Add Customer
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                            type="text"
                            placeholder="Search by name, account number, or email..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="pl-10"
                        />
                        {filterText && (
                            <button onClick={() => setFilterText('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Clear search">
                                <XIcon className="h-4 w-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"/>
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                        <div className="text-center py-10">Loading customers...</div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                ) : (
                    <>
                        <CustomerTable 
                            customers={customers} 
                            onViewCustomer={(customer) => setSelectedCustomerId(customer.id)}
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
            </CardContent>
        </Card>
    );
};

export default Customers;
