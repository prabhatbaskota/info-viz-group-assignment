// -----------------------------
// Globals
let scatterData = [], xVariable = 'age', yVariable = 'substance_score', colorVariable = 'gender', showTrendLine = false;
let zoomBehavior, svg, plotG, xAxisG, yAxisG, clipId = 'clip-' + Date.now();
const vizSelector = '#visualization';

// Tooltip setup
let tooltip = d3.select('body').selectAll('.d3-tooltip').data([0]);
tooltip = tooltip.enter().append('div').attr('class', 'd3-tooltip tooltip')
  .style('position', 'absolute').style('pointer-events', 'none')
  .style('opacity', 0).style('background', 'white')
  .style('border', '1px solid #ccc').style('border-radius', '5px')
  .style('padding', '8px').style('font-size', '12px')
  .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
  .merge(tooltip);

// -----------------------------
// Init
document.addEventListener('DOMContentLoaded', () => { setupUI(); loadData(); });

// -----------------------------
// UI and Sample Data
function setupUI() {
  if (!d3.select(vizSelector).node()) d3.select('body').append('div').attr('id', vizSelector.replace('#', ''));
  generateSampleData();
  createScatterPlot(scatterData);
  setupEventListeners();
}

function generateSampleData() {
  scatterData = Array.from({length:250}, (_,i)=>({
    record_id: i+1,
    age: Math.floor(Math.random()*10)+15 + (Math.random()*0.8-0.4),
    substance_score: +(Math.random()*8-2).toFixed(1),
    gender: ['Male','Female','Other'][i%3],
    region: ['North','South','East','West','Central'][i%5],
    education_level: ['High School','College','University','Vocational'][i%4],
    tobacco_use: Math.floor(Math.random()*6),
    alcohol_use: Math.floor(Math.random()*6),
    marijuana_use: Math.floor(Math.random()*6),
    mental_health_score: +(Math.random()*10).toFixed(1)
  }));
}

function loadData() {
  d3.csv('data/youth_smoking_drug_data_10000_rows_expanded.csv').then(rawData=>{
    if(!rawData || !rawData.length) throw Error('CSV empty');
    scatterData = rawData.map((d,i)=>({
      record_id: i+1,
      age: ensureNumber(d.age,15) + (Math.random()*0.8-0.4),
      substance_score: ensureNumber(d.substance_score, +(Math.random()*8-2).toFixed(1)),
      gender: ensureString(d.gender, ['Male','Female'][i%2]),
      region: ensureString(d.region,['North','South','East','West'][i%4]),
      education_level: ensureString(d.education_level,['High School','College'][i%2]),
      tobacco_use: ensureNumber(d.tobacco_use, Math.floor(Math.random()*5)),
      alcohol_use: ensureNumber(d.alcohol_use, Math.floor(Math.random()*5)),
      marijuana_use: ensureNumber(d.marijuana_use, Math.floor(Math.random()*5))
    }));
    createScatterPlot(scatterData);
  }).catch(()=>createScatterPlot(scatterData));
}

// -----------------------------
// Scatter Plot
function createScatterPlot(data) {
  d3.select(vizSelector).selectAll('svg').remove();
  const margin={top:50,right:160,bottom:60,left:70}, totalWidth=1000,totalHeight=560;
  const width=totalWidth-margin.left-margin.right, height=totalHeight-margin.top-margin.bottom;

  svg=d3.select(vizSelector).append('svg').attr('width',totalWidth).attr('height',totalHeight);
  svg.append('defs').append('clipPath').attr('id',clipId).append('rect').attr('width',width).attr('height',height);

  const g=svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
  plotG=g.append('g').attr('class','plot-group').attr('clip-path',`url(#${clipId})`);
  xAxisG=g.append('g').attr('class','x-axis').attr('transform',`translate(0,${height})`);
  yAxisG=g.append('g').attr('class','y-axis');

  const xExtent=d3.extent(data,d=>ensureNumber(d[xVariable],0));
  const yExtent=d3.extent(data,d=>ensureNumber(d[yVariable],0));
  const xScale=d3.scaleLinear().domain([xExtent[0]-0.05*(xExtent[1]-xExtent[0]),xExtent[1]+0.05*(xExtent[1]-xExtent[0])]).range([0,width]).nice();
  const yScale=d3.scaleLinear().domain([yExtent[0]-0.05*(yExtent[1]-yExtent[0]),yExtent[1]+0.05*(yExtent[1]-yExtent[0])]).range([height,0]).nice();

  const categories=Array.from(new Set(data.map(d=>d[colorVariable]||'Unknown')));
  const colorScale=d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10);

  xAxisG.call(d3.axisBottom(xScale)); yAxisG.call(d3.axisLeft(yScale));

  g.append('text').attr('x',width/2).attr('y',height+45).attr('text-anchor','middle').style('font-weight','600').text(getVariableLabel(xVariable));
  g.append('text').attr('transform','rotate(-90)').attr('x',-height/2).attr('y',-50).attr('text-anchor','middle').style('font-weight','600').text(getVariableLabel(yVariable));
  g.append('text').attr('x',width/2).attr('y',-20).attr('text-anchor','middle').style('font-size','16px').style('font-weight','700')
    .text(`Scatter Plot: ${getVariableLabel(xVariable)} vs ${getVariableLabel(yVariable)}`);

  const points=plotG.selectAll('.dot').data(data,d=>d.record_id);
  points.exit().remove();
  points.enter().append('circle').attr('class','dot').attr('r',5).attr('fill',d=>colorScale(d[colorVariable]||'Unknown'))
    .style('stroke','white').style('stroke-width',1).style('opacity',0.8)
    .on('mouseover',(e,d)=>{tooltip.html(`<strong>Record #${d.record_id}</strong><br/>${getVariableLabel(xVariable)}: ${d[xVariable]}<br/>${getVariableLabel(yVariable)}: ${d[yVariable]}<br/>${getVariableLabel(colorVariable)}: ${d[colorVariable]||'N/A'}<br/>Age: ${d.age}<br/>Region: ${d.region}`).style('left',`${e.pageX+12}px`).style('top',`${e.pageY-12}px`).transition().duration(120).style('opacity',0.95); d3.select(e.currentTarget).transition().duration(120).attr('r',8).style('stroke','#000');})
    .on('mousemove',e=>tooltip.style('left',`${e.pageX+12}px`).style('top',`${e.pageY-12}px`))
    .on('mouseout',e=>{tooltip.transition().duration(160).style('opacity',0); d3.select(e.currentTarget).transition().duration(120).attr('r',5).style('stroke','white');})
    .merge(points).attr('cx',d=>xScale(ensureNumber(d[xVariable],0))).attr('cy',d=>yScale(ensureNumber(d[yVariable],0)));

  // Legend
  const legend=g.selectAll('.legend').data(categories).enter().append('g').attr('class','legend').attr('transform',(d,i)=>`translate(${width+20},${i*22})`);
  legend.append('rect').attr('width',14).attr('height',14).attr('fill',d=>colorScale(d));
  legend.append('text').attr('x',20).attr('y',11).style('font-size','12px').text(d=>d);

  drawTrendLineIfNeeded(data,xScale,yScale,plotG);
  addZoomBehavior(svg,g,xScale,yScale,width,height);
  updateCorrelationStats(data,xVariable,yVariable);
}

// -----------------------------
// Zoom behavior
function addZoomBehavior(svg,g,xScale,yScale,width,height){
  zoomBehavior=d3.zoom().scaleExtent([0.5,10]).translateExtent([[-100,-100],[width+100,height+100]]).extent([[0,0],[width,height]]).on('zoom',e=>{
    const newX=e.transform.rescaleX(xScale), newY=e.transform.rescaleY(yScale);
    xAxisG.call(d3.axisBottom(newX)); yAxisG.call(d3.axisLeft(newY));
    plotG.selectAll('.dot').attr('cx',d=>newX(ensureNumber(d[xVariable],0))).attr('cy',d=>newY(ensureNumber(d[yVariable],0)));
    updateTrendLineOnTransform(newX,newY);
  });
  svg.call(zoomBehavior);
}

function resetZoomView(){if(!zoomBehavior||!svg)return; svg.transition().duration(700).call(zoomBehavior.transform,d3.zoomIdentity); createScatterPlot(scatterData);}

// -----------------------------
// Trend line
function drawTrendLineIfNeeded(data,xScale,yScale,plotG){
  plotG.selectAll('.trend-line').remove();
  if(!showTrendLine) return;
  const lr=linearRegression(data.map(d=>ensureNumber(d[xVariable],NaN)),data.map(d=>ensureNumber(d[yVariable],NaN)));
  const xMin=d3.min(data,d=>ensureNumber(d[xVariable],0)), xMax=d3.max(data,d=>ensureNumber(d[xVariable],0));
  const lineData=[{x:xMin,y:lr.predict(xMin)},{x:xMax,y:lr.predict(xMax)}];
  plotG.append('path').datum(lineData).attr('class','trend-line').attr('d',d3.line().x(d=>xScale(d.x)).y(d=>yScale(d.y))).attr('stroke','#f70404ff').attr('stroke-width',2).attr('fill','none').style('stroke-dasharray','6 4');
}

function updateTrendLineOnTransform(newX,newY){
  const path=plotG.selectAll('.trend-line'); if(path.empty()) return;
  const lr=linearRegression(scatterData.map(d=>ensureNumber(d[xVariable],NaN)),scatterData.map(d=>ensureNumber(d[yVariable],NaN)));
  const xMin=d3.min(scatterData,d=>ensureNumber(d[xVariable],0)), xMax=d3.max(scatterData,d=>ensureNumber(d[xVariable],0));
  const lineData=[{x:xMin,y:lr.predict(xMin)},{x:xMax,y:lr.predict(xMax)}];
  path.datum(lineData).attr('d',d3.line().x(d=>newX(d.x)).y(d=>newY(d.y)));
}

// Linear regression
function linearRegression(xArr,yArr){
  const pairs=xArr.map((x,i)=>[+x,+yArr[i]]).filter(([x,y])=>isFinite(x)&&isFinite(y));
  const n=pairs.length; if(n===0)return {predict:()=>0};
  const sumX=d3.sum(pairs,d=>d[0]), sumY=d3.sum(pairs,d=>d[1]), sumXY=d3.sum(pairs,d=>d[0]*d[1]), sumX2=d3.sum(pairs,d=>d[0]*d[0]);
  const slope=(n*sumXY-sumX*sumY)/(n*sumX2-sumX*sumX)||0, intercept=(sumY-slope*sumX)/n||0;
  return {slope,intercept,predict:x=>slope*x+intercept};
}

// -----------------------------
// Correlation stats
function updateCorrelationStats(data,xVar,yVar){
  const valid=data.filter(d=>isFinite(+d[xVar])&&isFinite(+d[yVar]));
  const n=valid.length; if(n===0)return;
  const sumX=d3.sum(valid,d=>+d[xVar]), sumY=d3.sum(valid,d=>+d[yVar]), sumXY=d3.sum(valid,d=>+d[xVar]*+d[yVar]), sumXX=d3.sum(valid,d=>+d[xVar]*+d[xVar]), sumYY=d3.sum(valid,d=>+d[yVar]*+d[yVar]);
  const corr=Math.sqrt((n*sumXX-sumX*sumX)*(n*sumYY-sumY*sumY))===0?0:(n*sumXY-sumX*sumY)/Math.sqrt((n*sumXX-sumX*sumX)*(n*sumYY-sumY*sumY));
  const statsElement=d3.select('#correlation-stats'); if(statsElement.node()) statsElement.html(`<h4>Correlation Statistics</h4><p><strong>Correlation Coefficient:</strong> ${corr.toFixed(3)}</p><p><strong>Data Points:</strong> ${data.length}</p><p><strong>Trend Strength:</strong> ${getTrendStrength(corr)}</p>`);
}

function getTrendStrength(c){const a=Math.abs(c); return a>0.7?"Strong":a>0.4?"Moderate":a>0.2?"Weak":"Very Weak";}

// -----------------------------
// Event listeners
function setupEventListeners(){
  d3.select('#x-axis-select').on('change',function(){xVariable=this.value;createScatterPlot(scatterData);});
  d3.select('#y-axis-select').on('change',function(){yVariable=this.value;createScatterPlot(scatterData);});
  d3.select('#color-select').on('change',function(){colorVariable=this.value;createScatterPlot(scatterData);});
  d3.select('#reset-view').on('click',resetZoomView);
  d3.select('#toggle-trend').on('click',()=>{showTrendLine=!showTrendLine;createScatterPlot(scatterData);});
}

// -----------------------------
// Helper functions
function ensureNumber(v,d=0){const n=+v;return isNaN(n)?d:n;}
function ensureString(v,d='Unknown'){const s=String(v||'').trim();return s||d;}
function getVariableLabel(v){const l={'age':'Age','substance_score':'Substance Score','tobacco_use':'Tobacco Use','alcohol_use':'Alcohol Use','marijuana_use':'Marijuana Use','mental_health_score':'Mental Health Score','gender':'Gender','region':'Region','education_level':'Education Level'}; return l[v]||v;}
