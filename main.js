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

    d3.select("#gender-filter").on("change", function() {
        const gen = d3.select(this).property("value");
        const filtered = gen === "All" ? globalData : globalData.filter(d => d.Gender === gen);
        updateAllCharts(filtered);
    });

    d3.select("#metric-filter").on("change", () => {
        const gen = d3.select("#gender-filter").property("value");
        const filtered = gen === "All" ? globalData : globalData.filter(d => d.Gender === gen);
        updateAllCharts(filtered);
    });
});

function updateAllCharts(data) {
    const metrics = d3.select("#metric-filter").property("value").split(",");
    if (typeof updateHeatmap === "function") updateHeatmap(data);
    if (typeof updateLineChart === "function") updateLineChart(data);
    if (typeof updateBarChart === "function") updateBarChart(data, metrics);
    if (typeof updateScatterPlot === "function") updateScatterPlot(data);
}