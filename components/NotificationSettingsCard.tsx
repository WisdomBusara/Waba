import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { fetchFromApi } from '../lib/api';

interface NotificationSettingsCardProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({ showToast }) => {
    const [settings, setSettings] = useState({
        highConsumptionThreshold: 1000,
        emailAlerts: true,
        pushAlerts: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await fetchFromApi('notification-settings');
                if (data) {
                    setSettings({
                        highConsumptionThreshold: data.highConsumptionThreshold,
                        emailAlerts: Boolean(data.emailAlerts),
                        pushAlerts: Boolean(data.pushAlerts)
                    });
                }
            } catch (err: any) {
                showToast('Failed to load notification settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showToast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetchFromApi('notification-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            showToast('Notification settings saved successfully.', 'success');
        } catch (err: any) {
            showToast('Failed to save notification settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage your personal alerts and consumption thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        High Consumption Threshold (Units)
                    </label>
                    <Input 
                        type="number" 
                        value={settings.highConsumptionThreshold}
                        onChange={(e) => setSettings({...settings, highConsumptionThreshold: Number(e.target.value)})}
                        className="max-w-xs"
                    />
                    <p className="mt-1 text-xs text-slate-500">You will be alerted when a customer's reading exceeds this value.</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between max-w-md">
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Email Alerts</h4>
                            <p className="text-xs text-slate-500">Receive notifications via email.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.emailAlerts}
                                onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between max-w-md">
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Push Notifications</h4>
                            <p className="text-xs text-slate-500">Receive alerts in your browser.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.pushAlerts}
                                onChange={(e) => setSettings({...settings, pushAlerts: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default NotificationSettingsCard;
