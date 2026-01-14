/**
 * Member 2 — Grouped Bar Chart (Multi-Year Average + Cross-Brushing)
 * Shows average Smoking Prevalence and Drug Experimentation by Age Group (2020–2024)
 */

console.log("Member bar chart loaded");

let barSvg, barX0, barX1, barY, barColor;

function updateBarChart(data, keys) {

    const container = d3.select("#bar-chart");
    if (container.empty()) return;

    // ---- Dimensions ----
    const margin = { top: 60, right: 30, bottom: 70, left: 70 };
    const width = 450 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    // ---- Persistent SVG ----
    if (!barSvg) {
        const fullSvg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        barSvg = fullSvg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        barX0 = d3.scaleBand().range([0, width]).padding(0.2);
        barX1 = d3.scaleBand().padding(0.1);
        barY = d3.scaleLinear().range([height, 0]);
        barColor = d3.scaleOrdinal().range(["#1f77b4", "#ff7f0e"]);

        barSvg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`);
        barSvg.append("g").attr("class", "y-axis");

        barSvg.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .text("Age Groups");

        barSvg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Average Rate (%)");
    }

    // ---- Multi-year aggregation (2020–2024) ----
    const aggregated = d3.rollups(
        data,
        v => ({
            Smoking_Prevalence: d3.mean(v, d => +d.Smoking_Prevalence),
            Drug_Experimentation: d3.mean(v, d => +d.Drug_Experimentation)
        }),
        d => d.Age_Group
    ).map(d => ({
        Age_Group: d[0],
        Smoking_Prevalence: d[1].Smoking_Prevalence,
        Drug_Experimentation: d[1].Drug_Experimentation
    }));

    const AGE_ORDER = ["10-14","15-19","20-24","25-29","30-39","40-49","50-59","60-69","70-79","80+"];

    const ageGroups = AGE_ORDER.filter(age =>
        aggregated.some(d => d.Age_Group === age)
    );

    const activeKeys = (keys && keys.length === 2)
        ? keys
        : ["Smoking_Prevalence", "Drug_Experimentation"];

    // ---- Scales ----
    barX0.domain(ageGroups);
    barX1.domain(activeKeys).range([0, barX0.bandwidth()]);
    barColor.domain(activeKeys);

    const maxY = d3.max(aggregated, d =>
        Math.max(d.Smoking_Prevalence, d.Drug_Experimentation)
    ) || 10;

    barY.domain([0, maxY]).nice();

    // ---- Axes ----
    barSvg.select(".x-axis")
        .transition().duration(750)
        .call(d3.axisBottom(barX0))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

    barSvg.select(".y-axis")
        .transition().duration(750)
        .call(d3.axisLeft(barY).ticks(5).tickFormat(d => d + "%"));

    // ---- Groups ----
    const groupSel = barSvg.selectAll(".age-group")
        .data(ageGroups, d => d);

    const groupEnter = groupSel.enter()
        .append("g")
        .attr("class", "age-group");

    groupSel.exit().remove();

    const groups = groupEnter.merge(groupSel)
        .transition().duration(750)
        .attr("transform", d => `translate(${barX0(d)},0)`);

    // ---- Bars ----
    const bars = barSvg.selectAll(".age-group")
        .selectAll("rect")
        .data(age => {
            const row = aggregated.find(d => d.Age_Group === age);
            return activeKeys.map(key => ({
                key,
                value: row ? row[key] : 0,
                ageGroup: age
            }));
        }, d => d.key);

    bars.exit().remove();

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("data-age", d => d.ageGroup) // 🔗 Cross-brushing link
        .attr("x", d => barX1(d.key))
        .attr("y", height)
        .attr("width", barX1.bandwidth())
        .attr("height", 0)
        .attr("fill", d => barColor(d.key))
        .merge(bars)
        .on("mouseover", function(event, d) {
            if (window.highlightData) window.highlightData("age", d.ageGroup);
            d3.select(".heatmap-tooltip")
                .style("display", "block")
                .html(`<strong>Age: ${d.ageGroup}</strong><br>${d.key.replace(/_/g," ")}: ${d.value.toFixed(1)}%`);
        })
        .on("mouseout", function() {
            if (window.resetHighlight) window.resetHighlight();
            d3.select(".heatmap-tooltip").style("display", "none");
        })
        .on("mousemove", function(event) {
            d3.select(".heatmap-tooltip")
                .style("left", (event.clientX + 15) + "px")
                .style("top", (event.clientY - 15) + "px");
        })
        .transition().duration(750)
        .attr("x", d => barX1(d.key))
        .attr("y", d => barY(d.value))
        .attr("width", barX1.bandwidth())
        .attr("height", d => height - barY(d.value))
        .attr("fill", d => barColor(d.key));
}
