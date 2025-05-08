
# Singapore HDB Resale Price Map

## Overview
An interactive visualization tool that displays resale prices of HDB flats across different towns in Singapore. The application provides a color-coded map interface with filtering capabilities to help users understand price distributions across regions.

## Core Features

### Interactive Singapore Map
- Displays all unique towns from the HDB resale transactions API
- Color-coded regions based on average resale prices
  - Red: Most expensive areas
  - Green: Most affordable areas
  - Gray: Areas with no applicable data based on current filters
- Hover functionality shows town name and average resale price
- Non-Singapore regions are shown but not interactive

### Filter Controls
- Located above the map
- Filter options include:
  - Flat Type (e.g., 3 ROOM, 4 ROOM, etc.)
  - Remaining Lease Years Range
- Default view shows average prices for ALL properties in each area

## Technical Details
### Map Implementation
- Base map layer: OpenStreetMap
- Map library: Mapbox Libre
- Visualization libraries:
  - D3.js for data visualization and transitions
  - Flubber for smooth shape morphing animations

### Data Source
- API Endpoint: https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc
- Returns transaction data including:
  - Transaction month
  - Town
  - Flat type
  - Block and street details
  - Floor area
  - Lease information
  - Resale price

### Sample API Response




