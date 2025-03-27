import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// const mongoURI = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/<database>?retryWrites=true&w=majority';

mongoose.connect(process.env.DATABASE_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
});