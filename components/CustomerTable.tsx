import React from 'react';
import { Customer } from '../types';
import { ChevronsUpDownIcon, ChevronUpIcon, ChevronDownIcon } from './icons';

type SortConfig = {
    key: keyof Customer;
    direction: string;
} | null;

interface CustomerTableProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onSort: (key: keyof Customer) => void;
  sortConfig: SortConfig;
}

const SortableHeader: React.FC<{
    columnKey: keyof Customer;
    label: string;
    onSort: (key: keyof Customer) => void;
    sortConfig: SortConfig;
}> = ({ columnKey, label, onSort, sortConfig }) => {
    const isSorted = sortConfig?.key === columnKey;
    const sortDirection = isSorted ? sortConfig.direction : null;

    const getIcon = () => {
        if (!isSorted) {
            return <ChevronsUpDownIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
        }
        if (sortDirection === 'ascending') {
            return <ChevronUpIcon className="h-4 w-4 text-gray-800 dark:text-gray-200" />;
        }
        return <ChevronDownIcon className="h-4 w-4 text-gray-800 dark:text-gray-200" />;
    };

    return (
        <th scope="col" className="px-6 py-4">
            <button onClick={() => onSort(columnKey)} className="group flex items-center space-x-2 w-full text-left">
                <span className={`font-medium ${isSorted ? 'text-gray-900 dark:text-white' : ''}`}>{label}</span>
                {getIcon()}
            </button>
        </th>
    );
};


const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onViewCustomer, onSort, sortConfig }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-800 dark:text-slate-300">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
          <tr>
            <SortableHeader columnKey="name" label="Customer Name" onSort={onSort} sortConfig={sortConfig} />
            <SortableHeader columnKey="accountNumber" label="Account No." onSort={onSort} sortConfig={sortConfig} />
            <SortableHeader columnKey="email" label="Contact" onSort={onSort} sortConfig={sortConfig} />
            <SortableHeader columnKey="address" label="Address" onSort={onSort} sortConfig={sortConfig} />
            <SortableHeader columnKey="joinDate" label="Joined On" onSort={onSort} sortConfig={sortConfig} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <tr 
                key={customer.id} 
                onClick={() => onViewCustomer(customer)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
              >
                <td scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
                  {customer.name}
                </td>
                <td className="px-6 py-4 font-mono">{customer.accountNumber}</td>
                <td className="px-6 py-4">
                  <div>{customer.email}</div>
                  <div className="text-xs text-slate-500">{customer.phone}</div>
                </td>
                <td className="px-6 py-4 truncate max-w-xs">{customer.address}</td>
                <td className="px-6 py-4">{customer.joinDate}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                No customers found matching your filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;