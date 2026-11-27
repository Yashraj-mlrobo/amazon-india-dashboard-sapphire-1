// ============================================================
// js/chatbot.js — Sapphire IQ  |  Data Assistant Chatbot
//                 NLP engine, response builders, chat UI
// ============================================================
'use strict';

// ── Safe format helpers (populated by data.js before this runs) ───────────
function _fmt(n, compact) {
  if (window.fmtINR) return window.fmtINR(n, compact);
  if (!n) return '₹0';
  if (compact) {
    if (n >= 10000000) return '₹' + (n/10000000).toFixed(2) + ' Cr';
    if (n >= 100000)   return '₹' + (n/100000).toFixed(2)   + ' L';
    if (n >= 1000)     return '₹' + (n/1000).toFixed(1)     + ' K';
    return '₹' + n.toFixed(0);
  }
  return '₹' + n.toLocaleString('en-IN', {maximumFractionDigits:0});
}
function fmt(n) { return _fmt(n, true); }
function pct(n) { return (n || 0).toFixed(1) + '%'; }
function num(n) { return (n || 0).toLocaleString('en-IN'); }

// ── Live data accessor ───────────────────────────────────────────────────
function data() { return window.AGG || {}; }

// ══════════════════════════════════════════════════════════════════════════════
// SAPPHIRE IQ — DATA ASSISTANT CHATBOT ENGINE
// ══════════════════════════════════════════════════════════════════════════════

function getTotals(){
  var d = data();
  var t = d.totals || {};
  var status = d.byStatus || {};
  var retOrders = (status.Returned||{}).orders||0;
  var canOrders = (status.Cancelled||{}).orders||0;
  return {
    sales      : t.sales    || 0,
    netSales   : t.netSales || 0,
    profit     : t.profit   || 0,
    orders     : t.orders   || 0,
    units      : t.units    || 0,
    lostRev    : t.lostRevenue || 0,
    retOrders  : retOrders,
    canOrders  : canOrders,
    margin     : t.sales ? t.profit/t.sales*100 : 0,
    aov        : t.orders ? t.sales/t.orders : 0,
    retRate    : t.orders ? retOrders/t.orders*100 : 0,
    canRate    : t.orders ? canOrders/t.orders*100 : 0
  };
}

function rankDim(dimObj, sortKey, n){
  sortKey = sortKey || 'sales';
  n = n || 5;
  return Object.entries(dimObj||{})
    .map(function(e){
      var d = e[1];
      var margin = d.sales ? d.profit/d.sales*100 : 0;
      var retRate = d.orders ? ((d.returned||0)+(d.cancelled||0))/d.orders*100 : 0;
      return {
        name   : e[0],
        sales  : d.sales||0,
        profit : d.profit||0,
        orders : d.orders||0,
        margin : margin,
        retRate: retRate
      };
    })
    .sort(function(a,b){ return b[sortKey]-a[sortKey]; })
    .slice(0, n);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
var SECTION_MAP = {
  s1: 'Executive Pulse',
  s2: 'Category & Product',
  s3: 'Comparison Studio',
  s4: 'Order Funnel',
  s5: 'Geography & Channels'
};

// All known entity names (lowercase for matching)
function allEntities(){
  var d = data();
  var list = [];
  ['byCategory','byProduct','byState','byPayment','byFulfillment'].forEach(function(k){
    Object.keys(d[k]||{}).forEach(function(name){ list.push({name:name, dim:k}); });
  });
  ['2024','2025','2026'].forEach(function(y){ list.push({name:y, dim:'byYear'}); });
  return list;
}

function findEntities(q){
  var entities = allEntities();
  var found = [];
  entities.forEach(function(e){
    if(q.toLowerCase().indexOf(e.name.toLowerCase()) !== -1) found.push(e);
  });
  // Also match shortened names e.g. "electronics"
  var shorthands = {
    'electronics'    : 'Electronics & Mobiles',
    'apparel'        : 'Apparel & Fashion',
    'fashion'        : 'Apparel & Fashion',
    'beauty'         : 'Beauty & Personal Care',
    'home'           : 'Home & Kitchen',
    'kitchen'        : 'Home & Kitchen',
    'pantry'         : 'Pantry & Groceries',
    'groceries'      : 'Pantry & Groceries',
    'fba'            : 'Amazon (FBA)',
    'amazon fba'     : 'Amazon (FBA)',
    'seller flex'    : 'Seller Flex',
    'fbm'            : 'Merchant (FBM)',
    'cod'            : 'Cash on Delivery (COD)',
    'upi'            : 'UPI',
    'maharashtra'    : 'Maharashtra',
    'karnataka'      : 'Karnataka',
    'delhi'          : 'Delhi',
    'mumbai'         : 'Maharashtra',
  };
  Object.keys(shorthands).forEach(function(k){
    if(q.toLowerCase().indexOf(k) !== -1){
      var full = shorthands[k];
      if(!found.some(function(e){ return e.name===full; })){
        var d = data();
        var dims = ['byCategory','byPayment','byFulfillment','byState'];
        dims.forEach(function(dim){
          if(d[dim] && d[dim][full]) found.push({name:full, dim:dim});
        });
      }
    }
  });
  return found;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildSummaryResponse(){
  var t = getTotals();
  var d = data();
  var topCat = rankDim(d.byCategory,'sales',1)[0];
  var topState = rankDim(d.byState,'sales',1)[0];
  return {
    text: 'Here\'s your complete <strong>Amazon India business snapshot</strong>:',
    kpis: [
      {label:'Gross Sales',    val:fmt(t.sales),    cls:''},
      {label:'Net Realized',   val:fmt(t.netSales), cls:'green'},
      {label:'Total Profit',   val:fmt(t.profit),   cls:'green'},
      {label:'Net Margin',     val:pct(t.margin),   cls:'green'},
      {label:'Total Orders',   val:num(t.orders),   cls:''},
      {label:'Avg Order Value',val:fmt(t.aov),      cls:''},
      {label:'Revenue Lost',   val:fmt(t.lostRev),  cls:'rose'},
      {label:'Return+Cancel',  val:pct(t.retRate+t.canRate), cls:'amber'}
    ],
    extra: (topCat ? '<br>🏆 <strong>'+topCat.name+'</strong> leads all categories with '+fmt(topCat.sales)+' in sales.' : '') +
           (topState ? '<br>📍 <strong>'+topState.name+'</strong> is the top-performing state.' : ''),
    actions:[
      {label:'View KPI Dashboard →', section:'s1', flashId:null},
      {label:'Inspect Revenue Leakage →', section:'s4', flashId:null}
    ]
  };
}

function buildRankResponse(q){
  var d = data();
  // Determine dimension
  var dimKey = 'byCategory', dimLabel = 'categories';
  if(/product|item/i.test(q)){   dimKey='byProduct';     dimLabel='products'; }
  else if(/state|region|city|geo/i.test(q)){ dimKey='byState'; dimLabel='states'; }
  else if(/payment|pay\b|upi|cod|card|bank/i.test(q)){ dimKey='byPayment'; dimLabel='payment methods'; }
  else if(/fulfil|fba|fbm|flex/i.test(q)){ dimKey='byFulfillment'; dimLabel='fulfillment channels'; }

  // Determine sort metric
  var sortKey = 'sales', sortLabel = 'Sales';
  if(/profit\b/i.test(q))  { sortKey='profit';  sortLabel='Profit'; }
  if(/margin/i.test(q))    { sortKey='margin';  sortLabel='Margin %'; }
  if(/order/i.test(q) && !/value/i.test(q)){ sortKey='orders'; sortLabel='Orders'; }

  var isBottom = /worst|lowest|bottom|least/i.test(q);
  var n = 5;
  var ranked = rankDim(d[dimKey], sortKey, Object.keys(d[dimKey]||{}).length);
  if(isBottom) ranked = ranked.reverse();
  ranked = ranked.slice(0, n);

  var totalVal = ranked.reduce(function(s,r){ return s+(r[sortKey]||0); }, 0) * 2; // rough total

  var sectionMap = {byCategory:'s2',byProduct:'s2',byState:'s5',byPayment:'s5',byFulfillment:'s5'};

  return {
    text: (isBottom?'<strong>Bottom ':'<strong>Top ') + n + ' ' + dimLabel + '</strong> by ' + sortLabel + ':',
    table: ranked.map(function(r,i){
      var displayVal = sortKey==='margin' ? pct(r[sortKey]) :
                       sortKey==='orders' ? num(r[sortKey]) : fmt(r[sortKey]);
      var share = (r[sortKey]/(d.totals&&d.totals[sortKey==='sales'?'sales':sortKey==='profit'?'profit':'orders']||1)*100).toFixed(1);
      return {rank:i+1, name:r.name, val:displayVal, share:share+'%', margin:pct(r.margin)};
    }),
    sortLabel: sortLabel,
    actions:[
      {label:'Jump to '+SECTION_MAP[sectionMap[dimKey]]+' →', section:sectionMap[dimKey], flashId:null}
    ]
  };
}

function buildLeakageResponse(){
  var d = data();
  var t = getTotals();
  var status = d.byStatus || {};
  var ret = status.Returned || {sales:0,orders:0};
  var can = status.Cancelled|| {sales:0,orders:0};

  // Highest return category
  var catList = Object.entries(d.byCategory||{}).map(function(e){
    return {name:e[0], lost:(e[1].returned||0)+(e[1].cancelled||0), rate:((e[1].returned||0)+(e[1].cancelled||0))/(e[1].orders||1)*100};
  }).sort(function(a,b){return b.rate-a.rate;});

  // COD vs UPI risk
  var cod = d.byPayment&&d.byPayment['Cash on Delivery (COD)'] || {};
  var upi = d.byPayment&&d.byPayment['UPI'] || {};
  var codRate = cod.orders ? ((cod.returned||0)+(cod.cancelled||0))/cod.orders*100 : 0;
  var upiRate = upi.orders ? ((upi.returned||0)+(upi.cancelled||0))/upi.orders*100 : 0;

  return {
    text: '⚠️ <strong>Revenue Leakage Deep-Dive</strong>',
    kpis:[
      {label:'Total Lost Revenue',  val:fmt(t.lostRev),         cls:'rose'},
      {label:'% of Gross Sales',    val:pct(t.lostRev/t.sales*100), cls:'amber'},
      {label:'Returned Orders',     val:num(ret.orders)+' orders',  cls:'amber'},
      {label:'Cancelled Orders',    val:num(can.orders)+' orders',  cls:'rose'},
      {label:'Return Rate',         val:pct(t.retRate),             cls:'amber'},
      {label:'Cancel Rate',         val:pct(t.canRate),             cls:'rose'}
    ],
    extra:'<br>📦 <strong>'+catList[0].name+'</strong> has the highest return+cancel rate at '+pct(catList[0].rate)+'.<br>'+
          '💳 <strong>COD</strong> return+cancel rate: <strong>'+pct(codRate)+'</strong> vs <strong>UPI</strong>: '+pct(upiRate)+' — COD is <strong>'+((codRate/upiRate)||1).toFixed(1)+'× riskier</strong>.',
    actions:[
      {label:'Inspect Order Funnel →',      section:'s4', flashId:'funnel-steps'},
      {label:'View Payment Risk Matrix →',  section:'s4', flashId:'pay-status-chart'},
      {label:'Filter by COD →',             section:null,  filter:{key:'payment',val:'Cash on Delivery (COD)'}}
    ]
  };
}

function buildCompareResponse(entities){
  var d = data();
  var a = entities[0], b = entities[1];
  var dimToDataMap = {
    byCategory:'byCategory', byProduct:'byProduct',
    byState:'byState', byPayment:'byPayment',
    byFulfillment:'byFulfillment', byYear:'byYear'
  };

  function getEntityData(e){
    var src = d[e.dim] || {};
    return src[e.name] || null;
  }

  var aData = getEntityData(a);
  var bData = getEntityData(b);
  if(!aData || !bData){
    return {
      text:'I found <strong>'+a.name+'</strong> but couldn\'t locate both entities in the dataset. Please try naming them more specifically.',
      actions:[{label:'Open Comparison Studio →', section:'s3', flashId:null}]
    };
  }

  var aSales   = aData.sales||0,   bSales   = bData.sales||0;
  var aProfit  = aData.profit||0,  bProfit  = bData.profit||0;
  var aOrders  = aData.orders||1,  bOrders  = bData.orders||1;
  var aMargin  = aSales ? aProfit/aSales*100 : 0;
  var bMargin  = bSales ? bProfit/bSales*100 : 0;
  var aRet     = ((aData.returned||0)+(aData.cancelled||0))/aOrders*100;
  var bRet     = ((bData.returned||0)+(bData.cancelled||0))/bOrders*100;
  var salesWinner  = aSales  >= bSales  ? a.name : b.name;
  var profitWinner = aProfit >= bProfit ? a.name : b.name;

  // Determine comparison studio dim value
  var dimForStudio = {
    byCategory:'category', byProduct:'product', byState:'state',
    byPayment:'payment', byFulfillment:'fulfillment', byYear:'year'
  }[a.dim] || 'category';

  return {
    text: '⚡ <strong>'+a.name+' vs '+b.name+'</strong>',
    compareTable: [
      {metric:'Sales',       a:fmt(aSales),    b:fmt(bSales),    winner: aSales>=bSales?'A':'B'},
      {metric:'Profit',      a:fmt(aProfit),   b:fmt(bProfit),   winner: aProfit>=bProfit?'A':'B'},
      {metric:'Margin %',    a:pct(aMargin),   b:pct(bMargin),   winner: aMargin>=bMargin?'A':'B'},
      {metric:'Orders',      a:num(aOrders),   b:num(bOrders),   winner: aOrders>=bOrders?'A':'B'},
      {metric:'Ret+Can %',   a:pct(aRet),      b:pct(bRet),      winner: aRet<=bRet?'A':'B'}
    ],
    extra:'<br>🏆 <strong>'+salesWinner+'</strong> leads on Sales. <strong>'+profitWinner+'</strong> wins on Profit.',
    entityA: a.name, entityB: b.name, studioDim: dimForStudio,
    actions:[
      {label:'Open in Comparison Studio →', section:'s3', studioA:a.name, studioB:b.name, studioDim:dimForStudio}
    ]
  };
}

function buildExplainResponse(q){
  var explanations = {
    'pareto': '<strong>Pareto 80/20 Curve</strong> shows that a small number of products (usually ~20%) drive most of your revenue (~80%). The cumulative % line tells Ravi: <em>"If we focus on the top 5 products, we capture over 60% of all sales."</em>',
    'radar':  '<strong>6-Axis Radar Chart</strong> compares entities across 6 metrics simultaneously — Sales, Profit, Margin %, AOV, Units, and Completion Rate — in a web shape. A larger, more balanced web = healthier performance.',
    'heatmap':'<strong>2D Heatmap</strong> shows two dimensions (e.g. State × Category) at once. Darker cells = higher values. Clicking any cell drills down to exact orders for that combination.',
    'funnel': '<strong>Order Funnel</strong> shows how 10,000 orders travel from "Placed" → "Delivered" → "Shipped", and how many leak out as Returns or Cancellations — revealing exactly how much revenue is lost before reaching the customer.',
    'treemap':'<strong>Treemap</strong> uses tile sizes proportional to sales share. Bigger tile = more revenue. Great for spotting at a glance which category dominates the business.',
    'bubble': '<strong>Bubble Chart</strong> shows three dimensions at once: X = Return Rate, Y = Profit Margin %, bubble size = Sales. Products in the top-left corner (low returns, high margin) are your best performers.'
  };
  var matched = null;
  Object.keys(explanations).forEach(function(k){
    if(q.toLowerCase().indexOf(k) !== -1) matched = explanations[k];
  });
  if(!matched){
    matched = 'I can explain any visualization in simple terms. Ask me: <br><em>"Explain the Pareto chart"</em>, <em>"What does the Radar show?"</em>, <em>"How do I read the Heatmap?"</em>, or <em>"Explain the Order Funnel"</em>.';
  }
  return {
    text: '📊 <strong>Chart Explanation for Ravi:</strong><br><br>' + matched,
    actions:[{label:'Jump to Category & Product →', section:'s2', flashId:null}]
  };
}

function buildFallbackResponse(q){
  return {
    text: 'I\'m not sure about that one — here\'s what I <strong>can analyze</strong> for you:',
    list:[
      'Overall KPIs: sales, profit, margin, AOV, orders',
      'Rankings: top/bottom categories, products, states, payment methods',
      'Revenue leakage: returns, cancellations, COD risk',
      'Head-to-head: compare any two entities side-by-side',
      'Chart explanations in plain language for Ravi'
    ],
    chips:[
      'Overall business summary',
      'Which category has the highest profit?',
      'Why are we losing revenue?'
    ],
    actions:[]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER INTENT ROUTER
// ─────────────────────────────────────────────────────────────────────────────
function routeQuery(q){
  var ql = q.toLowerCase();

  // Compare intent (needs two entities)
  if(/\bvs\b|versus|compare|difference between|vs\./i.test(ql)){
    var ents = findEntities(ql);
    if(ents.length >= 2) return {type:'compare', payload:buildCompareResponse(ents)};
  }

  // Explain intent
  if(/explain|what does|how (to|do you) read|what is a? ?(pareto|radar|heatmap|funnel|treemap|bubble)/i.test(ql)){
    return {type:'explain', payload:buildExplainResponse(ql)};
  }

  // Leakage / returns / cancellations
  if(/return|cancel|loss|leakage|leak|lost revenue|refund|\bcod\b|cash on delivery/i.test(ql)){
    return {type:'leakage', payload:buildLeakageResponse()};
  }

  // Summary / overview
  if(/summary|overview|total|overall|snapshot|kpi|how (are|is|did)|performance/i.test(ql)){
    return {type:'summary', payload:buildSummaryResponse()};
  }

  // Ranking / top / bottom
  if(/top|best|highest|most|bottom|worst|lowest|least|rank/i.test(ql)){
    return {type:'rank', payload:buildRankResponse(ql)};
  }

  // Single entity lookup
  var ents = findEntities(ql);
  if(ents.length === 1){
    var e = ents[0];
    var d = data();
    var src = d[e.dim]||{};
    var eData = src[e.name]||{};
    var margin = eData.sales ? eData.profit/eData.sales*100 : 0;
    var retRate = eData.orders ? ((eData.returned||0)+(eData.cancelled||0))/eData.orders*100 : 0;
    var sectionForDim = {byCategory:'s2',byProduct:'s2',byState:'s5',byPayment:'s5',byFulfillment:'s5',byYear:'s1'};
    return {
      type:'entity',
      payload:{
        text:'Here are the stats for <strong>'+e.name+'</strong>:',
        kpis:[
          {label:'Sales',       val:fmt(eData.sales||0),          cls:''},
          {label:'Profit',      val:fmt(eData.profit||0),         cls:'green'},
          {label:'Margin %',    val:pct(margin),                  cls:'green'},
          {label:'Orders',      val:num(eData.orders||0),         cls:''},
          {label:'Units',       val:num(eData.units||0),          cls:''},
          {label:'Ret+Can %',   val:pct(retRate),                 cls:retRate>12?'rose':'amber'}
        ],
        actions:[
          {label:'View in Dashboard →', section:sectionForDim[e.dim]||'s1', flashId:null},
          {label:'Send to Comparison Studio →', section:'s3', studioA:e.name, studioB:null, studioDim:null}
        ]
      }
    };
  }

  // Compare intent with partial entities
  if(ents.length === 2) return {type:'compare', payload:buildCompareResponse(ents)};

  return {type:'fallback', payload:buildFallbackResponse(ql)};
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function renderKpis(kpis){
  if(!kpis||!kpis.length) return '';
  return '<div class="chat-kpi-row">' +
    kpis.map(function(k){
      return '<span class="chat-kpi-pill '+(k.cls||'')+'">'+'<span style="font-size:0.6rem;font-weight:600;color:inherit;opacity:0.75;display:block">'+k.label+'</span>'+k.val+'</span>';
    }).join('') + '</div>';
}

function renderTable(rows, sortLabel){
  if(!rows||!rows.length) return '';
  return '<table class="chat-rank-table"><thead><tr><th>#</th><th>Name</th><th>'+sortLabel+'</th><th>Share</th></tr></thead><tbody>' +
    rows.map(function(r){
      return '<tr><td><span class="chat-rank-num">'+r.rank+'</span></td><td>'+r.name+'</td><td>'+r.val+'</td><td style="color:#94A3B8">'+r.share+'</td></tr>';
    }).join('') + '</tbody></table>';
}

function renderCompareTable(rows, aName, bName){
  if(!rows||!rows.length) return '';
  return '<table class="chat-rank-table"><thead><tr><th>Metric</th><th style="color:#6366F1">'+
    (aName.length>10?aName.substring(0,8)+'…':aName)+'</th><th style="color:#F43F5E">'+
    (bName.length>10?bName.substring(0,8)+'…':bName)+'</th></tr></thead><tbody>'+
    rows.map(function(r){
      var aStyle = r.winner==='A' ? 'color:#059669;font-weight:800' : '';
      var bStyle = r.winner==='B' ? 'color:#059669;font-weight:800' : '';
      return '<tr><td style="color:#64748B;font-size:0.65rem">'+r.metric+'</td>'+
        '<td style="font-family:JetBrains Mono,monospace;'+aStyle+'">'+r.a+'</td>'+
        '<td style="font-family:JetBrains Mono,monospace;'+bStyle+'">'+r.b+'</td></tr>';
    }).join('')+'</tbody></table>';
}

function renderList(items){
  if(!items||!items.length) return '';
  return '<ul style="margin:8px 0 0 14px;display:flex;flex-direction:column;gap:4px">'+
    items.map(function(i){ return '<li style="font-size:0.74rem;color:#334155">'+i+'</li>'; }).join('')+'</ul>';
}

function renderSuggestChips(chips){
  if(!chips||!chips.length) return '';
  return '<div class="chat-actions" style="margin-top:8px">'+
    chips.map(function(c){
      return '<span class="chat-action-pill" onclick="chatSendQuery(\''+c.replace(/'/g,"\\'")+'\')" style="background:#F8FAFC;border-color:#E2E8F0;color:#475569">'+c+'</span>';
    }).join('')+'</div>';
}

function renderActions(actions, payload){
  if(!actions||!actions.length) return '';
  return '<div class="chat-actions">'+
    actions.map(function(a){
      var onclick = '';
      if(a.studioA && a.studioB){
        // Open in comparison studio with both entities pre-selected
        onclick = "chatOpenComparison('"+a.studioDim+"','"+
          a.studioA.replace(/'/g,"\\'")+"','"+a.studioB.replace(/'/g,"\\'")+"')";
      } else if(a.section){
        var flash = a.flashId ? "'"+a.flashId+"'" : 'null';
        onclick = "chatJumpTo('"+a.section+"',"+flash+")";
      } else if(a.filter){
        onclick = "chatApplyFilter('"+a.filter.key+"','"+a.filter.val.replace(/'/g,"\\'")+"')";
      }
      return '<span class="chat-action-pill" onclick="'+onclick+'">'+a.label+'</span>';
    }).join('')+'</div>';
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD FULL BOT BUBBLE HTML
// ─────────────────────────────────────────────────────────────────────────────
function buildBotHTML(intent){
  var p = intent.payload;
  var html = p.text || '';
  if(p.kpis)         html += renderKpis(p.kpis);
  if(p.table)        html += renderTable(p.table, p.sortLabel||'Value');
  if(p.compareTable) html += renderCompareTable(p.compareTable, p.entityA||'A', p.entityB||'B');
  if(p.extra)        html += p.extra;
  if(p.list)         html += renderList(p.list);
  if(p.chips)        html += renderSuggestChips(p.chips);
  if(p.actions)      html += renderActions(p.actions, p);
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT-TO-DASHBOARD ACTIONS (exposed to global scope for inline onclick)
// ─────────────────────────────────────────────────────────────────────────────
function chatJumpTo(sectionId, flashId){
  // Close panel
  closeChatPanel();
  setTimeout(function(){
    var el = document.getElementById(sectionId);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    if(flashId){
      setTimeout(function(){
        var target = document.getElementById(flashId);
        if(!target){ target = document.querySelector('#'+sectionId+' .card'); }
        if(target){
          target.classList.add('card-flash');
          setTimeout(function(){ target.classList.remove('card-flash'); }, 2800);
        }
      }, 600);
    }
  }, 200);
}

function chatOpenComparison(dim, aName, bName){
  closeChatPanel();
  setTimeout(function(){
    // Set the comparison studio selectors
    var dimSel = document.getElementById('comp-dim');
    if(dimSel){
      dimSel.value = dim;
      if(typeof onCompDimChange === 'function') onCompDimChange();
      setTimeout(function(){
        var selA = document.getElementById('comp-a');
        var selB = document.getElementById('comp-b');
        if(selA) selA.value = aName;
        if(selB) selB.value = bName;
        if(typeof runComparison === 'function') runComparison();
      }, 80);
    }
    var s3 = document.getElementById('s3');
    if(s3) s3.scrollIntoView({behavior:'smooth'});
    setTimeout(function(){
      var card = document.querySelector('#s3 .comp-studio');
      if(card){ card.classList.add('card-flash'); setTimeout(function(){ card.classList.remove('card-flash'); }, 2800); }
    }, 700);
  }, 200);
}

function chatApplyFilter(key, val){
  var el = document.getElementById('f-'+key);
  if(el){
    el.value = val;
    if(typeof applyFilters === 'function') applyFilters();
  }
  closeChatPanel();
  setTimeout(function(){
    var s1 = document.getElementById('s1');
    if(s1) s1.scrollIntoView({behavior:'smooth'});
  }, 200);
}

function chatSendQuery(text){
  var input = document.getElementById('chat-input');
  if(input){
    input.value = text;
    sendChatMessage();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE FEED MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function appendMsg(html, isUser){
  var feed = document.getElementById('chat-feed');
  if(!feed) return;
  var div = document.createElement('div');
  div.className = 'chat-msg ' + (isUser ? 'chat-msg-user' : 'chat-msg-bot');
  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isUser ? 'chat-bubble-user' : 'chat-bubble-bot');
  bubble.innerHTML = html;
  div.appendChild(bubble);
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  return div;
}

function showTyping(){
  var feed = document.getElementById('chat-feed');
  if(!feed) return null;
  var div = document.createElement('div');
  div.className = 'chat-msg chat-msg-bot';
  div.innerHTML = '<div class="chat-typing"><span></span><span></span><span></span></div>';
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  return div;
}

function updateScope(){
  var badge = document.getElementById('chat-scope-txt');
  if(!badge) return;
  var t = getTotals();
  badge.textContent = 'Analyzing ' + num(t.orders) + ' Orders';
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
function sendChatMessage(){
  var input = document.getElementById('chat-input');
  if(!input) return;
  var q = input.value.trim();
  if(!q) return;
  input.value = '';

  // Hide chips after first message
  var sugg = document.getElementById('chat-suggestions');
  if(sugg) sugg.style.display = 'none';

  appendMsg(q, true);

  var typingEl = showTyping();
  var delay = 400 + Math.random()*300;

  setTimeout(function(){
    if(typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    var intent = routeQuery(q);
    var botHTML = buildBotHTML(intent);
    appendMsg(botHTML, false);
    updateScope();
  }, delay);
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL OPEN / CLOSE
// ─────────────────────────────────────────────────────────────────────────────
function openChatPanel(){
  document.getElementById('chat-panel').classList.add('chat-open');
  document.getElementById('chat-launcher').classList.add('chat-open');
  var badge = document.getElementById('chat-badge');
  if(badge){ badge.classList.remove('visible'); }
  updateScope();
}

function closeChatPanel(){
  document.getElementById('chat-panel').classList.remove('chat-open');
  document.getElementById('chat-launcher').classList.remove('chat-open');
}

function toggleChatPanel(){
  var panel = document.getElementById('chat-panel');
  if(panel.classList.contains('chat-open')) closeChatPanel();
  else openChatPanel();
}

function clearChat(){
  var feed = document.getElementById('chat-feed');
  if(!feed) return;
  feed.innerHTML = '';
  var sugg = document.getElementById('chat-suggestions');
  if(sugg) sugg.style.display = 'flex';
  appendMsg('Chat cleared! Ask me anything about your Amazon India data 👋', false);
}

// ── Chat UI event wiring (safe, no inline onclick dependency) ────────────
function initChatbot() {
  // Greeting
  var t = getTotals();
  appendMsg(
    '👋 Hi Ravi! I\'m your <strong>Sapphire IQ Data Assistant</strong>. ' +
    'I have live access to <strong>' + num(t.orders) + ' Amazon India orders</strong> (2024–2026).<br><br>' +
    'Ask me anything — sales totals, top categories, revenue leakage, ' +
    'comparisons, or just say <em>\"business summary\"</em> to start!',
    false
  );

  // Stagger intro card children (if intro is showing)
  var card = document.querySelector('.intro-card');
  if (card) {
    var children = card.querySelectorAll(
      '.intro-badge,.intro-headline,.intro-subtitle,.intro-pills,.intro-divider,.intro-actions,.intro-footer'
    );
    children.forEach(function(el, i) {
      el.style.transitionDelay = (i * 90) + 'ms';
    });
  }

  // Keyboard shortcut on input
  var input = document.getElementById('chat-input');
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
    });
  }

  // Launcher button
  var launcher = document.getElementById('chat-launcher');
  if (launcher) {
    launcher.addEventListener('click', function() { toggleChatPanel(); });
    // remove any stray onclick set in HTML
    launcher.removeAttribute('onclick');
  }

  // Send button
  var sendBtn = document.getElementById('chat-send');
  if (sendBtn) {
    sendBtn.addEventListener('click', function() { sendChatMessage(); });
    sendBtn.removeAttribute('onclick');
  }

  // Clear button
  var clearBtn = document.getElementById('chat-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() { clearChat(); });
    clearBtn.removeAttribute('onclick');
  }

  // Close button
  var closeBtn = document.getElementById('chat-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() { closeChatPanel(); });
    closeBtn.removeAttribute('onclick');
  }

  // Suggestion chips — delegate via feed parent
  var sugg = document.getElementById('chat-suggestions');
  if (sugg) {
    sugg.addEventListener('click', function(e) {
      var chip = e.target.closest('.chat-chip');
      if (chip) chatSendQuery(chip.dataset.query || chip.textContent.trim());
    });
  }

  updateScope();
}

// ── Global exports ────────────────────────────────────────────────────────
window.toggleChatPanel  = toggleChatPanel;
window.closeChatPanel   = closeChatPanel;
window.openChatPanel    = openChatPanel;
window.clearChat        = clearChat;
window.sendChatMessage  = sendChatMessage;
window.chatSendQuery    = chatSendQuery;
window.chatJumpTo       = chatJumpTo;
window.chatOpenComparison = chatOpenComparison;
window.chatApplyFilter  = chatApplyFilter;

document.addEventListener('DOMContentLoaded', initChatbot);
