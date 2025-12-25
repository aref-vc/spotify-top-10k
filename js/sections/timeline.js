/**
 * Section 3: Timeline & Trends
 * Charts: Tracks by Decade, Era Dominance, Longevity Champions, Pre/Post 2000
 */

function initTimeline() {
  renderTimelineChart();
  renderEraDominance();
  renderLongevity();
  renderEraComparison();

  Filters.register(onTimelineFilterChange);
}

function onTimelineFilterChange() {
  renderTimelineChart();
  renderEraDominance();
  renderLongevity();
  renderEraComparison();
}

// Chart 9: Tracks by Decade
function renderTimelineChart() {
  const container = document.getElementById('timeline-content');
  if (!container) return;

  const data = Filters.isFiltered() ? Filters.getFilteredByDecade() : DATA.byDecade;
  const dims = Utils.getChartDimensions(container, { left: 60, bottom: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (data.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No data for current filters');
    return;
  }

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, dims.innerWidth])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) * 1.1])
    .range([dims.innerHeight, 0]);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { y: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale));
  Utils.styleAxis(xAxis);

  // Y axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => Utils.formatNumber(d)));
  Utils.styleAxis(yAxis, { hideAxisLine: true });

  // Bars with decade colors
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', d => Utils.getDecadeColor(d.decade))
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
        <div class="tooltip-value">Explicit: ${d.explicitPercent}%</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 80)
    .attr('y', d => yScale(d.count))
    .attr('height', d => dims.innerHeight - yScale(d.count));

  // Labels on top of bars
  g.selectAll('.bar-label')
    .data(data)
    .join('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 8)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-size', '0.65rem')
    .style('opacity', 0)
    .text(d => Utils.formatNumber(d.count))
    .transition()
    .duration(400)
    .delay((d, i) => i * 80 + 600)
    .style('opacity', 1);
}

// Chart 10: Era Dominance (Stacked percentage)
function renderEraDominance() {
  const container = document.getElementById('era-dominance-content');
  if (!container) return;

  const data = Filters.isFiltered() ? Filters.getFilteredByDecade() : DATA.byDecade;
  const dims = Utils.getChartDimensions(container);
  const { svg, g } = Utils.createSvg(container, dims);

  if (data.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No data for current filters');
    return;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Create horizontal stacked bar
  let cumulative = 0;
  const stackedData = data.map(d => {
    const start = cumulative;
    cumulative += d.count / total;
    return { ...d, start, end: cumulative, percent: Math.round(100 * d.count / total) };
  });

  const barHeight = 60;
  const barY = dims.innerHeight / 2 - barHeight / 2;

  // Stacked segments
  g.selectAll('.segment')
    .data(stackedData)
    .join('rect')
    .attr('class', 'segment')
    .attr('x', d => d.start * dims.innerWidth)
    .attr('y', barY)
    .attr('width', 0)
    .attr('height', barHeight)
    .attr('fill', d => Utils.getDecadeColor(d.decade))
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${d.percent}% of top 10K</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('width', d => (d.end - d.start) * dims.innerWidth);

  // Labels below bar
  const labelsG = g.append('g')
    .attr('transform', `translate(0, ${barY + barHeight + 20})`);

  stackedData.forEach((d, i) => {
    const segmentWidth = (d.end - d.start) * dims.innerWidth;
    if (segmentWidth > 40) {
      labelsG.append('text')
        .attr('x', (d.start + d.end) / 2 * dims.innerWidth)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('fill', Utils.getDecadeColor(d.decade))
        .style('font-size', '0.7rem')
        .style('font-weight', '600')
        .text(d.label);

      labelsG.append('text')
        .attr('x', (d.start + d.end) / 2 * dims.innerWidth)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('fill', Utils.colors.text.tertiary)
        .style('font-size', '0.6rem')
        .text(`${d.percent}%`);
    }
  });

  // Title
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-size', '0.8rem')
    .text('Share of Top 10,000 by Decade');
}

// Chart 11: Longevity Champions
function renderLongevity() {
  const container = document.getElementById('longevity-content');
  if (!container) return;

  let champions;
  if (Filters.isFiltered()) {
    const songs = Filters.getFilteredSongs()
      .filter(s => s.year && s.year < 2000)
      .sort((a, b) => a.year - b.year)
      .slice(0, 15);
    champions = songs.map(s => ({
      track: s.track,
      artist: s.artists.join(', '),
      year: s.year,
      popularity: s.popularity,
      age: 2025 - s.year
    }));
  } else {
    champions = DATA.longevityChampions.slice(0, 15);
  }

  const dims = Utils.getChartDimensions(container, { left: 160, right: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (champions.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No pre-2000 tracks in selection');
    return;
  }

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(champions, d => d.age) * 1.1])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(champions.map((d, i) => i))
    .range([0, dims.innerHeight])
    .padding(0.25);

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d} years`));
  Utils.styleAxis(xAxis);

  // Bars
  g.selectAll('.bar')
    .data(champions)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', (d, i) => yScale(i))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', d => Utils.getDecadeColor(Math.floor(d.year / 10) * 10))
    .attr('rx', 3)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.track}</div>
        <div class="tooltip-value">${d.artist}</div>
        <div class="tooltip-value">Released: ${d.year} (${d.age} years ago)</div>
        <div class="tooltip-value">Popularity: ${d.popularity}</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 40)
    .attr('width', d => xScale(d.age));

  // Track labels
  g.selectAll('.label')
    .data(champions)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-size', '0.55rem')
    .text(d => {
      const name = d.track;
      return name.length > 20 ? name.substring(0, 20) + '...' : name;
    });

  // Year labels at end of bars
  g.selectAll('.year-label')
    .data(champions)
    .join('text')
    .attr('class', 'year-label')
    .attr('x', d => xScale(d.age) + 5)
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-size', '0.55rem')
    .style('opacity', 0)
    .text(d => d.year)
    .transition()
    .duration(400)
    .delay((d, i) => i * 40 + 600)
    .style('opacity', 1);
}

// Chart 12: Pre-2000 vs Post-2000
function renderEraComparison() {
  const container = document.getElementById('era-comparison-content');
  if (!container) return;

  const songs = Filters.getFilteredSongs();
  const pre2000 = songs.filter(s => s.year && s.year < 2000);
  const post2000 = songs.filter(s => s.year && s.year >= 2000);

  const data = [
    {
      era: 'Pre-2000',
      count: pre2000.length,
      avgPop: pre2000.length > 0 ? Math.round(pre2000.reduce((sum, s) => sum + s.popularity, 0) / pre2000.length) : 0,
      explicit: pre2000.length > 0 ? Math.round(100 * pre2000.filter(s => s.explicit).length / pre2000.length) : 0,
      color: Utils.colors.amber
    },
    {
      era: 'Post-2000',
      count: post2000.length,
      avgPop: post2000.length > 0 ? Math.round(post2000.reduce((sum, s) => sum + s.popularity, 0) / post2000.length) : 0,
      explicit: post2000.length > 0 ? Math.round(100 * post2000.filter(s => s.explicit).length / post2000.length) : 0,
      color: Utils.colors.cyan
    }
  ];

  const dims = Utils.getChartDimensions(container);
  const { svg, g } = Utils.createSvg(container, dims);

  const total = pre2000.length + post2000.length;

  // Create two comparison bars
  const barHeight = 40;
  const gap = 80;
  const startY = dims.innerHeight / 2 - barHeight - gap / 2;

  data.forEach((d, i) => {
    const y = startY + i * (barHeight + gap);
    const percent = total > 0 ? d.count / total : 0;

    // Background bar
    g.append('rect')
      .attr('x', 0)
      .attr('y', y)
      .attr('width', dims.innerWidth)
      .attr('height', barHeight)
      .attr('fill', Utils.colors.bg.elevated)
      .attr('rx', 4);

    // Value bar
    g.append('rect')
      .attr('x', 0)
      .attr('y', y)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('fill', d.color)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay(i * 200)
      .attr('width', percent * dims.innerWidth);

    // Era label
    g.append('text')
      .attr('x', 0)
      .attr('y', y - 10)
      .attr('fill', d.color)
      .style('font-size', '0.8rem')
      .style('font-weight', '600')
      .text(d.era);

    // Stats
    g.append('text')
      .attr('x', dims.innerWidth)
      .attr('y', y - 10)
      .attr('text-anchor', 'end')
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-size', '0.7rem')
      .text(`${Utils.formatNumber(d.count)} tracks (${Math.round(100 * percent)}%)`);

    // Percent label inside bar
    if (percent > 0.1) {
      g.append('text')
        .attr('x', 15)
        .attr('y', y + barHeight / 2 + 5)
        .attr('fill', Utils.colors.bg.primary)
        .style('font-size', '0.8rem')
        .style('font-weight', '600')
        .style('opacity', 0)
        .text(`${Math.round(100 * percent)}%`)
        .transition()
        .duration(400)
        .delay(i * 200 + 600)
        .style('opacity', 1);
    }
  });
}

window.initTimeline = initTimeline;
