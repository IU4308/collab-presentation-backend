import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import './config/db.js';
import { Presentation } from './model/Presentation.js';
import { findField, findPresentation, findSlide } from './lib/utils.js';

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

app.post('/presentations/:presentationId/slides/:slideId/fields', async (req, res) => {
    const { presentationId, slideId } = req.params
    const newField = req.body;
    try {
        const presentation = await findPresentation(presentationId);
        const slide = findSlide(presentation, slideId);
        slide.fields.push(newField);
        await presentation.save();
        io.emit('updatePresentation', presentation); 
        res.status(200).send('Fields updated');
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
        res.status(200).send('Field deleted');
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
        console.log(field)
        await presentation.save();

        io.emit('updatePresentation', presentation);
        res.status(200).send('Field updated');
    } catch (error) {
        console.log('Error updating fields', error.message)
    }
})


io.on('connection', async (socket) => {
    console.log('New client connected');
    socket.on('updateField', ({ slideId, fieldId, updatedField }) => {
        console.log(`Field updated: ${fieldId}`, updatedField);
        socket.broadcast.emit('fieldUpdated', { slideId, fieldId, updatedField });
    })
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));