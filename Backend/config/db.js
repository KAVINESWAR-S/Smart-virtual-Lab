const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from the .env file
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error: ', err.message);
        process.exit(1); // Exit the process with failure code
    }
};

module.exports = connectDB;