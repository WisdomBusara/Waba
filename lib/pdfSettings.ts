
import { PdfSettings } from '../types';

const SETTINGS_KEY = 'pdfCustomizationSettings';

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
    logo: null,
    themeColor: '#2563eb', // Default blue
    footerText: 'Payment Instructions: Please pay via M-Pesa, Paybill 123456, Account No. {ACCOUNT_NUMBER}.\nThank you for your business!',
};

export const getPdfSettings = (): PdfSettings => {
    try {
        const settingsJson = localStorage.getItem(SETTINGS_KEY);
        if (settingsJson) {
            // Merge saved settings with defaults to ensure all keys are present
            return { ...DEFAULT_PDF_SETTINGS, ...JSON.parse(settingsJson) };
        }
    } catch (error) {
        console.error("Failed to parse PDF settings from localStorage", error);
    }
    return DEFAULT_PDF_SETTINGS;
};

export const savePdfSettings = (settings: PdfSettings): void => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save PDF settings to localStorage", error);
    }
};
