import { TryCatch } from "./TryCatch.js";
import qs from "qs";
import { ErrorHandler } from "./errorHandler.js";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export const getAccessToken = TryCatch(async (REFRESH_TOKEN) => {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        },
        body: qs.stringify({
            grant_type: "refresh_token",
            refresh_token: REFRESH_TOKEN,
        }),
    });

    if (!response.ok) {
        throw new ErrorHandler("Failed to refresh access token", 401);
    }

    const tokenData = await response.json();
    return tokenData;
});