import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import CreateUserModal from '../components/CreateUserModal';
import ConfirmDialog from '../components/ConfirmDialog';

// MUI Imports
import {
    Box, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, CircularProgress, 
    Select, MenuItem, FormControl, InputLabel, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext'; 

// --- API Functions (Client) ---
const fetchUsers = async () => {
    const { data } = await api.get('/users');
    return data;
};

const updateUserRoleApi = ({ uid, role }) => {
    return api.patch(`/users/${uid}/role`, { role });
};

const deleteUserApi = (uid) => api.delete(`/users/${uid}`).then(res => res.data);
// -----------------------------

const UserManagementPage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth(); // Logged-in Admin user object
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // --- DELETE STATES ---
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    // --- END DELETE STATES ---


    // Fetch all users
    const { 
        data: users = [], 
        isLoading, 
        isError, 
        error 
    } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: fetchUsers,
        staleTime: 1000 * 60, 
        retry: 1,
    });

    // --- MUTATIONS ---

    // 1. Role Update Mutation
    const roleMutation = useMutation({
        mutationFn: updateUserRoleApi,
        onSuccess: (data, variables) => {
            showSuccessToast(`Role for ${variables.uid} updated to ${variables.role}.`);
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            
            if (user?.uid === variables.uid) { 
                window.location.reload(); 
            }
        },
        onError: (err) => {
            showErrorToast(err, 'Failed to update user role.');
        },
    });
    
    // 2. Delete User Mutation
    const deleteMutation = useMutation({
        mutationFn: deleteUserApi,
        onSuccess: () => {
            showSuccessToast('User account deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            setOpenDeleteConfirm(false);
            setUserToDelete(null);
        },
        onError: (err) => {
            showErrorToast(err, 'Failed to delete user.');
            setOpenDeleteConfirm(false);
            setUserToDelete(null);
        }
    });

    // --- HANDLERS ---

    const handleRoleChange = (uid) => async (event) => {
        const newRole = event.target.value;
        roleMutation.mutate({ uid, role: newRole });
    };

    const handleUserCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    };
    
    const handleDeleteClick = (targetUser) => {
        // --- FIX: Correctly compare the target user's UID against the logged-in user's UID ---
        if (targetUser.uid === user?.uid) { 
            showErrorToast({ message: "You cannot delete your own account." });
            return;
        }
        
        setUserToDelete(targetUser);
        setOpenDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            deleteMutation.mutate(userToDelete.uid);
        }
    };
    
    const formatRoleName = (role) => {
        if (role === 'operator') return 'Operator';
        if (role === 'viewer') return 'Viewer';
        if (role === 'admin') return 'Admin';
        return role;
    };


    const currentAdminUid = user?.uid; 


    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (isError) {
        return <Typography color="error" sx={{ p: 3, textAlign: 'center' }}>Error loading users: {error.message || 'Check API connection.'}</Typography>;
    }
    

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <AdminPanelSettingsIcon sx={{ mr: 1 }}/> User & Role Management
                </Typography>
                
                <Button 
                    variant="contained" 
                    color="success" 
                    onClick={() => setIsCreateModalOpen(true)}
                    startIcon={<AddIcon />}
                >
                    Create New User
                </Button>
            </Box>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell>User ID</TableCell>
                            <TableCell>Email / Name</TableCell>
                            <TableCell>Current Role</TableCell>
                            <TableCell sx={{ width: '20%' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.uid} hover>
                                <TableCell sx={{ fontSize: '0.8em', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.uid}</TableCell>
                                <TableCell>
                                    <Typography sx={{ fontWeight: 'medium' }}>{user.displayName || 'N/A'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                                </TableCell>
                                <TableCell>
                                     <FormControl 
                                         size="small" 
                                         sx={{ minWidth: 120 }} 
                                         // Disable role change if current user or mutation is pending
                                         disabled={user.uid === currentAdminUid || roleMutation.isPending}
                                     >
                                        <InputLabel>Role</InputLabel>
                                        <Select
                                            value={user.role}
                                            onChange={handleRoleChange(user.uid)}
                                            label="Role"
                                        >
                                            <MenuItem value="admin">{formatRoleName('admin')}</MenuItem>
                                            <MenuItem value="operator">{formatRoleName('operator')}</MenuItem> 
                                            <MenuItem value="viewer">{formatRoleName('viewer')}</MenuItem>
                                        </Select>
                                     </FormControl>
                                </TableCell>
                                <TableCell>
                                    {user.uid === currentAdminUid ? 
                                        <Typography variant="caption" color="primary"> (You)</Typography> :
                                        <Button 
                                            size="small" 
                                            color="error" 
                                            variant="outlined" 
                                            onClick={() => handleDeleteClick(user)}
                                            disabled={deleteMutation.isPending || roleMutation.isPending}
                                            startIcon={<DeleteIcon />}
                                        >
                                            Delete
                                        </Button>
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onUserCreated={handleUserCreated}
            />
            
            {/* DELETE CONFIRM DIALOG */}
            <ConfirmDialog
                isOpen={openDeleteConfirm}
                title="Confirm Account Deletion"
                message={`Are you sure you want to permanently delete the account for ${userToDelete?.email}? This action is irreversible and requires Admin privileges.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setOpenDeleteConfirm(false)}
                confirmButtonText="Delete Permanently"
                confirmColor="error"
                isLoading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default UserManagementPage;