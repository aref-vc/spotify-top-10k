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
// SECTION 5: TITLE INTELLIGENCE
// ============================================
console.log('\nComputing Title Intelligence...');

// Stopwords to filter out
const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'it', 'its', 'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'this',
  'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
  'there', 'then', 'once', 'de', 'la', 'el', 'en', 'un', 'una', 'los',
  'las', 'del', 'y', 'que', 'se', 'te', 'mi', 'tu', 'me', 'como', 'no',
  'ya', 'yo', 'es', 'feat', 'ft', 'vs', 'remix', 'version', 'edit',
  'mix', 'remaster', 'remastered', 'live', 'acoustic', 'radio'
]);

// Extract keywords from titles
const keywordCounts = {};
songs.forEach(song => {
  const title = song.track.name.toLowerCase();
  // Remove parenthetical content and special chars, split into words
  const cleanTitle = title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  const words = cleanTitle.match(/[a-zA-Z]+/g) || [];

  words.forEach(word => {
    if (word.length >= 2 && !stopwords.has(word)) {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    }
  });
});

const topKeywords = Object.entries(keywordCounts)
  .map(([word, count]) => ({ word, count, percent: Math.round(1000 * count / songs.length) / 10 }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 100);

console.log(`  - Top keyword: "${topKeywords[0].word}" (${topKeywords[0].count} tracks)`);

// Title length analysis
const titleLengths = songs.map(s => ({
  length: s.track.name.length,
  wordCount: s.track.name.split(/\s+/).length,
  popularity: s.popularity
}));

const avgTitleLength = Math.round(titleLengths.reduce((sum, t) => sum + t.length, 0) / titleLengths.length);
const avgWordCount = Math.round(10 * titleLengths.reduce((sum, t) => sum + t.wordCount, 0) / titleLengths.length) / 10;

// Title length buckets
const titleLengthBuckets = {};
titleLengths.forEach(t => {
  const bucket = Math.floor(t.length / 5) * 5; // 5-char buckets
  if (!titleLengthBuckets[bucket]) {
    titleLengthBuckets[bucket] = { bucket, label: `${bucket}-${bucket + 4}`, count: 0, totalPop: 0 };
  }
  titleLengthBuckets[bucket].count++;
  titleLengthBuckets[bucket].totalPop += t.popularity;
});

const titleLengthDist = Object.values(titleLengthBuckets)
  .map(b => ({
    ...b,
    avgPopularity: Math.round(b.totalPop / b.count)
  }))
  .sort((a, b) => a.bucket - b.bucket)
  .slice(0, 15); // Cap at reasonable range

// Title patterns detection
const titlePatterns = {
  feat: { count: 0, label: 'feat./ft.', regex: /\b(feat\.?|ft\.?)\b/i },
  remix: { count: 0, label: 'Remix', regex: /\bremix\b/i },
  live: { count: 0, label: 'Live', regex: /\blive\b/i },
  acoustic: { count: 0, label: 'Acoustic', regex: /\bacoustic\b/i },
  version: { count: 0, label: 'Version/Edit', regex: /\b(version|edit)\b/i },
  remaster: { count: 0, label: 'Remaster', regex: /\bremaster(ed)?\b/i },
  deluxe: { count: 0, label: 'Deluxe', regex: /\bdeluxe\b/i },
  parenthetical: { count: 0, label: 'Has (...)', regex: /\([^)]+\)/ },
  brackets: { count: 0, label: 'Has [...]', regex: /\[[^\]]+\]/ },
  allCaps: { count: 0, label: 'ALL CAPS', regex: /^[A-Z0-9\s\-']+$/ }
};

songs.forEach(song => {
  const title = song.track.name;
  Object.keys(titlePatterns).forEach(key => {
    if (titlePatterns[key].regex.test(title)) {
      titlePatterns[key].count++;
    }
  });
});

const titlePatternsArray = Object.entries(titlePatterns)
  .map(([key, data]) => ({
    pattern: key,
    label: data.label,
    count: data.count,
    percent: Math.round(1000 * data.count / songs.length) / 10
  }))
  .sort((a, b) => b.count - a.count);

console.log(`  - Title patterns: ${titlePatternsArray[0].label} (${titlePatternsArray[0].percent}%)`);

// Title evolution by decade
const titleEvolutionByDecade = {};
songs.forEach(song => {
  const year = getYear(song.release_date);
  if (!year) return;
  const decade = getDecade(year);

  if (!titleEvolutionByDecade[decade]) {
    titleEvolutionByDecade[decade] = {
      decade,
      label: `${decade}s`,
      totalLength: 0,
      totalWords: 0,
      count: 0,
      featCount: 0,
      remixCount: 0,
      parentheticalCount: 0
    };
  }

  const title = song.track.name;
  titleEvolutionByDecade[decade].totalLength += title.length;
  titleEvolutionByDecade[decade].totalWords += title.split(/\s+/).length;
  titleEvolutionByDecade[decade].count++;

  if (/\b(feat\.?|ft\.?)\b/i.test(title)) titleEvolutionByDecade[decade].featCount++;
  if (/\bremix\b/i.test(title)) titleEvolutionByDecade[decade].remixCount++;
  if (/\([^)]+\)/.test(title)) titleEvolutionByDecade[decade].parentheticalCount++;
});

const titleEvolution = Object.values(titleEvolutionByDecade)
  .map(d => ({
    decade: d.decade,
    label: d.label,
    avgLength: Math.round(d.totalLength / d.count),
    avgWords: Math.round(10 * d.totalWords / d.count) / 10,
    featPercent: Math.round(1000 * d.featCount / d.count) / 10,
    remixPercent: Math.round(1000 * d.remixCount / d.count) / 10,
    parentheticalPercent: Math.round(1000 * d.parentheticalCount / d.count) / 10
  }))
  .sort((a, b) => a.decade - b.decade);

console.log(`  - Title evolution: avg length from ${titleEvolution[0]?.avgLength || 0} to ${titleEvolution[titleEvolution.length - 1]?.avgLength || 0} chars`);

const titleAnalysis = {
  keywords: topKeywords,
  lengthStats: {
    avgLength: avgTitleLength,
    avgWords: avgWordCount,
    distribution: titleLengthDist
  },
  patterns: titlePatternsArray,
  evolution: titleEvolution
};

// ============================================
// SECTION 6: CORRELATION DISCOVERY
// ============================================
console.log('\nComputing Correlations...');

// Duration vs Popularity (30-second buckets)
const durationPopBuckets = {};
songs.forEach(song => {
  const dur = parseDuration(song.duration);
  if (dur <= 0) return;

  const bucket = Math.floor(dur / 30) * 30;
  const label = `${Math.floor(bucket / 60)}:${String(bucket % 60).padStart(2, '0')}`;

  if (!durationPopBuckets[bucket]) {
    durationPopBuckets[bucket] = { bucket, label, totalPop: 0, count: 0 };
  }
  durationPopBuckets[bucket].totalPop += song.popularity;
  durationPopBuckets[bucket].count++;
});

const durationPopularity = Object.values(durationPopBuckets)
  .filter(b => b.count >= 10) // Only meaningful buckets
  .map(b => ({
    bucket: b.bucket,
    label: b.label,
    avgPopularity: Math.round(10 * b.totalPop / b.count) / 10,
    count: b.count
  }))
  .sort((a, b) => a.bucket - b.bucket);

// Find optimal duration
const optimalDuration = durationPopularity.reduce((best, curr) =>
  curr.avgPopularity > best.avgPopularity ? curr : best, durationPopularity[0]);

console.log(`  - Optimal duration: ${optimalDuration.label} (${optimalDuration.avgPopularity} avg pop)`);

// Collaboration impact on popularity
const soloSongs = songs.filter(s => s.artists.length === 1);
const collabSongs = songs.filter(s => s.artists.length > 1);

const collabImpact = {
  solo: {
    count: soloSongs.length,
    avgPopularity: Math.round(10 * soloSongs.reduce((sum, s) => sum + s.popularity, 0) / soloSongs.length) / 10,
    avgDuration: Math.round(soloSongs.reduce((sum, s) => sum + parseDuration(s.duration), 0) / soloSongs.length),
    explicitPercent: Math.round(1000 * soloSongs.filter(s => s.explicit).length / soloSongs.length) / 10
  },
  collab: {
    count: collabSongs.length,
    avgPopularity: Math.round(10 * collabSongs.reduce((sum, s) => sum + s.popularity, 0) / collabSongs.length) / 10,
    avgDuration: Math.round(collabSongs.reduce((sum, s) => sum + parseDuration(s.duration), 0) / collabSongs.length),
    explicitPercent: Math.round(1000 * collabSongs.filter(s => s.explicit).length / collabSongs.length) / 10
  },
  difference: 0
};
collabImpact.difference = Math.round(10 * (collabImpact.collab.avgPopularity - collabImpact.solo.avgPopularity)) / 10;

console.log(`  - Collab impact: ${collabImpact.difference > 0 ? '+' : ''}${collabImpact.difference} popularity`);

// Album type performance
const albumTypePerformance = {};
songs.forEach(song => {
  const type = song.album_type || 'unknown';
  if (!albumTypePerformance[type]) {
    albumTypePerformance[type] = { type, totalPop: 0, count: 0, explicit: 0, totalDur: 0 };
  }
  albumTypePerformance[type].totalPop += song.popularity;
  albumTypePerformance[type].count++;
  if (song.explicit) albumTypePerformance[type].explicit++;
  albumTypePerformance[type].totalDur += parseDuration(song.duration);
});

const albumTypeStats = Object.values(albumTypePerformance)
  .map(t => ({
    type: t.type,
    count: t.count,
    avgPopularity: Math.round(10 * t.totalPop / t.count) / 10,
    explicitPercent: Math.round(1000 * t.explicit / t.count) / 10,
    avgDuration: Math.round(t.totalDur / t.count)
  }))
  .sort((a, b) => b.count - a.count);

console.log(`  - Album types: ${albumTypeStats.map(t => `${t.type}(${t.avgPopularity})`).join(', ')}`);

// Explicit impact
const explicitSongs = songs.filter(s => s.explicit);
const cleanSongs = songs.filter(s => !s.explicit);

const explicitImpact = {
  explicit: {
    count: explicitSongs.length,
    avgPopularity: Math.round(10 * explicitSongs.reduce((sum, s) => sum + s.popularity, 0) / explicitSongs.length) / 10,
    avgDuration: Math.round(explicitSongs.reduce((sum, s) => sum + parseDuration(s.duration), 0) / explicitSongs.length),
    collabPercent: Math.round(1000 * explicitSongs.filter(s => s.artists.length > 1).length / explicitSongs.length) / 10
  },
  clean: {
    count: cleanSongs.length,
    avgPopularity: Math.round(10 * cleanSongs.reduce((sum, s) => sum + s.popularity, 0) / cleanSongs.length) / 10,
    avgDuration: Math.round(cleanSongs.reduce((sum, s) => sum + parseDuration(s.duration), 0) / cleanSongs.length),
    collabPercent: Math.round(1000 * cleanSongs.filter(s => s.artists.length > 1).length / cleanSongs.length) / 10
  },
  difference: 0
};
explicitImpact.difference = Math.round(10 * (explicitImpact.explicit.avgPopularity - explicitImpact.clean.avgPopularity)) / 10;

console.log(`  - Explicit impact: ${explicitImpact.difference > 0 ? '+' : ''}${explicitImpact.difference} popularity`);

const correlations = {
  durationPopularity,
  optimalDuration,
  collabImpact,
  albumTypeStats,
  explicitImpact
};

// ============================================
// SECTION 7: RELEASE INTELLIGENCE
// ============================================
console.log('\nComputing Release Patterns...');

// Monthly seasonality
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const byMonth = Array(12).fill(null).map((_, i) => ({
  month: i + 1,
  label: monthNames[i],
  count: 0,
  totalPop: 0
}));

// Day of week patterns
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const byDayOfWeek = Array(7).fill(null).map((_, i) => ({
  day: i,
  label: dayNames[i],
  count: 0,
  totalPop: 0
}));

songs.forEach(song => {
  if (!song.release_date || song.release_date.length < 10) return;

  try {
    const date = new Date(song.release_date);
    if (isNaN(date.getTime())) return;

    const month = date.getMonth();
    byMonth[month].count++;
    byMonth[month].totalPop += song.popularity;

    const dayOfWeek = date.getDay();
    byDayOfWeek[dayOfWeek].count++;
    byDayOfWeek[dayOfWeek].totalPop += song.popularity;
  } catch (e) {
    // Skip invalid dates
  }
});

const monthlyStats = byMonth.map(m => ({
  ...m,
  avgPopularity: m.count > 0 ? Math.round(10 * m.totalPop / m.count) / 10 : 0,
  percent: Math.round(1000 * m.count / songs.length) / 10
}));

const dayOfWeekStats = byDayOfWeek.map(d => ({
  ...d,
  avgPopularity: d.count > 0 ? Math.round(10 * d.totalPop / d.count) / 10 : 0,
  percent: Math.round(1000 * d.count / songs.length) / 10
}));

const peakMonth = monthlyStats.reduce((best, curr) => curr.count > best.count ? curr : best, monthlyStats[0]);
const peakDay = dayOfWeekStats.reduce((best, curr) => curr.count > best.count ? curr : best, dayOfWeekStats[0]);

console.log(`  - Peak month: ${peakMonth.label} (${peakMonth.count} tracks)`);
console.log(`  - Peak day: ${peakDay.label} (${peakDay.count} tracks)`);

// Track age analysis (days since release)
const today = new Date('2025-01-01');
const ageDistribution = [];
const ageBuckets = [
  { label: '< 1 year', min: 0, max: 365 },
  { label: '1-2 years', min: 365, max: 730 },
  { label: '2-5 years', min: 730, max: 1825 },
  { label: '5-10 years', min: 1825, max: 3650 },
  { label: '10-20 years', min: 3650, max: 7300 },
  { label: '20+ years', min: 7300, max: Infinity }
];

ageBuckets.forEach(bucket => {
  bucket.count = 0;
  bucket.totalPop = 0;
});

songs.forEach(song => {
  if (!song.release_date) return;

  try {
    const releaseDate = new Date(song.release_date);
    if (isNaN(releaseDate.getTime())) return;

    const ageDays = Math.floor((today - releaseDate) / (1000 * 60 * 60 * 24));

    for (const bucket of ageBuckets) {
      if (ageDays >= bucket.min && ageDays < bucket.max) {
        bucket.count++;
        bucket.totalPop += song.popularity;
        break;
      }
    }
  } catch (e) {
    // Skip invalid dates
  }
});

const ageStats = ageBuckets.map(b => ({
  label: b.label,
  count: b.count,
  percent: Math.round(1000 * b.count / songs.length) / 10,
  avgPopularity: b.count > 0 ? Math.round(10 * b.totalPop / b.count) / 10 : 0
}));

console.log(`  - Age distribution: ${ageStats.map(a => `${a.label}(${a.percent}%)`).join(', ')}`);

// Rank vs Age scatter data (sample for visualization)
const rankByAge = songs
  .filter(s => s.release_date && getYear(s.release_date))
  .map(s => {
    const releaseDate = new Date(s.release_date);
    const ageDays = Math.floor((today - releaseDate) / (1000 * 60 * 60 * 24));
    return {
      rank: s.rank,
      age: Math.round(ageDays / 365 * 10) / 10, // Age in years
      year: getYear(s.release_date),
      popularity: s.popularity
    };
  })
  .filter((_, i) => i % 20 === 0) // Sample every 20th track for visualization
  .slice(0, 200);

const releasePatterns = {
  byMonth: monthlyStats,
  byDayOfWeek: dayOfWeekStats,
  peakMonth,
  peakDay,
  ageDistribution: ageStats,
  rankByAge
};

// ============================================
// SECTION 8: DEEP PATTERNS
// ============================================
console.log('\nComputing Deep Patterns...');

// Duplicate analysis by category
const duplicateCategories = {
  single: { label: '1 copy', min: 1, max: 1, count: 0 },
  few: { label: '2-5 copies', min: 2, max: 5, count: 0 },
  moderate: { label: '6-20 copies', min: 6, max: 20, count: 0 },
  many: { label: '21-100 copies', min: 21, max: 100, count: 0 },
  extreme: { label: '100+ copies', min: 101, max: Infinity, count: 0 }
};

songs.forEach(song => {
  const copies = song.copies || 1;
  for (const key of Object.keys(duplicateCategories)) {
    const cat = duplicateCategories[key];
    if (copies >= cat.min && copies <= cat.max) {
      cat.count++;
      break;
    }
  }
});

const duplicateStats = Object.values(duplicateCategories).map(c => ({
  label: c.label,
  count: c.count,
  percent: Math.round(1000 * c.count / songs.length) / 10
}));

// Top duplicates by decade
const duplicatesByDecade = {};
songs.filter(s => s.copies > 1).forEach(song => {
  const year = getYear(song.release_date);
  if (!year) return;
  const decade = getDecade(year);

  if (!duplicatesByDecade[decade]) {
    duplicatesByDecade[decade] = { decade, label: `${decade}s`, totalCopies: 0, count: 0 };
  }
  duplicatesByDecade[decade].totalCopies += song.copies;
  duplicatesByDecade[decade].count++;
});

const duplicatesByDecadeArray = Object.values(duplicatesByDecade)
  .map(d => ({
    ...d,
    avgCopies: Math.round(d.totalCopies / d.count)
  }))
  .sort((a, b) => a.decade - b.decade);

console.log(`  - Duplicate distribution: ${duplicateStats.map(d => `${d.label}(${d.count})`).join(', ')}`);

// Artist collaboration network (top 50 artists, their connections)
const artistCollabs = {};
songs.filter(s => s.artists.length > 1).forEach(song => {
  const artistNames = song.artists.map(a => a.name);

  // Count pairwise collaborations
  for (let i = 0; i < artistNames.length; i++) {
    for (let j = i + 1; j < artistNames.length; j++) {
      const pair = [artistNames[i], artistNames[j]].sort().join('|||');
      artistCollabs[pair] = (artistCollabs[pair] || 0) + 1;
    }
  }
});

// Get top 100 collaboration pairs
const topCollabPairs = Object.entries(artistCollabs)
  .map(([pair, count]) => {
    const [artist1, artist2] = pair.split('|||');
    return { artist1, artist2, count };
  })
  .sort((a, b) => b.count - a.count)
  .slice(0, 100);

// Build adjacency for chord diagram (top 30 most connected artists)
const artistConnectionCount = {};
topCollabPairs.forEach(p => {
  artistConnectionCount[p.artist1] = (artistConnectionCount[p.artist1] || 0) + p.count;
  artistConnectionCount[p.artist2] = (artistConnectionCount[p.artist2] || 0) + p.count;
});

const topConnectedArtists = Object.entries(artistConnectionCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .map(([name]) => name);

// Build chord matrix
const chordMatrix = [];
const artistIndex = {};
topConnectedArtists.forEach((name, i) => {
  artistIndex[name] = i;
  chordMatrix.push(Array(topConnectedArtists.length).fill(0));
});

topCollabPairs.forEach(p => {
  const i = artistIndex[p.artist1];
  const j = artistIndex[p.artist2];
  if (i !== undefined && j !== undefined) {
    chordMatrix[i][j] = p.count;
    chordMatrix[j][i] = p.count;
  }
});

const artistNetwork = {
  artists: topConnectedArtists,
  matrix: chordMatrix,
  topPairs: topCollabPairs.slice(0, 20)
};

console.log(`  - Top collab pair: ${topCollabPairs[0]?.artist1} & ${topCollabPairs[0]?.artist2} (${topCollabPairs[0]?.count} tracks)`);

// Decade DNA (multi-dimensional profile)
const decadeDNA = byDecadeArray.map(d => {
  const decadeSongs = songs.filter(s => getDecade(getYear(s.release_date)) === d.decade);
  const avgDur = decadeSongs.reduce((sum, s) => sum + parseDuration(s.duration), 0) / decadeSongs.length;
  const collabCount = decadeSongs.filter(s => s.artists.length > 1).length;
  const singleCount = decadeSongs.filter(s => s.album_type === 'single').length;

  return {
    decade: d.decade,
    label: d.label,
    metrics: {
      avgDuration: Math.round(avgDur),
      durationNorm: Math.round(100 * avgDur / 300), // Normalized to 5 min = 100
      explicitPercent: d.explicitPercent,
      collabPercent: Math.round(100 * collabCount / decadeSongs.length),
      singlePercent: Math.round(100 * singleCount / decadeSongs.length),
      avgPopularity: d.avgPopularity,
      trackCount: d.count
    }
  };
});

console.log(`  - Decade DNA computed for ${decadeDNA.length} decades`);

// Breakout profile (95-100 popularity)
const breakoutSongs = songs.filter(s => s.popularity >= 95);
const nonBreakoutSongs = songs.filter(s => s.popularity < 95);

const breakoutProfile = {
  count: breakoutSongs.length,
  percent: Math.round(1000 * breakoutSongs.length / songs.length) / 10,
  characteristics: {
    avgDuration: Math.round(breakoutSongs.reduce((sum, s) => sum + parseDuration(s.duration), 0) / breakoutSongs.length),
    collabPercent: Math.round(100 * breakoutSongs.filter(s => s.artists.length > 1).length / breakoutSongs.length),
    explicitPercent: Math.round(100 * breakoutSongs.filter(s => s.explicit).length / breakoutSongs.length),
    singlePercent: Math.round(100 * breakoutSongs.filter(s => s.album_type === 'single').length / breakoutSongs.length),
    avgTitleLength: Math.round(breakoutSongs.reduce((sum, s) => sum + s.track.name.length, 0) / breakoutSongs.length)
  },
  comparison: {
    avgDuration: Math.round(nonBreakoutSongs.reduce((sum, s) => sum + parseDuration(s.duration), 0) / nonBreakoutSongs.length),
    collabPercent: Math.round(100 * nonBreakoutSongs.filter(s => s.artists.length > 1).length / nonBreakoutSongs.length),
    explicitPercent: Math.round(100 * nonBreakoutSongs.filter(s => s.explicit).length / nonBreakoutSongs.length),
    singlePercent: Math.round(100 * nonBreakoutSongs.filter(s => s.album_type === 'single').length / nonBreakoutSongs.length),
    avgTitleLength: Math.round(nonBreakoutSongs.reduce((sum, s) => sum + s.track.name.length, 0) / nonBreakoutSongs.length)
  },
  topBreakout: breakoutSongs.slice(0, 10).map(s => ({
    track: s.track.name,
    artist: s.artists.map(a => a.name).join(', '),
    popularity: s.popularity,
    year: getYear(s.release_date)
  }))
};

console.log(`  - Breakout tracks (95+): ${breakoutProfile.count} (${breakoutProfile.percent}%)`);

const deepPatterns = {
  duplicates: {
    distribution: duplicateStats,
    byDecade: duplicatesByDecadeArray
  },
  artistNetwork,
  decadeDNA,
  breakoutProfile
};

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
  // New sections for deep analysis
  titleAnalysis,
  correlations,
  releasePatterns,
  deepPatterns,
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
