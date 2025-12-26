# Architecture

## System Overview

```
BUILD TIME:
  Dataset/spotify-top-10k-songs.json (5.4 MB)
      ↓
  node build-data.js
      ↓
  js/data.js (4.6 MB pre-computed aggregations)

RUNTIME:
  index.html
      ↓
  D3.js v7 (CDN)
      ↓
  js/data.js → js/utils.js → js/filters.js
      ↓
  js/sections/*.js (8 sections, 32 charts)
```

## File Structure

```
/Spotify Top 10k/
├── index.html                 # Main entry point
├── build-data.js              # Data pipeline (Node.js)
├── CLAUDE.md                  # Claude Code config
├── README.md                  # Project overview
├── ARCHITECTURE.md            # This file
├── DATASET.md                 # Data schema docs
├── .gitignore
│
├── css/
│   └── styles.css             # Electric Dark theme
│
├── js/
│   ├── data.js                # Generated pre-computed data
│   ├── utils.js               # Shared D3 helpers, colors, tooltips
│   ├── filters.js             # Filter state management
│   └── sections/
│       ├── hero.js            # Section 1: Overview (4 charts)
│       ├── artists.js         # Section 2: Artists (4 charts)
│       ├── timeline.js        # Section 3: Timeline (4 charts)
│       ├── characteristics.js # Section 4: Music traits (4 charts)
│       ├── semantics.js       # Section 5: Title Intelligence (4 charts)
│       ├── correlations.js    # Section 6: Correlations (4 charts)
│       ├── release.js         # Section 7: Release Patterns (4 charts)
│       └── patterns.js        # Section 8: Deep Patterns (4 charts)
│
└── Dataset/
    └── spotify-top-10k-songs.json  # Source data
```

## Sections & Charts (8 Sections × 4 Charts = 32 Charts)

### Section 1: Hero Overview
| # | Chart | Type |
|---|-------|------|
| 1 | Key Stats | Animated counters |
| 2 | Popularity Distribution | Histogram |
| 3 | Top 10 Tracks | Horizontal bars |
| 4 | Album Type Split | Donut |

### Section 2: Artists & Dominance
| # | Chart | Type |
|---|-------|------|
| 5 | Top 20 Artists | Horizontal bars |
| 6 | Collaborations | Donut |
| 7 | Artist Diversity | Treemap |
| 8 | Most Featured | Lollipop |

### Section 3: Timeline & Trends
| # | Chart | Type |
|---|-------|------|
| 9 | Release Timeline | Area chart |
| 10 | Era Dominance | Stacked bars |
| 11 | Longevity Champions | Horizontal bars |
| 12 | Recent vs Classic | Diverging bar |

### Section 4: Music Characteristics
| # | Chart | Type |
|---|-------|------|
| 13 | Duration Distribution | Histogram |
| 14 | Explicit Content Trend | Line + bars |
| 15 | Optimal Duration | Scatter |
| 16 | ISRC Duplicates | Bar |

### Section 5: Title Intelligence
| # | Chart | Type |
|---|-------|------|
| 17 | Keyword Frequency | Horizontal bars |
| 18 | Title Length Analysis | Histogram |
| 19 | Title Patterns | Horizontal bars |
| 20 | Naming Evolution | Multi-line |

### Section 6: Correlation Discovery
| # | Chart | Type |
|---|-------|------|
| 21 | Duration Sweet Spot | Annotated bars |
| 22 | Collaboration ROI | Comparison bars |
| 23 | Album Type Performance | Horizontal bars |
| 24 | Explicit Impact | Comparison cards |

### Section 7: Release Intelligence
| # | Chart | Type |
|---|-------|------|
| 25 | Monthly Seasonality | Bar chart |
| 26 | Day-of-Week Patterns | Bar chart |
| 27 | Recency Bias | Horizontal bars |
| 28 | Age vs Position | Scatter |

### Section 8: Deep Patterns
| # | Chart | Type |
|---|-------|------|
| 29 | Duplicate Anatomy | Horizontal bars |
| 30 | Artist Connections | Chord diagram |
| 31 | Decade DNA | Grouped bars |
| 32 | Breakout Signals | Comparison table |

## Data Pipeline

### Input Schema

```javascript
{
  rank: 1,
  track: { name: "Die With A Smile", id: "2plbr..." },
  artists: [
    { name: "Lady Gaga", id: "1HY2J..." },
    { name: "Bruno Mars", id: "0du5c..." }
  ],
  album: { name: "Die With A Smile", id: "10FLj..." },
  popularity: 100,
  duration: "4:11",
  archived: true,
  explicit: false,
  release_date: "2024-08-16",
  album_type: "single",
  isrc: "USUM72409273",
  copies: 9
}
```

### Output Schema (DATA object)

```javascript
const DATA = {
  // Core aggregations
  summary: { totalTracks, totalArtists, avgPopularity, ... },
  byDecade: [...],
  byYear: [...],
  popularity: [...],
  albumTypes: [...],
  artists: { top, mostFeatured, total },
  collaborations: { stats, trend },
  duration: { avg, distribution, byDecade },
  explicit: { total, percent, byDecade },
  isrcDuplicates: [...],
  topTracks: [...],
  longevityChampions: [...],
  eraComparison: { preY2K, postY2K },

  // Deep analysis (Sections 5-8)
  titleAnalysis: {
    keywords: [...],           // Top 100 words
    lengthStats: {...},        // Title length distribution
    patterns: [...],           // feat., remix, deluxe counts
    evolution: [...]           // Trends by decade
  },
  correlations: {
    durationPopularity: [...], // Duration ranges with avg popularity
    optimalDuration: {...},    // Best performing duration
    collabImpact: {...},       // Solo vs Collab comparison
    albumTypeStats: [...],     // Performance by type
    explicitImpact: {...}      // Explicit vs Clean
  },
  releasePatterns: {
    byMonth: [...],            // Monthly distribution
    byDayOfWeek: [...],        // Day patterns
    ageDistribution: [...],    // Tracks by age bucket
    rankByAge: [...]           // Sampled rank vs age
  },
  deepPatterns: {
    duplicates: {...},         // Copy distribution
    artistNetwork: {...},      // Chord diagram matrix
    decadeDNA: [...],          // Multi-dimensional profiles
    breakoutProfile: {...}     // 95+ popularity analysis
  },

  songs: [...] // 10,000 lightweight objects for filtering
};
```

## Frontend Architecture

### Module Loading Order

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="js/data.js"></script>
<script src="js/utils.js"></script>
<script src="js/filters.js"></script>
<script src="js/sections/hero.js"></script>
<script src="js/sections/artists.js"></script>
<script src="js/sections/timeline.js"></script>
<script src="js/sections/characteristics.js"></script>
<script src="js/sections/semantics.js"></script>
<script src="js/sections/correlations.js"></script>
<script src="js/sections/release.js"></script>
<script src="js/sections/patterns.js"></script>
```

### Filter System

```javascript
Filters.state = {
  decades: [],      // Selected decades (empty = all)
  albumTypes: [],   // album, single, compilation
  explicit: null    // null = all, true/false = filtered
};

// Filter flow:
// User clicks chip → state updates → cache invalidated → callbacks notified
// Each section re-renders with Filters.getFilteredSongs()
```

### Chart Pattern

Every chart follows this structure:

```javascript
function renderChartName() {
  const container = document.getElementById('chart-content');
  if (!container) return;

  // Get data (filtered or pre-computed)
  const data = Filters.isFiltered()
    ? computeFromFiltered()
    : DATA.preComputed;

  // Setup dimensions
  const dims = Utils.getChartDimensions(container, { left: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  // Create scales
  const xScale = d3.scaleLinear()...
  const yScale = d3.scaleBand()...

  // Draw elements with transitions
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .transition()
    .duration(800)
    .attr(...)

  // Add value labels
  g.selectAll('.bar-value')
    .data(data)
    .join('text')
    .text(d => d.value)...

  // Add interactivity
  .on('mouseenter', (event, d) => {
    Utils.showTooltip(`<html>`, event);
  })
  .on('mouseleave', () => Utils.hideTooltip());
}
```

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Spotify Green | #1DB954 | Primary accent |
| Lime | #BEFF00 | Growth, positive |
| Cyan | #00BAFE | Data, neutral |
| Amber | #FFC000 | Highlights |
| Coral | #F04E50 | Explicit, negative |
| Background | #10100E | Main dark |
| Elevated | #1A1A18 | Cards |
| Text Primary | #FFFFE3 | Body text |

### Decade Colors

```javascript
decadeColors: {
  1950: '#8B4513',  // vintage brown
  1960: '#FF6B6B',  // psychedelic red
  1970: '#FFA500',  // disco orange
  1980: '#FF1493',  // neon pink
  1990: '#9B59B6',  // grunge purple
  2000: '#3498DB',  // digital blue
  2010: '#1DB954',  // Spotify green
  2020: '#BEFF00'   // lime
}
```

## Responsive Design

| Breakpoint | Behavior |
|------------|----------|
| 1200px+ | 2-column chart grid |
| 768-1200px | Single column |
| <768px | Collapsed nav, wrapped filters |

## Performance

- Pre-computed aggregations reduce runtime calculations
- Filter results cached by state key
- Transition staggering (30-50ms) prevents frame drops
- Sampled scatter plots (500 max) for large datasets
- Chord diagram limited to top 30 collaborators

## Chart Types Used

| Type | Charts |
|------|--------|
| Bar (Horizontal) | Top artists, keywords, patterns, duplicates |
| Bar (Vertical) | Popularity, timeline, monthly, day-of-week |
| Donut | Album types, collaborations |
| Treemap | Artist diversity |
| Lollipop | Featured artists |
| Stacked Bar | Era dominance |
| Scatter | Duration vs popularity, age vs position |
| Line | Explicit trend, naming evolution |
| Chord Diagram | Artist network |
| Comparison Cards | Explicit impact, breakout signals |

## Extension Points

### Adding a New Section

1. Create `js/sections/newsection.js`
2. Add HTML section to `index.html`
3. Add script tag to load order
4. Call `initNewsection()` in DOMContentLoaded
5. Register with `Filters.register(onNewsectionFilterChange)`

### Adding a New Filter

1. Add UI chips to filter bar
2. Extend `Filters.state`
3. Add binding in `Filters.init()`
4. Extend `Filters.filterSong()` logic

## Deployment

- **GitHub Pages**: https://aref-vc.github.io/spotify-top-10k/
- **Branch**: main
- **Build**: Static (no build step required)
