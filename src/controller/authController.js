import { getAccessToken } from "../utility/getAccessToken.js";
import { TryCatch } from "../utility/TryCatch.js";
import qs from "qs";
import dotenv from "dotenv";
import Spotify from "../model/spotify.js";
import { ErrorHandler } from "../utility/errorHandler.js";

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = "user-read-currently-playing user-read-playback-state";

export const handleLogin = TryCatch(async (req, res) => {
    const params = qs.stringify({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPE,
    });
    res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

export const handleCallback = TryCatch(async (req, res) => {
    const code = req.query.code;
    if (!code) {
        throw new ErrorHandler("No authorization code provided", 400);
    }

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        },
        body: qs.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
        }),
    });

    if (!tokenRes.ok) {
        throw new ErrorHandler("Failed to exchange code for tokens", 400);
    }

    const tokenData = await tokenRes.json();

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const spotifyData = {
        name: "default_user",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
    };

    await Spotify.findOneAndUpdate(
        { name: "default_user" },
        spotifyData,
        { upsert: true, new: true }
    );

    res.send("Spotify connected successfully. You can close this window.");
});

export const handleNowPlaying = TryCatch(async (req, res) => {
    const spotifyData = await Spotify.findOne({ name: "default_user" });
    if (!spotifyData) {
        throw new ErrorHandler("Not authorized. Please login first.", 401);
    }

    let refreshToken = spotifyData.refresh_token;
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const accessTokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });
    if (!accessTokenResponse.ok) {
        const errorText = await accessTokenResponse.text();
        throw new ErrorHandler(`Failed to refresh token: ${errorText}`, accessTokenResponse.status);
    }

    const accessTokenData = await accessTokenResponse.json(); 
    const accessToken = accessTokenData.access_token;

    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
       return res.status(400).json({success: false, message: "Failed to get currently playing track"});
    } 

    if (response.status === 204) {
        return res.status(200).json({ track_id: spotifyData.last_played_id });
    } else { 
        const data = await response.json(); 
        if (data.is_playing) {
            const updatedSpotifyData = await Spotify.findOneAndUpdate(
                { name: "default_user" },
                { last_played_id: data.item?.id, access_token: accessToken },
                { upsert: true, new: true }
            );
            return res.status(200).json({ track_id: updatedSpotifyData.last_played_id });
        }
        else {
            return res.status(200).json({ track_id: spotifyData.last_played_id });
        }
    } 
});      