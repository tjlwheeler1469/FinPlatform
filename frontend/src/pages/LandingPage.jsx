import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Building2, 
  PiggyBank, 
  Calculator, 
  BarChart3, 
  Shield,
  ChevronRight,
  Landmark,
  Percent
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const LandingPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Calculator,
      title: "Tax Optimization",
      description: "Calculate personal and company taxes with current 2024-25 Australian rates including franking credits"
    },
    {
      icon: Building2,
      title: "Property Portfolio",
      description: "Analyze multiple properties with negative gearing, depreciation, and rental yield calculations"
    },
    {
      icon: BarChart3,
      title: "Monte Carlo Simulations",
      description: "Advanced projections with probability distributions for informed investment decisions"
    },
    {
      icon: Landmark,
      title: "Loan Analysis",
      description: "Variable rate scenarios, repayment schedules, and debt-to-equity optimization"
    },
    {
      icon: PiggyBank,
      title: "All Investment Types",
      description: "Cash, bonds, stocks, ETFs, SMSF - comprehensive analysis of your entire portfolio"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your financial data is encrypted and never shared. Save and compare scenarios securely"
    }
  ];

  const investmentTypes = [
    { name: "Cash & Term Deposits", icon: PiggyBank },
    { name: "Shares & ETFs", icon: TrendingUp },
    { name: "Property Portfolio", icon: Building2 },
    { name: "Bonds & Fixed Income", icon: Percent },
    { name: "SMSF Management", icon: Landmark }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1769188409186-864de08c4642?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzeWRuZXklMjBza3lsaW5lJTIwZmluYW5jZXxlbnwwfHx8fDE3NzMxNDA2NjV8MA&ixlib=rb-4.1.0&q=85')`
          }}
        />
        <div className="absolute inset-0 hero-gradient" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 text-white">
              <p className="text-[#D4AF37] font-medium mb-4 tracking-wide uppercase text-sm animate-fade-in">
                Australian Investment Analysis
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in stagger-1 font-['Manrope']">
                Optimize Your
                <span className="text-[#D4AF37] block">Wealth Strategy</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl animate-fade-in stagger-2">
                Comprehensive investment analysis for personal and business portfolios. 
                Calculate taxes, analyze properties, and run Monte Carlo simulations 
                with current Australian tax rates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in stagger-3">
                <Button 
                  data-testid="get-started-btn"
                  onClick={login}
                  className="bg-[#D4AF37] text-[#0F392B] hover:bg-[#D4AF37]/90 text-lg px-8 py-6 font-semibold"
                >
                  Get Started Free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  data-testid="learn-more-btn"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="lg:col-span-5 animate-fade-in stagger-4">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4 font-['Manrope']">Investment Types Covered</h3>
                  <div className="space-y-3">
                    {investmentTypes.map((type, index) => (
                      <div 
                        key={type.name}
                        className="flex items-center gap-3 text-white/90 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <type.icon className="h-5 w-5 text-[#D4AF37]" />
                        <span>{type.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Manrope'] text-foreground">
              Powerful Analysis Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to make informed investment decisions with Australian tax considerations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="card-hover border border-border/50 bg-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-[#0F392B] flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 font-['Manrope'] text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tax Info Section */}
      <section className="py-20 px-6 md:px-12 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-['Manrope'] text-foreground">
                Updated for 2024-25 Tax Year
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our calculations use the latest Australian Tax Office rates including 
                Stage 3 tax cuts, updated Medicare levy thresholds, and current company tax rates.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Personal Tax Brackets</h4>
                    <p className="text-muted-foreground text-sm">16% rate on $18,201-$45,000, 30% on $45,001-$135,000</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Company Tax Rates</h4>
                    <p className="text-muted-foreground text-sm">25% base rate for eligible companies, 30% full rate</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Franking Credits</h4>
                    <p className="text-muted-foreground text-sm">Full imputation with 25% company tax rate basis</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1537849156823-51cf0388f86c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxhdXN0cmFsaWFuJTIwY3VycmVuY3klMjBub3RlcyUyMGJ1c2luZXNzfGVufDB8fHx8MTc3MzE0MDY3MHww&ixlib=rb-4.1.0&q=85"
                alt="Australian Finance"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-[#0F392B] text-white p-4 rounded-lg shadow-lg">
                <p className="text-3xl font-bold font-['Manrope']">$18,200</p>
                <p className="text-sm text-white/80">Tax-Free Threshold</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-[#0F392B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-['Manrope'] text-white">
            Start Optimizing Your Investments Today
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of Australian investors making smarter financial decisions
          </p>
          <Button 
            data-testid="cta-get-started-btn"
            onClick={login}
            className="bg-[#D4AF37] text-[#0F392B] hover:bg-[#D4AF37]/90 text-lg px-10 py-6 font-semibold"
          >
            Get Started Free
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#0F392B]" />
            <span className="font-bold font-['Manrope'] text-foreground">WealthOptimizer AU</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 WealthOptimizer. Australian tax calculations for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
