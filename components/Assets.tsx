import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, UploadIcon, FileTextIcon, CameraIcon, DownloadIcon } from './icons';
import { Scanner } from '@yudiel/react-qr-scanner';
import Papa from 'papaparse';

interface Asset {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  purchaseDate: string;
  price: number;
  notes: string;
  createdAt: string;
  locationId?: string;
  farmId?: string;
}

interface Attachment {
  id: string;
  assetId: string;
  type: string;
  fileName: string;
  uploadedAt: string;
}

interface MaintenanceLog {
  id: string;
  assetId: string;
  maintenanceDate: string;
  performedBy: string;
  performedByName: string;
  description: string;
  cost: number;
  photos: string;
  createdAt: string;
}

interface Farm {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

export default function Assets({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Meter',
    description: '',
    status: 'Active',
    purchaseDate: '',
    price: '',
    notes: '',
    farmId: '',
    locationId: ''
  });

  const [maintenanceData, setMaintenanceData] = useState({
    maintenanceDate: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
  });

  const fetchData = async () => {
    try {
      const [assetsRes, farmsRes, locationsRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/farms').catch(() => ({ ok: true, json: () => [] })), // Assuming these endpoints might not exist yet, fallback to empty
        fetch('/api/locations').catch(() => ({ ok: true, json: () => [] }))
      ]);
      
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (farmsRes.ok) setFarms(await farmsRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
      
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setCurrentAsset(asset);
      setFormData({
        name: asset.name,
        category: asset.category,
        description: asset.description || '',
        status: asset.status,
        purchaseDate: asset.purchaseDate || '',
        price: asset.price ? asset.price.toString() : '',
        notes: asset.notes || '',
        farmId: asset.farmId || '',
        locationId: asset.locationId || ''
      });
    } else {
      setCurrentAsset(null);
      setFormData({
        name: '',
        category: 'Meter',
        description: '',
        status: 'Active',
        purchaseDate: '',
        price: '',
        notes: '',
        farmId: selectedFarm || '',
        locationId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAsset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = currentAsset ? `/api/assets/${currentAsset.id}` : '/api/assets';
      const method = currentAsset ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.parse(localStorage.getItem('user') || '{}').id,
          'x-user-role': JSON.parse(localStorage.getItem('user') || '{}').role
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save asset');
      
      showToast(`Asset ${currentAsset ? 'updated' : 'created'} successfully`, 'success');
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const openDetails = async (asset: Asset) => {
    setCurrentAsset(asset);
    setIsDetailsModalOpen(true);
    fetchAttachments(asset.id);
    fetchMaintenanceLogs(asset.id);
  };

  const fetchAttachments = async (assetId: string) => {
    try {
      const res = await fetch(`/api/assets/${assetId}/attachments`);
      if (!res.ok) throw new Error('Failed to fetch attachments');
      const data = await res.json();
      setAttachments(data);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const fetchMaintenanceLogs = async (assetId: string) => {
    try {
      const res = await fetch(`/api/assets/${assetId}/maintenance`);
      if (!res.ok) throw new Error('Failed to fetch maintenance logs');
      const data = await res.json();
      setMaintenanceLogs(data);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !currentAsset) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch(`/api/assets/${currentAsset.id}/attachments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': JSON.parse(localStorage.getItem('user') || '{}').id,
            'x-user-role': JSON.parse(localStorage.getItem('user') || '{}').role
          },
          body: JSON.stringify({
            type,
            fileName: file.name,
            fileData: base64Data
          })
        });

        if (!res.ok) throw new Error('Failed to upload attachment');
        showToast('Attachment uploaded successfully', 'success');
        fetchAttachments(currentAsset.id);
      } catch (error: any) {
        showToast(error.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      const res = await fetch(`/api/assets/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': JSON.parse(localStorage.getItem('user') || '{}').id,
          'x-user-role': JSON.parse(localStorage.getItem('user') || '{}').role
        }
      });
      if (!res.ok) throw new Error('Failed to delete attachment');
      showToast('Attachment deleted successfully', 'success');
      if (currentAsset) fetchAttachments(currentAsset.id);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const downloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/assets/attachments/${attachmentId}`);
      if (!res.ok) throw new Error('Failed to fetch attachment data');
      const data = await res.json();
      
      const a = document.createElement('a');
      a.href = data.fileData;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset) return;
    
    try {
      const payload = {
        ...maintenanceData,
        cost: maintenanceData.cost ? parseFloat(maintenanceData.cost) : null
      };

      const res = await fetch(`/api/assets/${currentAsset.id}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.parse(localStorage.getItem('user') || '{}').id,
          'x-user-role': JSON.parse(localStorage.getItem('user') || '{}').role
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save maintenance log');
      
      showToast('Maintenance log added successfully', 'success');
      setIsMaintenanceModalOpen(false);
      setMaintenanceData({ maintenanceDate: new Date().toISOString().split('T')[0], description: '', cost: '' });
      fetchMaintenanceLogs(currentAsset.id);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const deleteMaintenanceLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this maintenance log?')) return;
    try {
      const res = await fetch(`/api/assets/maintenance/${logId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': JSON.parse(localStorage.getItem('user') || '{}').id,
          'x-user-role': JSON.parse(localStorage.getItem('user') || '{}').role
        }
      });
      if (!res.ok) throw new Error('Failed to delete maintenance log');
      showToast('Maintenance log deleted successfully', 'success');
      if (currentAsset) fetchMaintenanceLogs(currentAsset.id);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedId = result[0].rawValue;
      const asset = assets.find(a => a.id === scannedId);
      if (asset) {
        setIsScannerOpen(false);
        openDetails(asset);
        showToast('Asset found', 'success');
      } else {
        showToast('Asset not found', 'error');
      }
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/assets/bulk-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': JSON.parse(localStorage.getItem('user') || '{}').id,
              'x-user-role': JSON.parse(localStorage.getItem('user') || '{}').role
            },
            body: JSON.stringify({ assets: results.data })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to upload assets');
          
          showToast(`Successfully uploaded ${data.successCount} assets. ${data.errorCount > 0 ? `${data.errorCount} failed.` : ''}`, data.errorCount > 0 ? 'error' : 'success');
          if (data.errors && data.errors.length > 0) {
            console.error('Upload errors:', data.errors);
          }
          fetchData();
        } catch (error: any) {
          showToast(error.message, 'error');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        showToast(`Error parsing CSV: ${error.message}`, 'error');
      }
    });
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFarm = selectedFarm ? asset.farmId === selectedFarm : true;
    return matchesSearch && matchesFarm;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asset Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="btn-secondary flex items-center"
          >
            <CameraIcon className="w-5 h-5 mr-2" />
            Scan QR
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center"
          >
            <UploadIcon className="w-5 h-5 mr-2" />
            Bulk Upload CSV
          </button>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleCSVUpload} 
          />
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Asset
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search assets..."
            className="input-field pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-64">
          <select
            className="input-field w-full"
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
          >
            <option value="">All Farms</option>
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID / Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => openDetails(asset)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{asset.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asset.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        asset.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {asset.purchaseDate || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(asset); }} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3">
                        <EditIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No assets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4" id="modal-title">
                    {currentAsset ? 'Edit Asset' : 'Add New Asset'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                      <input type="text" required className="input-field mt-1 w-full" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
                        <select className="input-field mt-1 w-full" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                          <option value="Meter">Meter</option>
                          <option value="Tank">Tank</option>
                          <option value="Pump">Pump</option>
                          <option value="Pipe">Pipe</option>
                          <option value="Tool">Tool</option>
                          <option value="Vehicle">Vehicle</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select className="input-field mt-1 w-full" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                          <option value="Active">Active</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Retired">Retired</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Farm</label>
                        <select className="input-field mt-1 w-full" value={formData.farmId} onChange={(e) => setFormData({...formData, farmId: e.target.value})}>
                          <option value="">Select Farm</option>
                          {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                        <select className="input-field mt-1 w-full" value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})}>
                          <option value="">Select Location</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Date</label>
                        <input type="date" className="input-field mt-1 w-full" value={formData.purchaseDate} onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                        <input type="number" step="0.01" className="input-field mt-1 w-full" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                      <textarea className="input-field mt-1 w-full" rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                      <textarea className="input-field mt-1 w-full" rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {currentAsset ? 'Save Changes' : 'Add Asset'}
                  </button>
                  <button type="button" onClick={handleCloseModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && currentAsset && (
        <div className="fixed inset-0 z-40 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsDetailsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentAsset.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {currentAsset.id}</p>
                  </div>
                  <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Asset Info */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Details</h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentAsset.category}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentAsset.status}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Purchase Date</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentAsset.purchaseDate || '-'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentAsset.price ? `$${currentAsset.price.toFixed(2)}` : '-'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentAsset.description || '-'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentAsset.notes || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Attachments & Maintenance */}
                  <div className="space-y-6">
                    {/* Attachments */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attachments (Images/Receipts)</h4>
                        <div className="flex space-x-2">
                          <label className="cursor-pointer text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
                            <UploadIcon className="w-4 h-4 mr-1" /> Image
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Image')} />
                          </label>
                          <label className="cursor-pointer text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
                            <UploadIcon className="w-4 h-4 mr-1" /> Receipt
                            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Receipt')} />
                          </label>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                        {attachments.length > 0 ? (
                          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                            {attachments.map(att => (
                              <li key={att.id} className="py-3 flex justify-between items-center">
                                <div className="flex items-center">
                                  <FileTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{att.fileName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{att.type} • {new Date(att.uploadedAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button onClick={() => downloadAttachment(att.id, att.fileName)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                    <DownloadIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteAttachment(att.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No attachments uploaded yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Maintenance Logs */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maintenance History</h4>
                        <button onClick={() => setIsMaintenanceModalOpen(true)} className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
                          <PlusIcon className="w-4 h-4 mr-1" /> Add Log
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                        {maintenanceLogs.length > 0 ? (
                          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                            {maintenanceLogs.map(log => (
                              <li key={log.id} className="py-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(log.maintenanceDate).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{log.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">By: {log.performedByName} {log.cost ? `• Cost: $${log.cost}` : ''}</p>
                                  </div>
                                  <button onClick={() => deleteMaintenanceLog(log.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No maintenance history.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => setIsDetailsModalOpen(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsMaintenanceModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleMaintenanceSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Add Maintenance Log</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
                      <input type="date" required className="input-field mt-1 w-full" value={maintenanceData.maintenanceDate} onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
                      <textarea required className="input-field mt-1 w-full" rows={3} value={maintenanceData.description} onChange={(e) => setMaintenanceData({...maintenanceData, description: e.target.value})}></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost</label>
                      <input type="number" step="0.01" className="input-field mt-1 w-full" value={maintenanceData.cost} onChange={(e) => setMaintenanceData({...maintenanceData, cost: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Save Log
                  </button>
                  <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsScannerOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Scan Asset QR Code</h3>
                  <button onClick={() => setIsScannerOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="aspect-square bg-black rounded-lg overflow-hidden">
                  <Scanner onScan={handleScan} />
                </div>
                <p className="mt-4 text-sm text-gray-500 text-center">Point your camera at an asset QR code to view its details.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
