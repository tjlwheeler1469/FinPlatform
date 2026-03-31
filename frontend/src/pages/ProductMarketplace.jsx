import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield,
  TrendingUp,
  Home,
  Star,
  ChevronRight,
  Check,
  DollarSign,
  Percent,
  ExternalLink,
  Filter,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Briefcase
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const ProductMarketplace = () => {
  const { portfolio } = usePortfolio();
  const [recommendations, setRecommendations] = useState(null);
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommendations");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchRecommendations();
    fetchProducts();
  }, [portfolio]);

  const fetchRecommendations = async () => {
    try {
      // Use the new AI recommendations endpoint
      const clientId = portfolio?.client_id || "default_client";
      const response = await axios.get(`${API}/marketplace/ai-recommendations/${clientId}`);
      
      // Transform recommendations to match expected format
      const data = response.data;
      setRecommendations({
        recommendations: data.recommendations || [],
        summary: {
          insurance_gaps_identified: data.recommendations?.filter(r => r.product_type === "insurance").length || 0,
          investment_opportunities: data.recommendations?.filter(r => r.product_type === "investment").length || 0,
          loan_savings_potential: data.recommendations?.filter(r => r.product_type === "mortgage")
            .reduce((sum, r) => sum + (r.potential_savings || 0), 0) || 0
        }
      });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      // Set default recommendations on error
      setRecommendations({
        recommendations: [],
        summary: { insurance_gaps_identified: 0, investment_opportunities: 0, loan_savings_potential: 0 }
      });
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch all product types from the new endpoints
      const [insurance, mortgages, investments] = await Promise.all([
        axios.get(`${API}/marketplace/products/insurance`),
        axios.get(`${API}/marketplace/products/mortgages`),
        axios.get(`${API}/marketplace/products/investments`)
      ]);
      
      // Combine products into a unified format
      const allProducts = [
        ...insurance.data.providers.map(p => ({ ...p, category: "insurance", type: "Insurance" })),
        ...mortgages.data.providers.map(p => ({ ...p, category: "mortgage", type: "Mortgage" })),
        ...investments.data.products.map(p => ({ ...p, category: "investment", type: "Investment" }))
      ];
      
      setProducts({
        products: allProducts,
        categories: ["insurance", "mortgage", "investment"]
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts({ products: [], categories: [] });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products?.products?.filter(p => 
    categoryFilter === "all" || p.category === categoryFilter
  ) || [];

  const StarRating = ({ rating }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="text-sm ml-1">{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6" data-testid="product-marketplace">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Financial Product Marketplace</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Compare insurance, investments, and loans from top providers
            </p>
          </div>
          <Button onClick={fetchRecommendations}>
            <Sparkles className="h-4 w-4 mr-2" /> Get Recommendations
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Insurance Gaps</p>
                  <p className="text-2xl font-bold">{recommendations?.summary?.insurance_gaps_identified || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Investment Opportunities</p>
                  <p className="text-2xl font-bold">{recommendations?.summary?.investment_opportunities || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Potential Annual Savings</p>
                  <p className="text-2xl font-bold">{formatCurrency(recommendations?.summary?.potential_savings || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6 mt-4">
            {/* Insurance Recommendations */}
            {recommendations?.insurance?.map((rec, i) => (
              <Card key={`item-${i}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-base">{rec.category}</CardTitle>
                    </div>
                    {rec.gap_identified && (
                      <Badge variant="destructive">Gap Identified</Badge>
                    )}
                  </div>
                  <CardDescription>{rec.reason}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        Recommended coverage: {formatCurrency(rec.recommended_coverage)}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm font-medium mb-3">Top Providers</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rec.products?.map((product, j) => (
                      <div key={j} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{product.provider}</p>
                            <p className="text-sm text-muted-foreground">{product.product_name}</p>
                          </div>
                          <StarRating rating={product.rating} />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Monthly Premium</p>
                            <p className="text-lg font-bold">${product.premium_monthly}/mo</p>
                          </div>
                          <Button size="sm">
                            Get Quote <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {product.features?.slice(0, 3).map((feature, k) => (
                            <Badge key={k} variant="secondary" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />{feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Investment Recommendations */}
            {recommendations?.investments?.map((rec, i) => (
              <Card key={`item-${i}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">{rec.category}</CardTitle>
                  </div>
                  <CardDescription>{rec.reason}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">{rec.potential_benefit}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rec.products?.map((product, j) => (
                      <div key={j} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{product.provider}</p>
                            <p className="text-sm text-muted-foreground">{product.product_name}</p>
                          </div>
                          <StarRating rating={product.rating} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">5yr Return</p>
                            <p className="font-semibold text-green-600">{product.return_5yr}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">10yr Return</p>
                            <p className="font-semibold text-green-600">{product.return_10yr}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Fees</p>
                            <p className="font-semibold">{product.fees_percent}%</p>
                          </div>
                        </div>
                        <Button className="w-full mt-3" variant="outline" size="sm">
                          Learn More <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Loan Recommendations */}
            {recommendations?.loans?.map((rec, i) => (
              <Card key={`item-${i}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base">{rec.category}</CardTitle>
                  </div>
                  <CardDescription>{rec.reason}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800 font-medium">{rec.potential_benefit}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rec.products?.map((product, j) => (
                      <div key={j} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{product.provider}</p>
                            <p className="text-sm text-muted-foreground">{product.product_name}</p>
                          </div>
                          <StarRating rating={product.rating} />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Interest Rate</p>
                            <p className="text-2xl font-bold">{product.interest_rate}%</p>
                            <p className="text-xs text-muted-foreground">Comparison: {product.comparison_rate}%</p>
                          </div>
                          <Button size="sm">
                            Apply Now <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {product.features?.slice(0, 3).map((feature, k) => (
                            <Badge key={k} variant="secondary" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />{feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Insurance Products</CardTitle>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Insurance</SelectItem>
                      <SelectItem value="life">Life Insurance</SelectItem>
                      <SelectItem value="income_protection">Income Protection</SelectItem>
                      <SelectItem value="tpd">TPD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredProducts.filter(p => p.category?.includes('life') || p.category?.includes('income') || p.category?.includes('tpd')).map((product, i) => (
                    <div key={`item-${i}`} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <Shield className="h-8 w-8 text-green-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{product.product_name}</p>
                          <Badge variant="secondary">{product.provider}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Coverage: {formatCurrency(product.coverage_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <StarRating rating={product.rating} />
                        <p className="text-lg font-bold mt-1">${product.premium_monthly}/mo</p>
                      </div>
                      <Button size="sm">
                        Get Quote <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Investment Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredProducts.filter(p => p.category?.includes('super') || p.category?.includes('etf') || p.category?.includes('managed')).map((product, i) => (
                    <div key={`item-${i}`} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{product.product_name}</p>
                          <Badge variant="secondary">{product.provider}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.asset_class || 'Diversified'}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">5yr</p>
                          <p className="font-semibold text-green-600">{product.return_5yr}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">10yr</p>
                          <p className="font-semibold text-green-600">{product.return_10yr}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fees</p>
                          <p className="font-semibold">{product.fees_percent}%</p>
                        </div>
                      </div>
                      <StarRating rating={product.rating} />
                      <Button size="sm" variant="outline">
                        Learn More
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Loan Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredProducts.filter(p => p.category?.includes('loan')).map((product, i) => (
                    <div key={`item-${i}`} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <Home className="h-8 w-8 text-purple-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{product.product_name}</p>
                          <Badge variant="secondary">{product.provider}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Max LVR: {product.max_lvr}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{product.interest_rate}%</p>
                        <p className="text-xs text-muted-foreground">Comp: {product.comparison_rate}%</p>
                      </div>
                      <StarRating rating={product.rating} />
                      <Button size="sm">
                        Apply <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProductMarketplace;
