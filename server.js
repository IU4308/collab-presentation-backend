import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import './config/db.js';
import { Presentation } from './model/Presentation.js';
import { findField, findPresentation, findSlide } from './lib/utils.js';
import mongoose from 'mongoose';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.use(cors());
app.use(express.json());

app.get("/presentations", async(req, res) => {
    try {
        const presentations = await Presentation.find()
        res.json(presentations)
    } catch (error) {
        console.error('Error fetching presentations:', error.message);
        res.status(500).send('Error fetching presentations');
    }
})

app.post('/presentations', async (req, res) => {
    const { username, title } = req.body;
    try {
        const newPresentation = new Presentation({
            presentationId: new mongoose.Types.ObjectId().toString(),
            creatorId: username,
            title: title,
            slides: [
                {
                    slideId: new mongoose.Types.ObjectId().toString(),
                    src: "/blank.jpg",
                    alt: "blank",
                    fields: []
                }
            ]
        });
        await newPresentation.save();
        io.emit('newPresentation', newPresentation);
        res.status(201).json(newPresentation);
    } catch (error) {
        console.error('Error creating presentation:', error.message);
        res.status(500).send('Error creating presentation');
    }
})
  
app.get("/presentations/:presentationId", async (req, res) => {
  const { presentationId } = req.params;
  try {
      const presentation = await findPresentation(presentationId);
      res.json(presentation);
  } catch (error) {
      console.error('Error fetching presentation:', error.message);
      res.status(500).send('Error fetching presentation');
  }
})

app.post("/presentations/:presentationId/slides", async (req, res) => {
    const { presentationId } = req.params; 
    try {
        const presentation = await findPresentation(presentationId);
        presentation.slides.push({
            slideId: new mongoose.Types.ObjectId().toString(),
            src: "/blank.jpg",
            alt: "Slide 1",
            fields: []
        })
        await presentation.save();
        io.emit('updatePresentation', presentation); 
        res.status(200).send('Presentation has been updated');
    } catch (error) {
        console.error('Error adding new slide:', error.message);
        res.status(500).send('Error adding new slide');
    }
})

app.delete("/presentations/:presentationId/slides/:slideId", async (req, res) => {
    const { presentationId, slideId } = req.params;
    try {
        const presentation = await findPresentation(presentationId);
        presentation.slides = presentation.slides.filter(slide => slide.slideId != slideId)
        await presentation.save(); 
        io.emit('updatePresentation', presentation); 
        res.status(200).send('Slide has been deleted');
    } catch (error) {
        console.error('Error deleting slide:', error.message);
        res.status(500).send('Error deleting slide');
    } 
})

app.put("/presentations/:presentationId/slides/:slideId", async (req, res) => {
    const { presentationId, slideId } = req.params;
    const { template } = req.body
    try {
        const presentation = await findPresentation(presentationId);
        const slide = findSlide(presentation, slideId);
        slide.src = template;
        await presentation.save(); 
        io.emit('updatePresentation', presentation); 
        res.status(200).send('Slide has been updated');
    } catch (error) {
        console.error('Error updating slide:', error.message);
        res.status(500).send('Error updating slide');
    } 
})

app.post('/presentations/:presentationId/slides/:slideId/fields', async (req, res) => {
    const { presentationId, slideId } = req.params
    const newField = req.body;
    try {
        const presentation = await findPresentation(presentationId);
        const slide = findSlide(presentation, slideId);
        slide.fields.push(newField);
        await presentation.save();
        io.emit('updatePresentation', presentation); 
        res.status(200).send('Fields have been updated');
  } catch (error) {
        console.log('Error updating fields on the server: ', error.message)
        res.status(500).send('Error updating fields');
  }
});

app.delete(`/presentations/:presentationId/slides/:slideId/fields/:selectedId`, async (req, res) => {
    const { presentationId, slideId, selectedId } = req.params;
    try {
        const presentation = await findPresentation(presentationId);
        const slide = findSlide(presentation, slideId);
        slide.fields = slide.fields.filter((field) => field.id !== selectedId); 
        await presentation.save(); 
        io.emit('updatePresentation', presentation); 
        res.status(200).send('Field has been deleted');
    } catch (error) {
        console.error('Error deleting field:', error.message);
        res.status(500).send('Error deleting field');
    }
}) 

app.put(`/presentations/:presentationId/slides/:slideId/fields/:selectedId`, async (req, res) => {
    const { presentationId, slideId, selectedId } = req.params;
    const updatedField = req.body;
    try {
        const presentation = await findPresentation(presentationId);
        const slide = findSlide(presentation, slideId);
        const field = findField(slide, selectedId);
        field.content = updatedField.content;
        field.position = updatedField.position;
        await presentation.save();

        io.emit('updatePresentation', presentation);
        res.status(200).send('Field has been updated');
    } catch (error) {
        console.log('Error updating fields', error.message)
    }
})

let users = [];

io.on('connection', async (socket) => {
    console.log('New client connected');
    socket.on('updateField', ({ slideId, fieldId, updatedField }) => {
        socket.broadcast.emit('fieldUpdated', { slideId, fieldId, updatedField });
    })

    socket.on('joinPresentation', async ({ presentationId, username }) => {
        console.log(`User ${username} joined the presentation ${presentationId}`)
        const presentation = await Presentation.findOne({ presentationId });
        let role = 'viewer';
        if (username === presentation.creatorId) {
            role = 'creator';
        }

        const newUser = { socketId: socket.id, presentationId, username, role }
        const existingUser = users.find((user) => user.socketId === socket.id);
        if (!existingUser) {
            users.push(newUser)
        }
        io.emit('userEvent', (users))
    })

    socket.on('updateRole', ({ userId, role }) => {
        const user = users.find((user) => user.socketId === userId);
        if (user) {
            user.role = role;
            console.log(`Updated role of ${user.username} to ${role}`);
            io.emit('userEvent', users);
        } else {
            console.log(`User with socketId ${userId} not found`);
        }
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        users = users.filter((user) => user.socketId !== socket.id);
        io.emit('userEvent', (users))
    });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));