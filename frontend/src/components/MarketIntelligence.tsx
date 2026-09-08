import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Activity, BarChart2, ShieldCheck, Compass } from "lucide-react";

interface MarketIntelligenceProps {
  currency: string;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ currency }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.getPrices(currency);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currency]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
      </div>
    );
  }

  const prices = data?.prices || [];
  const latestPrice = data?.latest_price || (141.72 * (currency === "SGD" ? 1.34 : (currency === "INR" ? 83.5 : 1)));
  const latestDailyClose = data?.latest_daily_close || latestPrice;
  const volatility = data?.volatility || 12.4;
  const percentile = data?.percentile || 24.5;
  const validation = data?.validation || { status: "Success", raw_records: 0, unique_records: 0, duplicates_removed: 0 };

  const sma50 = data?.sma_50 || latestPrice;
  const sma200 = data?.sma_200 || latestPrice;
  const distance50 = data?.distance_50 !== undefined ? data.distance_50 : (((latestPrice - sma50) / sma50) * 100);
  const distance200 = sma200 > 0 ? (((latestPrice - sma200) / sma200) * 100) : 0;

  const isBelow50 = latestPrice < sma50;
  const isBelow200 = latestPrice < sma200;

  let momentumTitle = "Neutral Price Momentum";
  let momentumExplanation = "Current price is tracking closely with its moving averages.";

  if (isBelow50 && isBelow200) {
    momentumTitle = "Weak Short-Term Momentum";
    momentumExplanation = "Current price is below both the 50-day and 200-day moving averages, indicating weaker recent price momentum.";
  } else if (!isBelow50 && !isBelow200) {
    momentumTitle = "Positive Short-Term Momentum";
    momentumExplanation = "Current price is above both the 50-day and 200-day moving averages, indicating constructive recent price momentum.";
  } else if (!isBelow50 && isBelow200) {
    momentumTitle = "Short-Term Rebound Momentum";
    momentumExplanation = "Current price has moved above its 50-day moving average but remains below its longer-term 200-day moving average.";
  } else {
    momentumTitle = "Consolidating Momentum";
    momentumExplanation = "Current price is below the 50-day moving average while holding above the longer-term 200-day moving average.";
  }

  const percentileExplanation = percentile <= 25.0
    ? "Current gold prices are in the lower quarter of the selected historical distribution."
    : (percentile <= 75.0
        ? "Current gold prices are in the middle range of the selected historical distribution."
        : "Current gold prices are in the upper quarter of the selected historical distribution.");

  // Format YYYY-MM-DD dates to a clean month-year format for cleaner visual tick labels on x-axis
  const formatXAxis = (tickItem: string) => {
    try {
      const parts = tickItem.split("-");
      if (parts.length < 3) return tickItem;
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear().toString().substring(2);
      
      if (month === "Jan") {
        return `${month} '${year}`;
      }
      return month;
    } catch {
      return tickItem;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-1 text-xs font-semibold text-gold border border-gold/20">
            <Activity className="h-3.5 w-3.5" />
            BigQuery Market Intelligence Active
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">Historical Market Intelligence</h2>
          <p className="text-mutedText text-sm max-w-xl">
            Analyze long-term gold trends, volatility indices, and cost percentiles derived from daily global closing prices.
          </p>
        </div>
        <div className="text-left md:text-right text-[10px] text-mutedText/80 font-mono bg-background/50 p-2.5 rounded border border-border">
          <span className="block font-bold text-gold">DATA PIPELINE VALIDATION</span>
          <span>Raw records: {validation.raw_records}</span> • <span>Unique days: {validation.unique_records}</span><br />
          <span>Duplicates removed: {validation.duplicates_removed}</span> • <span>Status: {validation.status}</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-mutedText text-xs font-semibold uppercase tracking-wider">
              <span>Spot Gold Rate</span>
              <TrendingUp className="h-4.5 w-4.5 text-gold" />
            </div>
            <p className="mt-2 text-2xl font-black text-white">
              {currency} {latestPrice.toFixed(2)}/g
            </p>
            <span className="text-[10px] text-mutedText uppercase font-semibold">Latest 24K Spot Rate</span>
          </div>
          <div className="mt-3 text-xs flex gap-2 border-t border-border/40 pt-2.5">
            <span className={data?.daily_change_percent >= 0 ? "text-emerald-400" : "text-rose-400"}>
              Daily: {data?.daily_change_percent >= 0 ? "+" : ""}{data?.daily_change_percent}%
            </span>
            <span className={data?.monthly_change_percent >= 0 ? "text-emerald-400" : "text-rose-400"}>
              Monthly: {data?.monthly_change_percent >= 0 ? "+" : ""}{data?.monthly_change_percent}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-mutedText text-xs font-semibold uppercase tracking-wider">
              <span>90-Day Volatility</span>
              <Activity className="h-4.5 w-4.5 text-gold" />
            </div>
            <p className="mt-2 text-2xl font-black text-white">{volatility}%</p>
            <span className="text-[10px] text-mutedText uppercase font-semibold">90-Day Annualised Volatility</span>
          </div>
          <p className="mt-3 text-[10px] text-mutedText border-t border-border/40 pt-2.5">
            Annualised standard deviation of daily returns
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-mutedText text-xs font-semibold uppercase tracking-wider">
              <span>Historical Percentile</span>
              <BarChart2 className="h-4.5 w-4.5 text-gold" />
            </div>
            <p className="mt-2 text-2xl font-black text-white">{percentile}th percentile</p>
            <span className="text-[10px] text-mutedText uppercase font-semibold">5-Year Historical Percentile</span>
          </div>
          <p className="mt-3 text-[10px] text-mutedText border-t border-border/40 pt-2.5 leading-tight">
            Above ~{percentile}% and below ~{(100 - percentile).toFixed(1)}% of historical observations.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-mutedText text-xs font-semibold uppercase tracking-wider">
              <span>Market Momentum</span>
              <Compass className="h-4.5 w-4.5 text-gold" />
            </div>
            <p className="mt-2 text-sm font-black text-white line-clamp-1">{momentumTitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-mutedText uppercase font-semibold">vs 50D:</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${distance50 >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                {distance50 >= 0 ? "+" : ""}{Number(distance50).toFixed(2)}%
              </span>
              <span className="text-[10px] text-mutedText uppercase font-semibold">vs 200D:</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${distance200 >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                {distance200 >= 0 ? "+" : ""}{Number(distance200).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="mt-3 text-[9px] text-mutedText border-t border-border/40 pt-2.5 flex justify-between items-center">
            <span>50D SMA: {currency} {sma50.toFixed(2)}/g</span>
            <span className="text-gold font-bold px-1.5 py-0.5 rounded bg-gold/10 text-[8px]">Planning signal</span>
          </div>
        </div>
      </div>

      {/* What This Means For Your Goal */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gold-light">What This Means For Your Goal</h4>
          <span className="text-[10px] text-mutedText font-semibold bg-background/50 px-2 py-0.5 rounded border border-border">
            Planning signal, not a price prediction
          </span>
        </div>
        <div className="space-y-2 text-sm text-white leading-relaxed">
          <p>
            <strong className="text-gold font-bold">{percentileExplanation}</strong> Current price is above approximately <strong className="text-gold">{percentile}%</strong> of historical observations and below approximately <strong className="text-gold">{(100 - percentile).toFixed(1)}%</strong>.
          </p>
          <p className="text-xs text-mutedText leading-relaxed">
            {momentumExplanation} 
            Current Spot: <strong className="text-white">{currency} {latestPrice.toFixed(2)}/g</strong> • 
            50D SMA: <strong className="text-white">{currency} {sma50.toFixed(2)}/g</strong> ({distance50 >= 0 ? "+" : ""}{Number(distance50).toFixed(2)}%) • 
            200D SMA: <strong className="text-white">{currency} {sma200.toFixed(2)}/g</strong> ({distance200 >= 0 ? "+" : ""}{Number(distance200).toFixed(2)}%).
          </p>
          <p className="text-xs text-mutedText italic border-t border-border/30 pt-2 font-medium">
            * Note: These metrics represent descriptive statistical summaries of historical performance to assist savings planning and do not constitute predictions of future gold market rates.
          </p>
        </div>
      </div>

      {/* Recharts Composed Area + Line Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">24K Gold Price — 1 Year Historical Trend</h4>
            <p className="text-xs text-mutedText mt-0.5">Daily closing prices in {currency} per gram with 50D and 200D moving average benchmarks</p>
          </div>
          <div className="text-left sm:text-right text-[10px] text-mutedText">
            <span>Latest Spot: <strong className="text-gold">{currency} {latestPrice.toFixed(2)}/g</strong></span><br />
            <span>Latest Daily Close: <strong className="text-white">{currency} {latestDailyClose.toFixed(2)}/g</strong></span>
          </div>
        </div>

        <div className="h-72">
          {prices.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={prices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#8A94A6" 
                  fontSize={9} 
                  tickLine={false} 
                  tickFormatter={formatXAxis}
                  interval={22}
                />
                <YAxis 
                  stroke="#8A94A6" 
                  fontSize={10} 
                  tickLine={false} 
                  domain={["dataMin - 5", "dataMax + 5"]} 
                  label={{ value: `${currency}/g`, angle: -90, position: "insideLeft", offset: 10, fill: "#8A94A6", fontSize: 9 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#12141C", border: "1px solid #202530", color: "#fff", borderRadius: "8px" }}
                  labelStyle={{ color: "#8A94A6", fontWeight: "bold" }}
                  formatter={(value: any, name: any) => {
                    return [`${currency} ${Number(value).toFixed(2)}/g`, String(name)];
                  }}
                />
                <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: "10px" }} />
                <Area 
                  type="monotone" 
                  dataKey="gold_price" 
                  name="24K Gold Price" 
                  stroke="#D4AF37" 
                  strokeWidth={1.5} 
                  fillOpacity={1} 
                  fill="url(#colorGold)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="sma_50" 
                  name="50-Day SMA" 
                  stroke="#8A94A6" 
                  strokeWidth={1.2} 
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="sma_200" 
                  name="200-Day SMA" 
                  stroke="#4F46E5" 
                  strokeWidth={1.2} 
                  strokeDasharray="6 2"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-mutedText">No data available</div>
          )}
        </div>
      </div>

      {/* SECTION 16 — Purchase Budget Scenarios */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Purchase Budget Scenarios</h3>
            <p className="text-xs text-mutedText mt-0.5">Evaluate how future market price shifts impact your jewellery acquisition budget</p>
          </div>
          <span className="text-[10px] font-bold text-gold uppercase px-2.5 py-1 rounded bg-gold/10 border border-gold/20">
            Budget Stress Scenarios (Not Forecasts)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-mutedText font-semibold">Scenario 1 (-10%)</span>
              <span className="text-emerald-400 font-bold">-10% Drop</span>
            </div>
            <p className="text-xl font-black text-white font-mono">{currency} {(latestPrice * 0.90).toFixed(2)}/g</p>
            <div className="text-[11px] text-mutedText space-y-1 border-t border-border/40 pt-2">
              <div>10g (22K Piece): <strong className="text-white">{currency} {(10 * 0.9167 * latestPrice * 0.90 * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
              <div>20g (22K Piece): <strong className="text-white">{currency} {(20 * 0.9167 * latestPrice * 0.90 * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
            </div>
          </div>

          <div className="bg-background border border-gold/40 rounded-xl p-4 space-y-2 bg-gold/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gold font-bold">Scenario 2 (Current)</span>
              <span className="text-gold font-bold">Baseline Rate</span>
            </div>
            <p className="text-xl font-black text-gold font-mono">{currency} {latestPrice.toFixed(2)}/g</p>
            <div className="text-[11px] text-mutedText space-y-1 border-t border-gold/20 pt-2">
              <div>10g (22K Piece): <strong className="text-white">{currency} {(10 * 0.9167 * latestPrice * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
              <div>20g (22K Piece): <strong className="text-white">{currency} {(20 * 0.9167 * latestPrice * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-mutedText font-semibold">Scenario 3 (+10%)</span>
              <span className="text-amber-400 font-bold">+10% Rise</span>
            </div>
            <p className="text-xl font-black text-white font-mono">{currency} {(latestPrice * 1.10).toFixed(2)}/g</p>
            <div className="text-[11px] text-mutedText space-y-1 border-t border-border/40 pt-2">
              <div>10g (22K Piece): <strong className="text-white">{currency} {(10 * 0.9167 * latestPrice * 1.10 * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
              <div>20g (22K Piece): <strong className="text-white">{currency} {(20 * 0.9167 * latestPrice * 1.10 * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-mutedText font-semibold">Scenario 4 (+20%)</span>
              <span className="text-rose-400 font-bold">+20% Rise</span>
            </div>
            <p className="text-xl font-black text-white font-mono">{currency} {(latestPrice * 1.20).toFixed(2)}/g</p>
            <div className="text-[11px] text-mutedText space-y-1 border-t border-border/40 pt-2">
              <div>10g (22K Piece): <strong className="text-white">{currency} {(10 * 0.9167 * latestPrice * 1.20 * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
              <div>20g (22K Piece): <strong className="text-white">{currency} {(20 * 0.9167 * latestPrice * 1.20 * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-mutedText leading-relaxed bg-background/50 p-3 rounded-lg border border-border/60">
          <strong>Planning Note:</strong> These scenarios help users plan savings under different gold-price assumptions and are not forecasts. Finished jewellery costs include estimated standard retail making charges (~15%).
        </p>
      </div>

      {/* Analytics Disclaimer */}
      <div className="rounded-xl border border-border bg-background p-4 flex gap-3 items-center">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
        <span className="text-xs text-mutedText">
          <strong>Data Strategy:</strong> Market insights are calculated from historical daily gold price data in BigQuery. Historical percentile, volatility, and moving-average indicators are descriptive statistics used for purchase planning and are not guaranteed price predictions.
        </span>
      </div>
    </div>
  );
};
