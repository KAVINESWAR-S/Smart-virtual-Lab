const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');
const Circuit = require('../models/Circuit.js');

function generateShareId() {
    // 12 chars URL-safe-ish (base64url)
    return crypto.randomBytes(9).toString('base64url');
}

// @desc    Create a circuit
// @route   POST /api/circuits
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title, circuitData } = req.body;
    if (!circuitData) {
        return res.status(400).json({ message: 'circuitData is required' });
    }

    try {
        const circuit = await Circuit.create({
            owner: req.user._id,
            title: title || 'Untitled circuit',
            circuitData,
        });
        res.status(201).json(circuit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    List my circuits
// @route   GET /api/circuits/my
// @access  Private
router.get('/my', protect, async (req, res) => {
    try {
        const circuits = await Circuit.find({ owner: req.user._id }).sort({ updatedAt: -1 });
        res.json(circuits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Public load circuit by shareId (read-only)
// @route   GET /api/circuits/share/:shareId
// @access  Public
router.get('/share/:shareId', async (req, res) => {
    try {
        const circuit = await Circuit.findOne({ shareId: req.params.shareId, isPublic: true });
        if (!circuit) return res.status(404).json({ message: 'Shared circuit not found' });
        res.json(circuit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Load my circuit by id
// @route   GET /api/circuits/:id
// @access  Private (owner)
router.get('/:id', protect, async (req, res) => {
    try {
        const circuit = await Circuit.findById(req.params.id);
        if (!circuit) return res.status(404).json({ message: 'Circuit not found' });
        if (!circuit.owner.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
        res.json(circuit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Enable/rotate share for a circuit
// @route   POST /api/circuits/:id/share
// @access  Private (owner)
router.post('/:id/share', protect, async (req, res) => {
    const { enabled = true, rotate = false } = req.body || {};

    try {
        const circuit = await Circuit.findById(req.params.id);
        if (!circuit) return res.status(404).json({ message: 'Circuit not found' });
        if (!circuit.owner.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });

        circuit.isPublic = !!enabled;
        if (enabled) {
            if (!circuit.shareId || rotate) {
                // Retry on rare collisions
                for (let i = 0; i < 5; i++) {
                    circuit.shareId = generateShareId();
                    try {
                        await circuit.save();
                        return res.json(circuit);
                    } catch (err) {
                        if (err?.code === 11000) continue;
                        throw err;
                    }
                }
                return res.status(500).json({ message: 'Failed to generate shareId' });
            }
        } else {
            circuit.shareId = undefined;
        }

        await circuit.save();
        res.json(circuit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

