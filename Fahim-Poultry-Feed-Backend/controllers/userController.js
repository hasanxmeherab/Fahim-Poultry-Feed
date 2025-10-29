const admin = require('firebase-admin');
const mongoose = require('mongoose');

// @desc    Get a list of all users and their roles
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
    try {
        // Use Firebase Admin SDK to list users
        const listUsersResult = await admin.auth().listUsers(100); 
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            role: userRecord.customClaims?.role || 'viewer', // Default still 'viewer'
            metadata: { 
                lastSignInTime: userRecord.metadata.lastSignInTime,
                creationTime: userRecord.metadata.creationTime
            }
        }));

        res.status(200).json(users);
    } catch (error) {
        console.error("Error listing users:", error);
        next(new Error('Failed to retrieve user list.'));
    }
};

// @desc    Update a user's custom role claim
// @route   PATCH /api/users/:uid/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
    const { uid } = req.params;
    const { role } = req.body;
    const callerUid = req.user.uid; 

    // Prevent an admin from modifying themselves
    if (uid === callerUid) {
        const error = new Error("Cannot modify your own administrative role.");
        error.statusCode = 400;
        return next(error);
    }

    // Basic validation updated to include 'operator'
    if (!role || !['admin', 'operator', 'viewer'].includes(role)) {
        const error = new Error('Invalid role specified.');
        error.statusCode = 400;
        return next(error);
    }

    try {
        await admin.auth().setCustomUserClaims(uid, { role });
        await admin.auth().revokeRefreshTokens(uid); 

        const updatedUser = await admin.auth().getUser(uid);
        res.status(200).json({ 
            uid: updatedUser.uid,
            email: updatedUser.email,
            role: role,
            message: `Role for ${updatedUser.email} updated to ${role}. Tokens revoked.`
        });
    } catch (error) {
        console.error("Error setting custom user claims:", error);
        next(new Error('Failed to update user role.'));
    }
};


// @desc    Create a new user account and set initial role
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
    // Default role is now 'operator'
    const { email, password, displayName, role = 'operator' } = req.body; 

    // Basic validation
    if (!email || !password || !displayName) {
        const error = new Error('Email, password, and display name are required.');
        error.statusCode = 400;
        return next(error);
    }
    // Validation updated to include 'operator'
    if (!['admin', 'operator', 'viewer'].includes(role)) { 
        const error = new Error('Invalid role specified.');
        error.statusCode = 400;
        return next(error);
    }

    try {
        // 1. Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });

        // 2. Set custom user claims (role)
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        // 3. Send success response
        res.status(201).json({ 
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            role: role,
            message: `User ${displayName} created successfully with role ${role}.`
        });

    } catch (error) {
        console.error("Error creating new user:", error);
        
        if (error.code === 'auth/email-already-in-use') {
             const customError = new Error('The provided email is already in use by an existing user.');
             customError.statusCode = 400;
             return next(customError);
        }
        
        next(new Error('Failed to create new user account.'));
    }
};


module.exports = {
    getAllUsers,
    updateUserRole,
    createUser,
};