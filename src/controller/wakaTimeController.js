import { TryCatch } from "../utility/TryCatch.js";
import {
    getTodayStats,
    getYesterdayStats,
    getWeeklyStats,
    formatTime
} from "../utility/wakaTimeService.js";

export const getTodayCodingHours = TryCatch(async (req, res) => {
    const data = await getTodayStats();

    const totalTime = data.data?.grand_total?.total_seconds || 0;
    const formattedTime = formatTime(totalTime);

    const response = {
        date: data.data?.range?.date || new Date().toISOString().split('T')[0],
        total_time: formattedTime,
        total_seconds: totalTime,
        languages: data.data?.languages?.slice(0, 5).map(lang => ({
            name: lang.name,
            time: formatTime(lang.total_seconds),
            percentage: lang.percent
        })) || []
    };

    res.json({
        success: true,
        data: response
    });
});

export const getYesterdayCodingHours = TryCatch(async (req, res) => {
    const data = await getYesterdayStats();

    const totalTime = data.data?.grand_total?.total_seconds || 0;
    const formattedTime = formatTime(totalTime);

    const response = {
        date: data.data?.range?.date || new Date(Date.now() - 86400000).toISOString().split('T')[0],
        total_time: formattedTime,
        total_seconds: totalTime,
        languages: data.data?.languages?.slice(0, 5).map(lang => ({
            name: lang.name,
            time: formatTime(lang.total_seconds),
            percentage: lang.percent
        })) || []
    };

    res.json({
        success: true,
        data: response
    });
});

export const getWeeklyCodingHours = TryCatch(async (req, res) => {
    const data = await getWeeklyStats();

    const totalTime = data.data?.total_seconds || 0;
    const formattedTime = formatTime(totalTime);

    const dailyBreakdown = data.data?.days?.map(day => ({
        date: day.date,
        total_time: formatTime(day.total_seconds),
        total_seconds: day.total_seconds
    })) || [];

    const response = {
        period: "Last 7 days",
        total_time: formattedTime,
        total_seconds: totalTime,
        daily_breakdown: dailyBreakdown,
        languages: data.data?.languages?.slice(0, 5).map(lang => ({
            name: lang.name,
            time: formatTime(lang.total_seconds),
            percentage: lang.percent
        })) || []
    };

    res.json({
        success: true,
        data: response
    });
});

export const getCodingHoursSummary = TryCatch(async (req, res) => {
    const [todayData, yesterdayData, weeklyData] = await Promise.all([
        getTodayStats(),
        getYesterdayStats(),
        getWeeklyStats()
    ]);

    const todayTime = todayData.data?.grand_total?.total_seconds || 0;
    const yesterdayTime = yesterdayData.data?.grand_total?.total_seconds || 0;
    const weeklyTime = weeklyData.data?.total_seconds || 0;

    const response = {
        today: {
            time: formatTime(todayTime),
            seconds: todayTime
        },
        yesterday: {
            time: formatTime(yesterdayTime),
            seconds: yesterdayTime
        },
        this_week: {
            time: formatTime(weeklyTime),
            seconds: weeklyTime
        },
        summary: {
            today: formatTime(todayTime),
            yesterday: formatTime(yesterdayTime),
            this_week: formatTime(weeklyTime)
        }
    };

    res.json({
        success: true,
        data: response
    });
});
