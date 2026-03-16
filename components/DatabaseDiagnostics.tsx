
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { ShieldCheckIcon, AlertTriangleIcon, LayoutGridIcon, ActivityIcon, ZapIcon, DownloadIcon } from './icons';
import { fetchFromApi } from '../lib/api';

interface DbStats {
    status: 'Healthy' | 'Corrupted';
    integrityMessage: string;
    tableCounts: {
        customers: number;
        meters: number;
        readings: number;
        invoices: number;
        payments: number;
        users: number;
    };
    size: string;
    lastValidated: string;
}

const DatabaseDiagnostics: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void }> = ({ showToast }) => {
    const [stats, setStats] = useState<DbStats | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const runValidation = useCallback(async () => {
        setIsValidating(true);
        try {
            const data = await fetchFromApi('db/validate');
            setStats(data);
            if (data.status === 'Healthy') {
                showToast('Database integrity check passed.', 'success');
            } else {
                showToast('Warning: Database integrity issues detected!', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Validation failed.', 'error');
        } finally {
            setIsValidating(false);
        }
    }, [showToast]);

    useEffect(() => {
        runValidation();
    }, []);

    const StatItem = ({ label, count, icon: Icon }: any) => (
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
                {count?.toLocaleString() || 0}
            </p>
        </div>
    );

    return (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5 text-indigo-500" />
                            Database Health & Diagnostics
                        </CardTitle>
                        <CardDescription>Monitor data integrity and record distribution across the system.</CardDescription>
                    </div>
                    <Button 
                        onClick={runValidation} 
                        disabled={isValidating}
                        variant={stats?.status === 'Corrupted' ? 'destructive' : 'outline'}
                    >
                        {isValidating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <ZapIcon className="w-4 h-4 mr-2" />
                                Run Full Diagnostic
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Status Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center space-y-3 ${
                            stats?.status === 'Healthy' 
                            ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' 
                            : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'
                        }`}>
                            {stats?.status === 'Healthy' ? (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                                    <ShieldCheckIcon className="w-12 h-12 text-emerald-500 relative" />
                                </div>
                            ) : (
                                <AlertTriangleIcon className="w-12 h-12 text-rose-500" />
                            )}
                            <div>
                                <h4 className="text-xl font-bold">Storage is {stats?.status || 'Unknown'}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {stats?.status === 'Healthy' 
                                        ? 'Integrity check passed. No corruption detected.' 
                                        : 'Critical system error: Database corruption detected!'}
                                </p>
                            </div>
                            <div className="pt-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                Last Check: {stats?.lastValidated ? new Date(stats.lastValidated).toLocaleTimeString() : 'Never'}
                            </div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Engine</span>
                                <span className="font-mono font-bold">SQLite 3.x (B-Tree)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">File Size</span>
                                <span className="font-mono font-bold">{stats?.size || '0 KB'}</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Status Msg</span>
                                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">{stats?.integrityMessage || 'ok'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Distribution */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-2 mb-4">
                            <LayoutGridIcon className="w-4 h-4 text-slate-400" />
                            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Record Distribution</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <StatItem label="Customers" count={stats?.tableCounts.customers} icon={ShieldCheckIcon} />
                            <StatItem label="Meters" count={stats?.tableCounts.meters} icon={ActivityIcon} />
                            <StatItem label="Readings" count={stats?.tableCounts.readings} icon={ZapIcon} />
                            <StatItem label="Invoices" count={stats?.tableCounts.invoices} icon={DownloadIcon} />
                            <StatItem label="Payments" count={stats?.tableCounts.payments} icon={ZapIcon} />
                            <StatItem label="Staff Users" count={stats?.tableCounts.users} icon={ShieldCheckIcon} />
                        </div>
                        
                        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span><b>Maintenance Tip:</b> If your database exceeds 1GB or record counts go above 100k, consider enabling Write-Ahead Logging (WAL) mode or transitioning to a cloud database like PostgreSQL for better concurrency.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DatabaseDiagnostics;
