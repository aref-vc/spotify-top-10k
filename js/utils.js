/**
 * Spotify Top 10K - Utility Functions
 * Shared D3 helpers, colors, and tooltips
 */

const Utils = {
  // ============================================
  // COLOR PALETTES
  // ============================================

  colors: {
    primary: '#1DB954',    // Spotify Green
    lime: '#BEFF00',
    cyan: '#00BAFE',
    amber: '#FFC000',
    coral: '#F04E50',
    emerald: '#00DE71',
    text: {
      primary: '#FFFFE3',
      secondary: '#B3B3A8',
      tertiary: '#808078'
    },
    bg: {
      card: '#1E1E1C',
      elevated: '#1A1A18'
    }
  },

  decadeColors: {
    1950: '#8B4513',
    1960: '#FF6B6B',
    1970: '#FFA500',
    1980: '#FF1493',
    1990: '#9B59B6',
    2000: '#3498DB',
    2010: '#1DB954',
    2020: '#BEFF00'
  },

  // Chart color sequence
  chartColors: [
    '#1DB954', '#00BAFE', '#BEFF00', '#FFC000',
    '#FF6B6B', '#9B59B6', '#00DE71', '#F04E50',
    '#3498DB', '#FF1493', '#FFA500', '#8B4513'
  ],

  getDecadeColor(decade) {
    return this.decadeColors[decade] || '#666666';
  },

  getChartColor(index) {
    return this.chartColors[index % this.chartColors.length];
  },

  // ============================================
  // TOOLTIP
  // ============================================

  tooltip: null,

  initTooltip() {
    if (this.tooltip) return;

    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  },

  showTooltip(html, event) {
    this.initTooltip();

    const x = event.pageX;
    const y = event.pageY;

    this.tooltip
      .html(html)
      .style('left', `${x + 15}px`)
      .style('top', `${y - 10}px`)
      .classed('visible', true)
      .style('opacity', 1);
  },

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip
        .classed('visible', false)
        .style('opacity', 0);
    }
  },

  // ============================================
  // CHART DIMENSIONS
  // ============================================

  getChartDimensions(container, margin = {}) {
    const defaultMargin = { top: 40, right: 30, bottom: 50, left: 60 };
    const m = { ...defaultMargin, ...margin };

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 350;

    return {
      width,
      height,
      margin: m,
      innerWidth: width - m.left - m.right,
      innerHeight: height - m.top - m.bottom
    };
  },

  // ============================================
  // SVG CREATION
  // ============================================

  createSvg(container, dims) {
    d3.select(container).select('svg').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', dims.width)
      .attr('height', dims.height);

    const g = svg.append('g')
      .attr('transform', `translate(${dims.margin.left},${dims.margin.top})`);

    return { svg, g };
  },

  // ============================================
  // AXIS STYLING
  // ============================================

  styleAxis(axis, options = {}) {
    axis.selectAll('text')
      .attr('fill', this.colors.text.tertiary)
      .style('font-size', '0.7rem');

    axis.selectAll('line, path')
      .attr('stroke', '#2A2A28');

    if (options.hideAxisLine) {
      axis.select('.domain').remove();
    }

    if (options.hideTicks) {
      axis.selectAll('line').remove();
    }

    return axis;
  },

  // ============================================
  // NUMBER FORMATTING
  // ============================================

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  },

  formatPercent(value, decimals = 0) {
    return value.toFixed(decimals) + '%';
  },

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  },

  // ============================================
  // ANIMATION HELPERS
  // ============================================

  animateNumber(element, endValue, duration = 1000) {
    const startValue = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      const current = Math.round(startValue + (endValue - startValue) * eased);
      element.textContent = Utils.formatNumber(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  },

  // ============================================
  // RESPONSIVE HELPERS
  // ============================================

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // ============================================
  // DATA HELPERS
  // ============================================

  aggregateBy(data, key, valueKey = null) {
    const result = {};
    data.forEach(item => {
      const k = item[key];
      if (!result[k]) {
        result[k] = { key: k, count: 0, values: [] };
      }
      result[k].count++;
      if (valueKey && item[valueKey] !== undefined) {
        result[k].values.push(item[valueKey]);
      }
    });

    // Calculate averages if values exist
    Object.values(result).forEach(r => {
      if (r.values.length > 0) {
        r.avg = r.values.reduce((a, b) => a + b, 0) / r.values.length;
        r.sum = r.values.reduce((a, b) => a + b, 0);
      }
      delete r.values;
    });

    return Object.values(result);
  },

  // ============================================
  // GRID LINES
  // ============================================

  addGridLines(g, xScale, yScale, innerWidth, innerHeight, options = {}) {
    if (options.x) {
      g.append('g')
        .attr('class', 'grid grid-x')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', '#2A2A28')
        .attr('stroke-opacity', 0.5);

      g.select('.grid-x .domain').remove();
    }

    if (options.y) {
      g.append('g')
        .attr('class', 'grid grid-y')
        .call(d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', '#2A2A28')
        .attr('stroke-opacity', 0.5);

      g.select('.grid-y .domain').remove();
    }
  }
};

// Make Utils globally available
window.Utils = Utils;
