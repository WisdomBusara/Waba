import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { fetchFromApi } from '../lib/api';
import { BellIcon, CheckIcon, AlertTriangleIcon, InfoIcon } from './icons';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: number;
    createdAt: string;
}

interface NotificationSettings {
    emailAlerts: number;
    pushAlerts: number;
    highConsumptionThreshold: number;
    unusualActivityAlerts: number;
}

interface NotificationsProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const Notifications: React.FC<NotificationsProps> = ({ showToast }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [settings, setSettings] = useState<NotificationSettings>({
        emailAlerts: 1,
        pushAlerts: 0,
        highConsumptionThreshold: 500,
        unusualActivityAlerts: 1
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [notifsData, settingsData] = await Promise.all([
                fetchFromApi('notifications'),
                fetchFromApi('notification-settings')
            ]);
            setNotifications(notifsData.notifications || []);
            setSettings(settingsData);
        } catch (error: any) {
            showToast(error.message || 'Failed to load notifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await fetchFromApi(`notifications/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: 1 } : n));
        } catch (error: any) {
            showToast(error.message || 'Failed to mark as read', 'error');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await fetchFromApi('notifications/read-all', { method: 'PUT' });
            setNotifications(notifications.map(n => ({ ...n, isRead: 1 })));
            showToast('All notifications marked as read', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to mark all as read', 'error');
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetchFromApi('notification-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            showToast('Notification settings saved successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Loading notifications...</div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                <Button onClick={handleMarkAllAsRead} variant="outline" className="text-sm">
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Mark all as read
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {notifications.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-slate-500">
                                <BellIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>You have no notifications.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        notifications.map(notif => (
                            <Card key={notif.id} className={`transition-colors ${notif.isRead ? 'opacity-70 bg-slate-50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-800 border-l-4 border-l-blue-500'}`}>
                                <CardContent className="p-4 flex gap-4">
                                    <div className={`mt-1 p-2 rounded-full ${notif.type === 'HIGH_CONSUMPTION' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : notif.type === 'UNUSUAL_ACTIVITY' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                        {notif.type === 'HIGH_CONSUMPTION' || notif.type === 'UNUSUAL_ACTIVITY' ? <AlertTriangleIcon className="w-5 h-5" /> : <InfoIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-medium ${notif.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{notif.title}</h3>
                                            <span className="text-xs text-slate-500">{new Date(notif.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{notif.message}</p>
                                        {!notif.isRead && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <div>
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Alert Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        High Consumption Threshold (Units)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.highConsumptionThreshold}
                                        onChange={(e) => setSettings({...settings, highConsumptionThreshold: Number(e.target.value)})}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        required
                                        min="1"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Alert when a single reading exceeds this value.</p>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Unusual Activity Alerts</p>
                                        <p className="text-xs text-slate-500">Alert on sudden spikes in consumption.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={settings.unusualActivityAlerts === 1} onChange={(e) => setSettings({...settings, unusualActivityAlerts: e.target.checked ? 1 : 0})} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Email Notifications</p>
                                        <p className="text-xs text-slate-500">Receive alerts via email.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={settings.emailAlerts === 1} onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked ? 1 : 0})} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Push Notifications</p>
                                        <p className="text-xs text-slate-500">Receive alerts on your device.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={settings.pushAlerts === 1} onChange={(e) => setSettings({...settings, pushAlerts: e.target.checked ? 1 : 0})} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <Button type="submit" variant="primary" className="w-full" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
