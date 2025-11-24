// wakatime.service.mjs
// ESM module. Ensure `"type": "module"` in package.json.
// Requires process.env.WAKATIME_API_KEY
import { ErrorHandler } from "./errorHandler.js";

const WAKATIME_API_KEY = process.env.WAKATIME_API_KEY;
const WAKATIME_BASE_URL = "https://wakatime.com/api/v1";

/* ---------------------------- helpers ----------------------------------- */

const assertApiKey = () => {
    if (!WAKATIME_API_KEY) {
        throw new ErrorHandler("WakaTime API key not configured", 500);
    }
};

const authHeader = () =>
    "Basic " + Buffer.from(`${WAKATIME_API_KEY}:`).toString("base64");

const isoDate = (d) => d.toISOString().slice(0, 10);

async function getJson(url) {
    const res = await fetch(url, {
        headers: { Authorization: authHeader() },
        cache: "no-store",
    });
    if (!res.ok) {
        if (res.status === 401) throw new ErrorHandler("Invalid WakaTime API key", 401);
        if (res.status === 404) throw new ErrorHandler("WakaTime endpoint not found", 404);
        const text = await res.text().catch(() => "");
        throw new ErrorHandler(
            `WakaTime API error: ${res.status} ${res.statusText} ${text || ""}`.trim(),
            res.status
        );
    }
    return res.json();
}

/** format seconds -> "Xh Ym" */
export const formatTime = (seconds) => {
    const s = Number(seconds) || 0;
    if (s <= 0) return "0m";
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

/** Build summaries URL with optional filters (editors/projects/languages). */
function buildSummariesUrl({ start, end, editors, projects, languages } = {}) {
    const params = new URLSearchParams();
    params.set("start", start);
    params.set("end", end);
    if (editors) params.set("editors", editors);           // e.g., "Cursor"
    if (projects) params.set("project", projects);         // e.g., "my-project"
    if (languages) params.set("languages", languages);     // e.g., "TypeScript"
    return `${WAKATIME_BASE_URL}/users/current/summaries?${params.toString()}`;
}

/** Normalize a single-day summary object from WakaTime into a clean shape. */
function normalizeSummaryDay(day) {
    const gt = day.grand_total ?? {};
    const range = day.range ?? {};
    return {
        date: range.date || null,
        range,                       // includes start, end, text, timezone
        grand_total: {
            hours: gt.hours ?? 0,
            minutes: gt.minutes ?? 0,
            total_seconds: gt.total_seconds ?? 0,
            digital: gt.digital ?? "0:00",
            decimal: gt.decimal ?? "0.00",
            text: gt.text ?? "0 mins",
            ai_additions: gt.ai_additions ?? 0,
            ai_deletions: gt.ai_deletions ?? 0,
            human_additions: gt.human_additions ?? 0,
            human_deletions: gt.human_deletions ?? 0,
        },
        // pass through rich arrays so you can show breakdowns on your site
        projects: day.projects ?? [],
        languages: day.languages ?? [],
        dependencies: day.dependencies ?? [],
        machines: day.machines ?? [],
        editors: day.editors ?? [],
        operating_systems: day.operating_systems ?? [],
        categories: day.categories ?? [],
        human_readable: formatTime(gt.total_seconds ?? 0),
    };
}

/* ----------------------------- core ------------------------------------- */
/**
 * Get summaries for a date range with optional filters.
 * Returns the raw WakaTime response as well as normalized per-day objects.
 */
export async function getSummaries({
    start,
    end,
    editors = "Cursor",     // default to Cursor so your portfolio shows Cursor time
    projects,               // optional
    languages,              // optional
} = {}) {
    assertApiKey();
    if (!start || !end) throw new ErrorHandler("start and end are required (YYYY-MM-DD)", 400);

    const url = buildSummariesUrl({ start, end, editors, projects, languages });
    const json = await getJson(url);

    // json.data is an array of days like the one you logged:
    // [{ grand_total: {...}, range: {...}, projects: [...], editors: [...], ... }]
    const days = (json.data ?? []).map(normalizeSummaryDay);

    return {
        raw: json,    // if you need anything else later
        days,
    };
}

/**
 * Get Cursor-only time for a single day (normalized).
 * @param {string|null} date - "YYYY-MM-DD" (defaults to today)
 */
export async function getDailyStats(date = null, { editors = "Cursor", projects, languages } = {}) {
    const targetDate =
        typeof date === "string" && date.length >= 10 ? date : isoDate(new Date());

    const { days } = await getSummaries({
        start: targetDate,
        end: targetDate,
        editors,
        projects,
        languages,
    });

    const day = days[0] ?? normalizeSummaryDay({ grand_total: {}, range: { date: targetDate } });
    return day;
}

/** Today’s (normalized) */
export async function getTodayStats(opts = {}) {
    return getDailyStats(null, opts);
}

/** Yesterday’s (normalized) */
export async function getYesterdayStats(opts = {}) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return getDailyStats(isoDate(y), opts);
}

/**
 * Last 7 days (inclusive) aggregate for Cursor-only.
 * Returns totals plus the array of normalized days for charts.
 */
export async function getWeeklyStats({ editors = "Cursor", projects, languages } = {}) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    const start = isoDate(startDate);
    const end = isoDate(endDate);

    const { days } = await getSummaries({ start, end, editors, projects, languages });
    const total_seconds = days.reduce((acc, d) => acc + (d.grand_total.total_seconds || 0), 0);

    return {
        start,
        end,
        total_seconds,
        human_readable: formatTime(total_seconds),
        days, // keep for sparklines / charts / breakdowns
    };
}

/* --------------------------- debug helpers ------------------------------- */
// Use these while testing to see full nested objects (no [Object] truncation):
export function debugLog(obj, label = "DEBUG") {
    // Avoid noisy logs in prod; gate behind env if you like.
    console.log(`\n=== ${label} ===`);
    // prints full depth so projects/languages/editors etc. are visible
    console.dir(obj, { depth: null });
}
