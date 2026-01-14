import express from 'express';
import { getResumeData } from '../controller/resumeController.js';

const router = express.Router();

router.get('/', getResumeData);

export default router;