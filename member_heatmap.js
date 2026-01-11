/**
 * MEMBER 1: HEATMAPS - Final Integrated Version with Manual Min/Max Legend
 */
const margin = { top: 80, right: 100, bottom: 60, left: 80 };
const width = 450 - margin.left - margin.right; 
const height = 380 - margin.top - margin.bottom;

function updateHeatmap(data) {
    d3.select("#heatmap-drug").selectAll("*").remove();
    d3.select("#heatmap-smoke").selectAll("*").remove();

    const ageGroups = Array.from(new Set(data.map(d => d.Age_Group))).sort();
    const genders = ["Male", "Female"];

    function buildHeatmap(containerID, valueField, titleText, interpolator) {
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

        const xScale = d3.scaleBand().domain(genders).range([0, width]).padding(0.05);
        const yScale = d3.scaleBand().domain(ageGroups).range([0, height]).padding(0.05);
        const colorScale = d3.scaleSequential(interpolator).domain([minVal, maxVal]);

        const svg = d3.select(containerID).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .on("mouseleave", () => d3.select(".heatmap-tooltip").style("display", "none"))
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Draw Cells
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
                d3.select(".heatmap-tooltip").style("display", "block")
                    .html(`<strong>${titleText}</strong><br>Age: ${d.age}<br>Avg: ${d.avg.toFixed(1)}%`);
            })
            .on("mousemove", function(event) {
                d3.select(".heatmap-tooltip")
                    .style("left", (event.clientX + 15) + "px")
                    .style("top", (event.clientY - 15) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
                d3.select(".heatmap-tooltip").style("display", "none");
            });

        // Value labels inside cells
        svg.selectAll("text.val")
            .data(heatmapData).enter().append("text")
            .attr("x", d => xScale(d.gender) + xScale.bandwidth()/2)
            .attr("y", d => yScale(d.age) + yScale.bandwidth()/2)
            .attr("text-anchor", "middle").attr("dominant-baseline", "central")
            .style("font-size", "11px").style("font-weight", "bold")
            .style("fill", d => ((d.avg - minVal) / (maxVal - minVal || 1)) < 0.45 ? "#fff" : "#000")
            .text(d => d.avg.toFixed(1));

        // --- LEGEND WITH MANUAL MIN/MAX LABELS ---
        const legendWidth = 15;
        const gradID = `grad-${containerID.replace("#","")}`;
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient").attr("id", gradID).attr("x1","0%").attr("x2","0%").attr("y1","100%").attr("y2","0%");
        
        gradient.append("stop").attr("offset", "0%").attr("stop-color", colorScale(minVal));
        gradient.append("stop").attr("offset", "100%").attr("stop-color", colorScale(maxVal));

        // Color Rect
        svg.append("rect")
            .attr("x", width + 20)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", height)
            .style("fill", `url(#${gradID})`);

        // Max Value Label (Top)
        svg.append("text")
            .attr("x", width + 40)
            .attr("y", 5)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(maxVal.toFixed(1) + "%");

        // Min Value Label (Bottom)
        svg.append("text")
            .attr("x", width + 40)
            .attr("y", height)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .attr("dominant-baseline", "baseline")
            .text(minVal.toFixed(1) + "%");

        // Legend Title
        svg.append("text")
            .attr("x", width + 30)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text("Scale");

        // --- AXES & CENTERED TITLE ---
        svg.append("g").call(d3.axisLeft(yScale));
        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));

        // Centered Header logic
        const visualCenter = (width + margin.left + margin.right) / 2 - margin.left;
        svg.append("text")
            .attr("x", visualCenter)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(titleText);
            
        // Axis Labels
        svg.append("text").attr("transform", "rotate(-90)").attr("y", -margin.left + 35).attr("x", -(height/2)).attr("text-anchor", "middle").style("font-size", "12px").text("Age Group");
        svg.append("text").attr("x", width/2).attr("y", height + 40).attr("text-anchor", "middle").style("font-size", "12px").text("Gender");
    }

    buildHeatmap("#heatmap-smoke", "Smoking_Prevalence", "Smoking Prevalence", d3.interpolateViridis);
    buildHeatmap("#heatmap-drug", "Drug_Experimentation", "Drug Experimentation", d3.interpolateMagma);
}