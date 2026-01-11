/**
 * Member 2 — Dynamic Grouped Bar Chart (Final Tooltip Fix)
 */
function updateBarChart(data, keys) {
    const container = d3.select("#bar-chart");
    
    // 1. Safety Check
    if (container.empty()) {
        console.error("Bar Chart Error: #bar-chart div not found");
        return;
    }
    container.selectAll("*").remove();

    // 2. Fixed Dimensions
    const margin = { top: 60, right: 30, bottom: 70, left: 70 };
    const width = 450 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    // 3. Create SVG
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 4. Data Setup
    const AGE_ORDER = ["10-14","15-19","20-24","25-29","30-39","40-49","50-59","60-69","70-79","80+"];
    const ageGroups = AGE_ORDER.filter(age => data.some(d => d.Age_Group === age));

    if (ageGroups.length === 0) {
        svg.append("text").attr("y", 20).text("No data found for selection");
        return;
    }

    const activeKeys = (keys && keys.length === 2) ? keys : ["Smoking_Prevalence", "Drug_Experimentation"];

    // 5. SCALES
    const x0 = d3.scaleBand().domain(ageGroups).range([0, width]).padding(0.2);
    const x1 = d3.scaleBand().domain(activeKeys).range([0, x0.bandwidth()]).padding(0.1);
    
    const maxY = d3.max(data, d => Math.max(+d[activeKeys[0]] || 0, +d[activeKeys[1]] || 0)) || 10;
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([height, 0]);

    const color = d3.scaleOrdinal().domain(activeKeys).range(["#1f77b4", "#ff7f0e"]);

    // 6. DRAW BARS
    const barGroups = svg.selectAll(".age-group")
        .data(ageGroups)
        .enter().append("g")
        .attr("transform", d => `translate(${x0(d)},0)`);

    barGroups.selectAll("rect")
        .data(ageGroup => {
            const row = data.find(d => d.Age_Group === ageGroup);
            return activeKeys.map(key => ({
                key: key,
                value: row ? +row[key] : 0,
                ageGroup: ageGroup
            }));
        })
        .enter().append("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => Math.max(0, height - y(d.value)))
        .attr("fill", d => color(d.key))
        .on("mouseover", function(event, d) {
            d3.select(".heatmap-tooltip")
                .style("display", "block")
                .html(`<strong>Age: ${d.ageGroup}</strong><br>${d.key.replace(/_/g," ")}: ${d.value.toFixed(1)}%`);
        })
        .on("mousemove", function(event) {
            // FIX: Use clientX/Y to match 'position: fixed' in CSS
            d3.select(".heatmap-tooltip")
                .style("left", (event.clientX + 15) + "px")
                .style("top", (event.clientY - 15) + "px");
        })
        .on("mouseout", () => {
            d3.select(".heatmap-tooltip").style("display", "none");
        });

    // 7. AXES
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));

    // 8. AXIS LABELS
    svg.append("text").attr("x", width/2).attr("y", height + 60).attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold").text("Age Groups");
    svg.append("text").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -height/2).attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold").text("Prevalence %");

    // 9. LEGEND
    const legend = svg.append("g")
        .attr("font-size", 10)
        .selectAll("g")
        .data(activeKeys)
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20 - 45})`);

    legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", color);
    legend.append("text").attr("x", 20).attr("y", 12).text(d => d.replace(/_/g, " "));
}