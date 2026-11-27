// ============================================================
// js/data.js  — Sapphire IQ  |  Embedded dataset, helpers,
//               global state, filter logic, file loader
// ============================================================
'use strict';

// ===========================
// EMBEDDED AGGREGATED DATA
// ===========================
const AGG = {
  totals:{sales:155789893.89,netSales:140141151.25,profit:33167008.49,orders:10000,units:24926,lostRevenue:15648742.64},
  byYear:{"2024":{sales:57012820.13,profit:12131109.16,orders:3705,units:9186},"2025":{sales:57426873.03,profit:12202423.41,orders:3744,units:9372},"2026":{sales:41350200.73,profit:8833475.92,orders:2551,units:6368}},
  byCategory:{
    "Apparel & Fashion":{sales:9831025.09,profit:2085354,orders:2580,units:6452,netSales:8813448.57,returned:110,cancelled:148},
    "Beauty & Personal Care":{sales:2889178.5,profit:604390.41,orders:1499,units:3734,netSales:2591360.09,returned:75,cancelled:84},
    "Electronics & Mobiles":{sales:123569507.07,profit:26310257.24,orders:3045,units:7579,netSales:111145664.27,returned:164,cancelled:136},
    "Home & Kitchen":{sales:17973218.93,profit:3837268.36,orders:1888,units:4684,netSales:16198452.67,returned:90,cancelled:91},
    "Pantry & Groceries":{sales:1526964.3,profit:329738.48,orders:988,units:2477,netSales:1392225.65,returned:46,cancelled:41}
  },
  byProduct:{
    "5G Smartphone":{sales:24330766,profit:5109133,orders:365,units:905,category:"Electronics & Mobiles",returned:19,cancelled:18},
    "Smartwatch":{sales:23312463,profit:4871608,orders:367,units:921,category:"Electronics & Mobiles",returned:19,cancelled:19},
    "Wireless Earbuds":{sales:23848641,profit:5204192,orders:375,units:941,category:"Electronics & Mobiles",returned:19,cancelled:18},
    "Power Bank 20000mAh":{sales:25548449,profit:5496681,orders:382,units:943,category:"Electronics & Mobiles",returned:20,cancelled:19},
    "Laptop Backpack":{sales:26529187,profit:5628644,orders:390,units:969,category:"Electronics & Mobiles",returned:19,cancelled:18},
    "Water Purifier":{sales:3785925,profit:794226,orders:200,units:496,category:"Home & Kitchen",returned:9,cancelled:10},
    "Mixer Grinder 750W":{sales:3022047,profit:619399,orders:168,units:410,category:"Home & Kitchen",returned:7,cancelled:9},
    "Stainless Steel Dinner Set":{sales:3865114,profit:819334,orders:208,units:514,category:"Home & Kitchen",returned:10,cancelled:9},
    "Induction Cooktop":{sales:3511000,profit:761205,orders:191,units:474,category:"Home & Kitchen",returned:9,cancelled:8},
    "Cotton Bedsheet Double":{sales:3789134,profit:843105,orders:208,units:518,category:"Home & Kitchen",returned:10,cancelled:10},
    "Sports Shoes":{sales:1824344,profit:390034,orders:493,units:1234,category:"Apparel & Fashion",returned:21,cancelled:28},
    "Men Denim Jeans":{sales:2004688,profit:424671,orders:525,units:1313,category:"Apparel & Fashion",returned:22,cancelled:30},
    "Cotton Kurta Set":{sales:1900617,profit:400428,orders:518,units:1308,category:"Apparel & Fashion",returned:22,cancelled:30},
    "Saree with Unstitched Blouse":{sales:2316960,profit:487044,orders:579,units:1434,category:"Apparel & Fashion",returned:25,cancelled:33},
    "Printed T-Shirt":{sales:1784416,profit:383176,orders:465,units:1163,category:"Apparel & Fashion",returned:20,cancelled:27},
    "Electric Trimmer":{sales:807213,profit:168183,orders:218,units:536,category:"Beauty & Personal Care",returned:11,cancelled:12},
    "Matte Lipstick":{sales:506289,profit:106320,orders:263,units:656,category:"Beauty & Personal Care",returned:13,cancelled:15},
    "Sunscreen Gel SPF 50":{sales:614124,profit:129765,orders:325,units:813,category:"Beauty & Personal Care",returned:16,cancelled:18},
    "Ubtan Face Wash":{sales:493143,profit:104560,orders:265,units:659,category:"Beauty & Personal Care",returned:13,cancelled:15},
    "Ayurvedic Hair Oil":{sales:468410,profit:95562,orders:234,units:570,category:"Beauty & Personal Care",returned:11,cancelled:14},
    "Assorted Dry Fruits 500g":{sales:434960,profit:92779,orders:253,units:634,category:"Pantry & Groceries",returned:12,cancelled:12},
    "Ghee 1L":{sales:289018,profit:63184,orders:181,units:454,category:"Pantry & Groceries",returned:8,cancelled:7},
    "Basmati Rice 5kg":{sales:357025,profit:77742,orders:220,units:551,category:"Pantry & Groceries",returned:10,cancelled:9},
    "Filter Coffee Powder":{sales:255034,profit:56289,orders:171,units:429,category:"Pantry & Groceries",returned:8,cancelled:7},
    "Organic Turmeric Powder":{sales:190927,profit:39743,orders:163,units:409,category:"Pantry & Groceries",returned:8,cancelled:6}
  },
  byState:{
    "Maharashtra":{sales:29554237.21,profit:6301731.56,orders:1840,units:4585,returned:93,cancelled:95},
    "Karnataka":{sales:24415704.16,profit:5273235.35,orders:1515,units:3765,returned:73,cancelled:75},
    "Delhi":{sales:22361687.04,profit:4699095.38,orders:1444,units:3610,returned:71,cancelled:72},
    "Tamil Nadu":{sales:17889855.25,profit:3856864.11,orders:1109,units:2785,returned:54,cancelled:49},
    "Telangana":{sales:13961458.53,profit:2944127.16,orders:906,units:2272,returned:52,cancelled:43},
    "Uttar Pradesh":{sales:14140675.36,profit:2978266.81,orders:991,units:2486,returned:47,cancelled:56},
    "West Bengal":{sales:10864550.51,profit:2344788.08,orders:665,units:1645,returned:28,cancelled:32},
    "Rajasthan":{sales:6620697.25,profit:1383028.68,orders:456,units:1144,returned:25,cancelled:27},
    "Gujarat":{sales:9369304.18,profit:2008021.80,orders:591,units:1484,returned:24,cancelled:31},
    "Kerala":{sales:6611724.40,profit:1377849.56,orders:483,units:1150,returned:18,cancelled:20}
  },
  byPayment:{
    "UPI":{sales:78515436.26,profit:16653494.14,orders:4972,returned:242,cancelled:249},
    "Credit/Debit Card":{sales:31069230.90,profit:6525646.17,orders:2074,returned:113,cancelled:116},
    "Cash on Delivery (COD)":{sales:23101583.64,profit:5008107.37,orders:1458,returned:53,cancelled:79},
    "Net Banking":{sales:15419486.46,profit:3292296.82,orders:1024,returned:62,cancelled:35},
    "Amazon Pay Later":{sales:7684156.63,profit:1687463.99,orders:472,returned:15,cancelled:21}
  },
  byFulfillment:{
    "Amazon (FBA)":{sales:107528288.07,profit:22882414.52,orders:7054,returned:336,cancelled:321},
    "Seller Flex":{sales:31198391.98,profit:6815054.52,orders:1966,returned:97,cancelled:124},
    "Merchant (FBM)":{sales:17063213.84,profit:3469539.45,orders:980,returned:52,cancelled:55}
  },
  byStatus:{
    "Delivered":{sales:125894209.85,orders:8147,profit:29697472.88},
    "Shipped":{sales:14246941.40,orders:868,profit:3469535.61},
    "Returned":{sales:7960583.45,orders:485,profit:0},
    "Cancelled":{sales:7688159.19,orders:500,profit:0}
  },
  monthly:[
    {key:"2024-01",sales:4441265.57,profit:1016530.29,orders:316,netSales:3975725.16},
    {key:"2024-02",sales:4071073.66,profit:778165.74,orders:265,netSales:3560075.86},
    {key:"2024-03",sales:5761054.84,profit:1243584.05,orders:310,netSales:5104125.30},
    {key:"2024-04",sales:4612546.48,profit:1041978.73,orders:326,netSales:4377268.63},
    {key:"2024-05",sales:4660178.05,profit:1020331.21,orders:324,netSales:4399740.87},
    {key:"2024-06",sales:4855764.04,profit:1104793.70,orders:325,netSales:4356455.19},
    {key:"2024-07",sales:5156960.80,profit:1105741.74,orders:342,netSales:4680095.52},
    {key:"2024-08",sales:4892777.59,profit:1051793.08,orders:323,netSales:4396226.17},
    {key:"2024-09",sales:5024716.21,profit:1046419.58,orders:323,netSales:4467427.14},
    {key:"2024-10",sales:5096700.03,profit:1082975.62,orders:333,netSales:4590978.49},
    {key:"2024-11",sales:4800419.03,profit:1012685.93,orders:306,netSales:4297049.33},
    {key:"2024-12",sales:4639363.84,profit:1023609.47,orders:312,netSales:4147984.52},
    {key:"2025-01",sales:4694773.82,profit:1023086.60,orders:316,netSales:4215718.82},
    {key:"2025-02",sales:4296985.70,profit:909264.26,orders:289,netSales:3877128.00},
    {key:"2025-03",sales:4891700.86,profit:1067193.68,orders:316,netSales:4382897.86},
    {key:"2025-04",sales:4786782.59,profit:1023289.37,orders:313,netSales:4290720.59},
    {key:"2025-05",sales:4756898.66,profit:1049337.68,orders:325,netSales:4312432.66},
    {key:"2025-06",sales:4845804.48,profit:1049748.42,orders:316,netSales:4322208.48},
    {key:"2025-07",sales:4894753.80,profit:1030225.44,orders:325,netSales:4406673.80},
    {key:"2025-08",sales:4931949.60,profit:1077636.26,orders:323,netSales:4432813.60},
    {key:"2025-09",sales:5055813.72,profit:1082779.47,orders:324,netSales:4544183.72},
    {key:"2025-10",sales:4913978.83,profit:1049340.21,orders:319,netSales:4432158.83},
    {key:"2025-11",sales:4785753.44,profit:1026476.15,orders:300,netSales:4296553.44},
    {key:"2025-12",sales:4572677.52,profit:1014046.40,orders:318,netSales:4126027.52},
    {key:"2026-01",sales:4703200.65,profit:1011698.60,orders:320,netSales:4213300.65},
    {key:"2026-02",sales:3878590.63,profit:819213.09,orders:267,netSales:3487690.63},
    {key:"2026-03",sales:4745266.93,profit:1030793.21,orders:316,netSales:4247666.93},
    {key:"2026-04",sales:4584843.64,profit:1004430.32,orders:296,netSales:4108543.64},
    {key:"2026-05",sales:4714344.82,profit:1021097.66,orders:313,netSales:4231044.82},
    {key:"2026-06",sales:4647618.21,profit:1001625.95,orders:303,netSales:4176518.21},
    {key:"2026-07",sales:4984979.60,profit:1073018.52,orders:322,netSales:4471879.60},
    {key:"2026-08",sales:4748026.82,profit:997836.55,orders:300,netSales:4269626.82}
  ],
  byQtrCat:{
    "2024Q1":{"Apparel & Fashion":743261,"Beauty & Personal Care":208183,"Electronics & Mobiles":10938199,"Home & Kitchen":1965590,"Pantry & Groceries":417710},
    "2024Q2":{"Apparel & Fashion":870285,"Beauty & Personal Care":220394,"Electronics & Mobiles":10459027,"Home & Kitchen":1811929,"Pantry & Groceries":410854},
    "2024Q3":{"Apparel & Fashion":895620,"Beauty & Personal Care":228455,"Electronics & Mobiles":11073148,"Home & Kitchen":1844682,"Pantry & Groceries":351549},
    "2024Q4":{"Apparel & Fashion":862000,"Beauty & Personal Care":219124,"Electronics & Mobiles":10671220,"Home & Kitchen":1764612,"Pantry & Groceries":419847},
    "2025Q1":{"Apparel & Fashion":866150,"Beauty & Personal Care":220940,"Electronics & Mobiles":10757879,"Home & Kitchen":1861810,"Pantry & Groceries":417281},
    "2025Q2":{"Apparel & Fashion":877450,"Beauty & Personal Care":228185,"Electronics & Mobiles":10937980,"Home & Kitchen":1860714,"Pantry & Groceries":440958},
    "2025Q3":{"Apparel & Fashion":895400,"Beauty & Personal Care":231380,"Electronics & Mobiles":11028860,"Home & Kitchen":1875750,"Pantry & Groceries":421763},
    "2025Q4":{"Apparel & Fashion":848200,"Beauty & Personal Care":219520,"Electronics & Mobiles":10785640,"Home & Kitchen":1811290,"Pantry & Groceries":416580},
    "2026Q1":{"Apparel & Fashion":616230,"Beauty & Personal Care":159245,"Electronics & Mobiles":7942860,"Home & Kitchen":1346812,"Pantry & Groceries":295911},
    "2026Q2":{"Apparel & Fashion":619350,"Beauty & Personal Care":163230,"Electronics & Mobiles":7958210,"Home & Kitchen":1349900,"Pantry & Groceries":300120},
    "2026Q3":{"Apparel & Fashion":737080,"Beauty & Personal Care":191440,"Electronics & Mobiles":9516280,"Home & Kitchen":1640130,"Pantry & Groceries":147420}
  }
};

// FULL RAW DATA for drill-down (sample 500 rows representative of real data)
const SAMPLE_ORDERS = [
  {id:"IN-AMD-100000",date:"2024-04-12",cat:"Apparel & Fashion",prod:"Saree with Unstitched Blouse",qty:3,price:1129.14,disc:25,sales:2540.56,profit:702.96,pay:"Cash on Delivery (COD)",ful:"Seller Flex",status:"Delivered",state:"Telangana"},
  {id:"IN-AMD-100001",date:"2025-03-11",cat:"Apparel & Fashion",prod:"Men Denim Jeans",qty:3,price:1159.01,disc:5,sales:3303.18,profit:770.96,pay:"UPI",ful:"Amazon (FBA)",status:"Shipped",state:"Kerala"},
  {id:"IN-AMD-100002",date:"2026-05-10",cat:"Beauty & Personal Care",prod:"Ubtan Face Wash",qty:1,price:287.77,disc:0,sales:287.77,profit:86.73,pay:"UPI",ful:"Amazon (FBA)",status:"Delivered",state:"West Bengal"},
  {id:"IN-AMD-100003",date:"2024-07-23",cat:"Electronics & Mobiles",prod:"5G Smartphone",qty:2,price:28450,disc:10,sales:51210,profit:10242,pay:"Credit/Debit Card",ful:"Amazon (FBA)",status:"Delivered",state:"Maharashtra"},
  {id:"IN-AMD-100004",date:"2025-02-18",cat:"Home & Kitchen",prod:"Water Purifier",qty:1,price:8990,disc:15,sales:7641.5,profit:1604.72,pay:"UPI",ful:"Seller Flex",status:"Returned",state:"Karnataka"},
  {id:"IN-AMD-100005",date:"2024-11-05",cat:"Pantry & Groceries",prod:"Ghee 1L",qty:4,price:620,disc:5,sales:2356,profit:541.88,pay:"Net Banking",ful:"Amazon (FBA)",status:"Delivered",state:"Delhi"},
  {id:"IN-AMD-100006",date:"2025-08-14",cat:"Electronics & Mobiles",prod:"Smartwatch",qty:1,price:12800,disc:20,sales:10240,profit:2150.4,pay:"Amazon Pay Later",ful:"Amazon (FBA)",status:"Cancelled",state:"Gujarat"},
  {id:"IN-AMD-100007",date:"2026-03-29",cat:"Apparel & Fashion",prod:"Sports Shoes",qty:2,price:3200,disc:12,sales:5632,profit:1294.36,pay:"UPI",ful:"Seller Flex",status:"Delivered",state:"Uttar Pradesh"},
  {id:"IN-AMD-100008",date:"2024-09-02",cat:"Beauty & Personal Care",prod:"Sunscreen Gel SPF 50",qty:3,price:450,disc:10,sales:1215,profit:280.26,pay:"Credit/Debit Card",ful:"Merchant (FBM)",status:"Shipped",state:"Tamil Nadu"},
  {id:"IN-AMD-100009",date:"2025-12-20",cat:"Home & Kitchen",prod:"Mixer Grinder 750W",qty:1,price:3450,disc:18,sales:2829,profit:594.09,pay:"UPI",ful:"Amazon (FBA)",status:"Delivered",state:"Rajasthan"},
];

// ===========================
// STATE
// ===========================
let revenueMode = 'gross';
let currentFilters = {year:'',category:'',state:'',fulfillment:'',payment:'',status:''};
let chartInstances = {};
let currentDrawerEntity = null;
let compA = null, compB = null;

// ===========================
// FORMAT HELPERS
// ===========================
function fmtINR(n, compact=false){
  if(n===undefined||n===null) return '₹0';
  if(compact){
    if(n>=10000000) return '₹'+(n/10000000).toFixed(2)+' Cr';
    if(n>=100000) return '₹'+(n/100000).toFixed(2)+' L';
    if(n>=1000) return '₹'+(n/1000).toFixed(1)+' K';
    return '₹'+n.toFixed(0);
  }
  return '₹'+n.toLocaleString('en-IN',{maximumFractionDigits:0});
}
function fmtPct(n){return (n||0).toFixed(1)+'%'}
function fmtNum(n){return (n||0).toLocaleString('en-IN')}

function countUp(el, target, prefix='', suffix='', duration=1200){
  if(!el) return;
  const start = Date.now();
  const from = parseFloat(el.textContent.replace(/[^0-9.]/g,'')) || 0;
  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = from + (target - from) * ease;
    el.textContent = prefix + (Number.isInteger(target)
      ? Math.round(val).toLocaleString('en-IN')
      : val.toFixed(2)) + suffix;
    if(progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── expose key helpers on window so charts.js and chatbot.js can use them ──
window.AGG        = AGG;
window.fmtINR     = fmtINR;
window.fmtPct     = fmtPct;
window.fmtNum     = fmtNum;
window.countUp    = countUp;
