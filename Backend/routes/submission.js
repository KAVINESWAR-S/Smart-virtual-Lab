const express = require('express');
const router = express.Router();
const { protect, teacherOnly, adminOrTeacher } = require('../middleware/authMiddleware.js');
const Submission = require('../models/Submission.js');
const Classroom = require('../models/Classroom.js');
const { computeCircuitMetrics, gradeCircuit } = require('../utils/circuitMetrics.js');

// ... (previous routes)

// @desc    Submit an experiment (Circuit or Quiz)
// @route   POST /api/submissions
// @access  Student only
router.post('/', protect, async (req, res) => {
    const { classroomId, experimentTitle, circuitData, quizScore } = req.body;
    if (!classroomId && !experimentTitle) {
        return res.status(400).json({ message: 'classroomId is required' });
    }

    try {
        let classroom = null;
        if (classroomId) {
            classroom = await Classroom.findById(classroomId);
            if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
        }

        const hasCircuitPayload = circuitData !== undefined && circuitData !== null;
        const hasQuizPayload = quizScore !== undefined;
        const shouldRegrade = hasCircuitPayload || hasQuizPayload;

        let submission = await Submission.findOne({
            student: req.user._id,
            ...(classroomId ? { classroom: classroomId } : { experimentTitle })
        });

        if (submission) {
            const willUpdateCircuit = circuitData !== undefined && circuitData !== null;
            const willUpdateQuiz = quizScore !== undefined;

            // Attempt limit: count a new attempt only when resubmitting a field that already exists
            let isAttempt = false;
            if (willUpdateCircuit) {
                isAttempt = isAttempt || submission.circuitData != null;
                submission.circuitData = circuitData;
            }
            if (willUpdateQuiz) {
                isAttempt = isAttempt || submission.quizScore != null;
                submission.quizScore = quizScore;
            }

            if (!submission.classroom && classroomId) submission.classroom = classroomId;
            if (!submission.experimentTitle) submission.experimentTitle = experimentTitle || classroom?.name || submission.experimentTitle;

            if (isAttempt) {
                const nextAttempts = (submission.attemptsUsed || 0) + 1;
                const limit = classroom?.attemptLimit ?? null;
                if (limit != null && nextAttempts > limit) {
                    return res.status(400).json({ message: `Attempt limit reached (${limit})` });
                }
                submission.attemptsUsed = nextAttempts;
                submission.lastAttemptAt = new Date();
            } else if (!submission.attemptsUsed) {
                // First submit counts as 1 attempt (if any meaningful data is provided)
                if (willUpdateCircuit || willUpdateQuiz) {
                    submission.attemptsUsed = 1;
                    submission.lastAttemptAt = new Date();
                }
            }

            if (shouldRegrade && submission.circuitData) {
                const metrics = computeCircuitMetrics(submission.circuitData);
                const { simulationScore, scoreBreakdown } = gradeCircuit({
                    metrics,
                    rubric: classroom?.gradingRubric || null,
                });
                submission.metricsSnapshot = metrics;
                submission.simulationScore = simulationScore;
                submission.scoreBreakdown = scoreBreakdown;
            }

            await submission.save();
            return res.json(submission);
        }

        let metricsSnapshot = null;
        let simulationScore = null;
        let scoreBreakdown = null;
        if (hasCircuitPayload) {
            metricsSnapshot = computeCircuitMetrics(circuitData);
            const gradeResult = gradeCircuit({ metrics: metricsSnapshot, rubric: classroom?.gradingRubric || null });
            simulationScore = gradeResult.simulationScore;
            scoreBreakdown = gradeResult.scoreBreakdown;
        }

        // Create new
        submission = await Submission.create({
            student: req.user._id,
            classroom: classroomId || undefined,
            experimentTitle: experimentTitle || classroom?.name || 'Untitled experiment',
            circuitData: circuitData || {},
            quizScore: quizScore !== undefined ? quizScore : null,
            attemptsUsed: (circuitData || quizScore !== undefined) ? 1 : 0,
            lastAttemptAt: (circuitData || quizScore !== undefined) ? new Date() : null,
            metricsSnapshot,
            simulationScore,
            scoreBreakdown,
        });

        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get My Submissions
// @route   GET /api/submissions/my
// @access  Student only
router.get('/my', protect, async (req, res) => {
    try {
        const submissions = await Submission.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Submissions for a student (Teacher view)
// @route   GET /api/submissions/student/:studentId
// @access  Teacher only
router.get('/student/:studentId', protect, teacherOnly, async (req, res) => {
    try {
        const submissions = await Submission.find({ student: req.params.studentId }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get All Submissions (Optional filter by experimentTitle)
// @route   GET /api/submissions
// @access  Teacher or Admin
router.get('/', protect, adminOrTeacher, async (req, res) => {
    const { experimentTitle, classroomId } = req.query;
    try {
        let query = {};
        if (classroomId) {
            query.classroom = classroomId;
        } else if (experimentTitle) {
            query.experimentTitle = experimentTitle;
        }
        const submissions = await Submission.find(query).populate('student', 'name email').sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Single Submission
// @route   GET /api/submissions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id).populate('student', 'name email');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Access check
        if (req.user.role === 'student' && !submission.student._id.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Teacher only
router.put('/:id/grade', protect, teacherOnly, async (req, res) => {
    const { grade, feedback } = req.body;

    try {
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.grade = grade;
        submission.feedback = feedback;
        await submission.save();

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
