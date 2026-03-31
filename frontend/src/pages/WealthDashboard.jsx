import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Home, Building2, Bitcoin, 
  PiggyBank, BarChart3, PieChart, RefreshCcw, ArrowUpRight, ArrowDownRight,
  Banknote, LineChart, Landmark
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WealthDashboard() {
  const [wealthData, setWealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchWealthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWealthData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/wealth/overview/client_1`);
      setWealthData(response.data);
    } catch (error) {
      console.error("Error fetching wealth data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', { 
      style: 'currency', 
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getAssetIcon = (assetClass) => {
    const icons = {
      cash: <Banknote className="w-5 h-5" />,
      shares: <LineChart className="w-5 h-5" />,
      etfs: <BarChart3 className="w-5 h-5" />,
      managed_funds: <PieChart className="w-5 h-5" />,
      property: <Home className="w-5 h-5" />,
      super: <Landmark className="w-5 h-5" />,
      crypto: <Bitcoin className="w-5 h-5" />,
      other: <Wallet className="w-5 h-5" />
    };
    return icons[assetClass] || <Wallet className="w-5 h-5" />;
  };

  const getAssetColor = (assetClass) => {
    const colors = {
      cash: "from-emerald-500 to-emerald-600",
      shares: "from-blue-500 to-blue-600",
      etfs: "from-purple-500 to-purple-600",
      managed_funds: "from-amber-500 to-amber-600",
      property: "from-rose-500 to-rose-600",
      super: "from-cyan-500 to-cyan-600",
      crypto: "from-orange-500 to-orange-600",
      other: "from-slate-500 to-slate-600"
    };
    return colors[assetClass] || "from-slate-500 to-slate-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="wealth-dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wealth Dashboard</h1>
          <p className="text-slate-400">Complete view across all asset classes</p>
        </div>
        <Button onClick={fetchWealthData} variant="outline" className="border-slate-700">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 border-0 col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Net Worth</p>
                <p className="text-4xl font-bold text-white mt-1">
                  {formatCurrency(wealthData?.summary.net_worth)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-0">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +{wealthData?.summary.net_worth_change_percent_ytd}% YTD
                  </Badge>
                  <span className="text-blue-100 text-sm">
                    +{formatCurrency(wealthData?.summary.net_worth_change_ytd)}
                  </span>
                </div>
              </div>
              <Wallet className="w-16 h-16 text-white/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Assets</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(wealthData?.summary.total_assets)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Liabilities</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(wealthData?.summary.total_liabilities)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Asset Allocation
          </CardTitle>
          <CardDescription className="text-slate-400">
            Distribution across all asset classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wealthData?.asset_allocation && Object.entries(wealthData.asset_allocation).map(([key, data]) => (
              <div key={key} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAssetColor(key)} flex items-center justify-center text-white`}>
                    {getAssetIcon(key)}
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{key.replace('_', ' ')}</p>
                    <p className="text-slate-400 text-sm">{formatCurrency(data.value)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Current</span>
                    <span className="text-white font-medium">{data.percent}%</span>
                  </div>
                  <Progress value={data.percent} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Target: {data.target}%</span>
                    <span className={data.percent > data.target ? 'text-amber-400' : data.percent < data.target - 2 ? 'text-blue-400' : 'text-emerald-400'}>
                      {data.percent > data.target ? 'Overweight' : data.percent < data.target - 2 ? 'Underweight' : 'On Target'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="shares" className="data-[state=active]:bg-blue-600">Shares</TabsTrigger>
          <TabsTrigger value="property" className="data-[state=active]:bg-blue-600">Property</TabsTrigger>
          <TabsTrigger value="super" className="data-[state=active]:bg-blue-600">Super</TabsTrigger>
          <TabsTrigger value="crypto" className="data-[state=active]:bg-blue-600">Crypto</TabsTrigger>
          <TabsTrigger value="cash" className="data-[state=active]:bg-blue-600">Cash</TabsTrigger>
        </TabsList>

        <TabsContent value="shares" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Share Portfolio</CardTitle>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Total Value</p>
                    <p className="text-white font-bold">{formatCurrency(wealthData?.shares.total_value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Unrealized Gain</p>
                    <p className="text-emerald-400 font-bold">+{formatCurrency(wealthData?.shares.unrealized_gain)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="text-left p-3 text-slate-400 font-medium">Stock</th>
                      <th className="text-right p-3 text-slate-400 font-medium">Units</th>
                      <th className="text-right p-3 text-slate-400 font-medium">Avg Cost</th>
                      <th className="text-right p-3 text-slate-400 font-medium">Current</th>
                      <th className="text-right p-3 text-slate-400 font-medium">Value</th>
                      <th className="text-right p-3 text-slate-400 font-medium">Gain</th>
                      <th className="text-right p-3 text-slate-400 font-medium">Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wealthData?.shares.holdings.map((holding) => (
                      <tr key={holding.ticker} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                        <td className="p-3">
                          <p className="font-semibold text-white">{holding.ticker}</p>
                          <p className="text-sm text-slate-400">{holding.name}</p>
                        </td>
                        <td className="p-3 text-right text-slate-300">{holding.units.toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-300">${holding.avg_cost.toFixed(2)}</td>
                        <td className="p-3 text-right text-white font-medium">${holding.current_price.toFixed(2)}</td>
                        <td className="p-3 text-right text-white font-medium">{formatCurrency(holding.value)}</td>
                        <td className="p-3 text-right">
                          <span className={holding.gain_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {holding.gain_percent >= 0 ? '+' : ''}{holding.gain_percent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-blue-400">{holding.dividend_yield.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property" className="mt-4">
          <div className="grid gap-4">
            {wealthData?.property.properties.map((property, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                        property.type === 'ppor' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                      }`}>
                        <Home className={`w-7 h-7 ${property.type === 'ppor' ? 'text-emerald-400' : 'text-blue-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{property.address}</p>
                        <Badge className={property.type === 'ppor' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}>
                          {property.type === 'ppor' ? 'Primary Residence' : 'Investment Property'}
                        </Badge>
                        <p className="text-slate-400 text-sm mt-2">Purchased: {property.purchase_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Current Value</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(property.value)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-700">
                    <div>
                      <p className="text-slate-400 text-sm">Purchase Price</p>
                      <p className="text-white font-medium">{formatCurrency(property.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Mortgage Balance</p>
                      <p className="text-white font-medium">{formatCurrency(property.mortgage_balance)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Equity</p>
                      <p className="text-emerald-400 font-medium">{formatCurrency(property.equity)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">{property.type === 'investment' ? 'Rental Income' : 'Interest Rate'}</p>
                      <p className="text-white font-medium">
                        {property.type === 'investment' ? `$${property.rental_income}/wk` : `${property.mortgage_rate}%`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="super" className="mt-4">
          <div className="grid gap-4">
            {wealthData?.super.funds.map((fund, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Landmark className="w-7 h-7 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{fund.fund_name}</p>
                        <Badge className="bg-purple-500/20 text-purple-400">{fund.investment_option}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Balance</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(fund.balance)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-400 text-sm">1 Year Return</p>
                      <p className="text-emerald-400 font-bold text-lg">+{fund.return_1y}%</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-400 text-sm">5 Year Return</p>
                      <p className="text-emerald-400 font-bold text-lg">+{fund.return_5y}% p.a.</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-400 text-sm">Annual Fees</p>
                      <p className="text-white font-bold text-lg">{formatCurrency(fund.fees_pa)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-400 text-sm">Insurance</p>
                      <p className="text-white font-bold text-lg">{fund.insurance ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Contribution Summary */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Contribution Summary (YTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm">Employer</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(wealthData?.super.contributions_ytd.employer)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm">Personal</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(wealthData?.super.contributions_ytd.personal)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm">Concessional Cap Remaining</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(wealthData?.super.caps.concessional_remaining)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm">Non-Concessional Remaining</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(wealthData?.super.caps.non_concessional_remaining)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crypto" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Bitcoin className="w-5 h-5 text-orange-400" />
                  Cryptocurrency Holdings
                </CardTitle>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Total Value</p>
                    <p className="text-white font-bold">{formatCurrency(wealthData?.crypto.total_value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Unrealized Gain</p>
                    <p className="text-emerald-400 font-bold">+{formatCurrency(wealthData?.crypto.unrealized_gain)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {wealthData?.crypto.holdings.map((holding) => (
                  <div key={holding.symbol} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        holding.symbol === 'BTC' ? 'bg-orange-500/20' : 
                        holding.symbol === 'ETH' ? 'bg-purple-500/20' : 'bg-cyan-500/20'
                      }`}>
                        <span className={`font-bold ${
                          holding.symbol === 'BTC' ? 'text-orange-400' : 
                          holding.symbol === 'ETH' ? 'text-purple-400' : 'text-cyan-400'
                        }`}>{holding.symbol}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{holding.name}</p>
                        <p className="text-slate-400 text-sm">{holding.units} {holding.symbol}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Price</p>
                        <p className="text-white font-medium">${holding.current_price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Value</p>
                        <p className="text-white font-medium">{formatCurrency(holding.value)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Gain</p>
                        <p className={`font-medium ${(holding.value - holding.cost_base) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(holding.value - holding.cost_base) >= 0 ? '+' : ''}{formatCurrency(holding.value - holding.cost_base)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-sm mt-4">Exchange: {wealthData?.crypto.exchange}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  Cash & Bank Accounts
                </CardTitle>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Total Cash</p>
                  <p className="text-white font-bold text-xl">{formatCurrency(wealthData?.cash.total)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {wealthData?.cash.accounts.map((account, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        account.type === 'term_deposit' ? 'bg-purple-500/20' : 
                        account.type === 'savings' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                      }`}>
                        <PiggyBank className={`w-6 h-6 ${
                          account.type === 'term_deposit' ? 'text-purple-400' : 
                          account.type === 'savings' ? 'text-emerald-400' : 'text-blue-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{account.name}</p>
                        <Badge className="bg-slate-700 text-slate-300 capitalize">{account.type.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Interest Rate</p>
                        <p className="text-emerald-400 font-medium">{account.interest_rate}%</p>
                      </div>
                      {account.maturity && (
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Maturity</p>
                          <p className="text-white font-medium">{account.maturity}</p>
                        </div>
                      )}
                      <div className="text-right min-w-[120px]">
                        <p className="text-slate-400 text-sm">Balance</p>
                        <p className="text-white font-bold text-lg">{formatCurrency(account.balance)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-400">Interest Earned YTD: <span className="text-emerald-400 font-medium">{formatCurrency(wealthData?.cash.total_interest_earned_ytd)}</span></p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
