/**
 * Member 2 — Grouped Bar Chart WITH YEAR FILTER
 * 2020 → real values of 2020
 * 2021 → real values of 2021
 * ...
 * all  → multi-year AVERAGE (2020–2024)
 */

console.log("Member bar chart loaded");

let barSvg, x0, x1, y, color;

const margin = { top: 40, right: 30, bottom: 80, left: 70 };
const width = 500 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const AGE_ORDER = [
  "10-14","15-19","20-24","25-29",
  "30-39","40-49","50-59","60-69","70-79","80+"
];

function updateBarChart(data, keys) {

  if (!data || data.length === 0) return;

  const container = d3.select("#bar-chart");
  if (container.empty()) return;

  const activeKeys = (keys && keys.length === 2)
    ? keys
    : ["Smoking_Prevalence", "Drug_Experimentation"];

  const selectedYear = d3.select("#bar-year-filter").property("value");

  // ===== PREPARE DATA CORRECTLY =====
  let processedData;

  // اول فیلتر سال
  const baseData =
    selectedYear === "all"
      ? data
      : data.filter(d => +d.Year === +selectedYear);

  // بعد همیشه تجمیع بر اساس Age_Group
  processedData = d3.rollups(
    baseData,
    v => ({
      Smoking_Prevalence: d3.mean(v, d => +d.Smoking_Prevalence),
      Drug_Experimentation: d3.mean(v, d => +d.Drug_Experimentation),
      Peer_Influence: d3.mean(v, d => +d.Peer_Influence)
    }),
    d => d.Age_Group
  ).map(([age, values]) => ({
    Age_Group: age,
    ...values
  }));

  const ageGroups = AGE_ORDER.filter(age =>
    processedData.some(d => d.Age_Group === age)
  );

  // ===== CREATE SVG ON FIRST RUN =====
  if (!barSvg) {

    const fullSvg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    barSvg = fullSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    x0 = d3.scaleBand().range([0, width]).padding(0.2);
    x1 = d3.scaleBand().padding(0.1);
    y  = d3.scaleLinear().range([height, 0]);

    color = d3.scaleOrdinal()
      .domain(activeKeys)
      .range(["#1f77b4", "#ff7f0e"]);

    barSvg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`);

    barSvg.append("g")
      .attr("class", "y-axis");

    barSvg.append("text")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Rate (%)");
  }

  // ===== SCALES =====
  x0.domain(ageGroups);
  x1.domain(activeKeys).range([0, x0.bandwidth()]);

  const maxY = d3.max(processedData, d =>
    d3.max(activeKeys, k => +d[k] || 0)
  ) || 10;

  y.domain([0, maxY]).nice();

  // ===== AXES =====
  barSvg.select(".x-axis")
    .transition().duration(600)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  barSvg.select(".y-axis")
    .transition().duration(600)
    .call(d3.axisLeft(y));

  // ===== GROUPS =====
  const groups = barSvg.selectAll(".age-group")
    .data(ageGroups, d => d);

  groups.exit().remove();

  const groupsEnter = groups.enter()
    .append("g")
    .attr("class", "age-group");

  const groupsMerged = groupsEnter.merge(groups)
    .attr("transform", d => `translate(${x0(d)},0)`);

  // ===== BARS =====
  const bars = groupsMerged.selectAll("rect")
    .data(age => {
      const row = processedData.find(d => d.Age_Group === age);

      return activeKeys.map(key => ({
        key,
        value: row ? +row[key] || 0 : 0,
        ageGroup: age
      }));
    });

  bars.exit().remove();

  const tooltip = d3.select(".heatmap-tooltip");

  bars.enter()
    .append("rect")
    .attr("x", d => x1(d.key))
    .attr("width", x1.bandwidth())
    .attr("y", y(0))
    .attr("height", height - y(0))
    .attr("fill", d => color(d.key))
    .merge(bars)
    .on("mouseover", (event, d) => {

      tooltip
        .style("display", "block")
        .html(`
          <strong>${d.ageGroup}</strong><br>
          ${d.key.replace("_"," ")}: ${d.value.toFixed(1)}%<br>
          Year: ${selectedYear === "all" ? "2020–2024 (avg)" : selectedYear}
        `);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display","none");
    })
    .transition().duration(600)
    .attr("x", d => x1(d.key))
    .attr("width", x1.bandwidth())
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));
}

// ===== LISTENER ONLY FOR BAR CHART =====
d3.select("#bar-year-filter").on("change", () => {
  const currentData =
    (typeof getFilteredData === "function")
      ? getFilteredData()
      : [];

  updateBarChart(currentData, null);
});
