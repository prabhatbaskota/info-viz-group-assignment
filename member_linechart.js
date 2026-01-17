// member_linechart.js

(function () {
  const margin = { top: 80, right: 140, bottom: 70, left: 90 };
  const width = 1000 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const container = "#line-chart"; // dashboard div id

  // Create tooltip once (avoid duplicates on multiple updates)
  const tooltip = d3.select("body")
    .selectAll(".tooltip")
    .data([null])
    .join("div")
    .attr("class", "tooltip");

  function render(data) {
    // Clear old chart completely each update
    d3.select(container).selectAll("*").remove();

    // Build svg exactly like your original
    const outerW = width + margin.left + margin.right;
const outerH = height + margin.top + margin.bottom;

const svgRoot = d3.select(container)
  .append("svg")
  .attr("viewBox", `0 0 ${outerW} ${outerH}`)
  .style("width", "100%")
  .style("height", "auto")
  .style("display", "block"); // removes extra whitespace

const svg = svgRoot.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Ensure numeric fields (safe even if already converted in main.js)
    data.forEach(d => {
      d.Year = +d.Year;
      d.Smoking_Prevalence = +d.Smoking_Prevalence;
      d.Drug_Experimentation = +d.Drug_Experimentation;
    });

    // Dashboard already filters gender in main.js using #gender-filter
    // so here we just use the passed data
    const genderLabel = d3.select("#gender-filter").empty()
      ? "Overall"
      : d3.select("#gender-filter").property("value");

    const yearlyData = Array.from(
      d3.rollup(
        data,
        v => ({
          smoking: d3.mean(v, d => d.Smoking_Prevalence),
          drugs: d3.mean(v, d => d.Drug_Experimentation)
        }),
        d => d.Year
      ),
      ([Year, v]) => ({
        Year,
        Smoking: v.smoking,
        Drugs: v.drugs
      })
    ).sort((a, b) => a.Year - b.Year);

    if (yearlyData.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("No data for this filter");
      return;
    }

    // X Scale
    const xScale = d3.scalePoint()
      .domain(yearlyData.map(d => d.Year))
      .range([0, width]);

    // Y Scales
    const yLeft = d3.scaleLinear()
      .domain([
        d3.min(yearlyData, d => d.Smoking) - 0.3,
        d3.max(yearlyData, d => d.Smoking) + 0.3
      ])
      .range([height, 0]);

    const yRight = d3.scaleLinear()
      .domain([
        d3.min(yearlyData, d => d.Drugs) - 0.5,
        d3.max(yearlyData, d => d.Drugs) + 0.5
      ])
      .range([height, 0]);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yLeft).ticks(5).tickFormat(d => d.toFixed(1) + "%"));

    svg.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yRight).ticks(5).tickFormat(d => d.toFixed(1) + "%"));

    // Axis Labels
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .style("fill", "#1f77b4")
      .style("font-weight", "bold")
      .text("Smoking Prevalence (%)");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", width + 120)
      .attr("text-anchor", "middle")
      .style("fill", "#ff7f0e")
      .style("font-weight", "bold")
      .text("Drug Experimentation (%)");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("Year");

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "bold")
      .text("Smoking vs Drug Experimentation");

    // Lines
    const smokingLine = d3.line()
      .x(d => xScale(d.Year))
      .y(d => yLeft(d.Smoking));

    const drugLine = d3.line()
      .x(d => xScale(d.Year))
      .y(d => yRight(d.Drugs));

    svg.append("path")
      .datum(yearlyData)
      .attr("fill", "none")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 3)
      .attr("d", smokingLine);

    svg.append("path")
      .datum(yearlyData)
      .attr("fill", "none")
      .attr("stroke", "#ff7f0e")
      .attr("stroke-width", 3)
      .attr("d", drugLine);

    // Tooltip helpers
    function showTooltip(event, d) {
      tooltip
        .style("display", "block")
        .html(
          `Year: ${d.Year}<br>
           Gender: ${genderLabel}<br>
           Smoking: ${d.Smoking.toFixed(2)}%<br>
           Drug Experimentation: ${d.Drugs.toFixed(2)}%`
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    }

    function moveTooltip(event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    }

    function hideTooltip() {
      tooltip.style("display", "none");
    }

    // Smoking points
    svg.selectAll(".dot-smoking")
      .data(yearlyData)
      .enter()
      .append("circle")
      .attr("class", "dot-smoking")
      .attr("cx", d => xScale(d.Year))
      .attr("cy", d => yLeft(d.Smoking))
      .attr("r", 5)
      .attr("fill", "#1f77b4")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("r", 9);
        showTooltip(event, d);
      })
      .on("mousemove", moveTooltip)
      .on("mouseout", function () {
        d3.select(this).transition().duration(150).attr("r", 5);
        hideTooltip();
      });

    // Drug points
    svg.selectAll(".dot-drugs")
      .data(yearlyData)
      .enter()
      .append("circle")
      .attr("class", "dot-drugs")
      .attr("cx", d => xScale(d.Year))
      .attr("cy", d => yRight(d.Drugs))
      .attr("r", 5)
      .attr("fill", "#ff7f0e")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("r", 9);
        showTooltip(event, d);
      })
      .on("mousemove", moveTooltip)
      .on("mouseout", function () {
        d3.select(this).transition().duration(150).attr("r", 5);
        hideTooltip();
      });

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 200}, 10)`);

    legend.append("circle").attr("r", 6).attr("fill", "#1f77b4");
    legend.append("text").attr("x", 14).attr("y", 4).text("Smoking Prevalence");

    legend.append("circle").attr("cy", 24).attr("r", 6).attr("fill", "#ff7f0e");
    legend.append("text").attr("x", 14).attr("y", 28).text("Drug Experimentation");
  }

  // This is what main.js calls (DO NOT rename)
  window.updateLineChart = function (data) {
    render(data);
  };
})();
