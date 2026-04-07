const express = require('express');
const router = express.Router();
const { protect, teacherOnly } = require('../middleware/authMiddleware.js');
const Classroom = require('../models/Classroom.js');
const Submission = require('../models/Submission.js');
const User = require('../models/User.js');
const multer = require('multer');
const pdfParse = require('pdf-parse');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// @desc    Extract text from PDF
// @route   POST /api/classrooms/extract-pdf
// @access  Teacher only
router.post('/extract-pdf', protect, teacherOnly, upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        const pdfData = await pdfParse(req.file.buffer);
        const text = pdfData.text;

        // Simple Heuristic Extraction
        let aim = '';
        let components = [];
        let procedure = [];

        // Try extracting Aim (everything between "Aim" and "Components" or "Procedure")
        const aimMatch = text.match(/(?:Aim|Objective)[:\s]+(.*?)(?=Components|Apparatus|Procedure|Theory|$)/is);
        if (aimMatch && aimMatch[1]) aim = aimMatch[1].trim();

        // Try extracting Components/Apparatus
        const compMatch = text.match(/(?:Components Required|Apparatus|Materials)[:\s]+(.*?)(?=Procedure|Theory|Observation|$)/is);
        if (compMatch && compMatch[1]) {
            components = compMatch[1].split(/[,\n]/).map(c => c.replace(/^[-\*\d\.\s]+/, '').trim()).filter(c => c);
        }

        // Try extracting Procedure
        const procMatch = text.match(/(?:Procedure|Steps)[:\s]+(.*?)(?=Observation|Conclusion|Result|$)/is);
        if (procMatch && procMatch[1]) {
            procedure = procMatch[1].split(/\n/).map(p => p.replace(/^[-\*\d\.\s]+/, '').trim()).filter(p => p.length > 5);
        }

        res.json({ aim, components, procedure });
    } catch (error) {
        console.error('PDF Extraction Error:', error);
        res.status(500).json({ message: 'Failed to extract text from PDF' });
    }
});

// @desc    Create a new classroom (Experiment)
// @route   POST /api/classrooms
// @access  Teacher only
router.post('/', protect, teacherOnly, async (req, res) => {
    const { name, aim, procedure, components, quiz, simulationEnabled, dueAt, attemptLimit, gradingRubric } = req.body;
    // Generate a unique 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const classroom = await Classroom.create({
            name,
            teacher: req.user._id,
            code,
            aim,
            procedure,
            components,
            quiz,
            dueAt: dueAt || null,
            attemptLimit: attemptLimit ?? null,
            gradingRubric: gradingRubric ?? null,
            simulationEnabled
        });
        res.status(201).json(classroom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all classrooms for the logged in user
// @route   GET /api/classrooms
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let classrooms;
        if (req.user.role === 'admin') {
            classrooms = await Classroom.find({});
        } else if (req.user.role === 'teacher') {
            classrooms = await Classroom.find({ teacher: req.user._id });
        } else {
            classrooms = await Classroom.find({ students: req.user._id });
        }
        res.json(classrooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Join a classroom
// @route   POST /api/classrooms/join
// @access  Student only
router.post('/join', protect, async (req, res) => {
    const { code } = req.body;

    try {
        const classroom = await Classroom.findOne({ code });

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Check if already joined
        if (classroom.students.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already joined this classroom' });
        }

        classroom.students.push(req.user._id);
        await classroom.save();

        // Add to user's joined classrooms
        req.user.classroomsJoined.push(classroom._id);
        await req.user.save();

        res.json({ message: 'Classroom joined successfully', classroom });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get classroom details (with students for teacher)
// @route   GET /api/classrooms/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate('students', 'name email')
            .populate('teacher', 'name email');

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Verify access
        if (req.user.role === 'student' && !classroom.students.some(s => s._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not authorized to view this classroom' });
        }
        if (req.user.role === 'teacher' && !classroom.teacher._id.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to view this classroom' });
        }

        res.json(classroom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a classroom (Experiment)
// @route   DELETE /api/classrooms/:id
// @access  Teacher only (must be the creator)
router.delete('/:id', protect, teacherOnly, async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Verify the teacher owns this experiment
        if (!classroom.teacher.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to delete this experiment' });
        }

        // Delete all submissions associated with this classroom
        await Submission.deleteMany({ classroom: classroom._id });

        // Remove this classroom from all students' classroomsJoined arrays
        await User.updateMany(
            { classroomsJoined: classroom._id },
            { $pull: { classroomsJoined: classroom._id } }
        );

        // Delete the classroom
        await Classroom.findByIdAndDelete(req.params.id);

        res.json({ message: 'Experiment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
