import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; 
import { Presentation } from '../model/Presentation.js';

dotenv.config();

mongoose.connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
});

const presentations = [
    {
        presentationId: uuidv4(),
        cover: "/slide1.jpg",
        creatorId: uuidv4(),
        editorsId: [2, 3],
        slides: [
            {
                slideId: uuidv4(),
                src: "/slide1.jpg",
                alt: "Slide 1",
                fields: [
                    {
                        id: uuidv4(),
                        content: "<p>Welcome to Slide 1</p>",
                        position: { x: 100, y: 150 },
                    },
                    {
                        id: uuidv4(),
                        content: "<p>Subtitle for Slide 1</p>",
                        position: { x: 200, y: 250 },
                    },
                ],
            },
            {
                slideId: uuidv4(),
                src: "/slide2.jpg",
                alt: "Slide 2",
                fields: [
                    {
                        id: uuidv4(),
                        content: "<p>Welcome to Slide 2</p>",
                        position: { x: 100, y: 150 },
                    },
                    {
                        id: uuidv4(),
                        content: "<p>Subtitle for Slide 2</p>",
                        position: { x: 200, y: 250 },
                    },
                ],
            },
        ],
    },
    {
        presentationId: uuidv4(),
        cover: "/slide2.jpg",
        creatorId: uuidv4(),
        editorsId: [4, 5],
        slides: [
            {
                slideId: uuidv4(),
                src: "/slide3.jpg",
                alt: "Slide 3",
                fields: [
                    {
                        id: uuidv4(),
                        content: "<p>Welcome to Slide 3</p>",
                        position: { x: 100, y: 150 },
                    },
                ],
            },
        ],
    },
];

const seedDatabase = async () => {
    try {
        await Presentation.deleteMany({});
        console.log('Existing presentations cleared');

        await Presentation.insertMany(presentations);
        console.log('Presentations seeded successfully');

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding database:', error.message);
        mongoose.connection.close();
    }
};

seedDatabase();