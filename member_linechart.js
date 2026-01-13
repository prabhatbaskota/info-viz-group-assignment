/**
 * Member: Line Chart - Interactive Cross-Brushing Version
 */
let lineSvg, lineX, lineY, lineFocus;

function updateLineChart(data, filterAge = null) {
    const container = d3.select("#line-chart");
    if (container.empty()) return;

    // Use local naming to prevent conflicts with Heatmap/Bar chart variables
    const lMargin = { top: 30, right: 30, bottom: 60, left: 70 };
    const lWidth = 450 - lMargin.left - lMargin.right;
    const lHeight = 300 - lMargin.top - lMargin.bottom;

    // 1. Setup Persistent Canvas
    if (!lineSvg) {
        const fullSvg = container.append("svg")
            .attr("width", lWidth + lMargin.left + lMargin.right)
            .attr("height", lHeight + lMargin.top + lMargin.bottom);
        
        lineSvg = fullSvg.append("g")
            .attr("transform", `translate(${lMargin.left},${lMargin.top})`);

        lineX = d3.scalePoint().range([0, lWidth]);
        lineY = d3.scaleLinear().range([lHeight, 0]);

        lineSvg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${lHeight})`);
        lineSvg.append("g").attr("class", "y-axis");

        // Static Labels
        lineSvg.append("text").attr("class", "axis-label").attr("x", lWidth/2).attr("y", lHeight+45).attr("text-anchor", "middle").text("Year");
        lineSvg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -lHeight/2).attr("text-anchor", "middle").text("Avg Smoking %");

        // The Line Path
        lineSvg.append("path")
            .attr("class", "main-line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3);

        // --- NEW: Vertical Focus Line (Tracker) ---
        lineFocus = lineSvg.append("line")
            .attr("class", "focus-line")
            .attr("y1", 0)
            .attr("y2", lHeight)
            .style("stroke", "#999")
            .style("stroke-width", 1)
            .style("stroke-dasharray", "3,3")
            .style("display", "none");
    }

    // 2. Prepare Data (Filter by Age if a hover/selection is active)
    let filteredData = data;
    if (filterAge) {
        filteredData = data.filter(d => d.Age_Group === filterAge);
    }

    const yearly = Array.from(
        d3.rollup(filteredData, v => d3.mean(v, d => d.Smoking_Prevalence), d => d.Year),
        ([Year, val]) => ({Year, val})
    ).sort((a,b) => a.Year - b.Year);

    // 3. Update Scales (Keep Y-axis steady or zoom)
    lineX.domain(yearly.map(d => d.Year));
    // Zooming the Y-axis slightly to show the trend better
    const minV = d3.min(yearly, d => d.val);
    const maxV = d3.max(yearly, d => d.val);
    lineY.domain([minV * 0.95, maxV * 1.05]).nice();

    // 4. Update Axes
    lineSvg.select(".x-axis").transition().duration(750)
        .call(d3.axisBottom(lineX).tickFormat(d3.format("d")));
    lineSvg.select(".y-axis").transition().duration(750)
        .call(d3.axisLeft(lineY).ticks(5).tickFormat(d => d.toFixed(1) + "%"));

    // 5. Morph the Line
    const lineGenerator = d3.line()
        .x(d => lineX(d.Year))
        .y(d => lineY(d.val))
        .curve(d3.curveMonotoneX);

    lineSvg.select(".main-line")
        .datum(yearly)
        .transition().duration(1000)
        .attr("d", lineGenerator)
        .attr("stroke", filterAge ? "#e74c3c" : "steelblue"); // Change color when highlighting

    // 6. Update the Circles (Dots)
    const circles = lineSvg.selectAll("circle.dot").data(yearly, d => d.Year);

    circles.exit().remove();

    const circlesEnter = circles.enter().append("circle")
        .attr("class", "dot")
        .attr("r", 0)
        .attr("fill", filterAge ? "#e74c3c" : "steelblue");

    circlesEnter.merge(circles)
        .on("mouseover", function(event, d) {
            lineFocus.style("display", "block").attr("x1", lineX(d.Year)).attr("x2", lineX(d.Year));
            d3.select(this).attr("r", 8).attr("fill", "orange");
            
            d3.select(".heatmap-tooltip").style("display", "block")
                .html(`<strong>Year: ${d.Year}</strong><br>
                       ${filterAge ? "Age " + filterAge : "Total Avg"}: ${d.val.toFixed(2)}%`);
        })
        .on("mousemove", (event) => {
            d3.select(".heatmap-tooltip")
                .style("left", (event.clientX + 15) + "px")
                .style("top", (event.clientY - 15) + "px");
        })
        .on("mouseout", function() {
            lineFocus.style("display", "none");
            d3.select(this).attr("r", 5).attr("fill", filterAge ? "#e74c3c" : "steelblue");
            d3.select(".heatmap-tooltip").style("display", "none");
        })
        .transition().duration(1000)
        .attr("cx", d => lineX(d.Year))
        .attr("cy", d => lineY(d.val))
        .attr("r", 5);
}