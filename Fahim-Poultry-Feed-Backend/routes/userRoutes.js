const express = require('express');
const router = express.Router();
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole'); 
const { 
    getAllUsers, 
    updateUserRole, 
    createUser, 
    deleteUser
} = require('../controllers/userController'); 

// All user management routes require the user to be authenticated AND an 'admin'
router.use(firebaseAuthMiddleware);
router.use(requireRole('admin'));

// GET /api/users - List all users
// POST /api/users - Create a new user (admin only)
router.route('/')
    .get(getAllUsers)
    .post(createUser); 

// PATCH /api/users/:uid/role - Update a specific user's role
router.patch('/:uid/role', updateUserRole);

// DELETE /api/users/:uid - Delete a specific user (admin only)
router.delete('/:uid', deleteUser);

module.exports = router;