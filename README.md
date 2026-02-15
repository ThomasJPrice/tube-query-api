# Tube Tracker API

A serverless API built for Vercel that provides real-time London Underground tube information using the Transport for London (TFL) API.

## Features

- 🚇 Get all London Underground stations
- 🚉 Get tube lines for specific stations
- 🧭 Get real-time arrival predictions and directions
- 🚄 Get next 4 live trains with arrival times in seconds
- 🚦 Real-time line status (Good Service, Minor Delays, etc.)
- ⚡ Serverless and scalable on Vercel
- 🔒 Safe data handling with error management
- 📦 No API key required for TFL API

## API Endpoints

### 1. Get All Stations

```
GET /api/stations
```

Returns a list of all London Underground tube stations.

**Response Example:**
```json
{
  "success": true,
  "count": 270,
  "stations": [
    {
      "id": "940GZZLUOXC",
      "name": "Oxford Circus Underground Station",
      "lat": 51.515224,
      "lon": -0.141903,
      "modes": ["tube"],
      "lines": [
        {
          "id": "central",
          "name": "Central"
        },
        {
          "id": "victoria",
          "name": "Victoria"
        }
      ]
    }
  ]
}
```

### 2. Get Lines for a Station

```
GET /api/lines/[stationId]
```

Returns the tube lines that serve a specific station.

**Parameters:**
- `stationId` - The station ID (e.g., "940GZZLUOXC")

**Example Request:**
```
GET /api/lines/940GZZLUOXC
```

**Response Example:**
```json
{
  "success": true,
  "stationId": "940GZZLUOXC",
  "stationName": "Oxford Circus Underground Station",
  "count": 3,
  "lines": [
    {
      "id": "bakerloo",
      "name": "Bakerloo",
      "modeName": "tube"
    },
    {
      "id": "central",
      "name": "Central",
      "modeName": "tube"
    },
    {
      "id": "victoria",
      "name": "Victoria",
      "modeName": "tube"
    }
  ]
}
```

### 3. Get Directions for a Station and Line

```
GET /api/directions/[stationId]/[line]
```

Returns arrival predictions and directions (e.g., eastbound, westbound) for a specific station and line.

**Parameters:**
- `stationId` - The station ID (e.g., "940GZZLUOXC")
- `line` - The line ID (e.g., "central")

**Example Request:**
```
GET /api/directions/940GZZLUOXC/central
```

**Response Example:**
```json
{
  "success": true,
  "stationId": "940GZZLUOXC",
  "line": "central",
  "count": 2,
  "directions": [
    {
      "direction": "eastbound",
      "platforms": ["Eastbound - Platform 4"],
      "destinations": ["Epping", "Hainault"],
      "nextTrains": [
        {
          "vehicleId": "123",
          "destinationName": "Epping",
          "towards": "Epping",
          "expectedArrival": "2026-02-14T10:30:00Z",
          "timeToStation": 90,
          "currentLocation": "At Liverpool Street",
          "platformName": "Eastbound - Platform 4"
        }
      ]
    },
    {
      "direction": "westbound",
      "platforms": ["Westbound - Platform 3"],
      "destinations": ["West Ruislip", "Ealing Broadway"],
      "nextTrains": [...]
    }
  ],
  "totalArrivals": 8
}
```

### 4. Get Live Trains for a Specific Direction

```
GET /api/trains/[stationId]/[line]/[direction]
```

Returns the next 4 upcoming trains for a specific station, line, and direction with real-time arrival information.

**Parameters:**
- `stationId` - The station ID (e.g., "940GZZLUOXC")
- `line` - The line ID (e.g., "central")
- `direction` - The direction (e.g., "Eastbound", "Westbound", "Northbound", "Southbound")

**Important:** Use the exact direction format returned by the `/api/directions` endpoint (with capital first letter).

**🔴 No Caching:** This endpoint always fetches fresh data from the TFL API with no caching. Every request retrieves real-time train positions, arrival times, and current line status.

**Example Request:**
```
GET /api/trains/940GZZLUOXC/central/Eastbound
```

**Response Example:**
```json
{
  "success": true,
  "stationId": "940GZZLUOXC",
  "line": "central",
  "direction": "Eastbound",
  "lineStatus": {
    "statusSeverity": 10,
    "statusSeverityDescription": "Good Service",
    "reason": null
  },
  "count": 4,
  "trains": [
    {
      "position": 1,
      "destinationName": "Epping",
      "timeToStation": 90,
      "expectedArrival": "2026-02-15T10:30:00Z",
      "platformName": "Eastbound - Platform 4",
      "currentLocation": "At Liverpool Street",
      "towards": "Epping"
    },
    {
      "position": 2,
      "destinationName": "Hainault",
      "timeToStation": 180,
      "expectedArrival": "2026-02-15T10:31:30Z",
      "platformName": "Eastbound - Platform 4",
      "currentLocation": "Between Bank and Liverpool Street",
      "towards": "Hainault"
    },
    {
      "position": 3,
      "destinationName": "Epping",
      "timeToStation": 270,
      "expectedArrival": "2026-02-15T10:33:00Z",
      "platformName": "Eastbound - Platform 4",
      "currentLocation": "At Bank",
      "towards": "Epping"
    },
    {
      "position": 4,
      "destinationName": "Epping",
      "timeToStation": 360,
      "expectedArrival": "2026-02-15T10:34:30Z",
      "platformName": "Eastbound - Platform 4",
      "currentLocation": "Approaching Bank",
      "towards": "Epping"
    }
  ]
}
```

**Response Fields:**

**Line Status:**
- `lineStatus.statusSeverity` - Numeric severity code (see table below)
- `lineStatus.statusSeverityDescription` - Human-readable status description
- `lineStatus.reason` - Detailed explanation of any disruptions (null if good service)

**Train Information:**
- `position` - Train position in arrival order (1-4)
- `destinationName` - Final destination of the train
- `timeToStation` - **Time until arrival in seconds**
- `expectedArrival` - ISO 8601 timestamp of expected arrival
- `platformName` - Platform where the train will arrive
- `currentLocation` - Current location of the train
- `towards` - Direction/destination the train is heading

**Line Status Severity Levels:**

| Severity | Description | Meaning |
|----------|-------------|---------|
| 10 | Good Service | Normal service operating |
| 9 | Minor Delays | Service running with minor delays |
| 8 | Severe Delays | Service running with severe delays |
| 7 | Reduced Service | Service operating at reduced frequency |
| 6 | Bus Service | Rail service replaced by buses |
| 5 | Part Closure | Service not operating on part of the line |
| 4 | Planned Closure | Planned engineering work affecting service |
| 3 | Part Suspended | Part of line temporarily not in service |
| 2 | Suspended | Entire line temporarily not in service |
| 1 | Closed | Line completely closed |
| 0 | Special Service | Special service pattern (e.g., events) |

**Common Status Examples:**
- **Good Service (10)**: `"reason": null` - Everything running normally
- **Minor Delays (9)**: `"reason": "Minor delays due to train cancellations"`
- **Part Closure (5)**: `"reason": "No service between White City and Ealing Broadway. Replacement buses operate."`
- **Planned Closure (4)**: `"reason": "Service operates 06:00-00:30, Monday to Friday only"`

**Example Response with Disruption:**
```json
{
  "success": true,
  "stationId": "940GZZLUOXC",
  "line": "central",
  "direction": "Eastbound",
  "lineStatus": {
    "statusSeverity": 9,
    "statusSeverityDescription": "Minor Delays",
    "reason": "Central Line: Minor delays due to train cancellations."
  },
  "count": 3,
  "trains": [...]
}
```

**Usage Guide:**

1. **First**, call `/api/directions/[stationId]/[line]` to get available directions
2. **Then**, use one of the returned directions (e.g., "Eastbound") to call `/api/trains/[stationId]/[line]/Eastbound`
3. **Display** the next 4 trains with their arrival times in seconds

**Example workflow:**
```bash
# Step 1: Get directions for Oxford Circus on Central line
GET /api/directions/940GZZLUOXC/central
# Returns: { directions: [{ direction: "Eastbound", ... }, { direction: "Westbound", ... }] }

# Step 2: Get live trains for Eastbound direction
GET /api/trains/940GZZLUOXC/central/Eastbound
# Returns: Next 4 eastbound trains with arrival times in seconds
```

**Converting seconds to display format:**
```javascript
// Example: timeToStation = 90 seconds
const minutes = Math.floor(90 / 60); // 1 minute
const seconds = 90 % 60; // 30 seconds
// Display: "1m 30s" or "90s"
```

## Getting Station IDs

To find a station ID:
1. Call `/api/stations` to get the full list
2. Search for your desired station by name
3. Use the `id` field in subsequent API calls

Example station IDs:
- Oxford Circus: `940GZZLUOXC`
- King's Cross St. Pancras: `940GZZLUKSX`
- Piccadilly Circus: `940GZZLUPCC`
- Bank: `940GZZLUBNK`

## Line IDs

Common line IDs used in the TFL API:
- `bakerloo` - Bakerloo
- `central` - Central
- `circle` - Circle
- `district` - District
- `hammersmith-city` - Hammersmith & City
- `jubilee` - Jubilee
- `metropolitan` - Metropolitan
- `northern` - Northern
- `piccadilly` - Piccadilly
- `victoria` - Victoria
- `waterloo-city` - Waterloo & City

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found (invalid station or line)
- `405` - Method Not Allowed (only GET supported)
- `500` - Internal Server Error

## Deployment

### Deploy to Vercel

1. Install Vercel CLI (if not already installed):
```bash
npm i -g vercel
```

2. Install dependencies:
```bash
npm install
```

3. Deploy to Vercel:
```bash
vercel
```

4. Follow the prompts to deploy your API

### Local Development

Run the API locally with Vercel Dev:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Data Safety

This API implements several safety measures:

- ✅ **Input Validation**: All parameters are validated before making requests
- ✅ **URL Encoding**: Station and line IDs are properly encoded
- ✅ **Error Handling**: Comprehensive try-catch blocks with meaningful error messages
- ✅ **HTTP Method Restriction**: Only GET requests are allowed
- ✅ **Caching**: Appropriate cache headers to reduce API load
  - Stations: 1 hour cache (static data)
  - Lines: 1 hour cache (static data)
  - Directions: 30 seconds cache (semi-live data)
  - Live Trains: **No caching** - always fetches fresh data from TFL API
- ✅ **Response Validation**: Checks for valid responses from TFL API
- ✅ **No API Key Required**: Uses public TFL API endpoints

## TFL API Documentation

This project uses the official Transport for London Unified API:
- **API Documentation**: https://api.tfl.gov.uk/
- **No API key required** for basic usage
- **Rate Limits**: TFL API has rate limits; caching is implemented to minimize requests

## Project Structure

```
tube-tracker-api/
├── api/
│   ├── stations.js                               # GET /api/stations
│   ├── lines/
│   │   └── [stationId].js                       # GET /api/lines/[stationId]
│   ├── directions/
│   │   └── [stationId]/
│   │       └── [line].js                        # GET /api/directions/[stationId]/[line]
│   └── trains/
│       └── [stationId]/
│           └── [line]/
│               └── [direction].js               # GET /api/trains/[stationId]/[line]/[direction]
├── package.json
├── vercel.json
├── test.js
└── README.md
```

## License

MIT

## Contributing

Feel free to open issues or submit pull requests for improvements!

## Acknowledgments

- Transport for London for providing the public API
- Vercel for serverless hosting platform
