# Sapphire IQ — Amazon India Sales & Profit Intelligence Dashboard

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.3-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

An enterprise-grade, interactive executive intelligence dashboard built for e-commerce performance analytics across Amazon India operations. Designed for executive presentations, financial audits, and deep operational drill-downs across 10,000 orders (2024–2026).

---

## 🌟 Key Highlights & Features

### 1. Executive Pulse & Trajectory (Section 1)
* **Real-time KPI Metrics**: Gross Order Value (GOV), Net Realized Sales, Total Realized Profit, Total Volume, Net Margin %, and Revenue Leakage.
* **Dynamic Revenue Lens**: Instant toggle between **Gross Order Value** and **Net Realized Sales** (`Delivered` + `Shipped`) across all metrics and visualizations.
* **Interactive Time Trajectory**: Multi-year monthly timeline (2024–2026) with volume & revenue dual-axis analysis.

### 2. Category & Product Intelligence Studio (Section 2)
* **Category Breakdown**: Performance metrics across 5 major verticals (*Apparel & Fashion*, *Beauty & Personal Care*, *Electronics & Mobiles*, *Home & Kitchen*, *Pantry & Groceries*).
* **Pareto 80/20 Analysis**: Cumulative revenue curve identifying the core ~20% SKU drivers delivering ~80% of top-line revenue.
* **Return & Cancellation Analysis**: Categorical leakage audit surfacing return rates and operational bottlenecks.

### 3. Interactive Comparison Studio (Section 3)
* **6-Axis Performance Radar**: Side-by-side multi-dimensional benchmarking (Sales, Profit, Margin %, AOV, Units Sold, Completion Rate).
* **Automated Presets & Delta Badges**: One-click comparisons (*Electronics vs. Fashion*, *UPI vs. COD*, *FBA vs. FBM*, *Maharashtra vs. Karnataka*) with automated % delta badges.
* **What-If Scenario Simulator**: Dynamic sliders for Price Adjustments, Cost of Goods (COGS), and Marketing Spend to simulate net margin shifts in real time.

### 4. Order Funnel & Risk Matrix (Section 4)
* **4-Stage Order Funnel**: End-to-end visualization of order lifecycle (`Delivered` ➔ `Shipped` ➔ `Returned` ➔ `Cancelled`).
* **Payment Risk Matrix**: Cash on Delivery (COD) vs. UPI vs. Cards vs. Net Banking default rates and return correlation.
* **Fulfillment Efficiency**: Comparative SLA, delivery rate, and profitability metrics across *Amazon (FBA)*, *Seller Flex*, and *Merchant (FBM)*.

### 5. Geography & State Performance Matrix (Section 5)
* **Top 10 Indian States**: Regional breakdown across Maharashtra, Karnataka, Telangana, Tamil Nadu, Uttar Pradesh, Delhi, West Bengal, Gujarat, Rajasthan, and Kerala.
* **Configurable 2D Heatmap**: Interactive cross-tabulation matrix (State × Category × Channel) with intensity gradients and order density.
* **Slide-over Drill-Down Drawer**: Click any state, product, or category to inspect granular orders, unit economics, and return profiles.

### 6. Built-in Natural Language Data Assistant
* **Floating Glassmorphic Chat Drawer**: Non-technical managers can query data using natural English.
* **Live Calculation Engine**: Directly parses active filtered dataset in memory (no hardcoded responses).
* **Action Deep-Links**: Bot responses include clickable action pills that automatically jump to charts, populate Comparison Studio presets, or trigger dashboard filters.

### 7. Export & Reporting Suite
* **Executive PDF Report**: Generate structured multi-page PDF summaries with KPI callouts, top insights, and audit records via jsPDF.
* **PNG Image Exports**: High-resolution chart card snapshots and full-dashboard canvas captures via html2canvas.
* **Live Excel/CSV Ingestion**: Drag-and-drop new `.xlsx` or `.csv` files into the dropzone to instantly refresh all charts via SheetJS.

---

## 🏗 Modular Architecture

The application is structured into decoupled, modular components designed to work offline or online via both `http://` and `file://` protocols:

```
amazon_india dashboard sapphire/
├── index.html          # Semantic HTML5 markup (zero inline CSS/JS)
├── styles.css          # Glassmorphic pastel theme, micro-interactions, responsive grid
├── js/
│   ├── data.js         # Core dataset (window.AGG), state management, formatters (en-IN)
│   ├── charts.js       # Chart.js renderers, Comparison Studio, Heatmap, PDF/PNG export
│   └── chatbot.js      # NLP query parser, intent routing engine, floating chat drawer
├── agg_data.json       # Pre-computed multi-dimensional aggregations
├── data.json           # Raw transactional sample dataset
└── package.json        # Project metadata and offline tooling dependencies
```

---

## 🚀 Getting Started

### Option 1: Direct File Access (No Server Required)
Simply double-click `index.html` or open it directly in any modern browser:
```bash
file:///d:/amazon_india%20dashboard%20sapphire/index.html
```

### Option 2: Local Web Server
You can serve the project using Python, Node.js, or any static file server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx serve)
npx serve .
```
Then visit `http://localhost:8080` in your web browser.

---

## 🛠 Tech Stack

* **Frontend**: Vanilla JavaScript (ES6+), HTML5, Modern CSS3 (CSS Variables, Flexbox, Grid, Glassmorphism, Backdrop Filters).
* **Charting**: [Chart.js 4.4.3](https://www.chartjs.org/) (Bar, Line, Doughnut, Radar, Pareto, Dual-Axis).
* **Reporting & Export**: [jsPDF 2.5.1](https://github.com/parallax/jsPDF) & [html2canvas 1.4.1](https://html2canvas.hertzen.com/).
* **Data Processing**: [SheetJS (xlsx 0.18.5)](https://sheetjs.com/).
* **Design Language**: Custom Sapphire Pastel Glassmorphic palette with native Indian numbering formats (`₹`, `Cr`, `L`, `K`).

---

## 👤 Author & Credits

* **Developer**: Yash Raj Bhatnagar ([@Yashraj-mlrobo](https://github.com/Yashraj-mlrobo))
* **Project**: Sapphire IQ — Amazon India Sales & Profit Intelligence Studio

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
