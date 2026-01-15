// member_scatterplots.js
/* global d3 */

(function () {
  const containerSelector = "#scatter-plot";
  let showTrendLine = true;

  // Tooltip appended to BODY (like your old working version)
  // This avoids clipping and layout conflicts.
  const tooltip = d3
    .select("body")
    .selectAll(".scatter-tooltip")
    .data([0])
    .join("div")
    .attr("class", "scatter-tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("z-index", 10000);

  window.updateScatterPlot = function updateScatterPlot(rawData) {
    const container = d3.select(containerSelector);
    if (container.empty()) return;

    container.selectAll("*").remove();

    // ---------- Controls ----------
    const controls = container
      .append("div")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("gap", "10px")
      .style("margin", "0 0 8px 0");

    const btnReset = controls
      .append("button")
      .text("Reset View")
      .style("cursor", "pointer")
      .style("border", "none")
      .style("padding", "6px 10px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("font-weight", "600");

    const btnTrend = controls
      .append("button")
      .text(showTrendLine ? "Hide Trend Line" : "Show Trend Line")
      .style("cursor", "pointer")
      .style("border", "none")
      .style("padding", "6px 10px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("font-weight", "600");

    const statsRow = container
      .append("div")
      .style("font-size", "12px")
      .style("color", "#34495e")
      .style("margin-bottom", "6px")
      .style("text-align", "center");

    // ---------- Size ----------
    const cw = Math.max(320, container.node().getBoundingClientRect().width);
    const totalWidth = Math.min(560, cw);
    const totalHeight = 300;

    const margin = { top: 18, right: 95, bottom: 50, left: 60 };
    const width = totalWidth - margin.left - margin.right;
    const height = totalHeight - margin.top - margin.bottom;

    const svg = container
      .append("svg")
      .attr("width", totalWidth)
      .attr("height", totalHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ---------- Data ----------
    const data = (rawData || [])
      .map((d) => ({
        ...d,
        Year: d.Year != null ? +d.Year : null,
        Peer_Influence: +d.Peer_Influence,
        Smoking_Prevalence: +d.Smoking_Prevalence,
        Drug_Experimentation: +d.Drug_Experimentation,
      }))
      .filter(
        (d) =>
          Number.isFinite(d.Peer_Influence) &&
          Number.isFinite(d.Smoking_Prevalence)
      );

    if (data.length === 0) {
      statsRow.text("No data available for scatterplot.");
      return;
    }

    const xVar = "Peer_Influence";
    const yVar = "Smoking_Prevalence";
    const colorVar = "Gender";

    // ---------- Smart domains ----------
    function paddedExtent(ext) {
      const span = (ext[1] - ext[0]) || 1;
      return [ext[0] - span * 0.08, ext[1] + span * 0.08];
    }

    const xMax = d3.max(data, (d) => d[xVar]);
    let xDomain;
    if (xMax <= 15) xDomain = [0, 15];
    else if (xMax <= 55) xDomain = [0, 60];
    else if (xMax <= 105) xDomain = [0, 100];
    else xDomain = paddedExtent(d3.extent(data, (d) => d[xVar]));

    const yExt = d3.extent(data, (d) => d[yVar]);
    const yPercentish = yExt[0] >= 0 && yExt[1] <= 100;
    const yDomain = yPercentish ? [0, 100] : paddedExtent(yExt);

    const xScale = d3.scaleLinear().domain(xDomain).range([0, width]).nice();
    const yScale = d3.scaleLinear().domain(yDomain).range([height, 0]).nice();

    // ---------- Axes ----------
    const xAxisG = g.append("g").attr("transform", `translate(0,${height})`);
    const yAxisG = g.append("g");

    xAxisG.call(d3.axisBottom(xScale).ticks(5));
    yAxisG.call(d3.axisLeft(yScale).ticks(5));

    g.append("text")
      .attr("class", "sc-x-label")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Peer Influence (%)");

    g.append("text")
      .attr("class", "sc-y-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .text("Smoking Prevalence (%)");

    // ---------- Clip ----------
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "scatter-clip")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height);

    const plotG = g.append("g").attr("clip-path", "url(#scatter-clip)");

    // ---------- Color + Legend ----------
    const categories = Array.from(new Set(data.map((d) => d[colorVar] || "Unknown")));
    const colorScale = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);

    const legend = g.append("g").attr("transform", `translate(${width + 10}, 5)`);

    legend
      .selectAll("g")
      .data(categories)
      .join("g")
      .attr("transform", (d, i) => `translate(0, ${i * 18})`)
      .each(function (cat) {
        const row = d3.select(this);
        row.append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("rx", 2)
          .attr("fill", colorScale(cat));
        row.append("text")
          .attr("x", 14)
          .attr("y", 9)
          .style("font-size", "11px")
          .style("font-weight", "600")
          .text(cat);
      });

    // ---------- Correlation ----------
    const r = pearsonR(data.map((d) => d[xVar]), data.map((d) => d[yVar]));
    const strength =
      Math.abs(r) >= 0.7 ? "Strong" :
      Math.abs(r) >= 0.4 ? "Moderate" :
      Math.abs(r) >= 0.2 ? "Weak" : "Very Weak";

    statsRow.html(
      `<span style="font-weight:700;">Correlation (r):</span> ${fmt3(r)} &nbsp; | &nbsp; ` +
      `<span style="font-weight:700;">Points:</span> ${data.length} &nbsp; | &nbsp; ` +
      `<span style="font-weight:700;">Trend Strength:</span> ${strength}`
    );

    // ---------- Points ----------
    const dots = plotG
      .selectAll("circle.dot")
      .data(data)
      .join("circle")
      .attr("class", "dot")
      .attr("r", 4)
      .attr("cx", (d) => xScale(d[xVar]))
      .attr("cy", (d) => yScale(d[yVar]))
      .attr("fill", (d) => colorScale(d[colorVar] || "Unknown"))
      .attr("stroke", "white")
      .attr("stroke-width", 0.6)
      .attr("opacity", 0.75);

    // Tooltip position: ABOVE cursor (like your old code)
    function moveTooltip(event) {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 28}px`);
    }

    dots
      .on("mouseover", (event, d) => {
        tooltip
          .style("display", "block")
          .html(
            `<strong>Gender:</strong> ${d.Gender ?? "Unknown"}<br>` +
            (d.Year ? `<strong>Year:</strong> ${d.Year}<br>` : "") +
            `<strong>Age Group:</strong> ${d.Age_Group ?? "N/A"}<br>` +
            `<strong>Peer Influence:</strong> ${fmt1(d.Peer_Influence)}%<br>` +
            `<strong>Smoking Prevalence:</strong> ${fmt1(d.Smoking_Prevalence)}%<br>` +
            (Number.isFinite(d.Drug_Experimentation)
              ? `<strong>Drug Experimentation:</strong> ${fmt1(d.Drug_Experimentation)}%`
              : "")
          );
        moveTooltip(event);
      })
      .on("mousemove", (event) => {
        moveTooltip(event);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    // ---------- Trendline ----------
    const trendPath = plotG
      .append("path")
      .attr("class", "trend-line")
      .style("pointer-events", "none");

    const renderTrend = (xS, yS) => {
      trendPath.attr("display", showTrendLine ? null : "none");
      if (!showTrendLine) return;

      const lr = linearRegression(
        data.map((d) => d[xVar]),
        data.map((d) => d[yVar])
      );

      const x0 = xS.domain()[0];
      const x1 = xS.domain()[1];

      const lineData = [
        { x: x0, y: lr.predict(x0) },
        { x: x1, y: lr.predict(x1) },
      ];

      trendPath
        .datum(lineData)
        .attr("d", d3.line().x((p) => xS(p.x)).y((p) => yS(p.y)))
        .attr("fill", "none")
        .attr("stroke", "#e74c3c")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "6 4")
        .attr("opacity", 0.9);
    };

    renderTrend(xScale, yScale);

    // ---------- Zoom (overlay behind points, so hover works!) ----------
    // This is the KEY: zoom overlay captures drag/zoom, points keep hover.
    const zoomOverlay = g
      .insert("rect", ":first-child")
      .attr("class", "zoom-overlay")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .style("pointer-events", "all");

    const zoom = d3.zoom()
      .scaleExtent([0.9, 6])
      .on("zoom", (event) => {
        const t = event.transform;
        const newX = t.rescaleX(xScale);
        const newY = t.rescaleY(yScale);

        xAxisG.call(d3.axisBottom(newX).ticks(5));
        yAxisG.call(d3.axisLeft(newY).ticks(5));

        dots
          .attr("cx", (d) => newX(d[xVar]))
          .attr("cy", (d) => newY(d[yVar]));

        renderTrend(newX, newY);

        tooltip.style("display", "none");
      });

    zoomOverlay.call(zoom);

    btnReset.on("click", () => {
      zoomOverlay.transition().duration(350).call(zoom.transform, d3.zoomIdentity);
    });

    btnTrend.on("click", () => {
      showTrendLine = !showTrendLine;
      btnTrend.text(showTrendLine ? "Hide Trend Line" : "Show Trend Line");
      renderTrend(xScale, yScale);
    });
  };

  // ---------- helpers ----------
  function fmt1(v) { return Number.isFinite(v) ? d3.format(".1f")(v) : "N/A"; }
  function fmt3(v) { return Number.isFinite(v) ? d3.format(".3f")(v) : "N/A"; }

  function pearsonR(xs, ys) {
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return NaN;
    const mx = d3.mean(xs), my = d3.mean(ys);
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      num += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    return num / Math.sqrt(dx2 * dy2);
  }

  function linearRegression(x, y) {
    const n = Math.min(x.length, y.length);
    const sumX = d3.sum(x), sumY = d3.sum(y);
    const sumXY = d3.sum(x.map((v, i) => v * y[i]));
    const sumX2 = d3.sum(x.map((v) => v * v));

    const denom = (n * sumX2 - sumX * sumX) || 1e-9;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    return { predict: (xx) => slope * xx + intercept };
  }
})();
