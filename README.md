# Coord.io

A web-based tool for converting geographic coordinates between various formats, featuring bulk processing and map visualization. Built with React and Vite.

## Features

- **Coordinate Conversion**: Convert between Latitude/Longitude (Decimal Degrees, DMS) and Projected Coordinate Systems (UTM, TM3).
- **Bulk Processing**: Import Excel/CSV files to convert multiple coordinates at once.
- **Map Visualization**: accurate map preview using Leaflet.
- **Export**: Download converted results.

## Tech Stack

- **Frontend**: React, Vite
- **Map**: Leaflet, React-Leaflet
- **Math/Projections**: Proj4, proj4js
- **Data Handling**: SheetJS (xlsx)
- **Styling**: CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/13wejay/coord-io.git
    cd coord-io
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Muhammad Ramadhani Wijayanto
