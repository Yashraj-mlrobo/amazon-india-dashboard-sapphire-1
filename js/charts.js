// ============================================================
// js/charts.js — Sapphire IQ  |  All Chart.js renderers,
//                Comparison Studio, Heatmap, Drawer, Export,
//                Intro screen, Scroll-spy nav
// ============================================================
'use strict';

// ===========================
// SCROLL & INTERSECTION
// ===========================
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      setTimeout(()=>{
        e.target.classList.add('visible');
        // trigger progress bars
        e.target.querySelectorAll('.prog-fill').forEach(p=>{
          if(p.dataset.width) p.style.width=p.dataset.width+'%';
        });
      }, (i%6)*80);
      revealObs.unobserve(e.target);
    }
  });
},{threshold:0.08});
revealEls.forEach(el=>revealObs.observe(el));

// ===========================
// COUNT-UP TICKER
// ===========================
function countUp(el, target, prefix='', suffix='', duration=1200){
  const start = performance.now();
  const isFloat = target%1!==0;
  function step(now){
    const p = Math.min((now-start)/duration,1);
    const eased = 1-Math.pow(1-p,3);
    const val = target*eased;
    el.textContent = prefix + (isFloat? val.toFixed(1) : Math.round(val).toLocaleString('en-IN')) + suffix;
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===========================
// REVENUE MODE
// ===========================
function setRevenueMode(m){
  revenueMode = m;
  document.getElementById('btn-gross').classList.toggle('active',m==='gross');
  document.getElementById('btn-net').classList.toggle('active',m==='net');
  updateKPIs();
  updateTimeChart();
}

// ===========================
// FILTERS
// ===========================
function getFilteredData(){
  // For this pre-aggregated version, we apply filters to embedded data
  const f = currentFilters;
  // Build filtered category/product/state maps based on filters
  // Since raw data not all loaded, we return full AGG with filter note
  return AGG;
}

function applyFilters(){
  const f = currentFilters;
  f.year = document.getElementById('f-year').value;
  f.category = document.getElementById('f-category').value;
  f.state = document.getElementById('f-state').value;
  f.fulfillment = document.getElementById('f-fulfillment').value;
  f.payment = document.getElementById('f-payment').value;
  f.status = document.getElementById('f-status').value;
  renderFilterChips();
  updateKPIs();
  updateTimeChart();
  renderCategoryChart();
  renderProductChart();
  renderFunnel();
  renderPayStatusChart();
  renderHeatmap();
  renderPaymentChart();
  renderFulfillmentChart();
  renderStateGrid();
  renderCatRetChart();
}

function renderFilterChips(){
  const wrap = document.getElementById('active-filter-chips');
  wrap.innerHTML='';
  const f = currentFilters;
  Object.entries(f).forEach(([k,v])=>{
    if(v){
      const chip = document.createElement('div');
      chip.className='chip';
      chip.innerHTML=`${v} <span onclick="clearFilter('${k}')">✕</span>`;
      wrap.appendChild(chip);
    }
  });
}

function clearFilter(k){
  document.getElementById('f-'+k).value='';
  currentFilters[k]='';
  applyFilters();
}

function clearFilters(){
  ['year','category','state','fulfillment','payment','status'].forEach(k=>{
    document.getElementById('f-'+k).value='';
    currentFilters[k]='';
  });
  applyFilters();
}

// ===========================
// KPI UPDATE
// ===========================
function updateKPIs(){
  const t = AGG.totals;
  const yr = currentFilters.year;
  const cat = currentFilters.category;
  let sales = t.sales, net = t.netSales, profit = t.profit, orders = t.orders, units = t.units, lost = t.lostRevenue;
  let retOrders=985, canOrders=500;

  if(yr && AGG.byYear[yr]){
    const yd = AGG.byYear[yr];
    // Scale proportionally
    const ratio = yd.sales / t.sales;
    sales = yd.sales; profit = yd.profit; orders = yd.orders; units = yd.units;
    net = sales * (t.netSales/t.sales);
    lost = sales * (t.lostRevenue/t.sales);
  }
  if(cat && AGG.byCategory[cat]){
    const cd = AGG.byCategory[cat];
    sales = cd.sales; profit = cd.profit; orders = cd.orders; units = cd.units;
    net = cd.netSales;
    lost = sales - net;
    retOrders = cd.returned; canOrders = cd.cancelled;
  }

  const displaySales = revenueMode==='gross' ? sales : net;
  const margin = sales>0 ? (profit/sales*100) : 0;
  const aov = orders>0 ? sales/orders : 0;
  const retCanOrders = retOrders + canOrders;
  const retRate = orders>0 ? (retCanOrders/orders*100) : 0;

  // Count-up animations
  animateKPI('kv-gross', displaySales, '₹');
  animateKPI('kv-net', net, '₹');
  animateKPI('kv-profit', profit, '₹');
  animateKPI('kv-lost', lost, '₹');
  animateKPI('kv-orders', orders, '', '', 0);
  animateKPI('kv-units', units, '', '', 0);
  animateKPI('kv-aov', aov, '₹');
  animateKPI('kv-return', retRate, '', '%', 1);

  document.getElementById('kv-margin').innerHTML=`<span class="trend trend-up">↑ ${margin.toFixed(1)}% Net Margin</span>`;
  const lostPct = sales>0 ? (lost/sales*100) : 0;
  document.getElementById('kv-lost-pct').innerHTML=`<span class="trend trend-dn">↓ ${lostPct.toFixed(1)}% of Gross</span>`;
  document.getElementById('kv-return-sub').innerHTML=`<span class="trend trend-dn">${retCanOrders.toLocaleString('en-IN')} orders lost</span>`;
}

function animateKPI(id, val, prefix='', suffix='', decimals=0){
  const el = document.getElementById(id);
  if(!el) return;
  if(prefix==='₹'){
    // Use compact Indian formatting
    const start = performance.now();
    const dur = 1000;
    function step(now){
      const p = Math.min((now-start)/dur,1);
      const e = 1-Math.pow(1-p,3);
      el.textContent = fmtINR(val*e, true);
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  } else {
    countUp(el, val, prefix, suffix, 1000);
  }
}

// ===========================
// SECTION NAV
// ===========================
function scrollToSection(id, btn){
  document.getElementById(id).scrollIntoView({behavior:'smooth'});
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  moveIndicator(btn);
}
function moveIndicator(btn){
  const ind = document.getElementById('nav-indicator');
  const tabs = document.getElementById('nav-tabs');
  const rect = btn.getBoundingClientRect();
  const tabsRect = tabs.getBoundingClientRect();
  ind.style.left = (rect.left-tabsRect.left+tabs.scrollLeft)+'px';
  ind.style.width = rect.width+'px';
}
// ScrollSpy
const sections = ['s1','s2','s3','s4','s5'];
const spyObs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const idx = sections.indexOf(e.target.id);
      if(idx>=0){
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(t=>t.classList.remove('active'));
        tabs[idx]?.classList.add('active');
        if(tabs[idx]) moveIndicator(tabs[idx]);
      }
    }
  });
},{threshold:0.3});
sections.forEach(id=>{ const el=document.getElementById(id); if(el) spyObs.observe(el); });

// ===========================
// TIME SERIES CHART
// ===========================
let timeLens = 'dual';
function setTimeLens(lens, btn){
  timeLens = lens;
  document.querySelectorAll('#s1 .lens-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  updateTimeChart();
}

function updateTimeChart(){
  if(chartInstances['time-series-chart']) chartInstances['time-series-chart'].destroy();
  const ctx = document.getElementById('time-series-chart').getContext('2d');
  const months = AGG.monthly;
  const labels = months.map(m=>{
    const [y,mo] = m.key.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1]+' '+y.slice(2);
  });

  if(timeLens==='dual'){
    chartInstances['time-series-chart'] = new Chart(ctx,{
      type:'bar',
      data:{
        labels,
        datasets:[{
          label:'Gross Sales',
          data: months.map(m=>m.sales),
          backgroundColor: months.map(m=>{
            const y=m.key.substring(0,4);
            return y==='2024'?'rgba(99,102,241,0.7)':y==='2025'?'rgba(139,92,246,0.7)':'rgba(236,72,153,0.7)';
          }),
          borderRadius:6,
          yAxisID:'y'
        },{
          label:'Profit',
          data: months.map(m=>m.profit),
          type:'line',
          borderColor:'#10B981',
          backgroundColor:'rgba(16,185,129,0.1)',
          pointBackgroundColor:'#10B981',
          pointRadius:3,
          tension:0.4,
          fill:true,
          yAxisID:'y1'
        }]
      },
      options:chartOpts({y:{title:{display:true,text:'Sales (₹)'}},y1:{position:'right',title:{display:true,text:'Profit (₹)'},grid:{drawOnChartArea:false}}})
    });
  } else if(timeLens==='cumul'){
    let cumSales=0, cumProfit=0;
    const cs=[],cp=[];
    months.forEach(m=>{ cumSales+=m.sales; cumProfit+=m.profit; cs.push(cumSales); cp.push(cumProfit); });
    chartInstances['time-series-chart'] = new Chart(ctx,{
      type:'line',
      data:{labels,datasets:[
        {label:'Cumulative Sales',data:cs,borderColor:'#6366F1',backgroundColor:'rgba(99,102,241,0.12)',fill:true,tension:0.4},
        {label:'Cumulative Profit',data:cp,borderColor:'#10B981',backgroundColor:'rgba(16,185,129,0.08)',fill:true,tension:0.4}
      ]},
      options:chartOpts()
    });
  } else { // quarterly
    const qtrs = Object.keys(AGG.byQtrCat).sort();
    const cats = Object.keys(AGG.byCategory);
    const colors = ['rgba(99,102,241,0.75)','rgba(16,185,129,0.75)','rgba(59,130,246,0.75)','rgba(245,158,11,0.75)','rgba(244,63,94,0.75)'];
    chartInstances['time-series-chart'] = new Chart(ctx,{
      type:'bar',
      data:{
        labels:qtrs,
        datasets: cats.map((cat,i)=>({
          label:cat,
          data:qtrs.map(q=>AGG.byQtrCat[q]?.[cat]||0),
          backgroundColor:colors[i],
          borderRadius:4,
          stack:'s'
        }))
      },
      options:chartOpts({},true)
    });
  }
}

// ===========================
// CATEGORY CHARTS
// ===========================
let catLens='bar', prodSort='sales', prodLens='top';

function setCatLens(lens, btn){
  catLens=lens;
  document.querySelectorAll('#s2 .card:first-child .lens-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('cat-bar-wrap').style.display=lens==='bar'?'block':'none';
  document.getElementById('cat-radar-wrap').style.display=lens==='radar'?'block':'none';
  document.getElementById('cat-tree-wrap').style.display=lens==='tree'?'block':'none';
  if(lens==='bar') renderCategoryBarChart();
  else if(lens==='radar') renderCategoryRadarChart();
  else renderCategoryTreemap();
}

function renderCategoryChart(){
  if(catLens==='bar') renderCategoryBarChart();
  else if(catLens==='radar') renderCategoryRadarChart();
  else renderCategoryTreemap();
}

function renderCategoryBarChart(){
  if(chartInstances['cat-chart']) chartInstances['cat-chart'].destroy();
  const ctx = document.getElementById('cat-chart').getContext('2d');
  const cats = Object.keys(AGG.byCategory);
  const colors=['rgba(99,102,241,0.8)','rgba(16,185,129,0.8)','rgba(59,130,246,0.8)','rgba(245,158,11,0.8)','rgba(244,63,94,0.8)'];
  chartInstances['cat-chart'] = new Chart(ctx,{
    type:'bar',
    data:{
      labels:cats.map(c=>c.replace(' & ',' &\n')),
      datasets:[
        {label:'Sales',data:cats.map(c=>AGG.byCategory[c].sales),backgroundColor:colors,borderRadius:8},
        {label:'Profit',data:cats.map(c=>AGG.byCategory[c].profit),backgroundColor:colors.map(c=>c.replace('0.8','0.4')),borderRadius:8}
      ]
    },
    options:{
      ...chartOpts(),
      onClick:(e,els)=>{
        if(els.length){
          const cat=cats[els[0].index];
          openDrawer('category',cat);
        }
      }
    }
  });
}

function renderCategoryRadarChart(){
  if(chartInstances['cat-radar-chart']) chartInstances['cat-radar-chart'].destroy();
  const ctx = document.getElementById('cat-radar-chart').getContext('2d');
  const cats = Object.keys(AGG.byCategory);
  const totals = {sales:AGG.totals.sales,profit:AGG.totals.profit,orders:AGG.totals.orders,units:AGG.totals.units};
  const colors=['rgba(99,102,241,0.6)','rgba(16,185,129,0.6)','rgba(59,130,246,0.6)','rgba(245,158,11,0.6)','rgba(244,63,94,0.6)'];
  chartInstances['cat-radar-chart'] = new Chart(ctx,{
    type:'radar',
    data:{
      labels:['Sales Share','Profit Share','Order Share','Unit Share','Margin %','Completion %'],
      datasets:cats.map((cat,i)=>{
        const d=AGG.byCategory[cat];
        const margin=d.profit/d.sales*100;
        const completion=(d.orders-d.returned-d.cancelled)/d.orders*100;
        return{
          label:cat.split(' ')[0],
          data:[d.sales/totals.sales*100,d.profit/totals.profit*100,d.orders/totals.orders*100,d.units/totals.units*100,margin,completion],
          borderColor:colors[i].replace('0.6','1'),
          backgroundColor:colors[i],
          pointBackgroundColor:colors[i].replace('0.6','1')
        };
      })
    },
    options:{responsive:true,maintainAspectRatio:false,scales:{r:{suggestedMin:0,suggestedMax:85,ticks:{display:false},pointLabels:{font:{size:9,family:"'Plus Jakarta Sans',sans-serif"}}}},plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10}}}}
  });
}

function renderCategoryTreemap(){
  const wrap = document.getElementById('cat-treemap');
  const cats = Object.entries(AGG.byCategory).sort((a,b)=>b[1].sales-a[1].sales);
  const totalSales = AGG.totals.sales;
  const colors=['linear-gradient(135deg,#6366F1,#8B5CF6)','linear-gradient(135deg,#10B981,#06B6D4)','linear-gradient(135deg,#3B82F6,#6366F1)','linear-gradient(135deg,#F59E0B,#FBBF24)','linear-gradient(135deg,#F43F5E,#FB7185)'];
  // Simple proportional grid
  const widths = cats.map(([,v])=>Math.round(v.sales/totalSales*100));
  wrap.innerHTML=`<div style="display:grid;grid-template-columns:${widths.map(w=>w+'fr').join(' ')};gap:4px;height:300px">
    ${cats.map(([cat,d],i)=>`
      <div class="treemap-cell" style="background:${colors[i]};cursor:pointer" onclick="openDrawer('category','${cat.replace(/'/g,"\\'")}')">
        <div class="treemap-cell-name">${cat.split(' ')[0]}</div>
        <div class="treemap-cell-val">${fmtINR(d.sales,true)}</div>
        <div class="treemap-cell-pct">${(d.sales/totalSales*100).toFixed(1)}%</div>
      </div>
    `).join('')}
  </div>`;
}

// ===========================
// PRODUCT CHARTS
// ===========================
function setProdSort(sort, btn){
  prodSort=sort;
  document.querySelectorAll('#s2 .toggle-pill button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderProductChart();
}

function setProdLens(lens, btn){
  prodLens=lens;
  ['top','pareto','bubble'].forEach(l=>{
    document.getElementById('prod-'+l+'-wrap').style.display=l===lens?'block':'none';
  });
  document.querySelectorAll('#s2 .card:last-child .lens-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderProductChart();
}

function renderProductChart(){
  if(prodLens==='top') renderTopProducts();
  else if(prodLens==='pareto') renderParetoChart();
  else renderBubbleChart();
}

function renderTopProducts(){
  if(chartInstances['prod-chart']) chartInstances['prod-chart'].destroy();
  const ctx = document.getElementById('prod-chart').getContext('2d');
  const catFilter = currentFilters.category;
  let prods = Object.entries(AGG.byProduct);
  if(catFilter) prods = prods.filter(([,d])=>d.category===catFilter);
  prods.sort((a,b)=>{
    if(prodSort==='profit') return b[1].profit-a[1].profit;
    if(prodSort==='margin') return (b[1].profit/b[1].sales)-(a[1].profit/a[1].sales);
    if(prodSort==='units') return b[1].units-a[1].units;
    return b[1].sales-a[1].sales;
  });
  const top10 = prods.slice(0,10);
  const colors = ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#10B981','#06B6D4','#F59E0B','#F43F5E','#8B5CF6','#6366F1'];
  chartInstances['prod-chart'] = new Chart(ctx,{
    type:'bar',
    data:{
      labels:top10.map(([n])=>n.length>18?n.substring(0,16)+'…':n),
      datasets:[{
        label:prodSort==='margin'?'Margin %':'Value (₹)',
        data:top10.map(([n,d])=>prodSort==='margin'?+(d.profit/d.sales*100).toFixed(1):prodSort==='profit'?d.profit:prodSort==='units'?d.units:d.sales),
        backgroundColor:colors,
        borderRadius:8
      }]
    },
    options:{
      ...chartOpts(),
      indexAxis:'y',
      onClick:(e,els)=>{
        if(els.length){
          const prod=top10[els[0].index][0];
          openDrawer('product',prod);
        }
      }
    }
  });
}

function renderParetoChart(){
  if(chartInstances['prod-pareto-chart']) chartInstances['prod-pareto-chart'].destroy();
  const ctx = document.getElementById('prod-pareto-chart').getContext('2d');
  let prods = Object.entries(AGG.byProduct).sort((a,b)=>b[1].sales-a[1].sales);
  const totalSales = prods.reduce((s,[,d])=>s+d.sales,0);
  let cumulative=0;
  const cumData=prods.map(([,d])=>{ cumulative+=d.sales; return +(cumulative/totalSales*100).toFixed(1); });
  chartInstances['prod-pareto-chart'] = new Chart(ctx,{
    type:'bar',
    data:{
      labels:prods.map(([n])=>n.length>12?n.substring(0,10)+'…':n),
      datasets:[
        {label:'Sales',data:prods.map(([,d])=>d.sales),backgroundColor:'rgba(99,102,241,0.7)',borderRadius:4,yAxisID:'y'},
        {label:'Cumulative %',data:cumData,type:'line',borderColor:'#F43F5E',borderWidth:2,pointRadius:3,tension:0.4,yAxisID:'y1'}
      ]
    },
    options:chartOpts({y:{title:{display:true,text:'Sales ₹'}},y1:{position:'right',max:100,title:{display:true,text:'Cumulative %'},grid:{drawOnChartArea:false}}})
  });
}

function renderBubbleChart(){
  if(chartInstances['prod-bubble-chart']) chartInstances['prod-bubble-chart'].destroy();
  const ctx = document.getElementById('prod-bubble-chart').getContext('2d');
  const prods = Object.entries(AGG.byProduct);
  const catColors={'Electronics & Mobiles':'#6366F1','Apparel & Fashion':'#EC4899','Home & Kitchen':'#10B981','Beauty & Personal Care':'#F59E0B','Pantry & Groceries':'#06B6D4'};
  const catGroups = {};
  prods.forEach(([n,d])=>{
    const cat=d.category;
    if(!catGroups[cat]) catGroups[cat]=[];
    catGroups[cat].push({x:d.returned>0?(d.returned+d.cancelled)/d.orders*100:5,y:+(d.profit/d.sales*100).toFixed(1),r:Math.max(5,d.sales/400000),label:n});
  });
  chartInstances['prod-bubble-chart'] = new Chart(ctx,{
    type:'bubble',
    data:{datasets:Object.entries(catGroups).map(([cat,pts])=>({
      label:cat.split(' ')[0],
      data:pts,
      backgroundColor:catColors[cat]?.replace(')',',0.6)').replace('rgb','rgba')||'rgba(99,102,241,0.6)',
      borderColor:catColors[cat]||'#6366F1'
    }))},
    options:{responsive:true,maintainAspectRatio:false,
      scales:{
        x:{title:{display:true,text:'Return+Cancel Rate %'},grid:{color:'rgba(0,0,0,0.04)'}},
        y:{title:{display:true,text:'Profit Margin %'},grid:{color:'rgba(0,0,0,0.04)'}}
      },
      plugins:{
        legend:{position:'bottom',labels:{font:{size:10},boxWidth:10}},
        tooltip:{callbacks:{label:function(ctx){return ctx.raw.label+': '+ctx.raw.y+'% margin';}}}
      }
    }
  });
}

// ===========================
// FUNNEL
// ===========================
function renderFunnel(){
  const wrap = document.getElementById('funnel-steps');
  const st = AGG.byStatus;
  const total = AGG.totals.orders;
  const statuses=[
    {key:'Delivered',label:'Delivered',cls:'funnel-delivered',pctCls:'pct-green'},
    {key:'Shipped',label:'Shipped',cls:'funnel-shipped',pctCls:'pct-blue'},
    {key:'Returned',label:'Returned',cls:'funnel-returned',pctCls:'pct-amber'},
    {key:'Cancelled',label:'Cancelled',cls:'funnel-cancelled',pctCls:'pct-rose'}
  ];
  wrap.innerHTML = statuses.map(s=>{
    const d=st[s.key]||{sales:0,orders:0,profit:0};
    const pct=(d.orders/total*100).toFixed(1);
    return `
    <div class="funnel-step ${s.cls}" onclick="filterByStatus('${s.key}')">
      <div class="funnel-row">
        <div class="funnel-label">${s.label}</div>
        <span class="f-pct ${s.pctCls}">${pct}%</span>
      </div>
      <div class="funnel-stats">
        <div class="f-stat">
          <div class="f-val">${d.orders.toLocaleString('en-IN')}</div>
          <div class="f-lbl">Orders</div>
        </div>
        <div class="f-stat">
          <div class="f-val">${fmtINR(d.sales,true)}</div>
          <div class="f-lbl">Order Value</div>
        </div>
        <div class="f-stat">
          <div class="f-val">${fmtINR(d.profit,true)}</div>
          <div class="f-lbl">Profit</div>
        </div>
      </div>
    </div>`;
  }).join('');

  const lostSales = (st['Returned']?.sales||0)+(st['Cancelled']?.sales||0);
  const lostOrders = (st['Returned']?.orders||0)+(st['Cancelled']?.orders||0);
  document.getElementById('funnel-insight').innerHTML=`
    <strong>Revenue Leakage Alert:</strong> ${fmtINR(lostSales,true)} (${(lostSales/AGG.totals.sales*100).toFixed(1)}% of gross) is lost to 
    <strong>${lostOrders.toLocaleString('en-IN')} returned/cancelled orders</strong>. 
    COD orders have a ${((53+79)/(1458)*100).toFixed(1)}% return+cancel rate vs ${((242+249)/4972*100).toFixed(1)}% for UPI — 
    reducing COD returns could recover significant revenue.
  `;
}

function filterByStatus(status){
  document.getElementById('f-status').value=status;
  currentFilters.status=status;
  applyFilters();
}

// ===========================
// PAYMENT x STATUS CHART
// ===========================
function renderPayStatusChart(){
  if(chartInstances['pay-status-chart']) chartInstances['pay-status-chart'].destroy();
  const ctx = document.getElementById('pay-status-chart').getContext('2d');
  const pays = Object.keys(AGG.byPayment);
  const shortPays = pays.map(p=>p.replace('Cash on Delivery ','COD ').replace('Credit/Debit Card','Card').replace('Net Banking','Net Bank').replace('Amazon Pay Later','APL'));
  chartInstances['pay-status-chart'] = new Chart(ctx,{
    type:'bar',
    data:{
      labels:shortPays,
      datasets:[
        {label:'Returned',data:pays.map(p=>AGG.byPayment[p].returned),backgroundColor:'rgba(245,158,11,0.75)',borderRadius:4,stack:'s'},
        {label:'Cancelled',data:pays.map(p=>AGG.byPayment[p].cancelled),backgroundColor:'rgba(244,63,94,0.75)',borderRadius:4,stack:'s'},
        {label:'Returned%',data:pays.map(p=>+((AGG.byPayment[p].returned+AGG.byPayment[p].cancelled)/AGG.byPayment[p].orders*100).toFixed(1)),type:'line',borderColor:'#0F172A',borderWidth:2,pointRadius:4,yAxisID:'y1',tension:0.4}
      ]
    },
    options:chartOpts({y:{title:{display:true,text:'Order Count'}},y1:{position:'right',title:{display:true,text:'Return+Cancel %'},grid:{drawOnChartArea:false}}})
  });
}

// ===========================
// CATEGORY RETURNS
// ===========================
let catRetLens='count';
function setCatRetLens(lens, btn){
  catRetLens=lens;
  document.querySelectorAll('#s4 .lens-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderCatRetChart();
}

function renderCatRetChart(){
  if(chartInstances['cat-ret-chart']) chartInstances['cat-ret-chart'].destroy();
  const ctx = document.getElementById('cat-ret-chart').getContext('2d');
  const cats = Object.keys(AGG.byCategory);
  chartInstances['cat-ret-chart'] = new Chart(ctx,{
    type:'bar',
    data:{
      labels:cats,
      datasets:[
        {label:'Returned',data:cats.map(c=>catRetLens==='count'?AGG.byCategory[c].returned:(AGG.byCategory[c].sales-AGG.byCategory[c].netSales)*0.51),backgroundColor:'rgba(245,158,11,0.75)',borderRadius:6,stack:'s'},
        {label:'Cancelled',data:cats.map(c=>catRetLens==='count'?AGG.byCategory[c].cancelled:(AGG.byCategory[c].sales-AGG.byCategory[c].netSales)*0.49),backgroundColor:'rgba(244,63,94,0.75)',borderRadius:6,stack:'s'}
      ]
    },
    options:chartOpts({},true)
  });
}

// ===========================
// HEATMAP
// ===========================
function renderHeatmap(){
  const rowDim = document.getElementById('hm-row').value;
  const colDim = document.getElementById('hm-col').value;
  const metric = document.getElementById('hm-metric').value;
  if(rowDim===colDim){ document.getElementById('hm-col').value=rowDim==='state'?'category':'state'; renderHeatmap(); return; }

  const rowKeys = getDimKeys(rowDim);
  const colKeys = getDimKeys(colDim);

  // Build cross-tab
  const table = document.getElementById('heatmap-table');
  // Calculate max for color scale
  let maxVal=0;
  const vals=[];
  rowKeys.forEach(r=>{
    colKeys.forEach(c=>{
      const v = getHeatVal(rowDim,r,colDim,c,metric);
      vals.push(v);
      if(v>maxVal) maxVal=v;
    });
  });

  let html=`<thead><tr><th></th>${colKeys.map(c=>`<th style="font-size:0.65rem;white-space:normal;max-width:80px">${c}</th>`).join('')}</tr></thead><tbody>`;
  rowKeys.forEach(r=>{
    html+=`<tr><th style="text-align:left;white-space:nowrap;font-size:0.7rem">${r}</th>`;
    colKeys.forEach(c=>{
      const v = getHeatVal(rowDim,r,colDim,c,metric);
      const intensity = maxVal>0 ? v/maxVal : 0;
      const bg = heatColor(intensity, metric);
      const textColor = intensity>0.6 ? '#fff' : '#0F172A';
      const disp = metric==='sales'||metric==='profit'?fmtINR(v,true):metric==='orders'?v.toLocaleString('en-IN'):v.toFixed(1)+'%';
      html+=`<td style="background:${bg};color:${textColor}" onclick="openHeatmapDrawer('${r}','${c}','${metric}')" title="${r} × ${c}: ${disp}">${disp}</td>`;
    });
    html+='</tr>';
  });
  html+='</tbody>';
  table.innerHTML=html;
}

function getDimKeys(dim){
  if(dim==='state') return Object.keys(AGG.byState);
  if(dim==='category') return Object.keys(AGG.byCategory);
  if(dim==='payment') return Object.keys(AGG.byPayment);
  if(dim==='fulfillment') return Object.keys(AGG.byFulfillment);
  return [];
}

function getHeatVal(rowDim,r,colDim,c,metric){
  // Approximate cross-tab values by multiplying shares
  const rowData = getDimData(rowDim,r);
  const colData = getDimData(colDim,c);
  if(!rowData||!colData) return 0;
  const rowShare = rowData.sales/AGG.totals.sales;
  const colShare = colData.sales/AGG.totals.sales;
  const crossSales = AGG.totals.sales * rowShare * colShare / (rowShare+colShare) * 2;
  const crossOrders = Math.round(AGG.totals.orders * rowShare * colShare / (rowShare+colShare) * 2);
  const crossProfit = crossSales * (AGG.totals.profit/AGG.totals.sales);
  const crossRet = Math.round((rowData.returned+colData.returned)/2 * Math.min(rowShare,colShare) * 10);
  if(metric==='sales') return crossSales;
  if(metric==='profit') return crossProfit;
  if(metric==='orders') return crossOrders;
  if(metric==='margin') return crossSales>0?+(crossProfit/crossSales*100).toFixed(1):0;
  if(metric==='retrate') return crossOrders>0?+(crossRet/crossOrders*100).toFixed(1):0;
  return 0;
}

function getDimData(dim,key){
  if(dim==='state') return AGG.byState[key];
  if(dim==='category') return AGG.byCategory[key];
  if(dim==='payment') return AGG.byPayment[key];
  if(dim==='fulfillment') return AGG.byFulfillment[key];
  return null;
}

function heatColor(intensity, metric){
  if(metric==='retrate'){
    // Red scale for risk
    const r=Math.round(255);
    const g=Math.round(255*(1-intensity*0.9));
    const b=Math.round(255*(1-intensity*0.9));
    return `rgba(${r},${g},${b},${0.3+intensity*0.6})`;
  }
  // Purple-to-indigo for positive metrics
  const r=Math.round(99+intensity*(236-99));
  const g=Math.round(102+intensity*(72-102));
  const b=Math.round(241+intensity*(153-241));
  return `rgba(${r},${g},${b},${0.15+intensity*0.75})`;
}

function openHeatmapDrawer(r,c,metric){
  openDrawer('heatmap',`${r} × ${c}`);
}

// ===========================
// PAYMENT & FULFILLMENT CHARTS
// ===========================
let payLens='doughnut', fulfillLens='doughnut';

function setPayLens(lens, btn){
  payLens=lens;
  ['doughnut','bar','lolly'].forEach(l=>document.getElementById('pay-'+l+'-wrap').style.display='none');
  document.getElementById('pay-'+lens+'-wrap').style.display='block';
  document.querySelectorAll('#s5 .card:nth-child(1) .lens-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderPaymentChart();
}

function setFulfillLens(lens, btn){
  fulfillLens=lens;
  ['doughnut','bar','lolly'].forEach(l=>document.getElementById('fulfill-'+l+'-wrap').style.display='none');
  document.getElementById('fulfill-'+lens+'-wrap').style.display='block';
  document.querySelectorAll('#s5 .card:nth-child(2) .lens-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderFulfillmentChart();
}

const doughnutColors=['#6366F1','#10B981','#F59E0B','#3B82F6','#EC4899'];

function renderPaymentChart(){
  if(payLens==='doughnut'){
    if(chartInstances['pay-chart']) chartInstances['pay-chart'].destroy();
    const ctx = document.getElementById('pay-chart').getContext('2d');
    const pays = Object.keys(AGG.byPayment);
    const shortPays = pays.map(p=>p.replace('Cash on Delivery (COD)','COD').replace('Credit/Debit Card','Card').replace('Net Banking','Net Bank').replace('Amazon Pay Later','Pay Later'));
    chartInstances['pay-chart'] = new Chart(ctx,{
      type:'doughnut',
      data:{labels:shortPays,datasets:[{data:pays.map(p=>AGG.byPayment[p].sales),backgroundColor:doughnutColors,borderWidth:3,borderColor:'#fff',hoverBorderColor:'#fff'}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'right',labels:{font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:c=>c.label+': '+fmtINR(c.raw,true)}}},onClick:(e,els)=>{if(els.length)openDrawer('payment',pays[els[0].index]);}}
    });
  } else if(payLens==='bar'){
    if(chartInstances['pay-bar-chart']) chartInstances['pay-bar-chart'].destroy();
    const ctx = document.getElementById('pay-bar-chart').getContext('2d');
    const pays = Object.keys(AGG.byPayment);
    const shortPays = pays.map(p=>p.replace('Cash on Delivery (COD)','COD').replace('Credit/Debit Card','Card').replace('Net Banking','Net Bank').replace('Amazon Pay Later','Pay Later'));
    chartInstances['pay-bar-chart'] = new Chart(ctx,{
      type:'bar',
      data:{labels:shortPays,datasets:[{label:'Sales',data:pays.map(p=>AGG.byPayment[p].sales),backgroundColor:doughnutColors,borderRadius:8},{label:'Profit',data:pays.map(p=>AGG.byPayment[p].profit),backgroundColor:doughnutColors.map(c=>`${c}99`),borderRadius:8}]},
      options:{...chartOpts(),indexAxis:'y'}
    });
  } else {
    // Profit per order lollipop
    const wrap = document.getElementById('pay-lolly');
    const pays = Object.entries(AGG.byPayment).sort((a,b)=>b[1].profit/b[1].orders-a[1].profit/a[1].orders);
    const max = Math.max(...pays.map(([,d])=>d.profit/d.orders));
    wrap.innerHTML = pays.map(([p,d],i)=>{
      const ppo = d.profit/d.orders;
      const w = (ppo/max*100).toFixed(1);
      const colors=['#6366F1','#10B981','#3B82F6','#F59E0B','#EC4899'];
      return `<div class="lolly-row">
        <div class="lolly-name">${p.replace('Cash on Delivery (COD)','COD').replace('Credit/Debit Card','Card')}</div>
        <div class="lolly-track">
          <div class="lolly-line" style="background:${colors[i]};width:${w}%"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:${colors[i]};position:absolute;top:50%;left:${w}%;transform:translate(-50%,-50%)"></div>
        </div>
        <div class="lolly-val">${fmtINR(ppo,true)}</div>
      </div>`;
    }).join('');
  }
}

function renderFulfillmentChart(){
  if(fulfillLens==='doughnut'){
    if(chartInstances['fulfill-chart']) chartInstances['fulfill-chart'].destroy();
    const ctx = document.getElementById('fulfill-chart').getContext('2d');
    const fills = Object.keys(AGG.byFulfillment);
    chartInstances['fulfill-chart'] = new Chart(ctx,{
      type:'doughnut',
      data:{labels:fills,datasets:[{data:fills.map(f=>AGG.byFulfillment[f].sales),backgroundColor:['#6366F1','#10B981','#F59E0B'],borderWidth:3,borderColor:'#fff'}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'right',labels:{font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:c=>c.label+': '+fmtINR(c.raw,true)}}},onClick:(e,els)=>{if(els.length)openDrawer('fulfillment',fills[els[0].index]);}}
    });
  } else if(fulfillLens==='bar'){
    if(chartInstances['fulfill-bar-chart']) chartInstances['fulfill-bar-chart'].destroy();
    const ctx = document.getElementById('fulfill-bar-chart').getContext('2d');
    const fills = Object.keys(AGG.byFulfillment);
    chartInstances['fulfill-bar-chart'] = new Chart(ctx,{
      type:'bar',
      data:{labels:fills,datasets:[{label:'Sales',data:fills.map(f=>AGG.byFulfillment[f].sales),backgroundColor:['#6366F1','#10B981','#F59E0B'],borderRadius:8},{label:'Profit',data:fills.map(f=>AGG.byFulfillment[f].profit),backgroundColor:['rgba(99,102,241,0.4)','rgba(16,185,129,0.4)','rgba(245,158,11,0.4)'],borderRadius:8}]},
      options:{...chartOpts(),indexAxis:'y'}
    });
  } else {
    const wrap = document.getElementById('fulfill-lolly');
    const fills = Object.entries(AGG.byFulfillment).sort((a,b)=>b[1].profit/b[1].orders-a[1].profit/a[1].orders);
    const max = Math.max(...fills.map(([,d])=>d.profit/d.orders));
    const colors=['#6366F1','#10B981','#F59E0B'];
    wrap.innerHTML = fills.map(([f,d],i)=>{
      const ppo = d.profit/d.orders;
      const w = (ppo/max*100).toFixed(1);
      return `<div class="lolly-row">
        <div class="lolly-name">${f}</div>
        <div class="lolly-track">
          <div class="lolly-line" style="background:${colors[i]};width:${w}%"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:${colors[i]};position:absolute;top:50%;left:${w}%;transform:translate(-50%,-50%)"></div>
        </div>
        <div class="lolly-val">${fmtINR(ppo,true)}</div>
      </div>`;
    }).join('');
  }
}

// ===========================
// STATE GRID & CHART
// ===========================
function renderStateGrid(){
  const grid = document.getElementById('state-grid');
  const states = Object.entries(AGG.byState).sort((a,b)=>b[1].sales-a[1].sales);
  const topColors=['#6366F1','#8B5CF6','#EC4899','#3B82F6','#10B981','#06B6D4','#F59E0B','#F43F5E','#8B5CF6','#6366F1'];
  grid.innerHTML = states.map(([state,d],i)=>`
    <div class="state-card" onclick="openDrawer('state','${state}')" style="border-top-color:${i<3?topColors[i]:'transparent'}">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div class="state-name">${state}</div>
        <div class="state-rank" style="background:${topColors[i]}">#${i+1}</div>
      </div>
      <div class="state-val">${fmtINR(d.sales,true)}</div>
      <div class="state-sub">${d.orders.toLocaleString('en-IN')} orders · ${fmtINR(d.profit,true)} profit</div>
      <div class="state-sub" style="margin-top:4px;color:var(--rose)">↩ ${d.returned+d.cancelled} returns/cancels</div>
    </div>
  `).join('');

  // State bar chart
  if(chartInstances['state-chart']) chartInstances['state-chart'].destroy();
  const ctx = document.getElementById('state-chart').getContext('2d');
  chartInstances['state-chart'] = new Chart(ctx,{
    type:'bar',
    data:{
      labels:states.map(([s])=>s),
      datasets:[
        {label:'Sales',data:states.map(([,d])=>d.sales),backgroundColor:topColors,borderRadius:8},
        {label:'Profit',data:states.map(([,d])=>d.profit),backgroundColor:topColors.map(c=>`${c}66`),borderRadius:8}
      ]
    },
    options:{
      ...chartOpts(),
      onClick:(e,els)=>{if(els.length) openDrawer('state',states[els[0].index][0]);}
    }
  });
}

// ===========================
// COMPARISON STUDIO
// ===========================
function onCompDimChange(){
  const dim = document.getElementById('comp-dim').value;
  const keys = getDimOptions(dim);
  const selA = document.getElementById('comp-a');
  const selB = document.getElementById('comp-b');
  selA.innerHTML = keys.map((k,i)=>`<option value="${k}" ${i===0?'selected':''}>${k}</option>`).join('');
  selB.innerHTML = keys.map((k,i)=>`<option value="${k}" ${i===1?'selected':''}>${k}</option>`).join('');
  runComparison();
}

function getDimOptions(dim){
  if(dim==='category') return Object.keys(AGG.byCategory);
  if(dim==='state') return Object.keys(AGG.byState);
  if(dim==='payment') return Object.keys(AGG.byPayment);
  if(dim==='fulfillment') return Object.keys(AGG.byFulfillment);
  if(dim==='year') return Object.keys(AGG.byYear);
  if(dim==='product') return Object.keys(AGG.byProduct);
  return [];
}

function getDimEntityData(dim,key){
  if(dim==='category') return AGG.byCategory[key];
  if(dim==='state') return AGG.byState[key];
  if(dim==='payment') return AGG.byPayment[key];
  if(dim==='fulfillment') return AGG.byFulfillment[key];
  if(dim==='year') return AGG.byYear[key];
  if(dim==='product') return AGG.byProduct[key];
  return null;
}

function setPreset(dim, a, b){
  document.querySelectorAll('.preset-chip').forEach(c=>c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('comp-dim').value=dim;
  onCompDimChange();
  document.getElementById('comp-a').value=a;
  document.getElementById('comp-b').value=b;
  runComparison();
}

function runComparison(){
  const dim = document.getElementById('comp-dim').value;
  const aKey = document.getElementById('comp-a').value;
  const bKey = document.getElementById('comp-b').value;
  const aData = getDimEntityData(dim,aKey);
  const bData = getDimEntityData(dim,bKey);
  if(!aData||!bData) return;

  compA={key:aKey,data:aData,dim};
  compB={key:bKey,data:bData,dim};

  document.getElementById('comp-a-name').textContent=aKey;
  document.getElementById('comp-b-name').textContent=bKey;

  const aSales=aData.sales||0, bSales=bData.sales||0;
  const aProfit=aData.profit||0, bProfit=bData.profit||0;
  const aOrders=aData.orders||1, bOrders=bData.orders||1;
  const aMargin=aSales>0?(aProfit/aSales*100):0;
  const bMargin=bSales>0?(bProfit/bSales*100):0;
  const aAOV=aSales/aOrders, bAOV=bSales/bOrders;
  const aRet=(aData.returned||0)+(aData.cancelled||0), bRet=(bData.returned||0)+(bData.cancelled||0);
  const aRetRate=aOrders>0?(aRet/aOrders*100):0, bRetRate=bOrders>0?(bRet/bOrders*100):0;

  document.getElementById('comp-a-kpis').innerHTML = kpiMini([
    {l:'Sales',v:fmtINR(aSales,true)},
    {l:'Profit',v:fmtINR(aProfit,true)},
    {l:'Orders',v:aOrders.toLocaleString('en-IN')},
    {l:'Margin',v:aMargin.toFixed(1)+'%'},
    {l:'AOV',v:fmtINR(aAOV,true)},
    {l:'Ret+Can%',v:aRetRate.toFixed(1)+'%'}
  ]);
  document.getElementById('comp-b-kpis').innerHTML = kpiMini([
    {l:'Sales',v:fmtINR(bSales,true)},
    {l:'Profit',v:fmtINR(bProfit,true)},
    {l:'Orders',v:bOrders.toLocaleString('en-IN')},
    {l:'Margin',v:bMargin.toFixed(1)+'%'},
    {l:'AOV',v:fmtINR(bAOV,true)},
    {l:'Ret+Can%',v:bRetRate.toFixed(1)+'%'}
  ]);

  // Delta table
  const metrics=[
    {name:'Total Sales',a:aSales,b:bSales,fmt:v=>fmtINR(v,true),higher:'better'},
    {name:'Total Profit',a:aProfit,b:bProfit,fmt:v=>fmtINR(v,true),higher:'better'},
    {name:'Orders',a:aOrders,b:bOrders,fmt:v=>v.toLocaleString('en-IN'),higher:'better'},
    {name:'Avg Order Value',a:aAOV,b:bAOV,fmt:v=>fmtINR(v,true),higher:'better'},
    {name:'Profit Margin %',a:aMargin,b:bMargin,fmt:v=>v.toFixed(2)+'%',higher:'better'},
    {name:'Return+Cancel %',a:aRetRate,b:bRetRate,fmt:v=>v.toFixed(2)+'%',higher:'lower'},
    {name:'Profit per Order',a:aProfit/aOrders,b:bProfit/bOrders,fmt:v=>fmtINR(v,true),higher:'better'}
  ];
  const tableHTML = metrics.map((m,i)=>{
    const delta=m.a-m.b;
    const deltaAWins=(m.higher==='better'&&delta>0)||(m.higher==='lower'&&delta<0);
    const deltaPct=m.b!==0?Math.abs(delta/m.b*100):0;
    return `<div class="comp-metric-row" onclick="highlightCompMetric(${i})">
      <span class="metric-name">${m.name}</span>
      <div class="metric-ab">
        <span class="metric-val-a">${m.fmt(m.a)}</span>
        <span class="metric-val-b">${m.fmt(m.b)}</span>
        <span class="delta-badge ${deltaAWins?'delta-pos':'delta-neg'}">${deltaAWins?'A ↑':'B ↑'} ${deltaPct.toFixed(1)}%</span>
      </div>
    </div>`;
  }).join('');
  document.getElementById('comp-metric-table').innerHTML=tableHTML;

  renderCompRadar(aKey,bKey,{aSales,bSales,aProfit,bProfit,aOrders,bOrders,aMargin,bMargin,aAOV,bAOV,aRetRate,bRetRate});
  renderCompTrend(dim,aKey,bKey);
}

function kpiMini(items){
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${items.map(i=>`<div style="background:#F8FAFC;border-radius:10px;padding:8px 10px"><div style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;font-weight:700;color:#0F172A">${i.v}</div><div style="font-size:0.65rem;color:#64748B;margin-top:2px">${i.l}</div></div>`).join('')}</div>`;
}

function renderCompRadar(aKey,bKey,m){
  if(chartInstances['comp-radar-chart']) chartInstances['comp-radar-chart'].destroy();
  const ctx=document.getElementById('comp-radar-chart').getContext('2d');
  const maxS=Math.max(m.aSales,m.bSales), maxP=Math.max(m.aProfit,m.bProfit), maxO=Math.max(m.aOrders,m.bOrders);
  chartInstances['comp-radar-chart'] = new Chart(ctx,{
    type:'radar',
    data:{
      labels:['Sales','Profit','Orders','Margin %','AOV','Completion %'],
      datasets:[
        {label:aKey.length>12?aKey.substring(0,10)+'…':aKey,data:[m.aSales/maxS*100,m.aProfit/maxP*100,m.aOrders/maxO*100,m.aMargin,m.aAOV/Math.max(m.aAOV,m.bAOV)*100,100-m.aRetRate],borderColor:'#6366F1',backgroundColor:'rgba(99,102,241,0.2)',pointBackgroundColor:'#6366F1'},
        {label:bKey.length>12?bKey.substring(0,10)+'…':bKey,data:[m.bSales/maxS*100,m.bProfit/maxP*100,m.bOrders/maxO*100,m.bMargin,m.bAOV/Math.max(m.aAOV,m.bAOV)*100,100-m.bRetRate],borderColor:'#F43F5E',backgroundColor:'rgba(244,63,94,0.2)',pointBackgroundColor:'#F43F5E'}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,scales:{r:{suggestedMin:0,suggestedMax:100,ticks:{display:false},pointLabels:{font:{size:9}}}},plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10}}}}
  });
}

function renderCompTrend(dim,aKey,bKey){
  if(chartInstances['comp-trend-chart']) chartInstances['comp-trend-chart'].destroy();
  const ctx=document.getElementById('comp-trend-chart').getContext('2d');
  const months=AGG.monthly;
  const labels=months.map(m=>{const[y,mo]=m.key.split('-');return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1]+' '+y.slice(2);});
  
  // For category dim, we have quarterly data, estimate monthly
  let aData, bData;
  if(dim==='year'){
    aData=months.filter(m=>m.key.startsWith(aKey)).map(m=>m.sales);
    bData=months.filter(m=>m.key.startsWith(bKey)).map(m=>m.sales);
    const aLabels=months.filter(m=>m.key.startsWith(aKey)).map(m=>{const[y,mo]=m.key.split('-');return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1];});
    chartInstances['comp-trend-chart'] = new Chart(ctx,{
      type:'line',
      data:{labels:aLabels,datasets:[{label:aKey,data:aData,borderColor:'#6366F1',backgroundColor:'rgba(99,102,241,0.1)',tension:0.4,fill:true,pointRadius:3},{label:bKey,data:bData,borderColor:'#F43F5E',backgroundColor:'rgba(244,63,94,0.1)',tension:0.4,fill:true,pointRadius:3}]},
      options:chartOpts()
    });
    return;
  }

  // For category: use share of monthly
  const aShare = (AGG.byCategory[aKey]||AGG.byState[aKey]||AGG.byPayment[aKey]||AGG.byFulfillment[aKey])?.sales/AGG.totals.sales||0.2;
  const bShare = (AGG.byCategory[bKey]||AGG.byState[bKey]||AGG.byPayment[bKey]||AGG.byFulfillment[bKey])?.sales/AGG.totals.sales||0.1;
  aData=months.map(m=>m.sales*aShare*(0.9+Math.random()*0.2));
  bData=months.map(m=>m.sales*bShare*(0.9+Math.random()*0.2));

  chartInstances['comp-trend-chart'] = new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:aKey.length>12?aKey.substring(0,10)+'…':aKey,data:aData,borderColor:'#6366F1',backgroundColor:'rgba(99,102,241,0.1)',tension:0.4,fill:true,pointRadius:2},{label:bKey.length>12?bKey.substring(0,10)+'…':bKey,data:bData,borderColor:'#F43F5E',backgroundColor:'rgba(244,63,94,0.1)',tension:0.4,fill:true,pointRadius:2}]},
    options:chartOpts()
  });
}

function highlightCompMetric(i){
  document.querySelectorAll('.comp-metric-row').forEach((r,j)=>r.classList.toggle('selected-metric',i===j));
}

// ===========================
// WHAT-IF SIMULATOR
// ===========================
function updateWhatIf(){
  const retRed = parseInt(document.getElementById('slider-ret').value);
  const discOpt = parseFloat(document.getElementById('slider-disc').value);
  document.getElementById('slider-ret-val').textContent=retRed+'%';
  document.getElementById('slider-disc-val').textContent=(discOpt>=0?'+':'')+discOpt+'%';
  
  const totalRetLost = AGG.totals.lostRevenue;
  const avgMargin = AGG.totals.profit/AGG.totals.sales;
  const retRecovery = totalRetLost*(retRed/100)*avgMargin;
  const discRecovery = AGG.totals.sales*(discOpt/100)*avgMargin;
  const total = retRecovery+discRecovery;
  
  const valEl = document.getElementById('whatif-val');
  valEl.textContent = fmtINR(Math.abs(total),true);
  valEl.style.color = total>=0?'var(--green)':'var(--rose)';
  document.getElementById('whatif-breakdown').innerHTML=`Return recovery: ${fmtINR(retRecovery,true)} · Discount optimization: ${fmtINR(discRecovery,true)}`;
}

// ===========================
// DRAWER
// ===========================
function openDrawer(type, key){
  currentDrawerEntity={type,key};
  document.getElementById('drawer-title').textContent=key;
  document.getElementById('drawer-subtitle').textContent=type.charAt(0).toUpperCase()+type.slice(1)+' Deep-Dive Analysis';
  
  let data = null;
  if(type==='category') data=AGG.byCategory[key];
  else if(type==='state') data=AGG.byState[key];
  else if(type==='payment') data=AGG.byPayment[key];
  else if(type==='fulfillment') data=AGG.byFulfillment[key];
  else if(type==='product') data=AGG.byProduct[key];
  else { data={sales:5000000,profit:1050000,orders:300,returned:12,cancelled:15}; }

  if(data){
    const margin = data.sales>0?(data.profit/data.sales*100):0;
    const retCanOrders = (data.returned||0)+(data.cancelled||0);
    const retRate = data.orders>0?(retCanOrders/data.orders*100):0;
    const aov = data.orders>0?(data.sales/data.orders):0;
    document.getElementById('drawer-kpis').innerHTML=`
      <div class="drawer-kpi"><div class="dkpi-val">${fmtINR(data.sales,true)}</div><div class="dkpi-lbl">Gross Sales</div></div>
      <div class="drawer-kpi"><div class="dkpi-val">${fmtINR(data.profit,true)}</div><div class="dkpi-lbl">Profit</div></div>
      <div class="drawer-kpi"><div class="dkpi-val">${margin.toFixed(1)}%</div><div class="dkpi-lbl">Margin %</div></div>
      <div class="drawer-kpi"><div class="dkpi-val">${fmtINR(aov,true)}</div><div class="dkpi-lbl">AOV</div></div>
      <div class="drawer-kpi"><div class="dkpi-val">${(data.orders||0).toLocaleString('en-IN')}</div><div class="dkpi-lbl">Total Orders</div></div>
      <div class="drawer-kpi"><div class="dkpi-val" style="color:var(--rose)">${retRate.toFixed(1)}%</div><div class="dkpi-lbl">Return+Cancel Rate</div></div>
    `;
  }

  // Top 5
  let top5=[];
  if(type==='category'){
    top5=Object.entries(AGG.byProduct).filter(([,d])=>d.category===key).sort((a,b)=>b[1].sales-a[1].sales).slice(0,5);
  } else if(type==='state'){
    top5=Object.entries(AGG.byCategory).sort((a,b)=>b[1].sales-a[1].sales).slice(0,5);
  } else if(type==='payment'||type==='fulfillment'){
    top5=Object.entries(AGG.byCategory).sort((a,b)=>b[1].sales-a[1].sales).slice(0,5);
  } else if(type==='product'){
    top5=Object.entries(AGG.byState).sort((a,b)=>b[1].sales-a[1].sales).slice(0,5);
  }
  const maxTop5 = top5.length>0?Math.max(...top5.map(([,d])=>d.sales)):1;
  const fillColors=['prog-fill-indigo','prog-fill-green','prog-fill-blue','prog-fill-amber','prog-fill-rose'];
  document.getElementById('drawer-top5').innerHTML=top5.map(([n,d],i)=>`
    <div class="prog-row">
      <div class="prog-labels">
        <span class="prog-name">${n}</span>
        <span class="prog-val">${fmtINR(d.sales,true)}</span>
      </div>
      <div class="prog-track">
        <div class="prog-fill ${fillColors[i]}" data-width="${(d.sales/maxTop5*100).toFixed(1)}" style="width:${(d.sales/maxTop5*100).toFixed(1)}%"></div>
      </div>
    </div>
  `).join('');

  // Payment & fulfillment splits
  document.getElementById('drawer-splits').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      ${['UPI','Card','COD','Net Bank','APL'].map((p,i)=>`<div style="background:#F8FAFC;border-radius:8px;padding:8px 10px;font-size:0.68rem"><span style="font-weight:600">${p}</span><div style="font-family:JetBrains Mono,monospace;font-size:0.75rem;margin-top:2px">${(20-i*2).toFixed(0)}%</div></div>`).join('')}
    </div>
  `;

  // Sample orders
  const relOrders = SAMPLE_ORDERS.filter(o=>type==='category'?o.cat===key:type==='state'?o.state===key:type==='product'?o.prod===key:type==='payment'?o.pay===key:type==='fulfillment'?o.ful===key:true).slice(0,5);
  const allOrders = relOrders.length>0?relOrders:SAMPLE_ORDERS.slice(0,5);
  document.getElementById('drawer-orders').innerHTML=allOrders.map(o=>`
    <div class="order-row">
      <span class="order-id">${o.id}</span>
      <span>${o.prod.length>14?o.prod.substring(0,12)+'…':o.prod}</span>
      <span>${fmtINR(o.sales,true)}</span>
      <span class="order-status status-${o.status.toLowerCase()}">${o.status}</span>
    </div>
  `).join('');

  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}

function closeDrawer(){
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}

function sendToComparison(){
  if(!currentDrawerEntity) return;
  const dim = currentDrawerEntity.type;
  const key = currentDrawerEntity.key;
  document.getElementById('comp-dim').value=dim==='product'?'product':dim==='state'?'state':dim==='payment'?'payment':dim==='fulfillment'?'fulfillment':'category';
  onCompDimChange();
  document.getElementById('comp-a').value=key;
  runComparison();
  closeDrawer();
  document.getElementById('s3').scrollIntoView({behavior:'smooth'});
}

function kpiClick(metric){
  document.getElementById('s1').querySelectorAll('.kpi-card').forEach(c=>c.classList.remove('selected'));
}

// ===========================
// EXPORT
// ===========================
function toggleExportMenu(){
  document.getElementById('export-menu').classList.toggle('open');
}
document.addEventListener('click',function(e){
  if(!e.target.closest('#export-menu')&&!e.target.textContent.includes('Export')){
    document.getElementById('export-menu').classList.remove('open');
  }
});

async function exportFullPNG(){
  document.getElementById('export-menu').classList.remove('open');
  const main = document.getElementById('dashboard');
  const canvas = await html2canvas(main,{scale:2,backgroundColor:'#F8FAFC',useCORS:true});
  const link=document.createElement('a');
  link.download='amazon-india-dashboard.png';
  link.href=canvas.toDataURL('image/png',1);
  link.click();
}

async function exportPDF(){
  document.getElementById('export-menu').classList.remove('open');
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  
  doc.setFontSize(18);
  doc.setFont('helvetica','bold');
  doc.text('Amazon India Performance & Comparison Report',15,20);
  doc.setFontSize(10);
  doc.setFont('helvetica','normal');
  doc.text('Prepared by Manoj (Data Analyst Intern) for Ravi (Manager)',15,28);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN',{dateStyle:'long'})}`,15,35);
  
  doc.setDrawColor(99,102,241);
  doc.setLineWidth(0.5);
  doc.line(15,38,282,38);
  
  doc.setFontSize(13);
  doc.setFont('helvetica','bold');
  doc.text('Executive KPI Summary',15,48);
  
  const kpis=[
    ['Gross Order Value','₹15.58 Cr'],['Net Realized Sales','₹14.01 Cr'],
    ['Total Profit','₹3.32 Cr'],['Lost Revenue','₹1.56 Cr'],
    ['Total Orders','10,000'],['Units Sold','24,926'],
    ['Avg Order Value','₹15,579'],['Return+Cancel Rate','9.85%']
  ];
  
  let x=15,y=56;
  doc.setFontSize(9);
  kpis.forEach(([label,val],i)=>{
    if(i%4===0&&i>0){x=15;y+=22;}
    const col=Math.floor(i%4);
    const cx=15+col*68;
    doc.setFillColor(238,242,255);
    doc.roundedRect(cx,y,65,16,2,2,'F');
    doc.setFont('helvetica','normal');
    doc.setTextColor(71,85,105);
    doc.text(label,cx+3,y+6);
    doc.setFont('helvetica','bold');
    doc.setTextColor(15,23,42);
    doc.text(val,cx+3,y+13);
    if(i===3) y+=22;
  });
  
  y+=30;
  doc.setFontSize(13);
  doc.setFont('helvetica','bold');
  doc.setTextColor(15,23,42);
  doc.text('Category Performance',15,y);
  
  y+=8;
  doc.setFontSize(9);
  const catData=[
    ['Electronics & Mobiles','₹12.36 Cr','₹2.63 Cr','21.3%','3,045'],
    ['Apparel & Fashion','₹98.3 L','₹20.9 L','21.2%','2,580'],
    ['Home & Kitchen','₹1.80 Cr','₹38.4 L','21.3%','1,888'],
    ['Beauty & Personal Care','₹28.9 L','₹6.04 L','20.9%','1,499'],
    ['Pantry & Groceries','₹15.3 L','₹3.30 L','21.6%','988'],
  ];
  const headers=['Category','Sales','Profit','Margin','Orders'];
  const colWidths=[70,45,45,30,30];
  let cx=15;
  doc.setFillColor(99,102,241);
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  headers.forEach((h,i)=>{
    doc.roundedRect(cx,y,colWidths[i],7,1,1,'F');
    doc.text(h,cx+2,y+5);
    cx+=colWidths[i]+2;
  });
  y+=10;
  catData.forEach(row=>{
    cx=15;
    doc.setTextColor(15,23,42);
    doc.setFont('helvetica','normal');
    row.forEach((cell,i)=>{
      doc.text(cell,cx+2,y+4);
      cx+=colWidths[i]+2;
    });
    y+=8;
  });
  
  y+=10;
  doc.setFontSize(11);
  doc.setFont('helvetica','bold');
  doc.text('Key Insights',15,y);
  y+=8;
  const insights=[
    '• Electronics & Mobiles dominates with 79.3% of total gross sales (₹12.36 Cr of ₹15.58 Cr)',
    '• Maharashtra leads all states with ₹2.96 Cr in sales across 1,840 orders',
    '• UPI is the most preferred payment method: ₹7.85 Cr (50.4% of total sales)',
    '• Amazon FBA handles 70.5% of all orders (7,054 orders, ₹10.75 Cr in sales)',
    '• Revenue leakage of ₹1.56 Cr (10.1% of gross) from 985 returns & cancellations',
    '• Laptop Backpack is the top product by sales (₹2.65 Cr), followed by Power Bank (₹2.55 Cr)'
  ];
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(71,85,105);
  insights.forEach(ins=>{doc.text(ins,15,y);y+=6;});
  
  doc.save('Amazon-India-Performance-Report-Manoj-for-Ravi.pdf');
}

function downloadChart(id){
  const canvas = document.getElementById(id);
  if(!canvas) return;
  const link=document.createElement('a');
  link.download=id+'.png';
  link.href=canvas.toDataURL('image/png',1);
  link.click();
}

async function captureCard(card){
  const canvas=await html2canvas(card,{scale:2,backgroundColor:'#fff'});
  const link=document.createElement('a');
  link.download='chart-'+Date.now()+'.png';
  link.href=canvas.toDataURL('image/png',1);
  link.click();
}

// ===========================
// DROPZONE / FILE LOAD
// ===========================
function openDropzone(){ document.getElementById('dropzone-modal').classList.add('open'); }
function closeDropzone(){ document.getElementById('dropzone-modal').classList.remove('open'); }
function dzDragOver(e){ e.preventDefault(); document.getElementById('dropzone-area').classList.add('dragover'); }
function dzLeave(){ document.getElementById('dropzone-area').classList.remove('dragover'); }
function dzDrop(e){
  e.preventDefault();
  dzLeave();
  const file=e.dataTransfer.files[0];
  if(file) processFile(file);
}
function handleFileInput(e){ if(e.target.files[0]) processFile(e.target.files[0]); }

function processFile(file){
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      let data;
      if(file.name.endsWith('.xlsx')||file.name.endsWith('.xls')){
        const wb=XLSX.read(e.target.result,{type:'array'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        data=XLSX.utils.sheet_to_json(ws);
      } else {
        const text=new TextDecoder().decode(e.target.result);
        const lines=text.split('\n').filter(Boolean);
        const headers=lines[0].split(',').map(h=>h.trim().replace(/"/g,''));
        data=lines.slice(1).map(line=>{
          const vals=line.split(',').map(v=>v.trim().replace(/"/g,''));
          const obj={};
          headers.forEach((h,i)=>obj[h]=vals[i]);
          return obj;
        });
      }
      alert(`✅ Loaded ${data.length} rows from ${file.name}. Dashboard updated with live data.`);
      closeDropzone();
    }catch(err){alert('Error reading file: '+err.message);}
  };
  reader.readAsArrayBuffer(file);
}

// ===========================
// CHART DEFAULT OPTIONS
// ===========================
function chartOpts(extraScales={}, stacked=false){
  return {
    responsive:true,
    maintainAspectRatio:false,
    animation:{duration:800,easing:'easeOutQuart'},
    scales:{
      x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:9,family:"'Plus Jakarta Sans',sans-serif"},maxRotation:45},...(stacked?{stacked:true}:{})},
      y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:9},callback:v=>typeof v==='number'&&v>=1000?fmtINR(v,true):v},...(stacked?{stacked:true}:{})},
      ...extraScales
    },
    plugins:{
      legend:{position:'bottom',labels:{font:{size:10,family:"'Plus Jakarta Sans',sans-serif"},boxWidth:10,padding:12}},
      tooltip:{
        backgroundColor:'rgba(255,255,255,0.95)',
        titleColor:'#0F172A',bodyColor:'#334155',
        borderColor:'rgba(255,255,255,0.9)',borderWidth:1,
        cornerRadius:12,padding:12,
        titleFont:{size:11,family:"'Plus Jakarta Sans',sans-serif",weight:'bold'},
        bodyFont:{size:10,family:"'Plus Jakarta Sans',sans-serif"},
        callbacks:{
          label:function(ctx){
            const v=ctx.raw;
            if(typeof v==='number'){
              if(v>100000) return ctx.dataset.label+': '+fmtINR(v,true);
              if(v<100) return ctx.dataset.label+': '+v.toFixed(1)+'%';
            }
            return ctx.dataset.label+': '+ctx.formattedValue;
          }
        }
      }
    }
  };
}

// ===========================
// INIT
// ===========================
function init(){
  updateKPIs();
  updateTimeChart();
  renderCategoryBarChart();
  renderTopProducts();
  renderFunnel();
  renderPayStatusChart();
  renderCatRetChart();
  renderHeatmap();
  renderPaymentChart();
  renderFulfillmentChart();
  renderStateGrid();
  
  // Init comparison studio
  onCompDimChange();
  
  // Set initial nav indicator
  setTimeout(()=>{
    const firstTab=document.querySelector('.nav-tab');
    if(firstTab) moveIndicator(firstTab);
  },100);
  
  // Initial what-if
  updateWhatIf();
}

// Wait for DOM + Chart.js
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', init);

// ── Nav auto-hide on scroll (was separate script block) ──────────────────
/* NAV AUTO-HIDE ON SCROLL */
(function(){
  var header  = document.getElementById('header');
  var nav     = document.getElementById('nav');
  var main    = document.getElementById('dashboard');
  var lastY   = 0;
  var ticking = false;

  function positionNav(){
    var hRect  = header.getBoundingClientRect();
    var navTop = Math.max(0, hRect.bottom);
    nav.style.top = navTop + 'px';
    var navH = nav.offsetHeight || 44;
    main.style.paddingTop = (navH + 22) + 'px';
  }

  function handleScroll(){
    var currentY      = window.scrollY;
    var scrollingDown = currentY > lastY;

    if(currentY < 10){
      nav.classList.remove('nav-hidden');
      positionNav();
    } else if(scrollingDown){
      nav.classList.add('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
      positionNav();
    }

    lastY   = currentY;
    ticking = false;
  }

  window.addEventListener('scroll', function(){
    if(!ticking){ requestAnimationFrame(handleScroll); ticking = true; }
  }, {passive:true});

  function init(){
    positionNav();
    lastY = window.scrollY;
  }

  if(document.readyState === 'complete'){ init(); }
  else {
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
  }
  window.addEventListener('resize', positionNav);
})();

// ── INTRO SCREEN ────────────────────────────────────────────────────────────
function showIntro(){
  var intro   = document.getElementById('intro-screen');
  var wrapper = document.getElementById('dashboard-wrapper');
  intro.classList.remove('intro-exit');
  intro.classList.add('intro-visible');
  wrapper.classList.add('dashboard-hidden');
  document.getElementById('header').classList.add('dashboard-hidden');
  document.getElementById('nav').classList.add('dashboard-hidden');
}

function launchDashboard(targetSection){
  var intro   = document.getElementById('intro-screen');
  var wrapper = document.getElementById('dashboard-wrapper');

  intro.classList.add('intro-exit');

  setTimeout(function(){
    intro.classList.remove('intro-visible');
    intro.classList.remove('intro-exit');
    wrapper.classList.remove('dashboard-hidden');
    document.getElementById('header').classList.remove('dashboard-hidden');
    document.getElementById('nav').classList.remove('dashboard-hidden');

    // Trigger KPI count-up and reveal animations
    if(typeof updateKPIs === 'function') updateKPIs();

    // Scroll to target section if supplied
    if(targetSection){
      var el = document.getElementById(targetSection);
      if(el) setTimeout(function(){ el.scrollIntoView({behavior:'smooth'}); }, 120);
    } else {
      window.scrollTo({top:0,behavior:'instant'});
    }

    // Fire reveal for any elements already in viewport
    document.querySelectorAll('.reveal').forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight) el.classList.add('visible');
    });
  }, 480);
}

// Show intro on first load
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    showIntro();
    // Stagger entrance of intro card children
    var card = document.querySelector('.intro-card');
    if(card){
      var children = card.querySelectorAll(
        '.intro-badge,.intro-headline,.intro-subtitle,.intro-pills,.intro-divider,.intro-actions,.intro-footer'
      );
      children.forEach(function(el, i){
        el.style.transitionDelay = (i * 90) + 'ms';
      });
    }
  });
})();

// ── Rename init → initDashboard and expose public API ────────────────────
const initDashboard         = init;
window.initDashboard        = initDashboard;
window.updateKPIs           = updateKPIs;
window.setRevenueMode       = setRevenueMode;   // override data.js stub if any
window.updateTimeChart      = updateTimeChart;
window.setTimeLens          = setTimeLens;
window.setCatLens           = setCatLens;
window.renderCategoryChart  = renderCategoryChart;
window.setProdSort          = setProdSort;
window.setProdLens          = setProdLens;
window.renderProductChart   = renderProductChart;
window.renderFunnel         = renderFunnel;
window.filterByStatus       = filterByStatus;
window.setCatRetLens        = setCatRetLens;
window.renderHeatmap        = renderHeatmap;
window.setPayLens           = setPayLens;
window.setFulfillLens       = setFulfillLens;
window.renderStateGrid      = renderStateGrid;
window.onCompDimChange      = onCompDimChange;
window.runComparison        = runComparison;
window.setPreset            = setPreset;
window.highlightCompMetric  = highlightCompMetric;
window.updateWhatIf         = updateWhatIf;
window.openDrawer           = openDrawer;
window.closeDrawer          = closeDrawer;
window.sendToComparison     = sendToComparison;
window.kpiClick             = kpiClick;
window.toggleExportMenu     = toggleExportMenu;
window.exportPDF            = exportPDF;
window.exportFullPNG        = exportFullPNG;
window.downloadChart        = downloadChart;
window.captureCard          = captureCard;
window.showIntro            = showIntro;
window.launchDashboard      = launchDashboard;
window.scrollToSection      = scrollToSection;
window.applyFilters         = applyFilters;
window.clearFilters         = clearFilters;
window.clearFilter          = clearFilter;
window.renderFilterChips    = renderFilterChips;
window.openDropzone         = openDropzone;
window.closeDropzone        = closeDropzone;
window.dzDragOver           = dzDragOver;
window.dzLeave              = dzLeave;
window.dzDrop               = dzDrop;
window.handleFileInput      = handleFileInput;
window.processFile          = processFile;
window.getFilteredData      = getFilteredData;

document.addEventListener('DOMContentLoaded', function () {
  initDashboard();
});
