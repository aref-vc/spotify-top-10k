# Spotify Top 10K Dashboard

Data visualization dashboard for Spotify's Top 10,000 most popular songs.

**Live**: [aref-vc.github.io/spotify-top-10k](https://aref-vc.github.io/spotify-top-10k/)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Visualization | D3.js v7 |
| Frontend | Vanilla JS (ES6+) |
| Styling | CSS Custom Properties |
| Data Pipeline | Node.js |
| Theme | Electric Dark |
| Hosting | GitHub Pages |

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
│       ├── hero.js             # Section 1: Overview (4 charts)
│       ├── artists.js          # Section 2: Artists (4 charts)
│       ├── timeline.js         # Section 3: Timeline (4 charts)
│       ├── characteristics.js  # Section 4: Music traits (4 charts)
│       ├── semantics.js        # Section 5: Title Intelligence (4 charts)
│       ├── correlations.js     # Section 6: Correlations (4 charts)
│       ├── release.js          # Section 7: Release Patterns (4 charts)
│       └── patterns.js         # Section 8: Deep Patterns (4 charts)
└── Dataset/
    └── spotify-top-10k-songs.json
```

## Sections (8 Sections, 32 Charts)

1. **Hero Overview** - Key stats, popularity, top tracks, album types
2. **Artists & Dominance** - Top artists, collaborations, diversity
3. **Timeline & Trends** - Decades, era analysis, longevity
4. **Music Characteristics** - Duration, explicit content, ISRC
5. **Title Intelligence** - Keywords, title length, naming patterns
6. **Correlation Discovery** - Duration/collab/explicit impact
7. **Release Intelligence** - Monthly, day-of-week, recency
8. **Deep Patterns** - Duplicates, artist network, decade DNA, breakout

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

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design, data schemas, chart patterns
- [DATASET.md](DATASET.md) - Source data schema and statistics
