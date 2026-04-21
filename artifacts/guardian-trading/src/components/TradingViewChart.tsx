import { useEffect, useRef } from "react";

const CHART_CONFIG = {
  allow_symbol_change: true,
  calendar: false,
  details: false,
  hide_side_toolbar: true,
  hide_top_toolbar: false,
  hide_legend: false,
  hide_volume: false,
  hotlist: false,
  interval: "D",
  locale: "en",
  save_image: true,
  style: "1",
  symbol: "NASDAQ:AAPL",
  theme: "dark",
  timezone: "Etc/UTC",
  backgroundColor: "#0F0F0F",
  gridColor: "rgba(242, 242, 242, 0.06)",
  watchlist: [],
  withdateranges: false,
  compareSymbols: [],
  studies: [],
  autosize: true,
};

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "calc(100% - 32px)";
    widget.style.width = "100%";

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright";
    const link = document.createElement("a");
    link.href = "https://www.tradingview.com/symbols/NASDAQ-AAPL/";
    link.rel = "noopener nofollow";
    link.target = "_blank";
    const blueSpan = document.createElement("span");
    blueSpan.className = "blue-text";
    blueSpan.textContent = "AAPL stock chart";
    link.appendChild(blueSpan);
    const tmSpan = document.createElement("span");
    tmSpan.className = "trademark";
    tmSpan.textContent = " by TradingView";
    copyright.appendChild(link);
    copyright.appendChild(tmSpan);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify(CHART_CONFIG);

    container.appendChild(widget);
    container.appendChild(copyright);
    container.appendChild(script);

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        minHeight: "500px",
        display: "block",
      }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
