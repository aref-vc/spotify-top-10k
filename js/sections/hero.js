/**
 * Section 1: Hero Overview
 * Charts: Key Stats, Popularity Distribution, Top 10 Tracks, Album Type Split
 */

function initHero() {
  renderStats();
  renderPopularityDist();
  renderTopTracks();
  renderAlbumTypes();

  // Register for filter updates
  Filters.register(onHeroFilterChange);
}

function onHeroFilterChange() {
  renderStats();
  renderPopularityDist();
  renderTopTracks();
  renderAlbumTypes();
}

// Chart 1: Key Statistics
function renderStats() {
  const container = document.getElementById('stats-content');
  if (!container) return;

  const stats = Filters.isFiltered() ? Filters.getFilteredStats() : DATA.summary;

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="stat-tracks">${Utils.formatNumber(stats.totalTracks)}</div>
        <div class="stat-label">Total Tracks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-artists">${Utils.formatNumber(stats.totalArtists)}</div>
        <div class="stat-label">Unique Artists</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.avgPopularity || DATA.summary.avgPopularity}</div>
        <div class="stat-label">Avg Popularity</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${DATA.summary.decadesSpanned}</div>
        <div class="stat-label">Decades Spanned</div>
      </div>
    </div>
  `;
}

// Chart 2: Popularity Distribution
function renderPopularityDist() {
  const container = document.getElementById('popularity-content');
  if (!container) return;

  const data = Filters.isFiltered() ? Filters.getFilteredPopularity() : DATA.popularity;
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
    .domain(data.map(d => d.range))
    .range([0, dims.innerWidth])
    .padding(0.3);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) * 1.1])
    .range([dims.innerHeight, 0]);

  // Add grid lines
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

  // Bars
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.range))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', Utils.colors.primary)
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.range}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks (${d.percent}%)</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('y', d => yScale(d.count))
    .attr('height', d => dims.innerHeight - yScale(d.count));

  // Value labels on top of bars
  g.selectAll('.bar-value')
    .data(data)
    .join('text')
    .attr('class', 'bar-value')
    .attr('x', d => xScale(d.range) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 8)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(d => Utils.formatNumber(d.count))
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 600)
    .style('opacity', 1);

  // Percent labels inside bars
  g.selectAll('.percent-label')
    .data(data)
    .join('text')
    .attr('class', 'percent-label')
    .attr('x', d => xScale(d.range) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) + 18)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.bg.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.55rem')
    .style('font-weight', '500')
    .style('opacity', 0)
    .text(d => `${d.percent}%`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 700)
    .style('opacity', d => (dims.innerHeight - yScale(d.count)) > 25 ? 1 : 0);

  // X axis label
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text('Popularity Score');
}

// Chart 3: Top 10 Tracks
function renderTopTracks() {
  const container = document.getElementById('top-tracks-content');
  if (!container) return;

  const songs = Filters.isFiltered() ? Filters.getFilteredSongs().slice(0, 10) : DATA.topTracks.slice(0, 10);
  const dims = Utils.getChartDimensions(container, { left: 180, right: 50 });
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
    .domain([0, 100])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(songs.map((d, i) => i))
    .range([0, dims.innerHeight])
    .padding(0.25);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { x: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5));
  Utils.styleAxis(xAxis);

  // Bars
  g.selectAll('.bar')
    .data(songs)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', (d, i) => yScale(i))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', (d, i) => Utils.getChartColor(i))
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      const artist = d.artists || d.artist;
      Utils.showTooltip(`
        <div class="tooltip-title">${d.track}</div>
        <div class="tooltip-value">${artist}</div>
        <div class="tooltip-value">Popularity: ${d.popularity}</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('width', d => xScale(d.popularity));

  // Labels
  g.selectAll('.label')
    .data(songs)
    .join('text')
    .attr('class', 'label')
    .attr('x', -10)
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text(d => {
      const name = d.track;
      return name.length > 22 ? name.substring(0, 22) + '...' : name;
    });
}

// Chart 4: Album Type Distribution
function renderAlbumTypes() {
  const container = document.getElementById('album-types-content');
  if (!container) return;

  const data = Filters.isFiltered() ? Filters.getFilteredAlbumTypes() : DATA.albumTypes;
  const dims = Utils.getChartDimensions(container, { bottom: 70 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (data.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-family', Utils.font)
      .text('No data for current filters');
    return;
  }

  const radius = Math.min(dims.innerWidth, dims.innerHeight) / 2 - 20;
  const centerX = dims.innerWidth / 2;
  const centerY = dims.innerHeight / 2;

  const donutG = g.append('g')
    .attr('transform', `translate(${centerX},${centerY})`);

  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(radius * 0.55)
    .outerRadius(radius);

  const colors = {
    album: Utils.colors.primary,
    single: Utils.colors.cyan,
    compilation: Utils.colors.amber
  };

  const arcs = donutG.selectAll('.arc')
    .data(pie(data))
    .join('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => colors[d.data.type] || '#666')
    .attr('stroke', Utils.colors.bg.card)
    .attr('stroke-width', 2)
    .style('opacity', 0)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.data.type}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.data.count)} tracks (${d.data.percent}%)</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 150)
    .style('opacity', 1);

  // Center text
  donutG.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.75rem')
    .text('Album Types');

  // Legend at bottom with circles
  Utils.addLegend(g, data, dims, {
    colorFn: d => colors[d.type] || '#666',
    labelFn: d => d.type,
    valueFn: d => `${d.percent}%`
  });
}

window.initHero = initHero;
