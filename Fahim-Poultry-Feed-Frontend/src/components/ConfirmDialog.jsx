import React from 'react';
import { 
    Button, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogContentText, 
    DialogTitle 
} from '@mui/material';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmButtonText = 'Confirm', confirmColor = 'primary' }) => {
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
                <Button onClick={onCancel} variant="outlined">
                    Cancel
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color={confirmColor} 
                    autoFocus
                >
                    {confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;