// member_linechart.js

(function () {
  // Smaller base size so it doesn't shrink to unreadable inside a card
  const margin = { top: 55, right: 70, bottom: 55, left: 70 };
  const width = 520 - margin.left - margin.right;   // base inner width
  const height = 280 - margin.top - margin.bottom;  // base inner height

  const container = "#line-chart";

  // Tooltip once
  const tooltip = d3.select("body")
    .selectAll(".tooltip")
    .data([null])
    .join("div")
    .attr("class", "tooltip");

  function render(data) {
    d3.select(container).selectAll("*").remove();

    // Responsive height (keeps card consistent)
    const isMobile = window.innerWidth < 600;
    const svgHeight = isMobile ? "240px" : "300px";

    const outerW = width + margin.left + margin.right;
    const outerH = height + margin.top + margin.bottom;

    const svgRoot = d3.select(container)
      .append("svg")
      .attr("viewBox", `0 0 ${outerW} ${outerH}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", svgHeight)
      .style("display", "block");

    const svg = svgRoot.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    data.forEach(d => {
      d.Year = +d.Year;
      d.Smoking_Prevalence = +d.Smoking_Prevalence;
      d.Drug_Experimentation = +d.Drug_Experimentation;
    });

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
      ([Year, v]) => ({ Year, Smoking: v.smoking, Drugs: v.drugs })
    ).sort((a, b) => a.Year - b.Year);

    if (!yearlyData.length) return;

    const xScale = d3.scalePoint()
      .domain(yearlyData.map(d => d.Year))
      .range([0, width]);

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

    // Axes (slightly smaller ticks to fit)
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yLeft).ticks(4).tickFormat(d => d.toFixed(1) + "%"));

    svg.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yRight).ticks(4).tickFormat(d => d.toFixed(1) + "%"));

    // Labels (kept same wording, adjusted positions for smaller canvas)
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -52)
      .attr("text-anchor", "middle")
      .style("fill", "#1f77b4")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text("Smoking Prevalence (%)");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", width + 55)
      .attr("text-anchor", "middle")
      .style("fill", "#ff7f0e")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text("Drug Experimentation (%)");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text("Year");

    // Title (smaller but readable)
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Smoking vs Drug Experimentation");

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
      .attr("stroke-width", 2.5)
      .attr("d", smokingLine);

    svg.append("path")
      .datum(yearlyData)
      .attr("fill", "none")
      .attr("stroke", "#ff7f0e")
      .attr("stroke-width", 2.5)
      .attr("d", drugLine);

    // Tooltip (best for scroll)
    function showTooltip(event, d) {
      tooltip
        .style("display", "block")
        .html(
          `Year: ${d.Year}<br>
           Gender: ${genderLabel}<br>
           Smoking: ${d.Smoking.toFixed(2)}%<br>
           Drug Experimentation: ${d.Drugs.toFixed(2)}%`
        )
        .style("left", (event.clientX + 10) + "px")
        .style("top", (event.clientY + 10) + "px");
    }
    function moveTooltip(event) {
      tooltip
        .style("left", (event.clientX + 10) + "px")
        .style("top", (event.clientY + 10) + "px");
    }
    function hideTooltip() { tooltip.style("display", "none"); }

    // Points (slightly smaller)
    svg.selectAll(".dot-smoking")
      .data(yearlyData)
      .enter()
      .append("circle")
      .attr("class", "dot-smoking")
      .attr("cx", d => xScale(d.Year))
      .attr("cy", d => yLeft(d.Smoking))
      .attr("r", 4)
      .attr("fill", "#1f77b4")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(120).attr("r", 7);
        showTooltip(event, d);
      })
      .on("mousemove", moveTooltip)
      .on("mouseout", function () {
        d3.select(this).transition().duration(120).attr("r", 4);
        hideTooltip();
      });

    svg.selectAll(".dot-drugs")
      .data(yearlyData)
      .enter()
      .append("circle")
      .attr("class", "dot-drugs")
      .attr("cx", d => xScale(d.Year))
      .attr("cy", d => yRight(d.Drugs))
      .attr("r", 4)
      .attr("fill", "#ff7f0e")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(120).attr("r", 7);
        showTooltip(event, d);
      })
      .on("mousemove", moveTooltip)
      .on("mouseout", function () {
        d3.select(this).transition().duration(120).attr("r", 4);
        hideTooltip();
      });

    // Legend (top-right, compact)
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 165}, 0)`);

    legend.append("circle").attr("r", 5).attr("fill", "#1f77b4");
    legend.append("text").attr("x", 10).attr("y", 4).style("font-size", "12px").text("Smoking");

    legend.append("circle").attr("cy", 18).attr("r", 5).attr("fill", "#ff7f0e");
    legend.append("text").attr("x", 10).attr("y", 22).style("font-size", "12px").text("Drugs");
  }

  window.updateLineChart = function (data) {
    render(data);
  };
})();
