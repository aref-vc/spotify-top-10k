# Spotify Top 10K Dashboard

A data visualization dashboard exploring Spotify's Top 10,000 most popular songs, spanning 73 years of music history from 1952 to 2025.

## Key Insights

| Metric | Value |
|--------|-------|
| Total Tracks | 10,000 |
| Unique Artists | 5,006 |
| Years Covered | 1952-2025 |
| Top Artist | Drake (121 tracks) |
| Collaboration Rate | 31% |
| Explicit Content | 26% |
| Average Duration | 3:33 |

## Sections

### 01 - Overview
Key statistics, popularity distribution, top 10 tracks, album type breakdown.

### 02 - Artists & Dominance
Top 20 artists, collaboration patterns, artist diversity treemap, most featured artists.

### 03 - Timeline & Trends
Tracks by decade, era dominance visualization, longevity champions (oldest popular tracks), pre/post-2000 comparison.

### 04 - Music Characteristics
Duration distribution, explicit content trends, duration vs popularity scatter, most re-released tracks (ISRC duplicates).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Visualization | D3.js v7 |
| Frontend | Vanilla JavaScript (ES6+) |
| Styling | CSS Custom Properties |
| Data Pipeline | Node.js |
| Theme | Electric Dark |

## Quick Start

```bash
# Generate pre-computed data
node build-data.js

# Open dashboard
open index.html
```

## Project Structure

```
├── index.html              # Main dashboard
├── build-data.js           # Data preprocessing
├── css/
│   └── styles.css          # Electric Dark theme
├── js/
│   ├── data.js             # Generated aggregations
│   ├── utils.js            # D3 helpers
│   ├── filters.js          # Filter management
│   └── sections/
│       ├── hero.js         # Section 1 (4 charts)
│       ├── artists.js      # Section 2 (4 charts)
│       ├── timeline.js     # Section 3 (4 charts)
│       └── characteristics.js  # Section 4 (4 charts)
└── Dataset/
    └── spotify-top-10k-songs.json
```

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Spotify Green | #1DB954 | Primary accent |
| Lime | #BEFF00 | 2020s, positive |
| Cyan | #00BAFE | Data, neutral |
| Amber | #FFC000 | Highlights |
| Coral | #F04E50 | Explicit, negative |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Data Source

Song data scraped from Anna's Archive Spotify collection, capturing the top 10,000 tracks by popularity score (70-100 range).

## License

MIT
