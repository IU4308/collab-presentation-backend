import cors from 'cors';

// const corsOptions = {
//     origin: [process.env.FRONTEND_URL], 
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], 
//     allowedHeaders: ['Content-Type', 'Authorization'], 
//     credentials: true,
// };

app.use(cors({ origin: '*' }));