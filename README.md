# Portfolio Backend

A Node.js backend service that integrates with Spotify Web API and WakaTime API to fetch currently playing music data and coding statistics for portfolio display.

## Features

- Spotify OAuth 2.0 authentication flow
- Automatic token refresh handling
- MongoDB integration for token storage
- Currently playing music data endpoint
- WakaTime integration for coding statistics
- Daily, weekly, and summary coding hours tracking
- Error handling and validation

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Spotify Developer Account with registered app
- WakaTime account with API key

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/spotify-portfolio
   CLIENT_ID=your_spotify_client_id
   CLIENT_SECRET=your_spotify_client_secret
   REDIRECT_URI=http://localhost:3000/api/v1/auth/callback
   WAKATIME_API_KEY=your_wakatime_api_key
   ```

4. **Spotify App Setup**

   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add `http://localhost:3000/api/v1/auth/callback` to Redirect URIs
   - Copy Client ID and Client Secret to your `.env` file

5. **WakaTime Setup**

   - Go to [WakaTime Account Settings](https://wakatime.com/settings/account)
   - Copy your API key
   - Add the API key to your `.env` file as `WAKATIME_API_KEY`

6. **Start the server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication Flow

1. **Login** - `GET /api/v1/auth/login`

   - Redirects to Spotify authorization page
   - User grants permissions

2. **Callback** - `GET /api/v1/auth/callback`

   - Handles Spotify callback after authorization
   - Stores tokens in database

3. **Now Playing** - `GET /api/v1/auth/now-playing`
   - Returns currently playing music data
   - Automatically refreshes tokens if needed

### WakaTime Integration

1. **Today's Coding Hours** - `GET /api/v1/wakatime/today`

   - Returns today's coding statistics
   - Includes total time and language breakdown

2. **Yesterday's Coding Hours** - `GET /api/v1/wakatime/yesterday`

   - Returns yesterday's coding statistics
   - Includes total time and language breakdown

3. **Weekly Coding Hours** - `GET /api/v1/wakatime/weekly`

   - Returns last 7 days coding statistics
   - Includes daily breakdown and language summary

4. **Coding Hours Summary** - `GET /api/v1/wakatime/summary`
   - Returns combined summary of today, yesterday, and weekly stats
   - Simple format for quick overview

## Response Format

### Now Playing Endpoint Response

```json
{
  "is_playing": true,
  "progress_ms": 15000,
  "item": {
    "id": "track_id",
    "name": "Song Name",
    "artists": ["Artist 1", "Artist 2"],
    "album": "Album Name",
    "album_image": "https://i.scdn.co/image/...",
    "external_url": "https://open.spotify.com/track/..."
  }
}
```

### WakaTime Endpoint Responses

#### Today's Coding Hours

```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "total_time": "4h 30m",
    "total_seconds": 16200,
    "languages": [
      {
        "name": "JavaScript",
        "time": "2h 15m",
        "percentage": 50.0
      },
      {
        "name": "Python",
        "time": "1h 45m",
        "percentage": 38.9
      }
    ]
  }
}
```

#### Coding Hours Summary

```json
{
  "success": true,
  "data": {
    "today": {
      "time": "4h 30m",
      "seconds": 16200
    },
    "yesterday": {
      "time": "3h 15m",
      "seconds": 11700
    },
    "this_week": {
      "time": "28h 45m",
      "seconds": 103500
    },
    "summary": {
      "today": "4h 30m",
      "yesterday": "3h 15m",
      "this_week": "28h 45m"
    }
  }
}
```

## Project Structure

```
src/
├── controller/
│   ├── authController.js      # Spotify authentication logic
│   └── wakaTimeController.js  # WakaTime coding stats logic
├── model/
│   └── spotify.js            # MongoDB schema
├── routes/
│   ├── authRoutes.js         # Spotify route definitions
│   └── wakaTimeRoutes.js     # WakaTime route definitions
├── utility/
│   ├── errorHandler.js       # Error handling middleware
│   ├── getAccessToken.js     # Token refresh utility
│   ├── TryCatch.js           # Async error wrapper
│   └── wakaTimeService.js    # WakaTime API service
└── index.js                  # Main server file
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Spotify Web API** - Music data source
- **WakaTime API** - Coding statistics source

## Development

- **Start development server**: `npm run dev`
- **Start production server**: `npm start`

## Error Handling

The application includes comprehensive error handling:

- Custom error classes
- Try-catch wrapper for async functions
- HTTP status code management
- Detailed error messages

## Security Notes

- Tokens are stored securely in MongoDB
- Automatic token refresh prevents expiration
- Environment variables for sensitive data
- Proper error handling prevents information leakage
