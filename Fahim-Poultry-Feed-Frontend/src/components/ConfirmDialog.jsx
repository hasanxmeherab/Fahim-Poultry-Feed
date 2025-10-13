import React from 'react';
import { 
    Button, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogContentText, 
    DialogTitle,
    CircularProgress // Import CircularProgress
} from '@mui/material';

// Add a new 'isLoading' prop
const ConfirmDialog = ({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmButtonText = 'Confirm', 
    confirmColor = 'primary',
    isLoading = false // Default to false
}) => {
    return (
        <Dialog
            open={isOpen}
            onClose={onCancel}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
        >
            <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 'bold' }}>
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="confirm-dialog-description">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {/* Disable the cancel button while the action is in progress */}
                <Button onClick={onCancel} variant="outlined" disabled={isLoading}>
                    Cancel
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color={confirmColor} 
                    autoFocus
                    disabled={isLoading} // Disable the confirm button while loading
                >
                    {/* Show a spinner when loading, otherwise show the text */}
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;