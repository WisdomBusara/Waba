import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { KpiData, RevenueData, RecentPayment, MapDataPoint, TopCustomer, AgingData, Defaulter, NRWData } from '../types';
import KpiCard from './KpiCard';
import RevenueChart from './RevenueChart';
import DataMap from './DataMap';
import TopCustomersList from './TopCustomersList';
import { DollarSignIcon, UsersIcon, CreditCardIcon, AlertTriangleIcon } from './icons';
import RecentPayments from './RecentPayments';
import { fetchFromApi } from '../lib/api';
import TrustedBy from './TrustedBy';
import AgingChart from './AgingChart';
import DefaultersTable from './DefaultersTable';

interface DashboardProps {
    setActiveView: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
    const [kpiData, setKpiData] = useState<KpiData[]>([]);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
    const [mapData, setMapData] = useState<MapDataPoint[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [agingData, setAgingData] = useState<AgingData[]>([]);
    const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
    const [nrwData, setNrwData] = useState<NRWData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleDashboardData = (data: any) => {
            if (data) {
                const kpiIcons: { [key: string]: React.ElementType } = {
                    'Total Billed (Month)': DollarSignIcon,
                    'Total Collected (Month)': CreditCardIcon,
                    'Active Customers': UsersIcon,
                    'Overdue Accounts': AlertTriangleIcon,
                };
                
                setKpiData(data.kpiData?.map((kpi: KpiData) => ({...kpi, icon: kpiIcons[kpi.title] || DollarSignIcon})) ?? []);
                setRevenueData(data.revenueData ?? []);
                setRecentPayments(data.recentPayments ?? []);
                setAgingData(data.agingData ?? []);
                setDefaulters(data.defaulters ?? []);
                setNrwData(data.nrwData ?? []);

                setMapData([
                    { id: 'nairobi', name: 'Nairobi', value: 1250, x: 52, y: 55 },
                    { id: 'mombasa', name: 'Mombasa', value: 450, x: 80, y: 80 },
                    { id: 'kisumu', name: 'Kisumu', value: 680, x: 20, y: 45 },
                    { id: 'nakuru', name: 'Nakuru', value: 890, x: 40, y: 40 },
                    { id: 'eldoret', name: 'Eldoret', value: 720, x: 28, y: 25 },
                ]);

                setTopCustomers([
                     { id: '1', name: 'Karen Water Ltd.', billed: 250000, avatar: `https://i.pravatar.cc/100?u=karen` },
                     { id: '2', name: 'Greenleaf Gardens', billed: 180000, avatar: `https://i.pravatar.cc/100?u=green` },
                     { id: '3', name: 'Runda Estates', billed: 150000, avatar: `https://i.pravatar.cc/100?u=runda` },
                     { id: '4', name: 'City Mall', billed: 120000, avatar: `https://i.pravatar.cc/100?u=city` },
                ]);

                setError(null);
            } else {
                setError('Received empty dashboard data from the server.');
            }
        };

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const data = await fetchFromApi('dashboard');
                handleDashboardData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard data. Please ensure the API server is running.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Setup Socket.IO connection for real-time updates
        const socket = io();
        
        socket.on('dashboard_update', (data: any) => {
            console.log('Received real-time dashboard update');
            handleDashboardData(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
            {kpiData.map((kpi, index) => (
                <div key={index} className="col-span-12 sm:col-span-6 xl:col-span-3 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <KpiCard {...kpi} />
                </div>
            ))}

            <div className="col-span-12 xl:col-span-8">
                <RevenueChart data={revenueData} />
            </div>
            
            <div className="col-span-12 xl:col-span-4">
                <AgingChart data={agingData} />
            </div>
            
            <div className="col-span-12 xl:col-span-7">
                <RecentPayments payments={recentPayments} setActiveView={setActiveView} />
            </div>

            <div className="col-span-12 xl:col-span-5">
                <DefaultersTable data={defaulters} />
            </div>

            <div className="col-span-12 xl:col-span-5">
                <DataMap data={mapData} nrwData={nrwData} />
            </div>
            
            <div className="col-span-12 xl:col-span-7">
                <TopCustomersList customers={topCustomers} />
            </div>

            <div className="col-span-12">
                <TrustedBy />
            </div>
        </div>
    );
};

export default Dashboard;