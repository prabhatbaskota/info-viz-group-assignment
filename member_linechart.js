function updateLineChart(data) {
    const container = d3.select("#line-chart").html("");
    const margin = { top: 30, right: 30, bottom: 60, left: 70 };
    const width = 450 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const yearly = Array.from(d3.rollup(data, v => d3.mean(v, d => d.Smoking_Prevalence), d => d.Year),
        ([Year, val]) => ({Year, val})).sort((a,b) => a.Year - b.Year);

    const x = d3.scalePoint().domain(yearly.map(d => d.Year)).range([0, width]);
    const y = d3.scaleLinear().domain([d3.min(yearly, d => d.val)*0.9, d3.max(yearly, d => d.val)*1.1]).range([height, 0]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => d.toFixed(1) + "%"));

    // Axis Labels
    svg.append("text").attr("x", width/2).attr("y", height+45).attr("text-anchor", "middle").style("font-weight","bold").text("Year");
    svg.append("text").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -height/2).attr("text-anchor", "middle").style("font-weight","bold").text("Avg Smoking %");

    const line = d3.line().x(d => x(d.Year)).y(d => y(d.val)).curve(d3.curveMonotoneX);
    svg.append("path").datum(yearly).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 3).attr("d", line);

    svg.selectAll("circle").data(yearly).enter().append("circle")
        .attr("cx", d => x(d.Year)).attr("cy", d => y(d.val)).attr("r", 5).attr("fill", "red")
        .on("mouseover", (event, d) => {
            d3.select(".heatmap-tooltip").style("display", "block").html(`<strong>Year: ${d.Year}</strong><br>Avg: ${d.val.toFixed(2)}%`);
        })
        .on("mousemove", (event) => {
            d3.select(".heatmap-tooltip").style("left", (event.clientX + 15) + "px").style("top", (event.clientY - 15) + "px");
        })
        .on("mouseout", () => d3.select(".heatmap-tooltip").style("display", "none"));
}