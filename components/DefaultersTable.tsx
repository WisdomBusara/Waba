import React from 'react';
import { Defaulter } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface DefaultersTableProps {
  data: Defaulter[];
}

const DefaultersTable: React.FC<DefaultersTableProps> = ({ data }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Overdue Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-800 dark:text-slate-300">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-3">Customer</th>
                <th scope="col" className="px-6 py-3 text-right">Amount Due</th>
                <th scope="col" className="px-6 py-3 text-right">Days Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.length > 0 ? data.map((defaulter) => (
                <tr key={defaulter.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    <div>{defaulter.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{defaulter.account}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-red-500">
                    {defaulter.amountDue.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                  </td>
                  <td className="px-6 py-4 text-right">{defaulter.daysOverdue}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                        No overdue accounts found.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DefaultersTable;
