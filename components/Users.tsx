
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserFormData } from '../types';
import { UserPlusIcon, Trash2Icon, ShieldCheckIcon } from './icons';
import { fetchFromApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import AddUserForm from './AddUserForm';

interface UsersProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const Users: React.FC<UsersProps> = ({ showToast }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchFromApi('users');
            setUsers(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users.');
            showToast(err.message || 'Failed to fetch users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSaveUser = async (data: UserFormData) => {
        try {
            await fetchFromApi('users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            showToast('User created successfully!', 'success');
            setIsAddingUser(false);
            fetchUsers();
        } catch (err: any) {
            showToast(err.message || 'Failed to create user.', 'error');
        }
    };

    const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

    const handleDeactivateUser = async () => {
        if (!userToDeactivate) return;
        try {
            await fetchFromApi(`users/${userToDeactivate.id}/deactivate`, { method: 'PUT' });
            showToast('User deactivated successfully.', 'success');
            setUserToDeactivate(null);
            fetchUsers();
        } catch (err: any) {
            showToast(err.message || 'Failed to deactivate user.', 'error');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'Manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Agent': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>System Users</CardTitle>
                            <CardDescription>Manage administrative staff and their permissions.</CardDescription>
                        </div>
                        <Button variant="primary" onClick={() => setIsAddingUser(true)}>
                            <UserPlusIcon className="h-4 w-4 mr-2" />
                            Add System User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading system users...</div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">{error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Last Active</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.map(user => (
                                        <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${user.status === 'Inactive' ? 'opacity-60' : ''}`}>
                                            <td className="px-6 py-4 font-medium flex items-center gap-2 text-slate-900 dark:text-white">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${user.status === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                    {user.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {new Date(user.lastActive).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {user.status !== 'Inactive' && (
                                                    <button 
                                                        onClick={() => setUserToDeactivate(user)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Deactivate User"
                                                    >
                                                        <Trash2Icon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isAddingUser && (
                <AddUserForm 
                    onSave={handleSaveUser} 
                    onCancel={() => setIsAddingUser(false)} 
                />
            )}

            {userToDeactivate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Deactivate User</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Are you sure you want to deactivate <strong>{userToDeactivate.name}</strong>? They will no longer be able to access the system.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setUserToDeactivate(null)}>Cancel</Button>
                            <Button variant="primary" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeactivateUser}>
                                Yes, Deactivate
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
