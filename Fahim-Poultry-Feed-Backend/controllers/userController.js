const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// NOTE: This register function is for one-time use to create your admin.
// You can call this once from an API tool like Postman, then remove the route.
const registerUser = async (req, res, next) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is missing or malformed. Ensure Content-Type is application/json.' });
        }
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ username,email,  password: hashedPassword });
        res.status(201).json({ _id: user.id, username: user.username });
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                username: user.username,
                token: jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
                    expiresIn: '1d', // Token expires in 1 day
                }),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { registerUser, loginUser };