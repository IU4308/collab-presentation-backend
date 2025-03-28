import mongoose from 'mongoose';

const presentationSchema = new mongoose.Schema({
    presentationId: { type: String, index: true },
    // cover: String,
    creatorId: String,
    title: String,
    slides: [
        {
            slideId: String,
            src: String,
            alt: String,
            fields: [
                {
                    id: String,
                    content: String,
                    position: {
                        x: Number,
                        y: Number,
                    },
                },
            ],
        },
    ],
});

export const Presentation = mongoose.model('Presentation', presentationSchema);
