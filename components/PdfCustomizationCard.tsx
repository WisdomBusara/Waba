
import React, { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdfSettings, Invoice } from '../types';
import { DEFAULT_PDF_SETTINGS } from '../lib/pdfSettings';
import { SaveIcon, XIcon } from './icons';
import BillTemplate from './pdf/BillTemplate';
import { fetchFromApi } from '../lib/api';

interface PdfCustomizationCardProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const SAMPLE_INVOICE: Invoice = {
  id: 'INV-2024-PREVIEW',
  customerName: 'Jane Doe',
  customerAccount: 'ACC-12345',
  customerAddress: '123 Preview Lane, Westlands, Nairobi',
  issueDate: new Date().toLocaleDateString('en-CA'),
  generationDate: new Date().toLocaleDateString('en-CA'),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
  items: [
    { description: 'Water Usage (15 m³)', quantity: 15, unitPrice: 110, total: 1650 },
    { description: 'Standing Charge', quantity: 1, unitPrice: 200, total: 200 },
    { description: 'Sewerage Charge', quantity: 1, unitPrice: 150, total: 150 },
  ],
  subtotal: 2000,
  penalties: 200, // To show how penalties look
  total: 2200,
  status: 'Overdue',
};


const PdfCustomizationCard: React.FC<PdfCustomizationCardProps> = ({ showToast }) => {
    const [settings, setSettings] = useState<PdfSettings>(DEFAULT_PDF_SETTINGS);
    const [isDirty, setIsDirty] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsClient(true);
        const loadSettings = async () => {
            try {
                const data = await fetchFromApi('pdf-settings');
                if (data) {
                    setSettings({ ...DEFAULT_PDF_SETTINGS, ...data });
                }
            } catch (err) {
                showToast('Failed to load PDF settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [showToast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                showToast('Logo image must be under 2MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, logo: reader.result as string }));
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            await fetchFromApi('pdf-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            showToast('PDF settings saved successfully!', 'success');
            setIsDirty(false);
        } catch (err: any) {
            showToast(err.message || 'Failed to save PDF settings.', 'error');
        }
    };

    const handleReset = () => {
        setSettings(DEFAULT_PDF_SETTINGS);
        setIsDirty(true);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-3 text-slate-500 italic">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Loading PDF settings...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
            {/* Settings Column */}
            <div className="xl:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice PDF Customization</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Personalize the look of your PDF invoices.
                            </p>
                        </div>
                        {isDirty && (
                            <button onClick={handleSave} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex-shrink-0">
                                <SaveIcon className="h-5 w-5 mr-2" />
                                Save
                            </button>
                        )}
                    </div>
                    <div className="p-6 space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</label>
                            <div className="sm:col-span-2 flex items-center space-x-4">
                                {settings.logo && <img src={settings.logo} alt="Company Logo" className="h-12 w-auto bg-gray-100 dark:bg-gray-700 p-1 rounded-md object-contain" />}
                                <input type="file" id="logo-upload" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
                                <label htmlFor="logo-upload" className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                    {settings.logo ? 'Change' : 'Upload'}
                                </label>
                                {settings.logo && (
                                    <button onClick={() => { setSettings(s => ({...s, logo: null})); setIsDirty(true); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Remove logo">
                                        <XIcon className="h-4 w-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                            <label htmlFor="themeColor" className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme Color</label>
                            <div className="sm:col-span-2 flex items-center space-x-2">
                                <input type="color" id="themeColor" name="themeColor" value={settings.themeColor || '#000000'} onChange={handleChange} className="h-10 w-10 p-1 border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-white dark:bg-gray-700" />
                                <input type="text" value={settings.themeColor} onChange={handleChange} name="themeColor" className="input-field w-32"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                            <label htmlFor="footerText" className="text-sm font-medium text-gray-700 dark:text-gray-300">Footer Text</label>
                            <div className="sm:col-span-2">
                                <textarea id="footerText" name="footerText" value={settings.footerText} onChange={handleChange} rows={4} className="mt-1 block w-full input-field" />
                                <p className="mt-1 text-xs text-gray-500">Use `{"{ACCOUNT_NUMBER}"}` as a placeholder.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 mt-auto flex justify-end">
                        <button onClick={handleReset} className="text-sm font-medium text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Column */}
            <div className="xl:col-span-3">
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col min-h-[700px]">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Preview</h3>
                    </div>
                    <div className="flex-1 p-1 md:p-4 bg-slate-100 dark:bg-slate-900 rounded-b-xl">
                        {isClient ? (
                            <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '0 0 0.75rem 0.75rem' }}>
                                <BillTemplate invoice={SAMPLE_INVOICE} settings={settings} />
                            </PDFViewer>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p>Loading preview...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`.input-field { padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #d1d5db; border-radius: 0.375rem; } .dark .input-field { background-color: #374151; border-color: #4b5563; }`}</style>
        </div>
    );
};

export default PdfCustomizationCard;
