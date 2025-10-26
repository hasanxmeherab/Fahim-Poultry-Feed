import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, Button, CircularProgress, Box, FormHelperText
} from '@mui/material';

/**
 * A generic modal for entering a single positive numeric value.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is open.
 * @param {function} props.onClose - Function to call when the modal is closed.
 * @param {function} props.onSubmit - Function to call with the validated number on submit.
 * @param {string} props.title - The title of the modal (e.g., "Make a Deposit").
 * @param {string} props.label - The label for the text field (e.g., "Amount (TK)").
 * @param {string} props.helperText - Default helper text shown below the input.
 * @param {string} [props.error] - An external error message (e.g., from an API response).
 * @param {boolean} [props.isLoading=false] - Disables buttons and shows a spinner.
 * @param {string} [props.submitText="Confirm"] - Text for the submit button.
 * @param {string} [props.inputType="number"] - Can be "number" (allows decimals) or "integer".
 */
const AmountEntryModal = ({
    open,
    onClose,
    onSubmit,
    title,
    label,
    helperText = "Please enter a valid positive value.",
    error: externalError = '', // Rename prop to avoid conflict
    isLoading = false,
    submitText = "Confirm",
    inputType = "number" // 'number' or 'integer'
}) => {
    const [value, setValue] = useState('');
    const [internalError, setInternalError] = useState(''); // For local validation

    // Clear value and errors when modal opens/closes
    useEffect(() => {
        if (open) {
            setValue('');
            setInternalError('');
        }
    }, [open]);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        const numValue = parseFloat(value);

        // Local validation
        if (isNaN(numValue) || numValue <= 0) {
            setInternalError("Value must be a positive number.");
            return;
        }
        if (inputType === 'integer' && !Number.isInteger(numValue)) {
            setInternalError("Value must be a whole number (e.g., 10).");
            return;
        }

        setInternalError(''); // Clear local error
        onSubmit(numValue); // Pass the validated number to the parent
    };

    // Determine which error to show: external (from API) or internal (from local validation)
    const displayError = externalError || internalError;
    const displayHelperText = displayError || helperText;

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="amount-input"
                    label={label}
                    type="number" // Always use number type for keyboard
                    fullWidth
                    variant="outlined"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={isLoading}
                    error={!!displayError}
                    inputProps={{
                        step: inputType === 'integer' ? '1' : 'any', // Allow decimals for 'number'
                        min: inputType === 'integer' ? '1' : '0.01',
                    }}
                    sx={{ mt: 1 }}
                />
                <FormHelperText error={!!displayError} sx={{ minHeight: '1.25em', ml: '14px' }}>
                    {displayHelperText}
                </FormHelperText>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Box sx={{ position: 'relative' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading || !value} // Disable if loading or no value
                    >
                        {submitText}
                    </Button>
                    {isLoading && (
                        <CircularProgress
                            size={24}
                            color="inherit"
                            sx={{
                                position: 'absolute', top: '50%', left: '50%',
                                marginTop: '-12px', marginLeft: '-12px',
                            }}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default AmountEntryModal;