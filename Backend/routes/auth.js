const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const PasswordRequest = require('../models/PasswordRequest');
const { protect } = require('../middleware/authMiddleware');

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Debug Admin
router.get('/debug-admin', async (req, res) => {
    try {
        const user = await User.findOne({ email: 'admin@example.com' });
        if (!user) return res.json({ message: 'Admin NOT FOUND' });

        const isMatch = await user.matchPassword('admin123');
        res.json({
            exists: true,
            email: user.email,
            role: user.role,
            passwordMatch: isMatch
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, department, year } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            department,
            year,
            role: 'student', // Force role to student for public registration
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                year: user.year,
                isFirstLogin: user.isFirstLogin,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                year: user.year,
                isFirstLogin: user.isFirstLogin,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Change Password (Logged In)
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            if (user.isFirstLogin) {
                user.isFirstLogin = false;
            }
            await user.save();
            
            // If they had an approved request, mark it resolved
            const approvedRequest = await PasswordRequest.findOne({ user: req.user._id, status: 'approved' });
            if (approvedRequest) {
                approvedRequest.status = 'resolved';
                await approvedRequest.save();
            }

            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Request a password reset via Admin
// @route   POST /api/auth/password-request
// @access  Private
router.post('/password-request', protect, async (req, res) => {
    try {
        // Check if there is already a pending request
        const existingRequest = await PasswordRequest.findOne({ user: req.user._id, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending password reset request.' });
        }

        const request = await PasswordRequest.create({ user: req.user._id });
        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get status of pending/approved password request
// @route   GET /api/auth/password-request/status
// @access  Private
router.get('/password-request/status', protect, async (req, res) => {
    try {
        const activeRequest = await PasswordRequest.findOne({ 
            user: req.user._id, 
            status: { $in: ['pending', 'approved'] } 
        }).sort({ createdAt: -1 });
        
        if (activeRequest) {
            res.json({ status: activeRequest.status });
        } else {
            res.json({ status: 'none' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
