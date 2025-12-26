/**
 * Section 8: Deep Patterns
 * Charts: Duplicate Anatomy, Artist Connections (Chord), Decade DNA, Breakout Signals
 */

function initPatterns() {
  renderDuplicateAnatomy();
  renderArtistNetwork();
  renderDecadeDNA();
  renderBreakoutSignals();

  Filters.register(onPatternsFilterChange);
}

function onPatternsFilterChange() {
  renderDuplicateAnatomy();
  renderArtistNetwork();
  renderDecadeDNA();
  renderBreakoutSignals();
}

// Chart 29: Duplicate Anatomy
function renderDuplicateAnatomy() {
  const container = document.getElementById('duplicate-anatomy-content');
  if (!container) return;

  const data = DATA.deepPatterns.duplicates.distribution;
  const dims = Utils.getChartDimensions(container, { left: 110, right: 70 });
  const { svg, g } = Utils.createSvg(container, dims);

  const colors = [Utils.colors.primary, Utils.colors.lime, Utils.colors.cyan,
                  Utils.colors.amber, Utils.colors.coral];

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.percent) * 1.15])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, dims.innerHeight])
    .padding(0.3);

  // Bars
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.label))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', (d, i) => colors[i])
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        <div class="tooltip-value">${d.percent}% of dataset</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('width', d => xScale(d.percent));

  // Labels
  g.selectAll('.label')
    .data(data)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text(d => d.label);

  // Percent + count labels
  g.selectAll('.value-label')
    .data(data)
    .join('text')
    .attr('class', 'value-label')
    .attr('x', d => xScale(d.percent) + 8)
    .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(d => `${d.percent}%`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 600)
    .style('opacity', 1);

  // Insight
  const uniquePercent = data[0]?.percent || 0;
  g.append('text')
    .attr('x', dims.innerWidth)
    .attr('y', dims.innerHeight - 5)
    .attr('text-anchor', 'end')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .text(`${100 - uniquePercent}% have multiple versions`);
}

// Chart 30: Artist Network (Chord Diagram)
function renderArtistNetwork() {
  const container = document.getElementById('artist-network-content');
  if (!container) return;

  const network = DATA.deepPatterns.artistNetwork;
  const dims = Utils.getChartDimensions(container, { top: 10, right: 10, bottom: 10, left: 10 });
  const { svg, g } = Utils.createSvg(container, dims);

  const radius = Math.min(dims.innerWidth, dims.innerHeight) / 2 - 60;
  const centerX = dims.innerWidth / 2;
  const centerY = dims.innerHeight / 2;

  const chordG = g.append('g')
    .attr('transform', `translate(${centerX},${centerY})`);

  // Generate chord layout
  const chord = d3.chord()
    .padAngle(0.04)
    .sortSubgroups(d3.descending);

  const chords = chord(network.matrix);

  // Color scale for artists
  const color = d3.scaleOrdinal()
    .domain(d3.range(network.artists.length))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), network.artists.length));

  // Draw arcs (artist segments)
  const arc = d3.arc()
    .innerRadius(radius)
    .outerRadius(radius + 15);

  const arcsG = chordG.selectAll('.arc')
    .data(chords.groups)
    .join('g')
    .attr('class', 'arc');

  arcsG.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.index))
    .attr('stroke', Utils.colors.bg.primary)
    .attr('stroke-width', 1)
    .style('opacity', 0)
    .on('mouseenter', (event, d) => {
      const artistName = network.artists[d.index];
      const connections = network.matrix[d.index].reduce((sum, v) => sum + v, 0);
      Utils.showTooltip(`
        <div class="tooltip-title">${artistName}</div>
        <div class="tooltip-value">${connections} collaborations</div>
      `, event);

      // Highlight connected chords
      chordG.selectAll('.chord path')
        .style('opacity', c => (c.source.index === d.index || c.target.index === d.index) ? 0.9 : 0.1);
    })
    .on('mouseleave', () => {
      Utils.hideTooltip();
      chordG.selectAll('.chord path').style('opacity', 0.7);
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .style('opacity', 1);

  // Artist name labels
  arcsG.append('text')
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr('dy', '0.35em')
    .attr('transform', d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${radius + 22})
      ${d.angle > Math.PI ? 'rotate(180)' : ''}
    `)
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.5rem')
    .text(d => {
      const name = network.artists[d.index];
      return name.length > 12 ? name.substring(0, 12) + '...' : name;
    });

  // Draw ribbons (connections)
  const ribbon = d3.ribbon()
    .radius(radius);

  chordG.selectAll('.chord')
    .data(chords)
    .join('g')
    .attr('class', 'chord')
    .append('path')
    .attr('d', ribbon)
    .attr('fill', d => color(d.source.index))
    .attr('stroke', Utils.colors.bg.primary)
    .attr('stroke-width', 0.5)
    .style('opacity', 0)
    .on('mouseenter', (event, d) => {
      const artist1 = network.artists[d.source.index];
      const artist2 = network.artists[d.target.index];
      const count = network.matrix[d.source.index][d.target.index];
      Utils.showTooltip(`
        <div class="tooltip-title">${artist1} × ${artist2}</div>
        <div class="tooltip-value">${count} tracks together</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(1000)
    .delay(600)
    .style('opacity', 0.7);

  // Title at center (optional)
  chordG.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', -5)
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .text('Top 30');

  chordG.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 10)
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .text('Collaborators');
}

// Chart 31: Decade DNA (Radar/Spider Chart)
function renderDecadeDNA() {
  const container = document.getElementById('decade-dna-content');
  if (!container) return;

  const data = DATA.deepPatterns.decadeDNA;
  const dims = Utils.getChartDimensions(container, { left: 20, right: 20 });
  const { svg, g } = Utils.createSvg(container, dims);

  // Select 4 most interesting decades for comparison
  const selectedDecades = data.filter(d =>
    [1980, 1990, 2010, 2020].includes(d.decade)
  );

  const metrics = [
    { key: 'durationNorm', label: 'Duration', max: 100 },
    { key: 'explicitPercent', label: 'Explicit %', max: 50 },
    { key: 'collabPercent', label: 'Collab %', max: 60 },
    { key: 'singlePercent', label: 'Singles %', max: 80 }
  ];

  const barHeight = 25;
  const groupHeight = metrics.length * barHeight + 30;
  const barMaxWidth = dims.innerWidth - 100;

  // Draw grouped bars for each decade
  selectedDecades.forEach((decade, di) => {
    const groupY = di * groupHeight + 20;

    // Decade label
    g.append('text')
      .attr('x', 0)
      .attr('y', groupY)
      .attr('fill', Utils.getDecadeColor(decade.decade))
      .style('font-family', Utils.font)
      .style('font-size', '0.8rem')
      .style('font-weight', '600')
      .text(decade.label);

    // Metrics bars
    metrics.forEach((metric, mi) => {
      const y = groupY + 15 + mi * barHeight;
      const value = decade.metrics[metric.key];
      const width = (value / metric.max) * barMaxWidth;

      // Background
      g.append('rect')
        .attr('x', 80)
        .attr('y', y)
        .attr('width', barMaxWidth)
        .attr('height', barHeight - 5)
        .attr('fill', Utils.colors.bg.elevated)
        .attr('rx', 3);

      // Value bar
      g.append('rect')
        .attr('x', 80)
        .attr('y', y)
        .attr('width', 0)
        .attr('height', barHeight - 5)
        .attr('fill', Utils.getDecadeColor(decade.decade))
        .attr('rx', 3)
        .attr('opacity', 0.8)
        .transition()
        .duration(800)
        .delay(di * 150 + mi * 50)
        .attr('width', width);

      // Metric label
      g.append('text')
        .attr('x', 75)
        .attr('y', y + barHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', Utils.colors.text.tertiary)
        .style('font-family', Utils.font)
        .style('font-size', '0.55rem')
        .text(metric.label);

      // Value label
      g.append('text')
        .attr('x', 80 + width + 5)
        .attr('y', y + barHeight / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', Utils.colors.text.secondary)
        .style('font-family', Utils.font)
        .style('font-size', '0.55rem')
        .style('opacity', 0)
        .text(metric.key.includes('Percent') ? `${value}%` : value)
        .transition()
        .delay(di * 150 + mi * 50 + 600)
        .duration(300)
        .style('opacity', 1);
    });
  });
}

// Chart 32: Breakout Signals
function renderBreakoutSignals() {
  const container = document.getElementById('breakout-content');
  if (!container) return;

  const breakout = DATA.deepPatterns?.breakoutProfile;
  const dims = Utils.getChartDimensions(container);
  const { svg, g } = Utils.createSvg(container, dims);

  // Guard against missing data
  if (!breakout || !breakout.characteristics || !breakout.comparison) {
    g.append('text')
      .attr('x', dims.innerWidth / 2)
      .attr('y', dims.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-family', Utils.font)
      .style('font-size', '0.75rem')
      .text('No breakout data available');
    return;
  }

  // Header
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.primary)
    .style('font-family', Utils.font)
    .style('font-size', '1rem')
    .style('font-weight', '700')
    .text(`${breakout.count} Breakout Tracks (95+ Popularity)`);

  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text(`Top ${breakout.percent}% of all tracks`);

  // Comparison grid
  const metrics = [
    { label: 'Avg Duration', breakout: `${Math.floor(breakout.characteristics.avgDuration / 60)}:${String(breakout.characteristics.avgDuration % 60).padStart(2, '0')}`, other: `${Math.floor(breakout.comparison.avgDuration / 60)}:${String(breakout.comparison.avgDuration % 60).padStart(2, '0')}` },
    { label: 'Collab Rate', breakout: `${breakout.characteristics.collabPercent}%`, other: `${breakout.comparison.collabPercent}%` },
    { label: 'Explicit Rate', breakout: `${breakout.characteristics.explicitPercent}%`, other: `${breakout.comparison.explicitPercent}%` },
    { label: 'Singles Rate', breakout: `${breakout.characteristics.singlePercent}%`, other: `${breakout.comparison.singlePercent}%` },
    { label: 'Title Length', breakout: `${breakout.characteristics.avgTitleLength} chars`, other: `${breakout.comparison.avgTitleLength} chars` }
  ];

  const startY = 70;
  const rowHeight = 35;
  const colWidth = dims.innerWidth / 3;

  // Headers
  ['Metric', 'Breakout', 'Others'].forEach((header, i) => {
    g.append('text')
      .attr('x', colWidth * i + colWidth / 2)
      .attr('y', startY)
      .attr('text-anchor', 'middle')
      .attr('fill', i === 0 ? Utils.colors.text.tertiary : (i === 1 ? Utils.colors.primary : Utils.colors.text.secondary))
      .style('font-family', Utils.font)
      .style('font-size', '0.7rem')
      .style('font-weight', '600')
      .text(header);
  });

  // Divider
  g.append('line')
    .attr('x1', 20)
    .attr('x2', dims.innerWidth - 20)
    .attr('y1', startY + 12)
    .attr('y2', startY + 12)
    .attr('stroke', Utils.colors.text.tertiary)
    .attr('stroke-width', 1);

  // Rows
  metrics.forEach((metric, i) => {
    const y = startY + 35 + i * rowHeight;

    // Metric label
    g.append('text')
      .attr('x', colWidth / 2)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.secondary)
      .style('font-family', Utils.font)
      .style('font-size', '0.65rem')
      .text(metric.label);

    // Breakout value
    g.append('text')
      .attr('x', colWidth + colWidth / 2)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.primary)
      .style('font-family', Utils.font)
      .style('font-size', '0.75rem')
      .style('font-weight', '600')
      .style('opacity', 0)
      .text(metric.breakout)
      .transition()
      .delay(i * 100)
      .duration(400)
      .style('opacity', 1);

    // Other value
    g.append('text')
      .attr('x', colWidth * 2 + colWidth / 2)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-family', Utils.font)
      .style('font-size', '0.75rem')
      .style('opacity', 0)
      .text(metric.other)
      .transition()
      .delay(i * 100 + 200)
      .duration(400)
      .style('opacity', 1);
  });

  // Top breakout tracks list
  const listStartY = startY + 35 + metrics.length * rowHeight + 20;

  g.append('text')
    .attr('x', 0)
    .attr('y', listStartY)
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .style('font-weight', '600')
    .text('Top Breakout Tracks:');

  breakout.topBreakout.slice(0, 5).forEach((track, i) => {
    g.append('text')
      .attr('x', 0)
      .attr('y', listStartY + 18 + i * 16)
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-family', Utils.font)
      .style('font-size', '0.55rem')
      .text(`${i + 1}. ${track.track.substring(0, 30)}${track.track.length > 30 ? '...' : ''} — ${track.artist.substring(0, 20)}`);
  });
}

window.initPatterns = initPatterns;
