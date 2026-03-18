
import { PdfSettings } from '../types';

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
    logo: null,
    themeColor: '#2563eb', // Default blue
    footerText: 'Payment Instructions: Please pay via M-Pesa, Paybill 123456, Account No. {ACCOUNT_NUMBER}.\nThank you for your business!',
};
