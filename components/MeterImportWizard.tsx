import React, { useState, useMemo, useCallback } from 'react';
import { addMeterSchema, AddMeterFormData } from '../lib/schemas';
import { UploadCloudIcon } from './icons';
import Modal from './ui/Modal';

interface MeterImportWizardProps {
    onComplete: (data: AddMeterFormData[]) => void;
    onCancel: () => void;
}

type WizardStep = 'upload' | 'map' | 'confirm';
type RawRow = { [key: string]: string };
type Mapping = { [key: string]: string | undefined };
type ValidatedRow = {
    original: RawRow;
    data: AddMeterFormData | null;
    isValid: boolean;
    errors: string[];
};

const REQUIRED_FIELDS: string[] = ['serialNumber', 'installationDate', 'initialReading'];
const OPTIONAL_FIELDS: string[] = ['customerAccount'];

const MeterImportWizard: React.FC<MeterImportWizardProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState<WizardStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<RawRow[]>([]);
    const [mapping, setMapping] = useState<Mapping>({});
    const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
    const [isParsing, setIsParsing] = useState(false);

    const parseCSV = useCallback((csvText: string) => {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            alert("CSV file must have a header row and at least one data row.");
            return;
        }
        const csvHeaders = lines[0].split(',').map(h => h.trim());
        const csvRows = lines.slice(1).map(line => {
            const values = line.split(',');
            return csvHeaders.reduce((obj, header, index) => {
                obj[header] = values[index]?.trim() || '';
                return obj;
            }, {} as RawRow);
        });
        setHeaders(csvHeaders);
        setRows(csvRows);
        setStep('map');
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setIsParsing(true);
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (event) => {
                parseCSV(event.target?.result as string);
                setIsParsing(false);
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleMappingChange = (field: string, value: string) => {
        setMapping(prev => ({ ...prev, [field]: value }));
    };
    
    const validateData = () => {
        const validated: ValidatedRow[] = rows.map(row => {
            const dataToValidate: { [key: string]: any } = {};
            
            // Transform raw row data based on mapping
            Object.keys(mapping).forEach(fieldKey => {
                const headerKey = mapping[fieldKey];
                if (headerKey && row[headerKey] !== undefined) {
                    dataToValidate[fieldKey] = row[headerKey] === '' ? null : row[headerKey];
                }
            });
           
            const result = addMeterSchema.safeParse(dataToValidate);
            
            if (result.success) {
                return { original: row, data: result.data, isValid: true, errors: [] };
            } else {
                return { original: row, data: null, isValid: false, errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) };
            }
        });
        setValidatedData(validated);
        setStep('confirm');
    };

    const isMappingComplete = useMemo(() => {
        return REQUIRED_FIELDS.every(field => mapping[field] && headers.includes(mapping[field]!));
    }, [mapping, headers]);

    const { validCount, invalidCount } = useMemo(() => {
        return validatedData.reduce((acc, row) => {
            if (row.isValid) acc.validCount++;
            else acc.invalidCount++;
            return acc;
        }, { validCount: 0, invalidCount: 0 });
    }, [validatedData]);
    
    const handleCommit = () => {
        const validMeters = validatedData
            .filter(row => row.isValid && row.data)
            .map(row => row.data!);
        onComplete(validMeters);
    };

    const renderUploadStep = () => (
        <div className="text-center">
            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Import Meters from CSV</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Drag and drop a file or click to select.</p>
            <div className="mt-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12">
                <input type="file" accept=".csv" onChange={handleFileChange} className="sr-only" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer bg-white dark:bg-gray-700 p-2 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                    <span>Select a file</span>
                </label>
            </div>
            <div className="mt-4 text-xs text-gray-500">
                <a href="data:text/csv;charset=utf-8,serialNumber,customerAccount,installationDate,initialReading%0ASN-TEST-001,CUST-NEW-01,2024-07-01,10%0ASN-TEST-002,,2024-07-05,0" 
                   download="sample_meters.csv" 
                   className="underline hover:text-blue-600">
                   Download sample CSV template
                </a>
            </div>
        </div>
    );
    
    const renderMappingStep = () => (
        <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Map CSV Columns</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Match the columns from your file to the required meter fields.</p>
            <div className="mt-6 space-y-4">
                {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map(field => (
                    <div key={field} className="grid grid-cols-2 gap-4 items-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {field.replace(/([A-Z])/g, ' $1')}
                            {REQUIRED_FIELDS.includes(field) && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            onChange={(e) => handleMappingChange(field, e.target.value)}
                            value={mapping[field] || ''}
                            className="block w-full input-field"
                        >
                            <option value="" disabled>Select column...</option>
                            {headers.map(header => <option key={header} value={header}>{header}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-end space-x-3">
                <button onClick={() => setStep('upload')} className="secondary-button">Back</button>
                <button onClick={validateData} disabled={!isMappingComplete} className="primary-button">
                    Review Data
                </button>
            </div>
        </div>
    );
    
    const renderConfirmStep = () => (
        <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Validate & Confirm</h3>
            <div className="mt-2 flex justify-between items-center text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p><span className="font-bold text-green-500">{validCount}</span> rows are valid and ready to import.</p>
                {invalidCount > 0 && <p><span className="font-bold text-red-500">{invalidCount}</span> rows have errors.</p>}
            </div>
            <div className="mt-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {headers.map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {validatedData.map((row, index) => (
                            <tr key={index} className={!row.isValid ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                {headers.map(h => <td key={h} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{row.original[h]}</td>)}
                                <td className="px-4 py-2 text-sm">
                                    {row.isValid 
                                        ? <span className="font-semibold text-green-600">Valid</span>
                                        : <div className="text-red-600 font-semibold">
                                            Invalid
                                            <ul className="text-xs list-disc pl-4 font-normal">
                                                {row.errors.map((e, i) => <li key={i}>{e}</li>)}
                                            </ul>
                                          </div>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="mt-8 flex justify-end space-x-3">
                <button onClick={() => setStep('map')} className="secondary-button">Back to Mapping</button>
                <button onClick={handleCommit} disabled={validCount === 0} className="primary-button">
                    Import {validCount} Valid Meters
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (step) {
            case 'upload': return renderUploadStep();
            case 'map': return renderMappingStep();
            case 'confirm': return renderConfirmStep();
            default: return null;
        }
    };

    return (
        <Modal title="Meter Import Wizard" onClose={onCancel} className="max-w-4xl">
            <div className="p-8 overflow-y-auto">
                {isParsing ? <p>Parsing file...</p> : renderContent()}
            </div>
            <style>{`
                .input-field {
                    padding: 0.5rem 0.75rem;
                    background-color: white; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .dark .input-field { background-color: #374151; border-color: #4b5563; }
                .input-field:focus { outline: none; --tw-ring-color: #3b82f6; box-shadow: 0 0 0 2px var(--tw-ring-color); border-color: #3b82f6; }
                
                .primary-button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed; }
                .secondary-button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600; }
            `}</style>
        </Modal>
    );
};

export default MeterImportWizard;
