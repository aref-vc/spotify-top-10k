/**
 * Section 2: Artists & Dominance
 * Charts: Top 20 Artists, Collaborations, Artist Diversity, Most Featured
 */

function initArtists() {
  renderTopArtists();
  renderCollaborations();
  renderDiversity();
  renderFeatured();

  Filters.register(onArtistsFilterChange);
}

function onArtistsFilterChange() {
  renderTopArtists();
  renderCollaborations();
  renderDiversity();
  renderFeatured();
}

// Chart 5: Top 20 Artists
function renderTopArtists() {
  const container = document.getElementById('top-artists-content');
  if (!container) return;

  const artists = Filters.isFiltered()
    ? Filters.getFilteredArtists().slice(0, 20)
    : DATA.artists.top.slice(0, 20);

  const dims = Utils.getChartDimensions(container, { left: 140, right: 50 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (artists.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No data for current filters');
    return;
  }

  const maxCount = d3.max(artists, d => d.trackCount);

  const xScale = d3.scaleLinear()
    .domain([0, maxCount * 1.1])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(artists.map(d => d.name))
    .range([0, dims.innerHeight])
    .padding(0.2);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { x: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5));
  Utils.styleAxis(xAxis);

  // Bars
  g.selectAll('.bar')
    .data(artists)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.name))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', (d, i) => Utils.getChartColor(i))
    .attr('rx', 3)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.name}</div>
        <div class="tooltip-value">${d.trackCount} tracks</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
        <div class="tooltip-value">Solo: ${d.soloTracks} / Collab: ${d.collabTracks}</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .attr('width', d => xScale(d.trackCount));

  // Labels
  g.selectAll('.label')
    .data(artists)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .text(d => d.name.length > 16 ? d.name.substring(0, 16) + '...' : d.name);

  // Value labels
  g.selectAll('.value-label')
    .data(artists)
    .join('text')
    .attr('class', 'value-label')
    .attr('x', d => xScale(d.trackCount) + 5)
    .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .style('opacity', 0)
    .text(d => d.trackCount)
    .transition()
    .duration(800)
    .delay((d, i) => i * 30 + 400)
    .style('opacity', 1);
}

// Chart 6: Collaborations
function renderCollaborations() {
  const container = document.getElementById('collaborations-content');
  if (!container) return;

  const songs = Filters.getFilteredSongs();
  const solo = songs.filter(s => s.artistCount === 1).length;
  const collab = songs.filter(s => s.artistCount > 1).length;
  const total = solo + collab;

  const data = [
    { label: 'Solo', count: solo, color: Utils.colors.primary, percent: total > 0 ? Math.round(100 * solo / total) : 0 },
    { label: 'Collab', count: collab, color: Utils.colors.cyan, percent: total > 0 ? Math.round(100 * collab / total) : 0 }
  ];

  const dims = Utils.getChartDimensions(container, { bottom: 70 });
  const { svg, g } = Utils.createSvg(container, dims);

  const radius = Math.min(dims.innerWidth, dims.innerHeight) / 2 - 30;
  const centerX = dims.innerWidth / 2;
  const centerY = dims.innerHeight / 2;

  const donutG = g.append('g')
    .attr('transform', `translate(${centerX},${centerY})`);

  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius);

  const arcs = donutG.selectAll('.arc')
    .data(pie(data))
    .join('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .attr('stroke', Utils.colors.bg.card)
    .attr('stroke-width', 3)
    .style('opacity', 0)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.data.label}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.data.count)} tracks (${d.data.percent}%)</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .style('opacity', 1);

  // Center stats
  const collabPercent = total > 0 ? Math.round(100 * collab / total) : 0;

  donutG.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', -8)
    .attr('fill', Utils.colors.text.primary)
    .style('font-family', Utils.font)
    .style('font-size', '1.5rem')
    .style('font-weight', '600')
    .text(`${collabPercent}%`);

  donutG.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 15)
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text('Collaborations');

  // Legend at bottom with circles
  Utils.addLegend(g, data, dims, {
    colorFn: d => d.color,
    labelFn: d => d.label,
    valueFn: d => `${d.percent}%`
  });
}

// Chart 7: Artist Diversity (Treemap)
function renderDiversity() {
  const container = document.getElementById('diversity-content');
  if (!container) return;

  const artists = Filters.isFiltered()
    ? Filters.getFilteredArtists().slice(0, 30)
    : DATA.artists.top.slice(0, 30);

  const dims = Utils.getChartDimensions(container, { top: 20, right: 20, bottom: 20, left: 20 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (artists.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No data for current filters');
    return;
  }

  const root = d3.hierarchy({ children: artists })
    .sum(d => d.trackCount);

  d3.treemap()
    .size([dims.innerWidth, dims.innerHeight])
    .padding(2)
    (root);

  const cells = g.selectAll('.cell')
    .data(root.leaves())
    .join('g')
    .attr('class', 'cell')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  cells.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', (d, i) => Utils.getChartColor(i))
    .attr('rx', 3)
    .style('opacity', 0)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.data.name}</div>
        <div class="tooltip-value">${d.data.trackCount} tracks</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 20)
    .style('opacity', 0.85);

  cells.append('text')
    .attr('x', 4)
    .attr('y', 14)
    .attr('fill', Utils.colors.bg.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.55rem')
    .style('font-weight', '600')
    .text(d => {
      const width = d.x1 - d.x0;
      if (width < 40) return '';
      const name = d.data.name;
      const maxLen = Math.floor(width / 6);
      return name.length > maxLen ? name.substring(0, maxLen) + '...' : name;
    });
}

// Chart 8: Most Featured Artists
function renderFeatured() {
  const container = document.getElementById('featured-content');
  if (!container) return;

  let featured;
  if (Filters.isFiltered()) {
    featured = Filters.getFilteredArtists()
      .filter(a => a.featuredIn > 0)
      .sort((a, b) => b.featuredIn - a.featuredIn)
      .slice(0, 15);
  } else {
    featured = DATA.artists.mostFeatured.slice(0, 15);
  }

  const dims = Utils.getChartDimensions(container, { left: 130, right: 40 });
  const { svg, g } = Utils.createSvg(container, dims);

  if (featured.length === 0) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .text('No featured artists found');
    return;
  }

  const maxFeatured = d3.max(featured, d => d.featuredIn);

  const xScale = d3.scaleLinear()
    .domain([0, maxFeatured * 1.1])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(featured.map(d => d.name))
    .range([0, dims.innerHeight])
    .padding(0.35);

  // Lollipop lines
  g.selectAll('.lollipop-line')
    .data(featured)
    .join('line')
    .attr('class', 'lollipop-line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('y2', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('stroke', Utils.colors.cyan)
    .attr('stroke-width', 2)
    .transition()
    .duration(800)
    .delay((d, i) => i * 40)
    .attr('x2', d => xScale(d.featuredIn));

  // Lollipop circles
  g.selectAll('.lollipop-circle')
    .data(featured)
    .join('circle')
    .attr('class', 'lollipop-circle')
    .attr('cx', 0)
    .attr('cy', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('r', 6)
    .attr('fill', Utils.colors.cyan)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.name}</div>
        <div class="tooltip-value">Featured in ${d.featuredIn} tracks</div>
        <div class="tooltip-value">Total tracks: ${d.trackCount}</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 40)
    .attr('cx', d => xScale(d.featuredIn));

  // Labels
  g.selectAll('.label')
    .data(featured)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name);
}

window.initArtists = initArtists;
