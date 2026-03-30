
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserFormData } from '../types';
import { UserPlusIcon, Trash2Icon, ShieldCheckIcon, EditIcon } from './icons';
import { fetchFromApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import UserForm from './AddUserForm';
import ConfirmModal from './ui/ConfirmModal';

interface UsersProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const Users: React.FC<UsersProps> = ({ showToast }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

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

    const handleSaveUser = async (data: UserFormData & { status?: string }) => {
        try {
            if (userToEdit) {
                await fetchFromApi(`users/${userToEdit.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                showToast('User updated successfully!', 'success');
            } else {
                await fetchFromApi('users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                showToast('User created successfully!', 'success');
            }
            setIsAddingUser(false);
            setUserToEdit(null);
            fetchUsers();
        } catch (err: any) {
            showToast(err.message || 'Failed to save user.', 'error');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await fetchFromApi(`users/${userToDelete.id}`, { method: 'DELETE' });
            showToast('User deleted successfully.', 'success');
            fetchUsers();
        } catch (err: any) {
            showToast(err.message || 'Failed to delete user.', 'error');
        } finally {
            setUserToDelete(null);
        }
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === 'Inactive' ? 'Active' : 'Inactive';
        try {
            await fetchFromApi(`users/${user.id}/status`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            showToast(`User ${newStatus.toLowerCase()} successfully.`, 'success');
            fetchUsers();
        } catch (err: any) {
            showToast(err.message || `Failed to ${newStatus.toLowerCase()} user.`, 'error');
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
                                                    {(user.name || '').split(' ').map(n => n?.[0] || '').join('')}
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
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${user.status === 'Inactive' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                                                    title={`Click to ${user.status === 'Inactive' ? 'activate' : 'deactivate'} user`}
                                                >
                                                    {user.status || 'Active'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setUserToEdit(user)}
                                                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <EditIcon className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setUserToDelete(user)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2Icon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {(isAddingUser || userToEdit) && (
                <UserForm 
                    onSave={handleSaveUser} 
                    onCancel={() => { setIsAddingUser(false); setUserToEdit(null); }} 
                    userToEdit={userToEdit}
                />
            )}

            {userToDelete && (
                <ConfirmModal
                    title="Delete User"
                    message={`Are you sure you want to permanently delete user ${userToDelete.name}?`}
                    onConfirm={handleDeleteUser}
                    onCancel={() => setUserToDelete(null)}
                    confirmText="Delete"
                    isDestructive={true}
                />
            )}
        </div>
    );
};

export default Users;
