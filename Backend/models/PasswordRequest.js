const mongoose = require('mongoose');

const passwordRequestSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'resolved', 'rejected'],
            default: 'pending'
        }
    },
    {
        timestamps: true,
    }
);

const PasswordRequest = mongoose.model('PasswordRequest', passwordRequestSchema);

module.exports = PasswordRequest;
