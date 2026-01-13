let globalData = [];

d3.csv("data.csv").then(data => {
    globalData = data.map(d => ({
        ...d,
        Year: +d.Year,
        Smoking_Prevalence: +d.Smoking_Prevalence,
        Drug_Experimentation: +d.Drug_Experimentation,
        Peer_Influence: +d.Peer_Influence
    }));

    updateAllCharts(globalData);

    // Listen for Filter Changes
    d3.select("#gender-filter").on("change", () => {
        updateAllCharts(getFilteredData());
    });

    d3.select("#metric-filter").on("change", () => {
        updateAllCharts(getFilteredData());
    });
});

/**
 * Helper to get data based on current dropdown selection
 */
function getFilteredData() {
    const gen = d3.select("#gender-filter").property("value");
    return gen === "All" ? globalData : globalData.filter(d => d.Gender === gen);
}

/**
 * Updates all components
 */
function updateAllCharts(data) {
    const metrics = d3.select("#metric-filter").property("value").split(",");
    
    if (typeof updateHeatmap === "function") updateHeatmap(data);
    if (typeof updateLineChart === "function") updateLineChart(data);
    if (typeof updateBarChart === "function") updateBarChart(data, metrics);
    
    // Placeholder for Member 4
    if (typeof updateScatterPlot === "function") updateScatterPlot(data);
}

/**
 * CROSS-BRUSHING LOGIC
 * These functions are called by mouse events in the Heatmap and Bar Chart
 */

// 1. Highlight function
window.highlightData = function(category, value) {
    // Apply CSS dimming to the background
    d3.select("body").classed("is-brushed", true);

    // Highlight elements matching the hovered age/year
    d3.selectAll(`[data-age='${value}']`).classed("is-active", true);
    d3.selectAll(`[data-year='${value}']`).classed("is-active", true);

    // INTEGRATION: Morph Line Chart to show specific trend
    if (category === "age" && typeof updateLineChart === "function") {
        updateLineChart(getFilteredData(), value);
    }
};

// 2. Reset function
window.resetHighlight = function() {
    // Remove CSS dimming and highlights
    d3.select("body").classed("is-brushed", false);
    d3.selectAll(".is-active").classed("is-active", false);

    // INTEGRATION: Reset Line Chart to the average trend
    if (typeof updateLineChart === "function") {
        updateLineChart(getFilteredData(), null);
    }
};