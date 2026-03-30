import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { TopCustomer } from '../types';

interface TopCustomersListProps {
  customers: TopCustomer[];
}

const TopCustomersList: React.FC<TopCustomersListProps> = ({ customers }) => {
  const totalBilled = Math.max(...customers.map(c => c.billed), 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Top Customers by Billed Amount</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer.id}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <img src={customer.avatar} alt={customer.name} className="w-9 h-9 rounded-full" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{customer.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {customer.billed.toLocaleString('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-primary rounded-full h-1.5"
                  style={{ width: `${totalBilled > 0 ? (customer.billed / totalBilled) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopCustomersList;
