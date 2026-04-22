// Client360 — Holdings tab: asset class breakdown with dialog drill-downs.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Wallet, BookOpen, ExternalLink } from "lucide-react";
import { ASSET_HOLDINGS } from "./data";
import { formatCurrency, formatDate } from "./utils";

const HoldingsTab = () => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[#D4A84C]" /> Net Worth Breakdown by Asset Class</CardTitle>
        <CardDescription>Click on any asset category to view detailed holdings and research</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(ASSET_HOLDINGS).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <Dialog key={key}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-[#D4A84C]" data-testid={`asset-category-${key}`}>
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                        <Icon className="h-6 w-6" style={{ color: category.color }} />
                      </div>
                      <p className="font-semibold text-lg">{formatCurrency(category.total)}</p>
                      <p className="text-xs text-muted-foreground">{category.label}</p>
                      <Badge variant="outline" className="mt-2 text-xs">{category.holdings.length} holdings</Badge>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" style={{ color: category.color }} /> {category.label} - {formatCurrency(category.total)}
                    </DialogTitle>
                    <DialogDescription>Detailed holdings and research reports</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4" /> Holdings ({category.holdings.length})</h4>
                      <div className="space-y-2">
                        {category.holdings.map((holding, idx) => (
                          <Card key={`h-${idx}`} className="bg-muted/30">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{holding.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {holding.symbol} • {holding.units.toLocaleString()} units @ ${holding.price?.toLocaleString() || "N/A"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{formatCurrency(holding.value)}</p>
                                  {holding.change !== undefined && (
                                    <p className={`text-sm ${holding.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                      {holding.change >= 0 ? "+" : ""}{holding.change}%
                                    </p>
                                  )}
                                  {holding.yield !== undefined && <p className="text-sm text-muted-foreground">Yield: {holding.yield}%</p>}
                                  {holding.rate !== undefined && <p className="text-sm text-muted-foreground">Rate: {holding.rate}%</p>}
                                </div>
                              </div>
                              {holding.costBase && (
                                <div className="mt-2 pt-2 border-t text-sm text-muted-foreground flex justify-between">
                                  <span>Cost Base: {formatCurrency(holding.costBase)}</span>
                                  <span className={holding.value > holding.costBase ? "text-emerald-600" : "text-red-600"}>
                                    P&L: {formatCurrency(holding.value - holding.costBase)} ({(((holding.value - holding.costBase) / holding.costBase) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              )}
                              {holding.maturity && <p className="text-sm text-muted-foreground mt-1">Maturity: {formatDate(holding.maturity)}</p>}
                              {holding.debt !== undefined && holding.debt > 0 && <p className="text-sm text-red-600 mt-1">Outstanding Debt: {formatCurrency(holding.debt)}</p>}
                              {holding.rental !== undefined && holding.rental > 0 && <p className="text-sm text-emerald-600 mt-1">Monthly Rental: {formatCurrency(holding.rental)}</p>}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {category.research && category.research.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <h4 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Research Reports</h4>
                          <div className="space-y-2">
                            {category.research.map((report, idx) => (
                              <Card key={`r-${idx}`} className="bg-blue-50/50 border-blue-200">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium">{report.title}</p>
                                      <p className="text-sm text-muted-foreground">{report.source} • {formatDate(report.date)}</p>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="outline" className="bg-white">{report.rating}</Badge>
                                      {report.target && <p className="text-sm text-emerald-600 mt-1">Target: ${report.target}</p>}
                                    </div>
                                  </div>
                                  <Button variant="link" size="sm" className="px-0 mt-2">
                                    <ExternalLink className="h-3 w-3 mr-1" /> View Full Report
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-r from-[#1a2744] to-[#2a3f5f] text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70">Total Portfolio Value</p>
            <p className="text-3xl font-bold">{formatCurrency(Object.values(ASSET_HOLDINGS).reduce((s, c) => s + c.total, 0))}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70">Total Holdings</p>
            <p className="text-2xl font-bold">{Object.values(ASSET_HOLDINGS).reduce((s, c) => s + c.holdings.length, 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </>
);

export default HoldingsTab;
