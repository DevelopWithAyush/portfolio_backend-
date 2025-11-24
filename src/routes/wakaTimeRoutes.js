import express from 'express';
import {
    getTodayCodingHours,
    getYesterdayCodingHours,
    getWeeklyCodingHours,
    getCodingHoursSummary
} from '../controller/wakaTimeController.js';

const router = express.Router();

router.get('/today', getTodayCodingHours);
router.get('/yesterday', getYesterdayCodingHours);
router.get('/weekly', getWeeklyCodingHours);
router.get('/summary', getCodingHoursSummary);

export default router;
