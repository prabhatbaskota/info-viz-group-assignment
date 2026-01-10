/**
 * MEMBER 1: HEATMAPS - Final Consistent Version
 */
const margin = { top: 60, right: 60, bottom: 60, left: 70 };
const width = 450 - margin.left - margin.right; 
const height = 380 - margin.top - margin.bottom;

function initHeatmap(data) {
    updateHeatmap(data);
}

function updateHeatmap(data) {
    // Clear old charts
    d3.select("#heatmap-drug").selectAll("*").remove();
    d3.select("#heatmap-smoke").selectAll("*").remove();

    const ageGroups = Array.from(new Set(data.map(d => d.Age_Group))).sort();
    const genders = ["Male", "Female"];

    function buildHeatmap(containerID, valueField, titleText, interpolator) {
        // 1. Prepare Data
        const heatmapData = [];
        ageGroups.forEach(age => {
            genders.forEach(gender => {
                const subset = data.filter(d => d.Age_Group === age && d.Gender === gender);
                const avg = d3.mean(subset, d => d[valueField]) || 0;
                heatmapData.push({ age, gender, avg });
            });
        });

        const maxVal = d3.max(heatmapData, d => d.avg) || 0;
        const minVal = d3.min(heatmapData, d => d.avg) || 0;

        // 2. Scales
        const xScale = d3.scaleBand().domain(genders).range([0, width]).padding(0.05);
        const yScale = d3.scaleBand().domain(ageGroups).range([0, height]).padding(0.05);
        const colorScale = d3.scaleSequential(interpolator).domain([minVal, maxVal]);

        // 3. SVG
        const svg = d3.select(containerID).append("svg")
            .attr("width", width + margin.left + margin.right + 10)
            .attr("height", height + margin.top + margin.bottom)
            .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        let tooltip = d3.select(".heatmap-tooltip");
        if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "heatmap-tooltip");

        // 4. Rectangles
        svg.selectAll("rect.cell")
            .data(heatmapData).enter().append("rect")
            .attr("x", d => xScale(d.gender))
            .attr("y", d => yScale(d.age))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.avg))
            .attr("stroke", "#fff")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
                tooltip.style("display", "block").style("opacity", 1)
                    .html(`<strong>${titleText}</strong><br>Age: ${d.age}<br>Avg: ${d.avg.toFixed(1)}%`);
            })
            .on("mousemove", (event) => tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 15) + "px"))
            .on("mouseout", function() {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
                tooltip.style("display", "none");
            });

        // 5. Value Text with Contrast Shadow
        svg.selectAll("text.val")
            .data(heatmapData).enter().append("text")
            .attr("x", d => xScale(d.gender) + xScale.bandwidth()/2)
            .attr("y", d => yScale(d.age) + yScale.bandwidth()/2)
            .attr("text-anchor", "middle").attr("dominant-baseline", "central")
            .style("font-size", "11px").style("font-weight", "bold")
            .style("fill", d => ((d.avg - minVal) / (maxVal - minVal || 1)) < 0.45 ? "#fff" : "#000")
            .text(d => d.avg.toFixed(1));

        // 6. Multi-Stop Legend (The Orange Fix)
        const legendX = width + 10;
        const gradID = `grad-${containerID.replace("#","")}`;
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient").attr("id", gradID).attr("x1","0%").attr("x2","0%").attr("y1","100%").attr("y2","0%");
        
        d3.range(10).forEach(i => {
            const offset = i / 9;
            gradient.append("stop")
                .attr("offset", `${offset * 100}%`)
                .attr("stop-color", colorScale(minVal + offset * (maxVal - minVal)));
        });

        svg.append("rect").attr("x", legendX).attr("width", 10).attr("height", height).style("fill", `url(#${gradID})`);
        svg.append("text").attr("x", legendX + 12).attr("y", 8).style("font-size", "9px").text(maxVal.toFixed(1));
        svg.append("text").attr("x", legendX + 12).attr("y", height).style("font-size", "9px").text(minVal.toFixed(1));
        svg.append("text").attr("x", legendX).attr("y", -10).style("font-size", "10px").style("font-weight", "bold").text("Rate (%)");

        // 7. Axes and Labels (THE FIX)
        svg.append("g").call(d3.axisLeft(yScale));
        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));

        // Y Label
        svg.append("text")
            .attr("transform", "rotate(-90)").attr("y", -margin.left + 25).attr("x", -(height / 2))
            .attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold").text("Age Group");

        // X Label
        svg.append("text")
            .attr("x", width / 2).attr("y", height + 40)
            .attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold").text("Gender");

        // Chart Title
        svg.append("text")
            .attr("x", width / 2).attr("y", -35).attr("text-anchor", "middle")
            .style("font-size", "14px").style("font-weight", "bold").text(titleText);
    }

    buildHeatmap("#heatmap-smoke", "Smoking_Prevalence", "Smoking Prevalence", d3.interpolateViridis);
    buildHeatmap("#heatmap-drug", "Drug_Experimentation", "Drug Experimentation", d3.interpolateMagma);
}