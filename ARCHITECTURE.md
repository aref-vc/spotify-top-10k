# Architecture

## System Overview

```
BUILD TIME:
  Dataset/spotify-top-10k-songs.json (5.4 MB)
      ↓
  node build-data.js
      ↓
  js/data.js (4.4 MB pre-computed aggregations)

RUNTIME:
  index.html
      ↓
  D3.js v7 (CDN)
      ↓
  js/data.js → js/utils.js → js/filters.js
      ↓
  js/sections/*.js (4 sections, 16 charts)
```

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
  summary: {
    totalTracks: 10000,
    totalArtists: 5006,
    totalAlbums: 8234,
    yearRange: { min: 1952, max: 2025 },
    decadesSpanned: 8,
    avgPopularity: 76,
    explicitCount: 2638,
    collaborationCount: 3056
  },
  byDecade: [
    { decade: 1950, label: "1950s", count: 23, ... },
    ...
  ],
  byYear: [...],
  popularity: [...],
  albumTypes: [...],
  artists: {
    top: [...],
    mostFeatured: [...],
    total: 5006
  },
  collaborations: { stats: {...}, trend: [...] },
  duration: { avg: 213, distribution: [...], byDecade: [...] },
  explicit: { total: 2638, percent: 26, byDecade: [...] },
  isrcDuplicates: [...],
  topTracks: [...],
  longevityChampions: [...],
  eraComparison: { preY2K: {...}, postY2K: {...} },
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

  // Add interactivity
  .on('mouseenter', (event, d) => {
    Utils.showTooltip(`<html>`, event);
  })
  .on('mouseleave', () => Utils.hideTooltip());
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

## Chart Types Used

| Type | Charts |
|------|--------|
| Bar (Horizontal) | Top artists, top tracks, longevity, duplicates |
| Bar (Vertical) | Popularity dist, timeline, explicit trend |
| Donut | Album types, collaborations |
| Treemap | Artist diversity |
| Lollipop | Featured artists |
| Stacked Bar | Era dominance |
| Scatter | Duration vs popularity |
| Line | Explicit trend overlay |

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
