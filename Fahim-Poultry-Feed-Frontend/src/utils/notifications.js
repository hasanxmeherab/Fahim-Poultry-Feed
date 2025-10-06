import { toast } from 'react-toastify';

/**
 * Displays an error toast with a message parsed from an error object.
 * @param {Error} error - The error object, likely from an Axios catch block.
 * @param {string} defaultMessage - A fallback message if the error object is not specific.
 */
export const showErrorToast = (error, defaultMessage = 'An unexpected error occurred.') => {
    // This logic tries to find the most specific error message from the backend response.
    const errorMessage = error.response?.data?.error 
                       || error.response?.data?.message 
                       || error.message 
                       || defaultMessage;
    toast.error(errorMessage);
};

/**
 * Displays a success toast with a custom message.
 * @param {string} message - The message to display.
 */
export const showSuccessToast = (message) => {
    toast.success(message);
};