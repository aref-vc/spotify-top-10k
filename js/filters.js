/**
 * Spotify Top 10K - Filter System
 * Global filter state management with caching
 */

const Filters = {
  // Current filter state
  state: {
    decades: [],      // Empty = all decades
    albumTypes: [],   // Empty = all types
    explicit: null    // null = all, true = explicit only, false = clean only
  },

  // Cache for filtered data
  _cacheKey: null,
  _cachedData: null,

  // Registered callbacks for filter changes
  _callbacks: [],

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this._bindDecadeFilters();
    this._bindTypeFilters();
    this._bindExplicitFilters();
    this._bindResetButton();
  },

  _bindDecadeFilters() {
    const chips = document.querySelectorAll('#decade-filters .filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const decade = parseInt(chip.dataset.decade);
        this._toggleArrayFilter('decades', decade, chip);
      });
    });
  },

  _bindTypeFilters() {
    const chips = document.querySelectorAll('#type-filters .filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.dataset.type;
        this._toggleArrayFilter('albumTypes', type, chip);
      });
    });
  },

  _bindExplicitFilters() {
    const chips = document.querySelectorAll('#explicit-filters .filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const explicit = chip.dataset.explicit === 'true';

        // Toggle behavior: clicking active chip deselects it
        if (this.state.explicit === explicit) {
          this.state.explicit = null;
          chip.classList.remove('active');
        } else {
          // Deselect other chip
          chips.forEach(c => c.classList.remove('active'));
          this.state.explicit = explicit;
          chip.classList.add('active');
        }

        this._invalidateCache();
        this._notifyCallbacks();
      });
    });
  },

  _bindResetButton() {
    const resetBtn = document.getElementById('filter-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  },

  _toggleArrayFilter(stateKey, value, chip) {
    const arr = this.state[stateKey];
    const index = arr.indexOf(value);

    if (index > -1) {
      arr.splice(index, 1);
      chip.classList.remove('active');
    } else {
      arr.push(value);
      chip.classList.add('active');
    }

    this._invalidateCache();
    this._notifyCallbacks();
  },

  // ============================================
  // FILTER OPERATIONS
  // ============================================

  isFiltered() {
    return (
      this.state.decades.length > 0 ||
      this.state.albumTypes.length > 0 ||
      this.state.explicit !== null
    );
  },

  filterSong(song) {
    // Decade filter
    if (this.state.decades.length > 0) {
      if (!this.state.decades.includes(song.decade)) {
        return false;
      }
    }

    // Album type filter
    if (this.state.albumTypes.length > 0) {
      if (!this.state.albumTypes.includes(song.albumType)) {
        return false;
      }
    }

    // Explicit filter
    if (this.state.explicit !== null) {
      if (song.explicit !== this.state.explicit) {
        return false;
      }
    }

    return true;
  },

  getFilteredSongs() {
    const cacheKey = JSON.stringify(this.state);

    if (this._cacheKey === cacheKey && this._cachedData) {
      return this._cachedData;
    }

    if (!this.isFiltered()) {
      this._cachedData = DATA.songs;
    } else {
      this._cachedData = DATA.songs.filter(song => this.filterSong(song));
    }

    this._cacheKey = cacheKey;
    return this._cachedData;
  },

  // ============================================
  // AGGREGATION WITH FILTERS
  // ============================================

  getFilteredStats() {
    const songs = this.getFilteredSongs();

    const uniqueArtists = new Set();
    songs.forEach(s => s.artists.forEach(a => uniqueArtists.add(a)));

    return {
      totalTracks: songs.length,
      totalArtists: uniqueArtists.size,
      avgPopularity: songs.length > 0
        ? Math.round(songs.reduce((sum, s) => sum + s.popularity, 0) / songs.length)
        : 0,
      explicitCount: songs.filter(s => s.explicit).length,
      collaborationCount: songs.filter(s => s.artistCount > 1).length
    };
  },

  getFilteredByDecade() {
    const songs = this.getFilteredSongs();
    const byDecade = {};

    songs.forEach(song => {
      const decade = song.decade;
      if (!byDecade[decade]) {
        byDecade[decade] = {
          decade,
          label: `${decade}s`,
          count: 0,
          avgPopularity: 0,
          explicitCount: 0
        };
      }
      byDecade[decade].count++;
      byDecade[decade].avgPopularity += song.popularity;
      if (song.explicit) byDecade[decade].explicitCount++;
    });

    Object.values(byDecade).forEach(d => {
      d.avgPopularity = Math.round(d.avgPopularity / d.count);
      d.explicitPercent = Math.round(100 * d.explicitCount / d.count);
    });

    return Object.values(byDecade).sort((a, b) => a.decade - b.decade);
  },

  getFilteredArtists() {
    const songs = this.getFilteredSongs();
    const artistStats = {};

    songs.forEach(song => {
      song.artists.forEach((artist, idx) => {
        if (!artistStats[artist]) {
          artistStats[artist] = {
            name: artist,
            trackCount: 0,
            avgPopularity: 0,
            soloTracks: 0,
            collabTracks: 0,
            featuredIn: 0
          };
        }

        artistStats[artist].trackCount++;
        artistStats[artist].avgPopularity += song.popularity;

        if (song.artistCount === 1) {
          artistStats[artist].soloTracks++;
        } else {
          artistStats[artist].collabTracks++;
          if (idx > 0) artistStats[artist].featuredIn++;
        }
      });
    });

    Object.values(artistStats).forEach(a => {
      a.avgPopularity = Math.round(a.avgPopularity / a.trackCount);
    });

    return Object.values(artistStats)
      .sort((a, b) => b.trackCount - a.trackCount);
  },

  getFilteredPopularity() {
    const songs = this.getFilteredSongs();
    const dist = {
      '70-74': 0, '75-79': 0, '80-84': 0,
      '85-89': 0, '90-94': 0, '95-100': 0
    };

    songs.forEach(s => {
      const pop = s.popularity;
      if (pop >= 95) dist['95-100']++;
      else if (pop >= 90) dist['90-94']++;
      else if (pop >= 85) dist['85-89']++;
      else if (pop >= 80) dist['80-84']++;
      else if (pop >= 75) dist['75-79']++;
      else dist['70-74']++;
    });

    return Object.entries(dist).map(([range, count]) => ({
      range,
      count,
      percent: songs.length > 0 ? Math.round(100 * count / songs.length) : 0
    }));
  },

  getFilteredAlbumTypes() {
    const songs = this.getFilteredSongs();
    const types = {};

    songs.forEach(s => {
      const type = s.albumType || 'unknown';
      if (!types[type]) types[type] = 0;
      types[type]++;
    });

    return Object.entries(types)
      .map(([type, count]) => ({
        type,
        count,
        percent: songs.length > 0 ? Math.round(100 * count / songs.length) : 0
      }))
      .sort((a, b) => b.count - a.count);
  },

  // ============================================
  // RESET
  // ============================================

  reset() {
    this.state.decades = [];
    this.state.albumTypes = [];
    this.state.explicit = null;

    // Clear all active chips
    document.querySelectorAll('.filter-chip.active').forEach(chip => {
      chip.classList.remove('active');
    });

    this._invalidateCache();
    this._notifyCallbacks();
  },

  // ============================================
  // CALLBACKS
  // ============================================

  register(callback) {
    this._callbacks.push(callback);
  },

  _notifyCallbacks() {
    const filteredSongs = this.getFilteredSongs();
    this._callbacks.forEach(cb => cb(filteredSongs));
  },

  _invalidateCache() {
    this._cacheKey = null;
    this._cachedData = null;
  }
};

// Make Filters globally available
window.Filters = Filters;
