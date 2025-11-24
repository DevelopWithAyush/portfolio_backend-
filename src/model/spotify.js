import mongoose from 'mongoose';

const spotifySchema = new mongoose.Schema({
    name: { type: String, required: true },
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    last_played_id: { type: String, required: true },
});

const Spotify = mongoose.model('Spotify', spotifySchema);

export default Spotify;