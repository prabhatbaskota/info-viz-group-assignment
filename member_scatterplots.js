// -----------------------------
// Globals
let showTrendLine = true;
let svg, plotG, xAxisG, yAxisG;
let zoomBehavior;
const vizSelector = "#scatter-plot";

// Tooltip
let tooltip = d3.select("body")
  .append("div")
  .attr("class", "heatmap-tooltip")
  .style("display", "none");

// -----------------------------
// Main update function
function updateScatterPlot(data) {

  d3.select(vizSelector).selectAll("svg").remove();

  const margin = { top: 40, right: 120, bottom: 60, left: 70 },
        totalWidth = 450,
        totalHeight = 350,
        width = totalWidth - margin.left - margin.right,
        height = totalHeight - margin.top - margin.bottom;

  svg = d3.select(vizSelector)
    .append("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  plotG = g.append("g");
  xAxisG = g.append("g").attr("transform", `translate(0,${height})`);
  yAxisG = g.append("g");

  // Variables (FIXED)
  const xVar = "Peer_Influence";
  const yVar = "Smoking_Prevalence";
  const colorVar = "Gender";

  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0])
    .nice();

  xAxisG.call(d3.axisBottom(xScale));
  yAxisG.call(d3.axisLeft(yScale));

  // Axis labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .style("font-weight", "600")
    .text("Peer Influence (%)");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .style("font-weight", "600")
    .text("Smoking Prevalence (%)");

  // Color scale
  const categories = [...new Set(data.map(d => d[colorVar]))];
  const colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(d3.schemeCategory10);

  // Points
  plotG.selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 4)
    .attr("cx", d => xScale(+d[xVar]))
    .attr("cy", d => yScale(+d[yVar]))
    .attr("fill", d => colorScale(d[colorVar]))
    .style("opacity", 0.7)
    .on("mouseover", (e, d) => {
      tooltip
        .style("display", "block")
        .html(`
          <strong>Peer Influence:</strong> ${d.Peer_Influence}%<br>
          <strong>Smoking:</strong> ${d.Smoking_Prevalence}%<br>
          <strong>Gender:</strong> ${d.Gender}<br>
          <strong>Age Group:</strong> ${d.Age_Group}
        `);
    })
    .on("mousemove", e => {
      tooltip
        .style("left", e.pageX + 10 + "px")
        .style("top", e.pageY - 20 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });

  // Trend line
  if (showTrendLine) drawTrendLine(data, xScale, yScale);

  // Zoom
  zoomBehavior = d3.zoom()
    .scaleExtent([0.8, 5])
    .on("zoom", e => {
      const newX = e.transform.rescaleX(xScale);
      const newY = e.transform.rescaleY(yScale);

      xAxisG.call(d3.axisBottom(newX));
      yAxisG.call(d3.axisLeft(newY));

      plotG.selectAll(".dot")
        .attr("cx", d => newX(+d[xVar]))
        .attr("cy", d => newY(+d[yVar]));

      updateTrendLine(newX, newY, data);
    });

  svg.call(zoomBehavior);
}

// -----------------------------
// Trend line helpers
function drawTrendLine(data, xScale, yScale) {
  plotG.selectAll(".trend-line").remove();

  const lr = linearRegression(
    data.map(d => +d.Peer_Influence),
    data.map(d => +d.Smoking_Prevalence)
  );

  const xMin = 0;
  const xMax = 100;

  const lineData = [
    { x: xMin, y: lr.predict(xMin) },
    { x: xMax, y: lr.predict(xMax) }
  ];

  plotG.append("path")
    .datum(lineData)
    .attr("class", "trend-line")
    .attr("d", d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
    )
    .attr("stroke", "#e74c3c")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .style("stroke-dasharray", "6 4");
}

function updateTrendLine(newX, newY, data) {
  const path = plotG.select(".trend-line");
  if (path.empty()) return;

  const lr = linearRegression(
    data.map(d => +d.Peer_Influence),
    data.map(d => +d.Smoking_Prevalence)
  );

  const lineData = [
    { x: 0, y: lr.predict(0) },
    { x: 100, y: lr.predict(100) }
  ];

  path.datum(lineData)
    .attr("d", d3.line()
      .x(d => newX(d.x))
      .y(d => newY(d.y))
    );
}

// -----------------------------
// Linear Regression
function linearRegression(x, y) {
  const n = x.length;
  const sumX = d3.sum(x);
  const sumY = d3.sum(y);
  const sumXY = d3.sum(x.map((v, i) => v * y[i]));
  const sumX2 = d3.sum(x.map(v => v * v));

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    predict: x => slope * x + intercept
  };
}
