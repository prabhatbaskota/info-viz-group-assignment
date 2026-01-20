/**
 * Member 2 — Grouped Bar Chart WITH YEAR FILTER
 * + Project style tooltip
 * + Tooltip color = bar color
 * + Value label inside bars
 * + FIXED AXIS BUG ✅
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

// ===== TOOLTIP =====
const barTooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "rgba(30,30,30,0.92)")
  .style("color", "#fff")
  .style("padding", "7px 9px")
  .style("border-radius", "6px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("display", "none");

function initBarChart() {

  const container = d3.select("#bar-chart");

  const fullSvg = container.append("svg")
    .attr("width", barWidth + barMargin.left + barMargin.right)
    .attr("height", barHeight + barMargin.top + barMargin.bottom);

  barSvg = fullSvg.append("g")
    .attr("transform",
      `translate(${barMargin.left + 15}, ${barMargin.top - 10})`
    );

  x0 = d3.scaleBand().range([0, barWidth]).padding(0.2);
  x1 = d3.scaleBand().padding(0.1);
  y  = d3.scaleLinear().range([barHeight, 0]);

  // محور‌ها
  barSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${barHeight})`);

  barSvg.append("g")
    .attr("class", "y-axis");

  // لیبل‌ها
  barSvg.append("text")
    .attr("x", barWidth / 2)
    .attr("y", barHeight + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Age Groups");

  barSvg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -barHeight / 2)
    .attr("y", -55)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Rate (%)");
}

function updateBarChart(data, keys) {

  if (!data || data.length === 0) return;

  if (!barSvg) initBarChart();

  const activeKeys = (keys && keys.length === 2)
    ? keys
    : ["Smoking_Prevalence", "Drug_Experimentation"];

  color = d3.scaleOrdinal()
    .domain(activeKeys)
    .range(["#1f77b4", "#ff7f0e"]);

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

  // ===== UPDATE SCALES =====
  x0.domain(ageGroups);
  x1.domain(activeKeys).range([0, x0.bandwidth()]);

  const maxY = d3.max(processedData, d =>
    d3.max(activeKeys, k => +d[k] || 0)
  ) || 10;

  y.domain([0, maxY]).nice();

  // ===== FIX اصلی اینجاست =====
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
        value: row ? +row[key] || 0 : 0,
        ageGroup: age
      }));
    });

  bars.exit().remove();

  // ===== VALUE TEXT INSIDE BARS =====
  const texts = groupsMerged.selectAll(".bar-value")
    .data(d => {
      const row = processedData.find(r => r.Age_Group === d);
      return activeKeys.map(key => ({
        key,
        value: row ? +row[key] || 0 : 0
      }));
    });

  texts.exit().remove();

  texts.enter()
    .append("text")
    .attr("class", "bar-value")
    .merge(texts)
    .attr("x", d => x1(d.key) + x1.bandwidth()/2)
    .attr("y", d => y(d.value) + 14)
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-size", "11px")
    .text(d => d.value.toFixed(1));

  bars.enter()
    .append("rect")
    .merge(bars)
    .attr("x", d => x1(d.key))
    .attr("width", x1.bandwidth())
    .attr("fill", d => color(d.key))
    .on("mouseover", function(event, d) {

      barTooltip
        .style("display", "block")
        .html(`
          <strong>${d.ageGroup}</strong><br>
          ${d.key.replace("_"," ")}: 
          <span style="color:${color(d.key)}">
            ${d.value.toFixed(1)}%
          </span>
        `);
    })
    .on("mousemove", (event) => {
      barTooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      barTooltip.style("display","none");
    })
    .transition().duration(600)
    .attr("y", d => y(d.value))
    .attr("height", d => barHeight - y(d.value));
}

// ===== LISTENER =====
d3.select("#bar-year-filter").on("change", () => {
  const currentData =
    (typeof getFilteredData === "function")
      ? getFilteredData()
      : [];

  updateBarChart(currentData, null);
});
