// Client360 — Performance tab: portfolio vs benchmark area chart with timeframe toggles.
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart as LineIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PERFORMANCE_TIMEFRAMES } from "./data";
import { formatCurrency, generatePerformanceData } from "./utils";

const PerformanceSection = () => {
  const [timeframe, setTimeframe] = useState("1Y");
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const monthsMap = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "2Y": 24, "3Y": 36, "5Y": 60, "10Y": 120 };
    setPerformanceData(generatePerformanceData(monthsMap[timeframe] || 12));
  }, [timeframe]);

  const startValue = performanceData[0]?.value || 0;
  const endValue = performanceData[performanceData.length - 1]?.value || 0;
  const totalReturn = startValue ? ((endValue - startValue) / startValue) * 100 : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><LineIcon className="h-5 w-5 text-[#D4A84C]" /> Portfolio Performance</CardTitle>
              <CardDescription>Historical returns vs benchmark</CardDescription>
            </div>
            <div className="flex gap-1">
              {PERFORMANCE_TIMEFRAMES.map((tf) => (
                <Button key={tf} size="sm" variant={timeframe === tf ? "default" : "outline"} onClick={() => setTimeframe(tf)} className={timeframe === tf ? "bg-[#D4A84C] text-black hover:bg-[#C49A3C]" : ""}>
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis stroke="#666" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${(val / 1_000_000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} formatter={(value) => [formatCurrency(value), ""]} />
                <Area type="monotone" dataKey="value" name="Portfolio" stroke="#3B82F6" fill="url(#colorPortfolio)" strokeWidth={2} />
                <Area type="monotone" dataKey="benchmark" name="Benchmark" stroke="#9CA3AF" fill="url(#colorBenchmark)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Return ({timeframe})</p>
          <p className={`text-2xl font-bold ${totalReturn >= 0 ? "text-emerald-600" : "text-red-600"}`}>{totalReturn >= 0 ? "+" : ""}{totalReturn.toFixed(2)}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Starting Value</p><p className="text-2xl font-bold">{formatCurrency(startValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Current Value</p><p className="text-2xl font-bold">{formatCurrency(endValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Absolute Gain/Loss</p>
          <p className={`text-2xl font-bold ${endValue >= startValue ? "text-emerald-600" : "text-red-600"}`}>{endValue >= startValue ? "+" : ""}{formatCurrency(endValue - startValue)}</p>
        </CardContent></Card>
      </div>
    </>
  );
};

export default PerformanceSection;
