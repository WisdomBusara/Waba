
import React, { useState, useMemo } from 'react';
import RevenueChart from './RevenueChart';
import { RevenueData } from '../types';
import { BarChartIcon, CreditCardIcon, AlertTriangleIcon } from './icons';

type ReportType = 'revenue' | 'payments' | 'aging';

const reportTypes = [
    { id: 'revenue', name: 'Revenue Overview', icon: BarChartIcon, description: "Analyze billed vs. collected revenue over time." },
    { id: 'payments', name: 'Payments Received', icon: CreditCardIcon, description: "Track incoming payments and methods." },
    { id: 'aging', name: 'Debt Aging Analysis', icon: AlertTriangleIcon, description: "View outstanding debt categorized by age." },
];

// Mock data generation for the chart
const generateReportData = (startDate: string, endDate: string): RevenueData[] => {
    const data: RevenueData[] = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const month = current.toLocaleString('default', { month: 'short' });
        const billed = 1000000 + Math.random() * 500000;
        const collected = billed * (0.75 + Math.random() * 0.2);
        data.push({ month, billed, collected });
        current.setMonth(current.getMonth() + 1);
    }
    return data;
};

const Reports: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType>('revenue');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [reportData, setReportData] = useState<RevenueData[] | null>(null);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleGenerateReport = () => {
        // In a real app, you'd fetch data here based on selectedReport and dateRange
        setReportData(generateReportData(dateRange.start, dateRange.end));
    };
    
    const renderReportContent = () => {
        if (!reportData) {
            return (
                <div className="text-center py-16">
                    <p className="text-gray-500">Select your parameters and generate a report.</p>
                </div>
            );
        }
        
        switch (selectedReport) {
            case 'revenue':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Revenue Overview</h3>
                        <RevenueChart data={reportData} />
                    </div>
                );
            case 'payments':
            case 'aging':
                return <div className="text-center py-16"><p className="text-gray-500">This report is not yet implemented.</p></div>;
            default:
                return null;
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportTypes.map(report => (
                    <button
                        key={report.id}
                        onClick={() => setSelectedReport(report.id as ReportType)}
                        className={`p-4 text-left rounded-lg border-2 transition-all ${selectedReport === report.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' : 'bg-white dark:bg-gray-800 border-transparent dark:hover:bg-gray-700 hover:bg-gray-50'}`}
                    >
                        <report.icon className={`h-6 w-6 mb-2 ${selectedReport === report.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                        <h3 className="font-semibold text-gray-900 dark:text-white">{report.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{report.description}</p>
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                 <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1 w-full">
                        <label htmlFor="start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                        <input type="date" name="start" id="start" value={dateRange.start} onChange={handleDateChange} className="mt-1 input-field w-full" />
                    </div>
                    <div className="flex-1 w-full">
                         <label htmlFor="end" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                        <input type="date" name="end" id="end" value={dateRange.end} onChange={handleDateChange} className="mt-1 input-field w-full" />
                    </div>
                    <div className="w-full md:w-auto">
                        <button onClick={handleGenerateReport} className="w-full primary-button">
                            Generate Report
                        </button>
                    </div>
                </div>

                {renderReportContent()}
            </div>
             <style>{`
                .input-field { padding: 0.5rem 0.75rem; background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.375rem; }
                .dark .input-field { background-color: #374151; border-color: #4b5563; }
                .primary-button { display: flex; align-items: center; justify-content:center; background-color: #3b82f6; color: white; padding: 0.6rem 1rem; border-radius: 0.375rem; font-weight: 500; }
                .primary-button:hover { background-color: #2563eb; }
            `}</style>
        </div>
    );
};

export default Reports;
