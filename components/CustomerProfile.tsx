
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Invoice, RecentPayment, Meter } from '../types';
import { fetchFromApi } from '../lib/api';
import { GoogleGenAI } from "@google/genai";
import { 
    ChevronLeftIcon, MoreHorizontalIcon, UserIcon, PlusIcon, FileTextIcon, 
    CreditCardIcon, PhoneIcon, DropletIcon, ArrowRightLeftIcon, Trash2Icon, 
    EditIcon, ChevronRightIcon, BarChartIcon, ZapIcon, AlertTriangleIcon, CheckCircleIcon
} from './icons';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import StatusBadge from './StatusBadge';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerBillingHistory from './CustomerBillingHistory';

interface CustomerProfileProps {
    customerId: string;
    onBack: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onEditRequest: (customer: Customer) => void;
    onNavigate: (view: string, params?: any) => void;
}

interface ProfileData {
    customer: Customer;
    history: {
        invoices: Invoice[];
        payments: RecentPayment[];
    };
    meters: Meter[];
    outstandingBalance: number;
    lastUpdated: string;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, onBack, showToast, onEditRequest, onNavigate }) => {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'billing' | 'usage'>('billing');
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const profileData = await fetchFromApi(`customers/${customerId}`);
            setData(profileData);
            setError(null);
            
            // Generate AI insights once data is available
            generateAiInsights(profileData);
        } catch (err: any) {
            setError(err.message || 'Failed to load customer details.');
            showToast(err.message || 'Failed to load customer details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const generateAiInsights = async (profileData: ProfileData) => {
        if (!process.env.API_KEY) return;
        setAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                Analyze the following customer data for a Water Billing System and provide a 2-sentence professional summary for an administrator.
                Customer: ${profileData.customer.name}
                Outstanding Balance: ${profileData.outstandingBalance} KES
                Invoices: ${profileData.history.invoices.length} total
                Recent Invoice Statuses: ${profileData.history.invoices.slice(0, 3).map(i => i.status).join(', ')}
                Payments: ${profileData.history.payments.length} total
                
                Focus on payment reliability and recent usage patterns. Keep it concise.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            
            setAiInsight(response.text || "No insights available.");
        } catch (err) {
            console.error("Gemini AI error:", err);
            setAiInsight("AI Insights temporarily unavailable.");
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [customerId]);

    const usageData = useMemo(() => {
        if (!data) return [];
        // Extract usage from invoice items
        return data.history.invoices
            .map(inv => {
                const waterItem = (inv.items || []).find(item => item.description?.toLowerCase()?.includes('water'));
                return {
                    month: inv.issueDate ? inv.issueDate.substring(0, 7) : '', // YYYY-MM
                    usage: waterItem ? waterItem.quantity : 0,
                    billed: inv.total
                };
            })
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-slate-500 dark:text-slate-400">Loading profile data...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold">Profile not found</h3>
                <p className="text-slate-500 mb-6">{error || 'Could not find the requested customer.'}</p>
                <Button onClick={onBack}>Go back to list</Button>
            </div>
        );
    }

    const { customer, history, outstandingBalance, meters } = data;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <button onClick={onBack} className="hover:text-blue-500 flex items-center transition-colors">
                            <ChevronLeftIcon className="w-4 h-4 mr-1" />
                            Customers
                        </button>
                        <span className="mx-2">/</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{customer.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <UserIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{customer.name}</h2>
                            <p className="text-sm text-slate-500 flex items-center">
                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2">{customer.accountNumber}</span>
                                <span className="flex items-center gap-1">
                                    <PhoneIcon className="w-3 h-3" /> {customer.phone}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => onEditRequest(customer)}>
                        <EditIcon className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                    <Button onClick={() => onNavigate('Invoices')}>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Invoice
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Main Info & History */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Insights Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/50">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="bg-blue-500/20 p-2.5 rounded-xl">
                                    <ZapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm mb-1 uppercase tracking-wider">AI Customer Intelligence</h4>
                                    {aiLoading ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            <span className="text-xs text-blue-600/70 italic">Analyzing usage patterns...</span>
                                        </div>
                                    ) : (
                                        <motion.p 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                            className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
                                        >
                                            {aiInsight || "No insights generated yet. Click to regenerate."}
                                        </motion.p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Navigation Tabs */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="flex border-b border-slate-200 dark:border-slate-800">
                            <button 
                                onClick={() => setActiveTab('billing')}
                                className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'billing' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                <FileTextIcon className="w-4 h-4" />
                                Unified Billing Activity
                            </button>
                            <button 
                                onClick={() => setActiveTab('usage')}
                                className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'usage' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                <BarChartIcon className="w-4 h-4" />
                                Usage Trends
                            </button>
                        </div>

                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {activeTab === 'billing' && (
                                    <motion.div
                                        key="billing"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <CustomerBillingHistory invoices={history.invoices} payments={history.payments} />
                                    </motion.div>
                                )}

                                {activeTab === 'usage' && (
                                    <motion.div
                                        key="usage"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="h-80 w-full bg-slate-50 dark:bg-slate-800/20 rounded-xl p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={usageData}>
                                                    <defs>
                                                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                        <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.5)" />
                                                    <XAxis dataKey="month" tick={{ fill: 'var(--recharts-text-color)', fontSize: 12 }} />
                                                    <YAxis yAxisId="left" tick={{ fill: 'var(--recharts-text-color)', fontSize: 12 }} label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
                                                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--recharts-text-color)', fontSize: 12 }} label={{ value: 'KES', angle: 90, position: 'insideRight' }} />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Area yAxisId="left" type="monotone" dataKey="usage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsage)" name="Water Usage (m³)" />
                                                    <Area yAxisId="right" type="monotone" dataKey="billed" stroke="#10b981" fillOpacity={1} fill="url(#colorBilled)" name="Billed Amount (KES)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Avg. Monthly Usage</p>
                                                <p className="text-2xl font-bold">{(usageData.reduce((acc, d) => acc + d.usage, 0) / (usageData.length || 1)).toFixed(1)} m³</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Consumption</p>
                                                <p className="text-2xl font-bold">{usageData.reduce((acc, d) => acc + d.usage, 0).toFixed(1)} m³</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Side: Quick Stats & Details */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Financial Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Financial Snapshot</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
                                    <p className={`text-2xl font-black ${outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        KES {outstandingBalance.toLocaleString()}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        {outstandingBalance > 0 ? (
                                            <AlertTriangleIcon className="w-4 h-4 text-orange-500" />
                                        ) : (
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                        )}
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            {outstandingBalance > 0 ? 'Account in Arrears' : 'No Overdue Payments'}
                                        </span>
                                    </div>
                                </div>
                                <Button className="w-full" variant={outstandingBalance > 0 ? 'primary' : 'outline'} onClick={() => onNavigate('Payments')}>
                                    <CreditCardIcon className="w-4 h-4 mr-2" />
                                    Record a Payment
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Customer Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Account Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <span className="text-xs text-slate-500">Email</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right">{customer.email}</span>
                                    </div>
                                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <span className="text-xs text-slate-500">Phone</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right">{customer.phone}</span>
                                    </div>
                                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <span className="text-xs text-slate-500">Join Date</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right">{customer.joinDate}</span>
                                    </div>
                                    <div className="flex justify-between items-start pt-1">
                                        <span className="text-xs text-slate-500">Address</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right max-w-[150px]">{customer.address}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Infrastructure */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Hardware & Metering</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {meters && meters.length > 0 ? (
                                    <div className="space-y-3">
                                        {meters.map(meter => (
                                            <div key={meter.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-blue-300 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <DropletIcon className="w-4 h-4 text-blue-600" />
                                                        <p className="text-xs font-bold font-mono">{meter.serialNumber}</p>
                                                    </div>
                                                    <StatusBadge status={meter.status} />
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    className="w-full text-[10px] h-7 px-2 justify-between group-hover:bg-blue-50"
                                                    onClick={() => onNavigate('Meters & Readings', { meterId: meter.id })}
                                                >
                                                    <span>View Meter Details</span>
                                                    <ArrowRightLeftIcon className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 italic mb-3">No meters assigned to this account.</p>
                                        <Button variant="outline" className="w-full text-xs h-8" onClick={() => onNavigate('Meters & Readings')}>
                                            Assign a Meter
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                            <Trash2Icon className="w-4 h-4 mr-2" />
                            Deactivate Account
                        </Button>
                    </motion.div>
                </div>
            </div>
            
            <style>{`
                .input-field { 
                    display: block; 
                    width: 100%; 
                    border-radius: 0.5rem; 
                    border: 1px solid #cbd5e1; 
                    background-color: #f8fafc; 
                    padding: 0.5rem 0.75rem; 
                    font-size: 0.875rem; 
                }
                .dark .input-field { 
                    background-color: #1e293b; 
                    border-color: #475569; 
                    color: #fff; 
                }
            `}</style>
        </div>
    );
};

export default CustomerProfile;
