# Tube Tracker API

A serverless API built for Vercel that provides real-time London Underground tube information using the Transport for London (TFL) API.

## Features

- 🚇 Get all London Underground stations
- 🚉 Get tube lines for specific stations
- 🧭 Get real-time arrival predictions and directions
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
  - Stations: 1 hour cache
  - Lines: 1 hour cache
  - Directions: 30 seconds cache (real-time data)
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
│   ├── stations.js                    # GET /api/stations
│   ├── lines/
│   │   └── [stationId].js            # GET /api/lines/[stationId]
│   └── directions/
│       └── [stationId]/
│           └── [line].js             # GET /api/directions/[stationId]/[line]
├── package.json
└── README.md
```

## License

MIT

## Contributing

Feel free to open issues or submit pull requests for improvements!

## Acknowledgments

- Transport for London for providing the public API
- Vercel for serverless hosting platform
