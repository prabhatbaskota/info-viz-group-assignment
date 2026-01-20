/**
 * Member 2 — Grouped Bar Chart WITH YEAR FILTER
 * + LEGEND OUTSIDE SVG (HTML BASED)
 */

console.log("Member bar chart loaded");

let barSvg, x0, x1, y, color;

const barMargin = { top: 40, right: 30, bottom: 80, left: 70 };
const barWidth  = 500 - barMargin.left - barMargin.right;
const barHeight = 400 - barMargin.top - barMargin.bottom;

const AGE_ORDER = [
  "10-14","15-19","20-24","25-29",
  "30-39","40-49","50-59","60-69","70-79","80+"
];

// ===== CREATE HTML LEGEND =====
function updateHtmlLegend(activeKeys) {

  const container = d3.select("#bar-legend-container");

  const data = activeKeys.map(k => ({
    key: k,
    label:
      k === "Smoking_Prevalence" ? "Smoking" :
      k === "Drug_Experimentation" ? "Drugs" :
      "Peer Influence",
    color: color(k)
  }));

  const items = container.selectAll(".bar-legend-item")
    .data(data);

  items.exit().remove();

  const enter = items.enter()
    .append("div")
    .attr("class", "bar-legend-item")
    .style("display", "inline-flex")
    .style("align-items", "center")
    .style("gap", "6px")
    .style("margin-right", "12px")
    .style("font-size", "12px");

  enter.append("div")
    .style("width", "12px")
    .style("height", "12px")
    .style("border-radius", "3px");

  enter.append("span");

  const merged = enter.merge(items);

  merged.select("div")
    .style("background", d => d.color);

  merged.select("span")
    .text(d => d.label);
}

function updateBarChart(data, keys) {

  if (!data || data.length === 0) return;

  const container = d3.select("#bar-chart");
  if (container.empty()) return;

  const activeKeys = (keys && keys.length === 2)
    ? keys
    : ["Smoking_Prevalence", "Drug_Experimentation"];

  color = d3.scaleOrdinal()
    .domain(activeKeys)
    .range(["#1f77b4", "#ff7f0e"]);

  // 🔴 UPDATE EXTERNAL LEGEND
  updateHtmlLegend(activeKeys);

  const selectedYear =
    d3.select("#bar-year-filter").property("value");

  // ===== DATA PREPARATION =====
  let processedData;

  if (selectedYear === "all") {
    processedData = d3.rollups(
      data,
      v => ({
        Smoking_Prevalence: d3.mean(v, d => +d.Smoking_Prevalence),
        Drug_Experimentation: d3.mean(v, d => +d.Drug_Experimentation)
      }),
      d => d.Age_Group
    ).map(([age, values]) => ({
      Age_Group: age,
      ...values
    }));
  } else {
    processedData = data.filter(d => +d.Year === +selectedYear);
  }

  const ageGroups = AGE_ORDER.filter(age =>
    processedData.some(d => d.Age_Group === age)
  );

  // ===== SVG INIT =====
  if (!barSvg) {

    const fullSvg = container.append("svg")
      .attr("width", barWidth + barMargin.left + barMargin.right)
      .attr("height", barHeight + barMargin.top + barMargin.bottom);

    barSvg = fullSvg.append("g")
      .attr("transform",
        `translate(${barMargin.left},${barMargin.top})`
      );

    x0 = d3.scaleBand().range([0, barWidth]).padding(0.2);
    x1 = d3.scaleBand().padding(0.1);
    y  = d3.scaleLinear().range([barHeight, 0]);

    barSvg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${barHeight})`);

    barSvg.append("g")
      .attr("class", "y-axis");
  }

  // ===== SCALES =====
  x0.domain(ageGroups);
  x1.domain(activeKeys).range([0, x0.bandwidth()]);

  const maxY = d3.max(processedData, d =>
    d3.max(activeKeys, k => +d[k] || 0)
  ) || 10;

  y.domain([0, maxY]).nice();

  barSvg.select(".x-axis")
    .transition().duration(600)
    .call(d3.axisBottom(x0));

  barSvg.select(".y-axis")
    .transition().duration(600)
    .call(d3.axisLeft(y));

  // ===== BARS =====
  const groups = barSvg.selectAll(".age-group")
    .data(ageGroups, d => d);

  groups.exit().remove();

  const groupsMerged = groups.enter()
    .append("g")
    .attr("class", "age-group")
    .merge(groups)
    .attr("transform", d => `translate(${x0(d)},0)`);

  const bars = groupsMerged.selectAll("rect")
    .data(age => {
      const row = processedData.find(d => d.Age_Group === age);

      return activeKeys.map(key => ({
        key,
        value: row ? +row[key] || 0 : 0
      }));
    });

  bars.exit().remove();

  bars.enter()
    .append("rect")
    .merge(bars)
    .attr("x", d => x1(d.key))
    .attr("width", x1.bandwidth())
    .attr("fill", d => color(d.key))
    .transition().duration(600)
    .attr("y", d => y(d.value))
    .attr("height", d => barHeight - y(d.value));
}

// ===== ONLY BAR LISTENER =====
d3.select("#bar-year-filter").on("change", () => {
  const currentData =
    (typeof getFilteredData === "function")
      ? getFilteredData()
      : [];

  updateBarChart(currentData, null);
});
