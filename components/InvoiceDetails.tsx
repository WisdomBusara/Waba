
import React from 'react';
import { Invoice } from '../types';
import { DownloadIcon, EditIcon, CreditCardIcon } from './icons';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { PDFDownloadLink } from '@react-pdf/renderer';
import BillTemplate from './pdf/BillTemplate';
import { getPdfSettings } from '../lib/pdfSettings';
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './ui/Sheet';
import { Button } from './ui/Button';


interface InvoiceDetailsProps {
    invoice: Invoice;
    onClose: () => void;
    onEdit: (invoice: Invoice) => void;
    onMarkAsPaid: (invoice: Invoice) => void;
}

const DetailItem: React.FC<{ label: string; value: string | number; currency?: boolean }> = ({ label, value, currency = false }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-medium text-slate-800 dark:text-slate-200">
            {currency ? Number(value).toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) : value}
        </p>
    </div>
);

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "h-5 w-5 text-slate-500" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, onClose, onEdit, onMarkAsPaid }) => {
    // Refresh settings whenever the details view is opened to catch latest customizations
    const pdfSettings = getPdfSettings();

    return (
        <Sheet open={true} onOpenChange={onClose}>
            <SheetContent className="flex flex-col sm:max-w-lg" onOpenChange={onClose}>
                <SheetHeader className="text-left">
                     <div className="flex justify-between items-start">
                        <div>
                            <SheetTitle className="text-2xl">{invoice.id}</SheetTitle>
                            <SheetDescription>To: {invoice.customerName}</SheetDescription>
                        </div>
                    </div>
                    <div className="pt-2">
                        <InvoiceStatusBadge status={invoice.status} />
                    </div>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 -mx-6 px-6">
                    <div className="space-y-2">
                       <DetailItem label="Issue Date" value={invoice.issueDate} />
                       <DetailItem label="Due Date" value={invoice.dueDate} />
                       <DetailItem label="Customer Account" value={invoice.customerAccount} />
                       <DetailItem label="Customer Address" value={invoice.customerAddress} />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Invoice Items</h3>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
                            {invoice.items.map((item, index) => (
                                <div key={index} className={`p-3 ${index < invoice.items.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 pr-2">{item.description}</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">{item.total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.quantity.toFixed(2)} x {Number(item.unitPrice).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Summary</h3>
                        <div className="space-y-2">
                           <DetailItem label="Subtotal" value={invoice.subtotal} currency />
                           <DetailItem label="Penalties" value={invoice.penalties} currency />
                           <div className="flex justify-between items-center py-3 text-lg font-bold">
                                <p>Total Due</p>
                                <p className="text-blue-600 dark:text-blue-400">{invoice.total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p>
                           </div>
                        </div>
                    </div>
                </div>
                
                <SheetFooter>
                    <div className="flex w-full justify-between items-center">
                        <div>
                            {invoice.status !== 'Paid' && (
                                <Button variant="outline" onClick={() => onMarkAsPaid(invoice)}>
                                    <CreditCardIcon className="h-4 w-4 mr-2" />
                                    Mark as Paid
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" onClick={() => onEdit(invoice)}>
                                <EditIcon className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <PDFDownloadLink
                                document={<BillTemplate invoice={invoice} settings={pdfSettings} />}
                                fileName={`Invoice-${invoice.id}.pdf`}
                                title={`Download PDF for Invoice ${invoice.id}`}
                            >
                                {({ loading }) => (
                                     <Button disabled={loading}>
                                        {loading ? (
                                            <>
                                                <LoadingSpinner className="h-4 w-4 mr-2 text-white" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <DownloadIcon className="h-4 w-4 mr-2" />
                                                Download PDF
                                            </>
                                        )}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default InvoiceDetails;
