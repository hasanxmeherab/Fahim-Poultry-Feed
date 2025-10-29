import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import CreateUserModal from '../components/CreateUserModal';

// MUI Imports
import {
    Box, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, CircularProgress, 
    Select, MenuItem, FormControl, InputLabel, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Added for title icon
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user/role

// --- API Functions (Client) ---
const fetchUsers = async () => {
    // This calls the GET /api/users endpoint which returns all users + their custom claims
    const { data } = await api.get('/users');
    return data;
};

const updateUserRoleApi = ({ uid, role }) => {
    // This calls the PATCH /api/users/:uid/role endpoint
    return api.patch(`/users/${uid}/role`, { role });
};
// -----------------------------

const UserManagementPage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth(); // Get the currently logged-in user object
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    // Mutation for updating a user role
    const roleMutation = useMutation({
        mutationFn: updateUserRoleApi,
        onSuccess: (data, variables) => {
            showSuccessToast(`Role for ${variables.uid} updated to ${variables.role}.`);
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); // Refresh the user list
            
            // If the current user's role was changed, force token refresh in AuthContext
            if (user?.uid === variables.uid) { 
                window.location.reload(); // Simplest way to force full token refresh/re-auth
            }
        },
        onError: (err) => {
            showErrorToast(err, 'Failed to update user role.');
        },
    });

    const handleRoleChange = (uid) => async (event) => {
        const newRole = event.target.value;
        roleMutation.mutate({ uid, role: newRole });
    };

    // Callback function to refresh list after creating a new user
    const handleUserCreated = () => {
         queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    };

    // Determine the current logged-in user's UID (for safety check in UI)
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
                                     <FormControl size="small" sx={{ minWidth: 120 }} disabled={user.uid === currentAdminUid || roleMutation.isPending}>
                                        <InputLabel>Role</InputLabel>
                                        <Select
                                            value={user.role}
                                            onChange={handleRoleChange(user.uid)}
                                            label="Role"
                                        >
                                            <MenuItem value="admin">Admin</MenuItem>
                                            <MenuItem value="clerk">Clerk</MenuItem>
                                            <MenuItem value="viewer">Viewer</MenuItem>
                                        </Select>
                                     </FormControl>
                                </TableCell>
                                <TableCell>
                                    {user.uid === currentAdminUid ? 
                                        <Typography variant="caption" color="primary"> (You)</Typography> :
                                        // You could add a Delete User button here, which would call a DELETE /api/users/:uid endpoint
                                        <Button size="small" color="error" variant="outlined" disabled>Delete</Button>
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
        </Box>
    );
};

export default UserManagementPage;