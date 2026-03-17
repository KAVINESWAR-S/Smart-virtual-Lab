const mongoose = require('mongoose');

const circuitSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            trim: true,
            default: 'Untitled circuit',
        },
        circuitData: {
            type: Object, // { nodes, edges, ... } (ReactFlow JSON)
            required: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        shareId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
    },
    { timestamps: true }
);

const Circuit = mongoose.model('Circuit', circuitSchema);
module.exports = Circuit;

