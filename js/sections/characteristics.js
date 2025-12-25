/**
 * Section 4: Music Characteristics
 * Charts: Duration Distribution, Explicit Trend, Duration vs Popularity, Duplicates
 */

function initCharacteristics() {
  renderDurationDist();
  renderExplicitTrend();
  renderOptimalDuration();
  renderDuplicates();

  Filters.register(onCharacteristicsFilterChange);
}

function onCharacteristicsFilterChange() {
  renderDurationDist();
  renderExplicitTrend();
  renderOptimalDuration();
  renderDuplicates();
}

// Chart 13: Duration Distribution
function renderDurationDist() {
  const container = document.getElementById('duration-content');
  if (!container) return;

  const songs = Filters.getFilteredSongs();

  // Create duration buckets (30-second intervals)
  const buckets = {};
  songs.forEach(s => {
    if (!s.durationSec) return;
    const bucket = Math.floor(s.durationSec / 30) * 30;
    if (!buckets[bucket]) {
      buckets[bucket] = { seconds: bucket, count: 0 };
    }
    buckets[bucket].count++;
  });

  const data = Object.values(buckets)
    .filter(d => d.seconds >= 60 && d.seconds <= 420) // 1-7 minutes
    .sort((a, b) => a.seconds - b.seconds);

  const dims = Utils.getChartDimensions(container, { left: 50, bottom: 60 });
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
    .domain(data.map(d => d.seconds))
    .range([0, dims.innerWidth])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) * 1.1])
    .range([dims.innerHeight, 0]);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { y: true });

  // X axis with time labels
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale)
      .tickValues(data.filter((d, i) => i % 2 === 0).map(d => d.seconds))
      .tickFormat(d => Utils.formatDuration(d))
    );
  Utils.styleAxis(xAxis);

  // Y axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => Utils.formatNumber(d)));
  Utils.styleAxis(yAxis, { hideAxisLine: true });

  // Bars with gradient from cyan to green (shorter to longer)
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.seconds))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', (d, i) => d3.interpolateViridis(i / data.length))
    .attr('rx', 2)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${Utils.formatDuration(d.seconds)} - ${Utils.formatDuration(d.seconds + 29)}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .attr('y', d => yScale(d.count))
    .attr('height', d => dims.innerHeight - yScale(d.count));

  // X axis label
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text('Duration');
}

// Chart 14: Explicit Content by Decade
function renderExplicitTrend() {
  const container = document.getElementById('explicit-trend-content');
  if (!container) return;

  const data = Filters.isFiltered() ? Filters.getFilteredByDecade() : DATA.byDecade;
  const dims = Utils.getChartDimensions(container, { left: 50, bottom: 60, right: 30 });
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
    .padding(0.3);

  const yScale = d3.scaleLinear()
    .domain([0, Math.max(d3.max(data, d => d.explicitPercent) * 1.2, 50)])
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
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d + '%'));
  Utils.styleAxis(yAxis, { hideAxisLine: true });

  // Bars
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', Utils.colors.coral)
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${d.explicitPercent}% explicit</div>
        <div class="tooltip-value">${Utils.formatNumber(d.explicitCount)} of ${Utils.formatNumber(d.count)} tracks</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 80)
    .attr('y', d => yScale(d.explicitPercent))
    .attr('height', d => dims.innerHeight - yScale(d.explicitPercent));

  // Line connecting bar tops
  const line = d3.line()
    .x(d => xScale(d.label) + xScale.bandwidth() / 2)
    .y(d => yScale(d.explicitPercent))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', Utils.colors.amber)
    .attr('stroke-width', 2)
    .attr('d', line)
    .attr('stroke-dasharray', function() { return this.getTotalLength(); })
    .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
    .transition()
    .duration(1200)
    .delay(400)
    .attr('stroke-dashoffset', 0);

  // Dots on line
  g.selectAll('.dot')
    .data(data)
    .join('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('cy', d => yScale(d.explicitPercent))
    .attr('r', 0)
    .attr('fill', Utils.colors.amber)
    .transition()
    .duration(400)
    .delay((d, i) => 800 + i * 80)
    .attr('r', 5);
}

// Chart 15: Duration vs Popularity (Scatter)
function renderOptimalDuration() {
  const container = document.getElementById('optimal-duration-content');
  if (!container) return;

  // Sample for performance (show 500 random songs)
  const allSongs = Filters.getFilteredSongs();
  const sampleSize = Math.min(500, allSongs.length);
  const step = Math.floor(allSongs.length / sampleSize);
  const songs = allSongs.filter((s, i) => i % step === 0).slice(0, sampleSize);

  const dims = Utils.getChartDimensions(container, { left: 50, bottom: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (songs.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No data for current filters');
    return;
  }

  const xScale = d3.scaleLinear()
    .domain([0, 480]) // 0-8 minutes
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([70, 100])
    .range([dims.innerHeight, 0]);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { x: true, y: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale)
      .tickValues([60, 120, 180, 240, 300, 360, 420])
      .tickFormat(d => Utils.formatDuration(d))
    );
  Utils.styleAxis(xAxis);

  // Y axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(yScale).ticks(5));
  Utils.styleAxis(yAxis, { hideAxisLine: true });

  // Scatter dots
  g.selectAll('.dot')
    .data(songs)
    .join('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.durationSec || 0))
    .attr('cy', d => yScale(d.popularity))
    .attr('r', 0)
    .attr('fill', Utils.colors.cyan)
    .attr('opacity', 0.5)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.track}</div>
        <div class="tooltip-value">${d.artists.join(', ')}</div>
        <div class="tooltip-value">Duration: ${d.duration}</div>
        <div class="tooltip-value">Popularity: ${d.popularity}</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(600)
    .delay((d, i) => i * 2)
    .attr('r', 4);

  // Average line
  const durationBuckets = {};
  songs.forEach(s => {
    const bucket = Math.round(s.durationSec / 30) * 30;
    if (!durationBuckets[bucket]) {
      durationBuckets[bucket] = { durations: [], popularities: [] };
    }
    durationBuckets[bucket].popularities.push(s.popularity);
  });

  const avgData = Object.entries(durationBuckets)
    .map(([sec, data]) => ({
      seconds: parseInt(sec),
      avgPop: data.popularities.reduce((a, b) => a + b, 0) / data.popularities.length
    }))
    .filter(d => d.seconds >= 60 && d.seconds <= 420)
    .sort((a, b) => a.seconds - b.seconds);

  if (avgData.length > 2) {
    const line = d3.line()
      .x(d => xScale(d.seconds))
      .y(d => yScale(d.avgPop))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(avgData)
      .attr('fill', 'none')
      .attr('stroke', Utils.colors.primary)
      .attr('stroke-width', 3)
      .attr('d', line)
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .delay(600)
      .attr('opacity', 0.8);
  }

  // Labels
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text('Duration');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -dims.innerHeight / 2)
    .attr('y', -35)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text('Popularity');
}

// Chart 16: Most Re-released Tracks
function renderDuplicates() {
  const container = document.getElementById('duplicates-content');
  if (!container) return;

  let duplicates;
  if (Filters.isFiltered()) {
    const songs = Filters.getFilteredSongs()
      .filter(s => s.copies > 10)
      .sort((a, b) => b.copies - a.copies)
      .slice(0, 15);
    duplicates = songs.map(s => ({
      track: s.track,
      artist: s.artists.join(', '),
      copies: s.copies
    }));
  } else {
    duplicates = DATA.isrcDuplicates.slice(0, 15);
  }

  const dims = Utils.getChartDimensions(container, { left: 180, right: 50 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (duplicates.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No duplicated tracks found');
    return;
  }

  const maxCopies = d3.max(duplicates, d => d.copies);

  const xScale = d3.scaleLinear()
    .domain([0, maxCopies * 1.1])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(duplicates.map((d, i) => i))
    .range([0, dims.innerHeight])
    .padding(0.25);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { x: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => Utils.formatNumber(d)));
  Utils.styleAxis(xAxis);

  // Bars
  g.selectAll('.bar')
    .data(duplicates)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', (d, i) => yScale(i))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', Utils.colors.emerald)
    .attr('rx', 3)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.track}</div>
        <div class="tooltip-value">${d.artist}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.copies)} versions on Spotify</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 40)
    .attr('width', d => xScale(d.copies));

  // Track labels
  g.selectAll('.label')
    .data(duplicates)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.55rem')
    .text(d => {
      const name = d.track;
      return name.length > 24 ? name.substring(0, 24) + '...' : name;
    });

  // Copy count labels
  g.selectAll('.count-label')
    .data(duplicates)
    .join('text')
    .attr('class', 'count-label')
    .attr('x', d => xScale(d.copies) + 5)
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .style('opacity', 0)
    .text(d => Utils.formatNumber(d.copies))
    .transition()
    .duration(400)
    .delay((d, i) => i * 40 + 600)
    .style('opacity', 1);

  // X axis label
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text('Number of Versions (ISRC Duplicates)');
}

window.initCharacteristics = initCharacteristics;
