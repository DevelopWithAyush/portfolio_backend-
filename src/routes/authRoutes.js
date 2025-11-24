import express from 'express';
import { handleCallback, handleLogin, handleNowPlaying } from '../controller/authController.js';

const router = express.Router();

router.get('/login', handleLogin);
router.get('/callback', handleCallback);
router.get('/now-playing', handleNowPlaying);

export default router;