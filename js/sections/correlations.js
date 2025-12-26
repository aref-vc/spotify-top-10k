/**
 * Section 6: Correlation Discovery
 * Charts: Duration Sweet Spot, Collaboration ROI, Album Type Performance, Explicit Impact
 */

function initCorrelations() {
  renderDurationSweet();
  renderCollabROI();
  renderAlbumTypePerf();
  renderExplicitImpact();

  Filters.register(onCorrelationsFilterChange);
}

function onCorrelationsFilterChange() {
  renderDurationSweet();
  renderCollabROI();
  renderAlbumTypePerf();
  renderExplicitImpact();
}

// Chart 21: Duration Sweet Spot
function renderDurationSweet() {
  const container = document.getElementById('duration-sweet-content');
  if (!container) return;

  const data = DATA.correlations.durationPopularity;
  const optimal = DATA.correlations.optimalDuration;
  const dims = Utils.getChartDimensions(container, { left: 60, bottom: 70 });
  const { svg, g } = Utils.createSvg(container, dims);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, dims.innerWidth])
    .padding(0.15);

  const yScale = d3.scaleLinear()
    .domain([72, d3.max(data, d => d.avgPopularity) + 1])
    .range([dims.innerHeight, 0]);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { y: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale));
  Utils.styleAxis(xAxis);
  xAxis.selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-0.5em')
    .attr('dy', '0.5em')
    .attr('transform', 'rotate(-45)');

  // Y axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(yScale).ticks(5));
  Utils.styleAxis(yAxis, { hideAxisLine: true });

  // Bars colored by popularity
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', d => d.label === optimal.label ? Utils.colors.primary : Utils.colors.cyan)
    .attr('rx', 3)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        ${d.label === optimal.label ? '<div class="tooltip-value" style="color:#1DB954">★ Optimal Duration</div>' : ''}
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 40)
    .attr('y', d => yScale(d.avgPopularity))
    .attr('height', d => dims.innerHeight - yScale(d.avgPopularity));

  // Value labels on top of bars (show every other to avoid crowding)
  g.selectAll('.bar-value')
    .data(data.filter((d, i) => i % 2 === 0 || d.label === optimal.label))
    .join('text')
    .attr('class', 'bar-value')
    .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.avgPopularity) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', d => d.label === optimal.label ? Utils.colors.primary : Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.55rem')
    .style('font-weight', d => d.label === optimal.label ? '700' : '500')
    .style('opacity', 0)
    .text(d => d.avgPopularity.toFixed(1))
    .transition()
    .duration(400)
    .delay((d, i) => i * 60 + 600)
    .style('opacity', 1);

  // Optimal marker annotation
  const optimalX = xScale(optimal.label) + xScale.bandwidth() / 2;
  const optimalY = yScale(optimal.avgPopularity);

  g.append('line')
    .attr('x1', optimalX)
    .attr('x2', optimalX)
    .attr('y1', optimalY - 10)
    .attr('y2', 20)
    .attr('stroke', Utils.colors.primary)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,4')
    .style('opacity', 0)
    .transition()
    .delay(800)
    .duration(400)
    .style('opacity', 1);

  g.append('text')
    .attr('x', optimalX)
    .attr('y', 12)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(`Sweet Spot: ${optimal.label}`)
    .transition()
    .delay(1000)
    .duration(400)
    .style('opacity', 1);

  // Y axis label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -dims.innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text('Avg Popularity');
}

// Chart 22: Collaboration ROI
function renderCollabROI() {
  const container = document.getElementById('collab-roi-content');
  if (!container) return;

  const data = DATA.correlations.collabImpact;
  const dims = Utils.getChartDimensions(container);
  const { svg, g } = Utils.createSvg(container, dims);

  const barData = [
    { label: 'Solo Tracks', value: data.solo.avgPopularity, count: data.solo.count, color: Utils.colors.amber },
    { label: 'Collaborations', value: data.collab.avgPopularity, count: data.collab.count, color: Utils.colors.cyan }
  ];

  const barHeight = 50;
  const gap = 40;
  const startY = dims.innerHeight / 2 - barHeight - gap / 2;
  const maxVal = Math.max(data.solo.avgPopularity, data.collab.avgPopularity);
  const minVal = 70; // Start from 70 for visibility

  barData.forEach((d, i) => {
    const y = startY + i * (barHeight + gap);
    const barWidth = ((d.value - minVal) / (maxVal - minVal + 5)) * dims.innerWidth;

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
      .attr('width', barWidth);

    // Label
    g.append('text')
      .attr('x', 0)
      .attr('y', y - 10)
      .attr('fill', d.color)
      .style('font-family', Utils.font)
      .style('font-size', '0.75rem')
      .style('font-weight', '600')
      .text(d.label);

    // Stats
    g.append('text')
      .attr('x', dims.innerWidth)
      .attr('y', y - 10)
      .attr('text-anchor', 'end')
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-family', Utils.font)
      .style('font-size', '0.65rem')
      .text(`${Utils.formatNumber(d.count)} tracks`);

    // Value inside bar
    g.append('text')
      .attr('x', 15)
      .attr('y', y + barHeight / 2 + 5)
      .attr('fill', Utils.colors.bg.primary)
      .style('font-family', Utils.font)
      .style('font-size', '1rem')
      .style('font-weight', '700')
      .style('opacity', 0)
      .text(d.value.toFixed(1))
      .transition()
      .duration(400)
      .delay(i * 200 + 600)
      .style('opacity', 1);
  });

  // Difference annotation
  const diffColor = data.difference >= 0 ? Utils.colors.primary : Utils.colors.coral;
  const diffText = data.difference >= 0 ? `+${data.difference}` : `${data.difference}`;

  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight - 20)
    .attr('text-anchor', 'middle')
    .attr('fill', diffColor)
    .style('font-family', Utils.font)
    .style('font-size', '0.85rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(`Collaboration Impact: ${diffText} popularity`)
    .transition()
    .delay(1200)
    .duration(400)
    .style('opacity', 1);
}

// Chart 23: Album Type Performance
function renderAlbumTypePerf() {
  const container = document.getElementById('album-type-perf-content');
  if (!container) return;

  const data = DATA.correlations.albumTypeStats;
  const dims = Utils.getChartDimensions(container, { left: 100, right: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  const colors = {
    album: Utils.colors.primary,
    single: Utils.colors.cyan,
    compilation: Utils.colors.amber
  };

  const xScale = d3.scaleLinear()
    .domain([70, d3.max(data, d => d.avgPopularity) + 2])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(data.map(d => d.type))
    .range([0, dims.innerHeight])
    .padding(0.4);

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5));
  Utils.styleAxis(xAxis);

  // Bars
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.type))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', d => colors[d.type] || Utils.colors.text.tertiary)
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.type}</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        <div class="tooltip-value">Explicit: ${d.explicitPercent}%</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 150)
    .attr('width', d => xScale(d.avgPopularity));

  // Labels
  g.selectAll('.label')
    .data(data)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', d => yScale(d.type) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', d => colors[d.type] || Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.75rem')
    .style('font-weight', '600')
    .text(d => d.type.charAt(0).toUpperCase() + d.type.slice(1));

  // Value labels
  g.selectAll('.value-label')
    .data(data)
    .join('text')
    .attr('class', 'value-label')
    .attr('x', d => xScale(d.avgPopularity) + 8)
    .attr('y', d => yScale(d.type) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.8rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(d => d.avgPopularity.toFixed(1))
    .transition()
    .duration(400)
    .delay((d, i) => i * 150 + 600)
    .style('opacity', 1);

  // X axis label
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text('Average Popularity');
}

// Chart 24: Explicit Impact
function renderExplicitImpact() {
  const container = document.getElementById('explicit-impact-content');
  if (!container) return;

  const data = DATA.correlations.explicitImpact;
  const dims = Utils.getChartDimensions(container);
  const { svg, g } = Utils.createSvg(container, dims);

  // Comparison layout
  const cardWidth = dims.innerWidth / 2 - 20;
  const cardHeight = dims.innerHeight - 40;

  const cards = [
    {
      label: 'Clean',
      data: data.clean,
      color: Utils.colors.cyan,
      x: 0
    },
    {
      label: 'Explicit',
      data: data.explicit,
      color: Utils.colors.coral,
      x: dims.innerWidth / 2 + 10
    }
  ];

  cards.forEach((card, i) => {
    const cardG = g.append('g')
      .attr('transform', `translate(${card.x}, 20)`);

    // Card background
    cardG.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('fill', Utils.colors.bg.elevated)
      .attr('rx', 8)
      .style('opacity', 0)
      .transition()
      .duration(400)
      .delay(i * 200)
      .style('opacity', 1);

    // Label
    cardG.append('text')
      .attr('x', cardWidth / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', card.color)
      .style('font-family', Utils.font)
      .style('font-size', '0.9rem')
      .style('font-weight', '700')
      .text(card.label);

    // Track count
    cardG.append('text')
      .attr('x', cardWidth / 2)
      .attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-family', Utils.font)
      .style('font-size', '0.65rem')
      .text(`${Utils.formatNumber(card.data.count)} tracks`);

    // Main popularity score
    cardG.append('text')
      .attr('x', cardWidth / 2)
      .attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.primary)
      .style('font-family', Utils.font)
      .style('font-size', '2rem')
      .style('font-weight', '700')
      .style('opacity', 0)
      .text(card.data.avgPopularity.toFixed(1))
      .transition()
      .delay(i * 200 + 400)
      .duration(400)
      .style('opacity', 1);

    cardG.append('text')
      .attr('x', cardWidth / 2)
      .attr('y', 120)
      .attr('text-anchor', 'middle')
      .attr('fill', Utils.colors.text.tertiary)
      .style('font-family', Utils.font)
      .style('font-size', '0.6rem')
      .text('avg popularity');

    // Additional stats
    const stats = [
      { label: 'Avg Duration', value: `${Math.floor(card.data.avgDuration / 60)}:${String(card.data.avgDuration % 60).padStart(2, '0')}` },
      { label: 'Collab Rate', value: `${card.data.collabPercent}%` }
    ];

    stats.forEach((stat, si) => {
      cardG.append('text')
        .attr('x', cardWidth / 2)
        .attr('y', 160 + si * 30)
        .attr('text-anchor', 'middle')
        .attr('fill', Utils.colors.text.secondary)
        .style('font-family', Utils.font)
        .style('font-size', '0.75rem')
        .text(stat.value);

      cardG.append('text')
        .attr('x', cardWidth / 2)
        .attr('y', 175 + si * 30)
        .attr('text-anchor', 'middle')
        .attr('fill', Utils.colors.text.tertiary)
        .style('font-family', Utils.font)
        .style('font-size', '0.55rem')
        .text(stat.label);
    });
  });

  // Difference indicator
  const diffColor = data.difference >= 0 ? Utils.colors.primary : Utils.colors.coral;
  const diffText = data.difference >= 0 ? `+${data.difference}` : `${data.difference}`;

  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', diffColor)
    .style('font-family', Utils.font)
    .style('font-size', '0.75rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(`Explicit tracks: ${diffText} popularity`)
    .transition()
    .delay(1000)
    .duration(400)
    .style('opacity', 1);
}

window.initCorrelations = initCorrelations;
