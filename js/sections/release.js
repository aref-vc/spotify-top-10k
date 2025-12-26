/**
 * Section 7: Release Intelligence
 * Charts: Monthly Seasonality, Day-of-Week Patterns, Recency Bias, Age vs Position
 */

function initRelease() {
  renderMonthlySeasonality();
  renderDayOfWeek();
  renderRecencyBias();
  renderAgeVsPosition();

  Filters.register(onReleaseFilterChange);
}

function onReleaseFilterChange() {
  renderMonthlySeasonality();
  renderDayOfWeek();
  renderRecencyBias();
  renderAgeVsPosition();
}

// Chart 25: Monthly Seasonality
function renderMonthlySeasonality() {
  const container = document.getElementById('monthly-content');
  if (!container) return;

  const data = DATA.releasePatterns.byMonth;
  const peak = DATA.releasePatterns.peakMonth;
  const dims = Utils.getChartDimensions(container, { left: 50, bottom: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, dims.innerWidth])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) * 1.15])
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

  // Bars
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', d => d.label === peak.label ? Utils.colors.primary : Utils.colors.cyan)
    .attr('rx', 3)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks (${d.percent}%)</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
        ${d.label === peak.label ? '<div class="tooltip-value" style="color:#1DB954">★ Peak Month</div>' : ''}
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('y', d => yScale(d.count))
    .attr('height', d => dims.innerHeight - yScale(d.count));

  // Value labels on top of bars
  g.selectAll('.bar-value')
    .data(data)
    .join('text')
    .attr('class', 'bar-value')
    .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 8)
    .attr('text-anchor', 'middle')
    .attr('fill', d => d.label === peak.label ? Utils.colors.primary : Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.55rem')
    .style('font-weight', d => d.label === peak.label ? '700' : '500')
    .style('opacity', 0)
    .text(d => Utils.formatNumber(d.count))
    .transition()
    .duration(400)
    .delay((d, i) => i * 50 + 600)
    .style('opacity', 1);

  // Percent labels inside bars (show for taller bars)
  g.selectAll('.percent-label')
    .data(data)
    .join('text')
    .attr('class', 'percent-label')
    .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) + 15)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.bg.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.5rem')
    .style('font-weight', '500')
    .style('opacity', 0)
    .text(d => `${d.percent}%`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 50 + 700)
    .style('opacity', d => (dims.innerHeight - yScale(d.count)) > 25 ? 0.9 : 0);
}

// Chart 26: Day-of-Week Patterns
function renderDayOfWeek() {
  const container = document.getElementById('day-of-week-content');
  if (!container) return;

  const data = DATA.releasePatterns.byDayOfWeek;
  const peak = DATA.releasePatterns.peakDay;
  const dims = Utils.getChartDimensions(container, { left: 60, right: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  // Reorder to start from Monday
  const reordered = [...data.slice(1), data[0]]; // Mon-Sun order
  const total = reordered.reduce((sum, d) => sum + d.count, 0);

  const xScale = d3.scaleBand()
    .domain(reordered.map(d => d.label))
    .range([0, dims.innerWidth])
    .padding(0.25);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(reordered, d => d.count) * 1.15])
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

  // Bars
  g.selectAll('.bar')
    .data(reordered)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', d => d.label === peak.label ? Utils.colors.primary : Utils.colors.amber)
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        <div class="tooltip-value">${Math.round(100 * d.count / total)}% of releases</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 80)
    .attr('y', d => yScale(d.count))
    .attr('height', d => dims.innerHeight - yScale(d.count));

  // Value labels on top of bars
  g.selectAll('.bar-value')
    .data(reordered)
    .join('text')
    .attr('class', 'bar-value')
    .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 8)
    .attr('text-anchor', 'middle')
    .attr('fill', d => d.label === peak.label ? Utils.colors.primary : Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .style('font-weight', d => d.label === peak.label ? '700' : '500')
    .style('opacity', 0)
    .text(d => Utils.formatNumber(d.count))
    .transition()
    .duration(400)
    .delay((d, i) => i * 80 + 600)
    .style('opacity', 1);

  // Percent labels inside bars
  g.selectAll('.percent-label')
    .data(reordered)
    .join('text')
    .attr('class', 'percent-label')
    .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) + 18)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.bg.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.55rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(d => `${Math.round(100 * d.count / total)}%`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 80 + 700)
    .style('opacity', d => (dims.innerHeight - yScale(d.count)) > 30 ? 0.9 : 0);

  // Title annotation
  g.append('text')
    .attr('x', dims.innerWidth)
    .attr('y', 15)
    .attr('text-anchor', 'end')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text('Friday is the new release day');
}

// Chart 27: Recency Bias (Age Distribution)
function renderRecencyBias() {
  const container = document.getElementById('recency-content');
  if (!container) return;

  const data = DATA.releasePatterns.ageDistribution;
  const dims = Utils.getChartDimensions(container, { left: 100, right: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

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
    .attr('fill', (d, i) => {
      const colors = [Utils.colors.primary, Utils.colors.lime, Utils.colors.cyan,
                      Utils.colors.amber, Utils.colors.coral, '#8B4513'];
      return colors[i] || Utils.colors.text.tertiary;
    })
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks (${d.percent}%)</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
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
    .style('font-size', '0.65rem')
    .text(d => d.label);

  // Percent labels
  g.selectAll('.percent-label')
    .data(data)
    .join('text')
    .attr('class', 'percent-label')
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
}

// Chart 28: Age vs Position (Scatter)
function renderAgeVsPosition() {
  const container = document.getElementById('age-position-content');
  if (!container) return;

  const data = DATA.releasePatterns.rankByAge;
  const dims = Utils.getChartDimensions(container, { left: 60, bottom: 60, right: 20 });
  const { svg, g } = Utils.createSvg(container, dims);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.age) * 1.05])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([d3.max(data, d => d.rank), 1])
    .range([dims.innerHeight, 0]);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { x: true, y: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => `${d}y`));
  Utils.styleAxis(xAxis);

  // Y axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `#${Utils.formatNumber(d)}`));
  Utils.styleAxis(yAxis, { hideAxisLine: true });

  // Color scale by popularity
  const colorScale = d3.scaleLinear()
    .domain([70, 85, 100])
    .range([Utils.colors.amber, Utils.colors.cyan, Utils.colors.primary]);

  // Points
  g.selectAll('.point')
    .data(data)
    .join('circle')
    .attr('class', 'point')
    .attr('cx', d => xScale(d.age))
    .attr('cy', d => yScale(d.rank))
    .attr('r', 0)
    .attr('fill', d => colorScale(d.popularity))
    .attr('opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.target).attr('r', 8).attr('opacity', 1);
      Utils.showTooltip(`
        <div class="tooltip-title">Rank #${d.rank}</div>
        <div class="tooltip-value">Age: ${d.age.toFixed(1)} years</div>
        <div class="tooltip-value">Released: ${d.year}</div>
        <div class="tooltip-value">Popularity: ${d.popularity}</div>
      `, event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.target).attr('r', 4).attr('opacity', 0.7);
      Utils.hideTooltip();
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 5)
    .attr('r', 4);

  // X axis label
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text('Track Age (years)');

  // Y axis label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -dims.innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text('Chart Rank');

  // Insight annotation
  g.append('text')
    .attr('x', dims.innerWidth - 10)
    .attr('y', 15)
    .attr('text-anchor', 'end')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .text('Recent tracks dominate top ranks');
}

window.initRelease = initRelease;
