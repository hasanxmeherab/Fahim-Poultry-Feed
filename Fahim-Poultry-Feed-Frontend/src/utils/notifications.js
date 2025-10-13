import { toast } from 'react-toastify';

/**
 * Displays an error toast with a message parsed from an error object.
 * @param {Error} error - The error object, likely from an Axios catch block.
 * @param {string} defaultMessage - A fallback message if the error object is not specific.
 */
export const showErrorToast = (error, defaultMessage = 'An unexpected error occurred.') => {
    let errorMessage = defaultMessage; // Start with the fallback message.

    // 1. Check for express-validator errors first.
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
        // This handles the new, specific error format.
        // It takes the message from the first error in the array.
        // e.g., from [{ "name": "Name is required." }] it extracts "Name is required."
        errorMessage = Object.values(error.response.data.errors[0])[0];
    
    // 2. Fall back to the old logic if no validation errors are found.
    } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else if (error.message) {
        errorMessage = error.message;
    }

    toast.error(errorMessage);
};

/**
 * Displays a success toast with a custom message.
 * @param {string} message - The message to display.
 */
export const showSuccessToast = (message) => {
    toast.success(message);
};