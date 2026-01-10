/**
 * MASTER CONTROLLER: main.js
 */
let globalData = [];

// 1. Load Data
d3.csv("./data.csv").then(data => {
    globalData = data.map(d => ({
        ...d,
        Year: +d.Year,
        Smoking_Prevalence: +d.Smoking_Prevalence,
        Drug_Experimentation: +d.Drug_Experimentation,
        Peer_Influence: +d.Peer_Influence
    }));

    updateAllCharts(globalData);
    setupDashboardListeners();
});

// 2. Coordinated Update Logic
function updateAllCharts(filteredData) {
    // Get the local metric choice for the bar chart
    const metricValue = d3.select("#metric-filter").property("value") || "Smoking_Prevalence,Drug_Experimentation";
    const selectedKeys = metricValue.split(",");

    // Update Heatmaps (Global Filter only)
    if (typeof updateHeatmap === "function") updateHeatmap(filteredData);
    
    // Update Bar Chart (Global Filter + Local Metric Choice)
    if (typeof updateBarChart === "function") {
        updateBarChart(filteredData, selectedKeys);
    }

    // Placeholders
    if (typeof updateLineChart === "function") updateLineChart(filteredData);
    if (typeof updateScatterPlot === "function") updateScatterPlot(filteredData);
}

// 3. Setup Listeners
function setupDashboardListeners() {
    // GLOBAL FILTER: Affects everything
    d3.select("#gender-filter").on("change", function() {
        const gen = d3.select(this).property("value");
        const filtered = gen === "All" ? globalData : globalData.filter(d => d.Gender === gen);
        updateAllCharts(filtered);
    });

    // LOCAL FILTER: Affects only the Bar Chart
    d3.select("#metric-filter").on("change", function() {
        const gen = d3.select("#gender-filter").property("value");
        const filtered = gen === "All" ? globalData : globalData.filter(d => d.Gender === gen);
        
        // We call updateAllCharts to ensure the bar chart gets the new keys
        updateAllCharts(filtered);
    });
}