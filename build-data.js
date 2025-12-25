#!/usr/bin/env node
/**
 * Spotify Top 10K Data Pipeline
 * Processes spotify-top-10k-songs.json and generates pre-computed aggregations
 * Output: js/data.js
 */

const fs = require('fs');
const path = require('path');

// Read source data
const inputPath = path.join(__dirname, 'Dataset', 'spotify-top-10k-songs.json');
const outputPath = path.join(__dirname, 'js', 'data.js');

console.log('Loading source data...');
const songs = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
console.log(`Loaded ${songs.length} songs`);

// Helper: Parse duration string "M:SS" to seconds
function parseDuration(durStr) {
  if (!durStr || !durStr.includes(':')) return 0;
  const parts = durStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Helper: Get decade from year
function getDecade(year) {
  return Math.floor(year / 10) * 10;
}

// Helper: Get year from release_date
function getYear(releaseDate) {
  if (!releaseDate) return null;
  return parseInt(releaseDate.substring(0, 4));
}

console.log('Computing aggregations...');

// ============================================
// SUMMARY STATS
// ============================================
const uniqueArtists = new Set();
const uniqueAlbums = new Set();
const years = new Set();

songs.forEach(song => {
  song.artists.forEach(a => uniqueArtists.add(a.name));
  if (song.album && song.album.name) uniqueAlbums.add(song.album.name);
  const year = getYear(song.release_date);
  if (year) years.add(year);
});

const summary = {
  totalTracks: songs.length,
  totalArtists: uniqueArtists.size,
  totalAlbums: uniqueAlbums.size,
  yearRange: {
    min: Math.min(...years),
    max: Math.max(...years)
  },
  decadesSpanned: new Set([...years].map(y => getDecade(y))).size,
  avgPopularity: Math.round(songs.reduce((sum, s) => sum + s.popularity, 0) / songs.length),
  explicitCount: songs.filter(s => s.explicit).length,
  collaborationCount: songs.filter(s => s.artists.length > 1).length
};

console.log(`  - Summary: ${summary.totalTracks} tracks, ${summary.totalArtists} artists`);

// ============================================
// BY DECADE BREAKDOWN
// ============================================
const byDecade = {};
const decadeColors = {
  1950: '#8B4513',
  1960: '#FF6B6B',
  1970: '#FFA500',
  1980: '#FF1493',
  1990: '#9B59B6',
  2000: '#3498DB',
  2010: '#1DB954',
  2020: '#BEFF00'
};

songs.forEach(song => {
  const year = getYear(song.release_date);
  if (!year) return;

  const decade = getDecade(year);
  if (!byDecade[decade]) {
    byDecade[decade] = {
      decade,
      label: `${decade}s`,
      color: decadeColors[decade] || '#666666',
      count: 0,
      avgPopularity: 0,
      explicitCount: 0,
      totalDuration: 0,
      artists: new Set()
    };
  }

  byDecade[decade].count++;
  byDecade[decade].avgPopularity += song.popularity;
  if (song.explicit) byDecade[decade].explicitCount++;
  byDecade[decade].totalDuration += parseDuration(song.duration);
  song.artists.forEach(a => byDecade[decade].artists.add(a.name));
});

// Finalize decade stats
Object.values(byDecade).forEach(d => {
  d.avgPopularity = Math.round(d.avgPopularity / d.count);
  d.avgDuration = Math.round(d.totalDuration / d.count);
  d.uniqueArtists = d.artists.size;
  d.explicitPercent = Math.round(100 * d.explicitCount / d.count);
  delete d.artists;
  delete d.totalDuration;
});

const byDecadeArray = Object.values(byDecade).sort((a, b) => a.decade - b.decade);
console.log(`  - Decades: ${byDecadeArray.length} decades`);

// ============================================
// BY YEAR BREAKDOWN
// ============================================
const byYear = {};

songs.forEach(song => {
  const year = getYear(song.release_date);
  if (!year) return;

  if (!byYear[year]) {
    byYear[year] = {
      year,
      count: 0,
      avgPopularity: 0,
      explicitCount: 0
    };
  }

  byYear[year].count++;
  byYear[year].avgPopularity += song.popularity;
  if (song.explicit) byYear[year].explicitCount++;
});

Object.values(byYear).forEach(y => {
  y.avgPopularity = Math.round(y.avgPopularity / y.count);
  y.explicitPercent = Math.round(100 * y.explicitCount / y.count);
});

const byYearArray = Object.values(byYear).sort((a, b) => a.year - b.year);
console.log(`  - Years: ${byYearArray.length} years`);

// ============================================
// ARTIST RANKINGS
// ============================================
const artistStats = {};

songs.forEach(song => {
  song.artists.forEach(artist => {
    if (!artistStats[artist.name]) {
      artistStats[artist.name] = {
        name: artist.name,
        id: artist.id,
        trackCount: 0,
        avgPopularity: 0,
        soloTracks: 0,
        collabTracks: 0,
        featuredIn: 0,
        explicitTracks: 0,
        topRank: Infinity
      };
    }

    artistStats[artist.name].trackCount++;
    artistStats[artist.name].avgPopularity += song.popularity;
    if (song.explicit) artistStats[artist.name].explicitTracks++;
    if (song.rank < artistStats[artist.name].topRank) {
      artistStats[artist.name].topRank = song.rank;
    }

    if (song.artists.length === 1) {
      artistStats[artist.name].soloTracks++;
    } else {
      artistStats[artist.name].collabTracks++;
      // First artist is primary, others are featured
      if (song.artists[0].name !== artist.name) {
        artistStats[artist.name].featuredIn++;
      }
    }
  });
});

// Finalize artist stats
Object.values(artistStats).forEach(a => {
  a.avgPopularity = Math.round(a.avgPopularity / a.trackCount);
  a.collabRate = Math.round(100 * a.collabTracks / a.trackCount);
});

const topArtists = Object.values(artistStats)
  .sort((a, b) => b.trackCount - a.trackCount)
  .slice(0, 50);

const mostFeatured = Object.values(artistStats)
  .filter(a => a.featuredIn > 0)
  .sort((a, b) => b.featuredIn - a.featuredIn)
  .slice(0, 20);

console.log(`  - Artists: ${Object.keys(artistStats).length} unique, top is ${topArtists[0].name} (${topArtists[0].trackCount})`);

// ============================================
// COLLABORATION ANALYSIS
// ============================================
const collabStats = {
  solo: songs.filter(s => s.artists.length === 1).length,
  duo: songs.filter(s => s.artists.length === 2).length,
  trio: songs.filter(s => s.artists.length === 3).length,
  more: songs.filter(s => s.artists.length > 3).length
};

collabStats.soloPercent = Math.round(100 * collabStats.solo / songs.length);
collabStats.collabPercent = 100 - collabStats.soloPercent;

// Collaboration by decade
const collabByDecade = {};
songs.forEach(song => {
  const year = getYear(song.release_date);
  if (!year) return;
  const decade = getDecade(year);

  if (!collabByDecade[decade]) {
    collabByDecade[decade] = { total: 0, collabs: 0 };
  }
  collabByDecade[decade].total++;
  if (song.artists.length > 1) collabByDecade[decade].collabs++;
});

const collabTrendByDecade = Object.entries(collabByDecade)
  .map(([decade, stats]) => ({
    decade: parseInt(decade),
    collabPercent: Math.round(100 * stats.collabs / stats.total)
  }))
  .sort((a, b) => a.decade - b.decade);

console.log(`  - Collaborations: ${collabStats.collabPercent}% of tracks`);

// ============================================
// POPULARITY DISTRIBUTION
// ============================================
const popularityDist = {
  '70-74': songs.filter(s => s.popularity >= 70 && s.popularity <= 74).length,
  '75-79': songs.filter(s => s.popularity >= 75 && s.popularity <= 79).length,
  '80-84': songs.filter(s => s.popularity >= 80 && s.popularity <= 84).length,
  '85-89': songs.filter(s => s.popularity >= 85 && s.popularity <= 89).length,
  '90-94': songs.filter(s => s.popularity >= 90 && s.popularity <= 94).length,
  '95-100': songs.filter(s => s.popularity >= 95).length
};

const popularityDistArray = Object.entries(popularityDist).map(([range, count]) => ({
  range,
  count,
  percent: Math.round(100 * count / songs.length)
}));

console.log(`  - Popularity: 95-100 has ${popularityDist['95-100']} tracks`);

// ============================================
// ALBUM TYPE BREAKDOWN
// ============================================
const albumTypes = {};
songs.forEach(song => {
  const type = song.album_type || 'unknown';
  if (!albumTypes[type]) albumTypes[type] = 0;
  albumTypes[type]++;
});

const albumTypeArray = Object.entries(albumTypes)
  .map(([type, count]) => ({
    type,
    count,
    percent: Math.round(100 * count / songs.length)
  }))
  .sort((a, b) => b.count - a.count);

console.log(`  - Album types: ${albumTypeArray.map(t => `${t.type}(${t.count})`).join(', ')}`);

// ============================================
// DURATION ANALYSIS
// ============================================
const durations = songs.map(s => parseDuration(s.duration)).filter(d => d > 0);
const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
const minDuration = Math.min(...durations);
const maxDuration = Math.max(...durations);

// Duration distribution (buckets of 30 seconds)
const durationBuckets = {};
durations.forEach(d => {
  const bucket = Math.floor(d / 30) * 30; // 30-second buckets
  const label = `${Math.floor(bucket / 60)}:${String(bucket % 60).padStart(2, '0')}`;
  if (!durationBuckets[bucket]) {
    durationBuckets[bucket] = { seconds: bucket, label, count: 0 };
  }
  durationBuckets[bucket].count++;
});

const durationDistArray = Object.values(durationBuckets)
  .sort((a, b) => a.seconds - b.seconds);

// Duration by decade
const durationByDecade = byDecadeArray.map(d => ({
  decade: d.decade,
  label: d.label,
  avgDuration: d.avgDuration,
  avgDurationFormatted: `${Math.floor(d.avgDuration / 60)}:${String(d.avgDuration % 60).padStart(2, '0')}`
}));

const durationStats = {
  avg: avgDuration,
  avgFormatted: `${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, '0')}`,
  min: minDuration,
  minFormatted: `${Math.floor(minDuration / 60)}:${String(minDuration % 60).padStart(2, '0')}`,
  max: maxDuration,
  maxFormatted: `${Math.floor(maxDuration / 60)}:${String(maxDuration % 60).padStart(2, '0')}`,
  distribution: durationDistArray,
  byDecade: durationByDecade
};

console.log(`  - Duration: avg ${durationStats.avgFormatted}, range ${durationStats.minFormatted} - ${durationStats.maxFormatted}`);

// ============================================
// EXPLICIT CONTENT ANALYSIS
// ============================================
const explicitStats = {
  total: songs.filter(s => s.explicit).length,
  clean: songs.filter(s => !s.explicit).length,
  percent: Math.round(100 * songs.filter(s => s.explicit).length / songs.length)
};

// Explicit by decade
const explicitByDecade = byDecadeArray.map(d => ({
  decade: d.decade,
  label: d.label,
  explicitPercent: d.explicitPercent,
  explicitCount: d.explicitCount,
  totalCount: d.count
}));

explicitStats.byDecade = explicitByDecade;

console.log(`  - Explicit: ${explicitStats.percent}% of tracks`);

// ============================================
// ISRC DUPLICATES (Most Re-released)
// ============================================
const isrcDuplicates = songs
  .filter(s => s.copies > 1)
  .sort((a, b) => b.copies - a.copies)
  .slice(0, 20)
  .map(s => ({
    track: s.track.name,
    artist: s.artists.map(a => a.name).join(', '),
    copies: s.copies,
    isrc: s.isrc,
    releaseDate: s.release_date
  }));

console.log(`  - Most duplicated: ${isrcDuplicates[0]?.track} (${isrcDuplicates[0]?.copies} copies)`);

// ============================================
// TOP TRACKS
// ============================================
const topTracks = songs
  .slice(0, 100)
  .map(s => ({
    rank: s.rank,
    track: s.track.name,
    trackId: s.track.id,
    artists: s.artists.map(a => a.name).join(', '),
    artistIds: s.artists.map(a => a.id),
    album: s.album.name,
    popularity: s.popularity,
    duration: s.duration,
    releaseDate: s.release_date,
    explicit: s.explicit,
    year: getYear(s.release_date),
    decade: getDecade(getYear(s.release_date))
  }));

console.log(`  - Top track: ${topTracks[0].track} by ${topTracks[0].artists}`);

// ============================================
// LONGEVITY CHAMPIONS (Oldest tracks still popular)
// ============================================
const longevityChampions = songs
  .filter(s => getYear(s.release_date) && getYear(s.release_date) < 2000)
  .sort((a, b) => getYear(a.release_date) - getYear(b.release_date))
  .slice(0, 20)
  .map(s => ({
    rank: s.rank,
    track: s.track.name,
    artist: s.artists.map(a => a.name).join(', '),
    year: getYear(s.release_date),
    popularity: s.popularity,
    age: 2025 - getYear(s.release_date)
  }));

console.log(`  - Oldest popular: ${longevityChampions[0]?.track} (${longevityChampions[0]?.year})`);

// ============================================
// ERA COMPARISON
// ============================================
const preY2K = songs.filter(s => getYear(s.release_date) < 2000);
const postY2K = songs.filter(s => getYear(s.release_date) >= 2000);

const eraComparison = {
  preY2K: {
    count: preY2K.length,
    percent: Math.round(100 * preY2K.length / songs.length),
    avgPopularity: Math.round(preY2K.reduce((sum, s) => sum + s.popularity, 0) / preY2K.length),
    explicitPercent: Math.round(100 * preY2K.filter(s => s.explicit).length / preY2K.length)
  },
  postY2K: {
    count: postY2K.length,
    percent: Math.round(100 * postY2K.length / songs.length),
    avgPopularity: Math.round(postY2K.reduce((sum, s) => sum + s.popularity, 0) / postY2K.length),
    explicitPercent: Math.round(100 * postY2K.filter(s => s.explicit).length / postY2K.length)
  }
};

console.log(`  - Era split: Pre-2000 ${eraComparison.preY2K.percent}%, Post-2000 ${eraComparison.postY2K.percent}%`);

// ============================================
// PREPARE SONGS ARRAY (lightweight for filtering)
// ============================================
const songsForFiltering = songs.map(s => ({
  rank: s.rank,
  track: s.track.name,
  trackId: s.track.id,
  artists: s.artists.map(a => a.name),
  artistCount: s.artists.length,
  album: s.album.name,
  albumType: s.album_type,
  popularity: s.popularity,
  duration: s.duration,
  durationSec: parseDuration(s.duration),
  year: getYear(s.release_date),
  decade: getDecade(getYear(s.release_date)),
  explicit: s.explicit,
  isrc: s.isrc,
  copies: s.copies
}));

// ============================================
// BUILD OUTPUT
// ============================================
const DATA = {
  summary,
  byDecade: byDecadeArray,
  byYear: byYearArray,
  popularity: popularityDistArray,
  albumTypes: albumTypeArray,
  artists: {
    top: topArtists,
    mostFeatured,
    total: Object.keys(artistStats).length
  },
  collaborations: {
    stats: collabStats,
    trend: collabTrendByDecade
  },
  duration: durationStats,
  explicit: explicitStats,
  isrcDuplicates,
  topTracks,
  longevityChampions,
  eraComparison,
  songs: songsForFiltering
};

// Write output
console.log('\nWriting output...');
const output = `// Auto-generated by build-data.js - DO NOT EDIT
// Generated: ${new Date().toISOString()}
// Source: Dataset/spotify-top-10k-songs.json

const DATA = ${JSON.stringify(DATA, null, 2)};
`;

fs.writeFileSync(outputPath, output, 'utf-8');

const stats = fs.statSync(outputPath);
console.log(`Output: ${outputPath}`);
console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log('\nDone!');
