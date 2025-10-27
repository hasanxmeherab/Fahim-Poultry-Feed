const admin = require('firebase-admin');

// @desc   Update user profile (displayName, photoURL)
// @route  PATCH /api/profile
// @access Private (requires Firebase token)
const updateUserProfile = async (req, res, next) => {
    // req.user is attached by firebaseAuthMiddleware containing decoded token (incl. uid)
    const userId = req.user?.uid;
    const { displayName, photoURL } = req.body;

    // Basic validation
    if (!userId) {
        const error = new Error('Authentication error: User ID not found.');
        error.statusCode = 401;
        return next(error);
    }
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
        const error = new Error('Validation error: Display name cannot be empty.');
        error.statusCode = 400;
        return next(error);
    }
    // Optional: Validate photoURL format if provided
    if (photoURL && typeof photoURL !== 'string') {
         const error = new Error('Validation error: Invalid photo URL format.');
         error.statusCode = 400;
         return next(error);
    }


    try {
        // Prepare updates for Firebase Auth
        const updates = {
            displayName: displayName.trim(),
            // Only include photoURL if it was provided in the request body
            ...(photoURL && { photoURL: photoURL }),
        };

        // Use Firebase Admin SDK to update the user record
        const userRecord = await admin.auth().updateUser(userId, updates);

        console.log(`Successfully updated profile for user: ${userId}`);

        // Return relevant user info (or just success status)
        res.status(200).json({
            message: 'Profile updated successfully.',
            // Optionally return updated user data (be careful not to expose sensitive info)
            // displayName: userRecord.displayName,
            // photoURL: userRecord.photoURL,
        });

    } catch (error) {
        console.error(`Error updating profile for user ${userId}:`, error);
        // Pass a generic server error to the central handler
        const serverError = new Error('Failed to update profile.');
        serverError.statusCode = 500;
        next(serverError);
    }
};

module.exports = {
    updateUserProfile,
};
