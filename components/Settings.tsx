
import React, { useState, useEffect } from 'react';
import { BillingSettings } from '../types';
import BillingCycleCard from './BillingCycleCard';
import PdfCustomizationCard from './PdfCustomizationCard';
import DatabaseDiagnostics from './DatabaseDiagnostics';
import { fetchFromApi } from '../lib/api';

interface SettingsProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const Settings: React.FC<SettingsProps> = ({ showToast }) => {
    const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await fetchFromApi('settings/billing');
                setBillingSettings(data);
            } catch (err) {
                showToast('Failed to load billing settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showToast]);

    const handleSaveBillingSettings = async (newSettings: BillingSettings) => {
        try {
            await fetchFromApi('settings/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
            setBillingSettings(newSettings);
            return true;
        } catch (err) {
            return false;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage system-wide configurations and preferences.
                </p>
            </div>
            
            {loading ? (
                <div className="flex items-center gap-3 text-slate-500 italic">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading settings...
                </div>
            ) : billingSettings ? (
                <div className="space-y-8">
                    <BillingCycleCard 
                        settings={billingSettings} 
                        onSave={handleSaveBillingSettings} 
                        showToast={showToast}
                    />
                    
                    <DatabaseDiagnostics showToast={showToast} />

                    <PdfCustomizationCard showToast={showToast} />
                </div>
            ) : (
                <p className="text-red-500">Could not load billing settings.</p>
            )}
        </div>
    );
};

export default Settings;
