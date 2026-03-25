const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PasswordRequest = require('../models/PasswordRequest');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin only
router.get('/users', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new teacher
// @route   POST /api/admin/users
// @access  Admin only
router.post('/users', protect, adminOnly, async (req, res) => {
    const { name, email, password, role, department } = req.body;

    // Only allow creating teachers or admins
    if (role !== 'teacher' && role !== 'admin') {
        return res.status(400).json({ message: 'Can only create Teacher or Admin accounts here' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            department: role === 'teacher' ? department : undefined,
            isFirstLogin: role === 'teacher'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin only
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin force reset user password
// @route   PUT /api/admin/users/:id/password
// @access  Admin only
router.put('/users/:id/password', protect, adminOnly, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await User.findById(req.params.id);

        if (user) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all pending password requests
// @route   GET /api/admin/password-requests
// @access  Admin only
router.get('/password-requests', protect, adminOnly, async (req, res) => {
    try {
        const requests = await PasswordRequest.find({ status: 'pending' }).populate('user', 'name email role');
        const studentRequests = requests.filter(req => req.user && req.user.role === 'student');
        res.json(studentRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update password request status
// @route   PUT /api/admin/password-requests/:id
// @access  Admin only
router.put('/password-requests/:id', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body; // 'resolved' or 'rejected'
        const request = await PasswordRequest.findById(req.params.id);
        
        if (request) {
            request.status = status;
            await request.save();
            res.json(request);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
