import React from 'react';
import { KpiData } from '../types';
import { Card, CardContent } from './ui/Card';

const KpiCard: React.FC<KpiData> = ({ title, value, change, changeType, icon: Icon }) => {
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? 'text-emerald-500' : 'text-red-500';

  const iconColor = {
      'Total Billed (Month)': 'bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400',
      'Total Collected (Month)': 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 dark:text-emerald-400',
      'Active Customers': 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400',
      'Overdue Accounts': 'bg-orange-100 dark:bg-orange-900/50 text-orange-500 dark:text-orange-400',
  }[title] || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

  const UpArrow = () => (
    <svg className="fill-current" width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.35716 2.47737L0.908974 5.82987L5.0443e-07 4.94612L5 0.0848689L10 4.94612L9.09103 5.82987L5.64284 2.47737L5.64284 10.0849L4.35716 10.0849L4.35716 2.47737Z" fill=""></path>
    </svg>
  );
  
  const DownArrow = () => (
    <svg className="fill-current" width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.64284 7.69375L9.09102 4.34125L10 5.225L5 10.0862L-4.49333e-07 5.225L0.908973 4.34125L4.35716 7.69375L4.35716 0.0862438L5.64284 0.0862438L5.64284 7.69375Z" fill=""></path>
    </svg>
  );

  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-500 dark:text-slate-400">{title}</h4>
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconColor}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
            <span className={`flex items-center gap-1 font-semibold ${changeColor}`}>
              {isIncrease ? <UpArrow /> : <DownArrow />}
              {change}
            </span>
            <span className="text-slate-500 dark:text-slate-400">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
