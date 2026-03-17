const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    code: {
        type: String,
        required: true,
        unique: true
    },
    // Experiment Details
    aim: {
        type: String,
        default: ''
    },
    procedure: {
        type: [String], // Array of steps
        default: []
    },
    components: {
        type: [String], // Array of component names required
        default: []
    },
    quiz: [{
        question: String,
        options: [String],
        answer: String
    }],
    dueAt: {
        type: Date,
        default: null
    },
    attemptLimit: {
        type: Number,
        default: null
    },
    gradingRubric: {
        type: Object,
        default: null
    },
    simulationEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Classroom = mongoose.model('Classroom', classroomSchema);
module.exports = Classroom;
