/**
 * Member 2 — Grouped Bar Chart
 * - Year filter (All Years avg OR selected year)
 * - Works with metric-filter (e.g., Smoking vs Drugs OR Smoking vs Peer)
 * - Aggregates by Age_Group correctly
 * - Keeps cross-brushing + tooltip
 */

console.log("Member bar chart loaded");

let barSvg, barX0, barX1, barY, barColor;

function updateBarChart(data, keys) {
  if (!data || data.length === 0) return;

  const container = d3.select("#bar-chart");
  if (container.empty()) return;

  // Dimensions
  const margin = { top: 60, right: 30, bottom: 70, left: 70 };
  const width = 450 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  // Create SVG once
  if (!barSvg) {
    const fullSvg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    barSvg = fullSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    barX0 = d3.scaleBand().range([0, width]).padding(0.2);
    barX1 = d3.scaleBand().padding(0.1);
    barY  = d3.scaleLinear().range([height, 0]);
    barColor = d3.scaleOrdinal().range(["#1f77b4", "#ff7f0e"]);

    barSvg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`);
    barSvg.append("g").attr("class", "y-axis");

    barSvg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height + 60)
      .attr("text-anchor", "middle")
      .text("Age Groups");

    barSvg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Rate (%)");
  }

  // ---------------------------------------
  // 1) Active metrics (from dashboard)
  // ---------------------------------------
  const activeKeys = (keys && keys.length === 2)
    ? keys
    : ["Smoking_Prevalence", "Drug_Experimentation"];

  // ---------------------------------------
  // 2) Year filter (All or one year)
  // ---------------------------------------
  const selectedYear = d3.select("#bar-year-filter").property("value");

  const base = (selectedYear === "all")
    ? data
    : data.filter(d => +d.Year === +selectedYear);

  // ---------------------------------------
  // 3) Aggregate BY AGE GROUP for the active metrics
  //    (this makes year switching really work)
  // ---------------------------------------
  const dataForChart = d3.rollups(
    base,
    v => {
      const obj = { Age_Group: v[0].Age_Group };
      activeKeys.forEach(k => {
        obj[k] = d3.mean(v, d => +d[k]) || 0;
      });
      return obj;
    },
    d => d.Age_Group
  ).map(([age, obj]) => ({ Age_Group: age, ...obj }));

  // Age order
  const AGE_ORDER = ["10-14","15-19","20-24","25-29","30-39","40-49","50-59","60-69","70-79","80+"];

  const ageGroups = AGE_ORDER.filter(age =>
    dataForChart.some(d => d.Age_Group === age)
  );

  // ---------------------------------------
  // 4) Scales
  // ---------------------------------------
  barX0.domain(ageGroups);
  barX1.domain(activeKeys).range([0, barX0.bandwidth()]);
  barColor.domain(activeKeys);

  const maxY = d3.max(dataForChart, d =>
    d3.max(activeKeys, k => +d[k] || 0)
  ) || 10;

  barY.domain([0, maxY]).nice();

  // Axes
  barSvg.select(".x-axis")
    .transition().duration(600)
    .call(d3.axisBottom(barX0))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  barSvg.select(".y-axis")
    .transition().duration(600)
    .call(d3.axisLeft(barY).ticks(5).tickFormat(d => d + "%"));

  // ---------------------------------------
  // 5) Groups
  // ---------------------------------------
  const groupSel = barSvg.selectAll(".age-group")
    .data(ageGroups, d => d);

  const groupEnter = groupSel.enter()
    .append("g")
    .attr("class", "age-group");

  groupSel.exit().remove();

  groupEnter.merge(groupSel)
    .transition().duration(600)
    .attr("transform", d => `translate(${barX0(d)},0)`);

  // ---------------------------------------
  // 6) Bars
  // ---------------------------------------
  const rectSel = barSvg.selectAll(".age-group")
    .selectAll("rect")
    .data(age => {
      const row = dataForChart.find(d => d.Age_Group === age);
      return activeKeys.map(k => ({
        key: k,
        value: row ? (+row[k] || 0) : 0,
        ageGroup: age
      }));
    }, d => d.key);

  rectSel.exit()
    .transition().duration(300)
    .attr("y", height)
    .attr("height", 0)
    .remove();

  const tooltip = d3.select(".heatmap-tooltip");

  rectSel.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("data-age", d => d.ageGroup) // cross-brushing hook
    .attr("x", d => barX1(d.key))
    .attr("width", barX1.bandwidth())
    .attr("y", height)
    .attr("height", 0)
    .attr("fill", d => barColor(d.key))
    .merge(rectSel)
    .on("mouseover", function(event, d) {
      if (window.highlightData) window.highlightData("age", d.ageGroup);

      tooltip
        .style("display", "block")
        .html(
          `<strong>Age: ${d.ageGroup}</strong><br>` +
          `${d.key.replace(/_/g, " ")}: ${d.value.toFixed(1)}%<br>` +
          `Year: ${selectedYear === "all" ? "2020–2024 (avg)" : selectedYear}`
        );
    })
    .on("mouseout", function() {
      if (window.resetHighlight) window.resetHighlight();
      tooltip.style("display", "none");
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY - 15) + "px");
    })
    .transition().duration(600)
    .attr("x", d => barX1(d.key))
    .attr("width", barX1.bandwidth())
    .attr("y", d => barY(d.value))
    .attr("height", d => Math.max(0, height - barY(d.value)))
    .attr("fill", d => barColor(d.key));
}

// Year dropdown listener: re-render using current dashboard gender filter
d3.select("#bar-year-filter").on("change", () => {
  const currentData = (typeof getFilteredData === "function") ? getFilteredData() : [];
  updateBarChart(currentData, null);
});
