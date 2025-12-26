/**
 * Section 5: Title Intelligence (Semantic Analysis)
 * Charts: Keyword Frequency, Title Length, Title Patterns, Naming Evolution
 */

function initSemantics() {
  renderKeywords();
  renderTitleLength();
  renderTitlePatterns();
  renderNamingEvolution();

  Filters.register(onSemanticsFilterChange);
}

function onSemanticsFilterChange() {
  renderKeywords();
  renderTitleLength();
  renderTitlePatterns();
  renderNamingEvolution();
}

// Chart 17: Keyword Frequency
function renderKeywords() {
  const container = document.getElementById('keywords-content');
  if (!container) return;

  const keywords = DATA.titleAnalysis.keywords.slice(0, 20);
  const dims = Utils.getChartDimensions(container, { left: 100, right: 50 });
  const { svg, g } = Utils.createSvg(container, dims);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(keywords, d => d.count) * 1.1])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(keywords.map(d => d.word))
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
    .data(keywords)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.word))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', (d, i) => Utils.getChartColor(i % 8))
    .attr('rx', 3)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">"${d.word}"</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        <div class="tooltip-value">${d.percent}% of all titles</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .attr('width', d => xScale(d.count));

  // Labels
  g.selectAll('.label')
    .data(keywords)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', d => yScale(d.word) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.6rem')
    .text(d => d.word);

  // Value labels
  g.selectAll('.value-label')
    .data(keywords)
    .join('text')
    .attr('class', 'value-label')
    .attr('x', d => xScale(d.count) + 5)
    .attr('y', d => yScale(d.word) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.55rem')
    .style('opacity', 0)
    .text(d => d.count)
    .transition()
    .duration(400)
    .delay((d, i) => i * 30 + 600)
    .style('opacity', 1);
}

// Chart 18: Title Length Analysis
function renderTitleLength() {
  const container = document.getElementById('title-length-content');
  if (!container) return;

  const data = DATA.titleAnalysis.lengthStats.distribution;
  const dims = Utils.getChartDimensions(container, { left: 50, bottom: 70 });
  const { svg, g } = Utils.createSvg(container, dims);

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
  xAxis.selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-0.5em')
    .attr('dy', '0.5em')
    .attr('transform', 'rotate(-45)');

  // Y axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => Utils.formatNumber(d)));
  Utils.styleAxis(yAxis, { hideAxisLine: true });

  // Bars colored by popularity
  const popScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.avgPopularity), d3.max(data, d => d.avgPopularity)])
    .range([Utils.colors.amber, Utils.colors.primary]);

  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label))
    .attr('width', xScale.bandwidth())
    .attr('y', dims.innerHeight)
    .attr('height', 0)
    .attr('fill', d => popScale(d.avgPopularity))
    .attr('rx', 3)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label} characters</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        <div class="tooltip-value">Avg Popularity: ${d.avgPopularity}</div>
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
    .attr('y', d => yScale(d.count) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.5rem')
    .style('font-weight', '500')
    .style('opacity', 0)
    .text(d => Utils.formatNumber(d.count))
    .transition()
    .duration(400)
    .delay((d, i) => i * 50 + 600)
    .style('opacity', 1);

  // Popularity labels inside bars (for taller bars)
  g.selectAll('.pop-label')
    .data(data)
    .join('text')
    .attr('class', 'pop-label')
    .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) + 15)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.bg.primary)
    .style('font-family', Utils.font)
    .style('font-size', '0.45rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(d => `${d.avgPopularity}`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 50 + 700)
    .style('opacity', d => (dims.innerHeight - yScale(d.count)) > 25 ? 0.9 : 0);

  // X axis label
  g.append('text')
    .attr('x', dims.innerWidth / 2)
    .attr('y', dims.innerHeight + 55)
    .attr('text-anchor', 'middle')
    .attr('fill', Utils.colors.text.tertiary)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .text('Title Length (characters)');

  // Stats annotation
  g.append('text')
    .attr('x', dims.innerWidth - 10)
    .attr('y', 15)
    .attr('text-anchor', 'end')
    .attr('fill', Utils.colors.text.secondary)
    .style('font-family', Utils.font)
    .style('font-size', '0.7rem')
    .text(`Avg: ${DATA.titleAnalysis.lengthStats.avgLength} chars`);
}

// Chart 19: Title Patterns
function renderTitlePatterns() {
  const container = document.getElementById('title-patterns-content');
  if (!container) return;

  const patterns = DATA.titleAnalysis.patterns.slice(0, 10);
  const dims = Utils.getChartDimensions(container, { left: 110, right: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(patterns, d => d.percent) * 1.15])
    .range([0, dims.innerWidth]);

  const yScale = d3.scaleBand()
    .domain(patterns.map(d => d.label))
    .range([0, dims.innerHeight])
    .padding(0.3);

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`));
  Utils.styleAxis(xAxis);

  // Bars
  g.selectAll('.bar')
    .data(patterns)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.label))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', Utils.colors.cyan)
    .attr('rx', 4)
    .on('mouseenter', (event, d) => {
      Utils.showTooltip(`
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-value">${Utils.formatNumber(d.count)} tracks</div>
        <div class="tooltip-value">${d.percent}% of titles</div>
      `, event);
    })
    .on('mouseleave', () => Utils.hideTooltip())
    .transition()
    .duration(800)
    .delay((d, i) => i * 60)
    .attr('width', d => xScale(d.percent));

  // Labels
  g.selectAll('.label')
    .data(patterns)
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
    .data(patterns)
    .join('text')
    .attr('class', 'percent-label')
    .attr('x', d => xScale(d.percent) + 8)
    .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', Utils.colors.cyan)
    .style('font-family', Utils.font)
    .style('font-size', '0.65rem')
    .style('font-weight', '600')
    .style('opacity', 0)
    .text(d => `${d.percent}%`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 60 + 600)
    .style('opacity', 1);
}

// Chart 20: Naming Evolution by Decade
function renderNamingEvolution() {
  const container = document.getElementById('naming-evolution-content');
  if (!container) return;

  const data = DATA.titleAnalysis.evolution;
  const dims = Utils.getChartDimensions(container, { left: 50, right: 80, bottom: 60 });
  const { svg, g } = Utils.createSvg(container, dims);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, dims.innerWidth])
    .padding(0.1);

  // Multi-line chart for different metrics
  const metrics = [
    { key: 'avgLength', label: 'Avg Length', color: Utils.colors.primary, max: 30 },
    { key: 'featPercent', label: 'Feat. %', color: Utils.colors.cyan, max: 20 },
    { key: 'parentheticalPercent', label: '(...) %', color: Utils.colors.amber, max: 50 }
  ];

  // Create a Y scale for each metric (normalized)
  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([dims.innerHeight, 0]);

  // Grid
  Utils.addGridLines(g, xScale, yScale, dims.innerWidth, dims.innerHeight, { y: true });

  // X axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${dims.innerHeight})`)
    .call(d3.axisBottom(xScale));
  Utils.styleAxis(xAxis);

  // Draw lines for each metric
  metrics.forEach((metric, mi) => {
    const line = d3.line()
      .x(d => xScale(d.label) + xScale.bandwidth() / 2)
      .y(d => yScale(d[metric.key] / metric.max * 100))
      .curve(d3.curveMonotoneX);

    // Line path
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', metric.color)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animate line
    const totalLength = path.node().getTotalLength();
    path.attr('stroke-dasharray', totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1200)
      .delay(mi * 200)
      .attr('stroke-dashoffset', 0);

    // Points
    g.selectAll(`.point-${metric.key}`)
      .data(data)
      .join('circle')
      .attr('class', `point-${metric.key}`)
      .attr('cx', d => xScale(d.label) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d[metric.key] / metric.max * 100))
      .attr('r', 0)
      .attr('fill', metric.color)
      .on('mouseenter', (event, d) => {
        Utils.showTooltip(`
          <div class="tooltip-title">${d.label}</div>
          <div class="tooltip-value">${metric.label}: ${d[metric.key]}${metric.key.includes('Percent') ? '%' : ''}</div>
          <div class="tooltip-value">Tracks: ${DATA.byDecade.find(dec => dec.label === d.label)?.count || 'N/A'}</div>
        `, event);
      })
      .on('mouseleave', () => Utils.hideTooltip())
      .transition()
      .duration(400)
      .delay((d, i) => mi * 200 + i * 50 + 800)
      .attr('r', 5);
  });

  // Legend
  const legendG = g.append('g')
    .attr('transform', `translate(${dims.innerWidth + 10}, 20)`);

  metrics.forEach((metric, i) => {
    const itemG = legendG.append('g')
      .attr('transform', `translate(0, ${i * 22})`);

    itemG.append('circle')
      .attr('r', 5)
      .attr('fill', metric.color);

    itemG.append('text')
      .attr('x', 12)
      .attr('y', 4)
      .attr('fill', Utils.colors.text.secondary)
      .style('font-family', Utils.font)
      .style('font-size', '0.6rem')
      .text(metric.label);
  });
}

window.initSemantics = initSemantics;
