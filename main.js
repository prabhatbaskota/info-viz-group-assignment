// main.js - Simplified version without cross-brushing

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