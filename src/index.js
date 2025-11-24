import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import wakaTimeRoutes from './routes/wakaTimeRoutes.js';
import gitRoutes from './routes/gitRoutes.js';
import os from 'os';
import { errorMiddleware } from './utility/errorHandler.js';

import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wakatime', wakaTimeRoutes);
app.use('/api/v1/git', gitRoutes);
app.use(errorMiddleware);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}; 





const API_KEY = process.env.WAKATIME_API_KEY;

if (!API_KEY) {
    console.warn('Missing WAKATIME_API_KEY in .env');
}

// helper: ISO date (yyyy-mm-dd)
const d = (date) => date.toISOString().slice(0, 10);

// GET /api/cursor-hours?range=today|yesterday|last7|last30
app.get('/api/cursor-hours', async (req, res) => {
    try {
        const range = (req.query.range || 'today').toString();
        const today = new Date();
        let start, end;

        if (range === 'today') {
            start = d(today);
            end = d(today);
        } else if (range === 'last7') {
            const s = new Date(today);
            s.setDate(s.getDate() - 6);
            start = d(s); end = d(today);
        } else if (range === 'last30') {
            const s = new Date(today);
            s.setDate(s.getDate() - 29);
            start = d(s); end = d(today);
        } else { // yesterday (default)
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            start = d(y); end = d(y);
        }

        // WakaTime summaries filtered to the Cursor editor
        const url = `https://wakatime.com/api/v1/users/current/summaries?start=${start}&end=${end}&editors=Cursor`;

        const r = await fetch(url, {
            headers: {
                // WakaTime uses Basic auth where the API key is the username, password empty
                Authorization: 'Basic ' + Buffer.from(`${API_KEY}:`).toString('base64'),
            },
        });

        if (!r.ok) {
            const text = await r.text();
            return res.status(r.status).json({ error: text });
        }

        const json = await r.json();
        console.log(json.data[0].grand_total);
        // Sum total_seconds across the returned days
        const totalSeconds = (json.data || []).reduce((acc, day) => {
            // day.grand_total.total_seconds exists even when 0
            return acc + (day.grand_total?.total_seconds || 0);
        }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.round((totalSeconds % 3600) / 60);

        res.json({
            range,
            start,
            end,
            total_seconds: totalSeconds,
            human_readable: `${hours}h ${minutes}m`,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});


const startServer = async () => {
    await connectDB();

    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
        const networks = os.networkInterfaces();
        const ip = networks['Wi-Fi']?.find(net => net.family === 'IPv4')?.address || 'localhost';
        console.log(`Server IP address: ${ip}`);
    });
};

startServer(); 