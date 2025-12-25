# Spotify Top 10K Dashboard

Data visualization dashboard for Spotify's Top 10,000 most popular songs.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Visualization | D3.js v7 |
| Frontend | Vanilla JS (ES6+) |
| Styling | CSS Custom Properties |
| Data Pipeline | Node.js |
| Theme | Electric Dark |

## Quick Start

```bash
# Build data (generates js/data.js)
node build-data.js

# View dashboard
open index.html
```

## Project Structure

```
├── index.html              # Main entry point
├── build-data.js           # Data preprocessing pipeline
├── css/styles.css          # Electric Dark theme
├── js/
│   ├── data.js             # Generated pre-computed data
│   ├── utils.js            # D3 helpers, tooltips, colors
│   ├── filters.js          # Filter state management
│   └── sections/
│       ├── hero.js         # Overview section (4 charts)
│       ├── artists.js      # Artists section (4 charts)
│       ├── timeline.js     # Timeline section (4 charts)
│       └── characteristics.js  # Music traits (4 charts)
└── Dataset/
    └── spotify-top-10k-songs.json
```

## Sections (4 Charts Each)

1. **Hero Overview** - Key stats, popularity, top tracks, album types
2. **Artists & Dominance** - Top artists, collaborations, diversity
3. **Timeline & Trends** - Decades, era analysis, longevity
4. **Music Characteristics** - Duration, explicit content, ISRC

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Spotify Green | #1DB954 | Primary accent |
| Lime | #BEFF00 | Growth, positive |
| Cyan | #00BAFE | Data, neutral |
| Amber | #FFC000 | Highlights |
| Coral | #F04E50 | Explicit, negative |
| Background | #10100E | Main dark |

## Key Files

- `build-data.js` - Run to regenerate data aggregations
- `js/filters.js` - Filter state and caching logic
- `js/utils.js` - Shared D3 utilities
