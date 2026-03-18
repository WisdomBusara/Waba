import React, { useState, useEffect, useCallback } from 'react';
import { FileTextIcon, SearchIcon, RefreshCwIcon } from './icons';
import { fetchFromApi } from '../lib/api';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface AuditLog {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [entityType, setEntityType] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) queryParams.append('search', search);
      if (actionType) queryParams.append('actionType', actionType);
      if (entityType) queryParams.append('entityType', entityType);

      const data = await fetchFromApi(`audit-logs?${queryParams.toString()}`);
      setLogs(data?.logs || []);
      setTotal(data?.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, search, actionType, entityType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchLogs();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Audit Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System activity and security events
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
            <Input 
                type="text" 
                placeholder="Search logs..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div>
            <select 
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="DEACTIVATE">Deactivate</option>
            </select>
        </div>
        <div>
            <select 
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Customer">Customer</option>
                <option value="Meter">Meter</option>
                <option value="Reading">Reading</option>
                <option value="Invoice">Invoice</option>
                <option value="Payment">Payment</option>
                <option value="Settings">Settings</option>
                <option value="NotificationSettings">Notification Settings</option>
                <option value="PDFSettings">PDF Settings</option>
            </select>
        </div>
        <div className="md:col-span-4 flex justify-end">
            <Button type="submit" variant="primary">Filter</Button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Entity ID</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {log.actorEmail || log.actorUserId || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (log.actionType || '').includes('FAILED') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        (log.actionType || '').includes('DELETE') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        (log.actionType || '').includes('CREATE') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {log.actionType || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {log.entityId || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate" title={log.details || ''}>
                        {log.details || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {Math.min(offset + 1, total)} to {Math.min(offset + limit, total)} of {total} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
