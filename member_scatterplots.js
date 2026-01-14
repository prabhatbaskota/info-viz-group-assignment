// member_scatterplots.js - Updated with reliable tooltip positioning

function updateScatterPlot(data) {
    const container = d3.select("#scatter-plot");
    if (container.empty()) return;

    // Responsive sizing based on container
    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 50, right: 120, bottom: 70, left: 70 };
    const width = containerWidth - margin.left - margin.right;
    const height = Math.max(320, width * 0.7) - margin.top - margin.bottom;

    // Clear previous content
    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", height + margin.top + margin.bottom)
        .style("overflow", "visible");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Variables
    const xVar = "Year";
    const yVar = "Smoking_Prevalence";
    const colorVar = "Gender";

    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[xVar]))
        .range([0, width])
        .nice();

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[yVar]))
        .range([height, 0])
        .nice();

    // Color scale
    const colorScale = d3.scaleOrdinal()
        .domain(["Male", "Female"])
        .range(["#1f77b4", "#ff7f0e"]); // blue & orange

    // Axes
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).tickFormat(d => d + "%"));

    // Axis labels
    g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text("Year");

    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -55)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Smoking Prevalence (%)");

    // Points
    g.selectAll(".dot")
        .data(data)
        .join("circle")
        .attr("class", "dot")
        .attr("r", 5)
        .attr("cx", d => xScale(+d[xVar]))
        .attr("cy", d => yScale(+d[yVar]))
        .attr("fill", d => colorScale(d[colorVar]))
        .style("opacity", 0.75)
        .style("stroke", "#fff")
        .style("stroke-width", 0.8)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition().duration(120)
                .attr("r", 9)
                .style("opacity", 1)
                .style("stroke-width", 2);

            const tooltip = d3.select(".heatmap-tooltip")
                .style("display", "block")
                .html(`
                    <strong>Year:</strong> ${d.Year}<br>
                    <strong>Smoking Prevalence:</strong> ${(+d.Smoking_Prevalence).toFixed(1)}%<br>
                    <strong>Gender:</strong> ${d.Gender}<br>
                    <strong>Age Group:</strong> ${d.Age_Group || "N/A"}
                `);

            // RELIABLE POSITIONING: pointer relative to SVG + SVG offset on page
            const [mouseX, mouseY] = d3.pointer(event, svg.node()); // ← relative to SVG
            const svgRect = svg.node().getBoundingClientRect();     // ← SVG position on screen

            tooltip
                .style("left", (svgRect.left + mouseX + 18) + "px")
                .style("top", (svgRect.top + mouseY - 15) + "px");
        })
        .on("mousemove", function(event) {
            const [mouseX, mouseY] = d3.pointer(event, svg.node());
            const svgRect = svg.node().getBoundingClientRect();

            d3.select(".heatmap-tooltip")
                .style("left", (svgRect.left + mouseX + 18) + "px")
                .style("top", (svgRect.top + mouseY - 15) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition().duration(120)
                .attr("r", 5)
                .style("opacity", 0.75)
                .style("stroke-width", 0.8);

            d3.select(".heatmap-tooltip").style("display", "none");
        });

    // Simple trend line
    const trendLine = g.append("path")
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("stroke", "#e74c3c")
        .attr("stroke-width", 2.2)
        .attr("stroke-dasharray", "5 5");

    updateTrendLine(data, xScale, yScale);

    function updateTrendLine(data, xS, yS) {
        const xValues = data.map(d => +d[xVar]);
        const yValues = data.map(d => +d[yVar]);

        const lr = linearRegression(xValues, yValues);

        const xMin = d3.min(xValues);
        const xMax = d3.max(xValues);

        const lineData = [
            { x: xMin, y: lr.predict(xMin) },
            { x: xMax, y: lr.predict(xMax) }
        ];

        trendLine.datum(lineData)
            .attr("d", d3.line()
                .x(d => xS(d.x))
                .y(d => yS(d.y))
            );
    }

    // Linear regression helper
    function linearRegression(x, y) {
        const n = x.length;
        const sumX = d3.sum(x);
        const sumY = d3.sum(y);
        const sumXY = d3.sum(x.map((v, i) => v * y[i]));
        const sumX2 = d3.sum(x.map(v => v * v));

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return {
            predict: val => slope * val + intercept
        };
    }

    // Gender legend
    const legend = svg.append("g")
        .attr("transform", `translate(${containerWidth - 100}, ${margin.top + 10})`);

    ["Male", "Female"].forEach((gender, i) => {
        legend.append("circle")
            .attr("cx", 0)
            .attr("cy", i * 24)
            .attr("r", 6)
            .attr("fill", colorScale(gender));

        legend.append("text")
            .attr("x", 14)
            .attr("y", i * 24 + 5)
            .text(gender)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
    });
}