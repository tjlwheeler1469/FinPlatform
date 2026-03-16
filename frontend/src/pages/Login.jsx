import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsSubmitting(false);
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      navigate("/dashboard");
    } else if (result.requiresMFA) {
      // Handle MFA flow
      navigate("/mfa-verify", { state: { email } });
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  // Demo login helper
  const handleDemoLogin = () => {
    setEmail("advisor@wealthcommand.com");
    setPassword("demo123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2744] via-[#2a3a5c] to-[#1a2744] p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4A84C]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4A84C]/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a2744] flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-[#D4A84C]" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-[#1a2744]">
              Welcome to Halcyon Wealth
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Sign in to access your financial command center
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm" data-testid="login-error">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1a2744]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  data-testid="login-email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#1a2744]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  data-testid="login-password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[#D4A84C] hover:text-[#D4A84C]/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#1a2744] hover:bg-[#1a2744]/90 text-white font-semibold"
              disabled={isSubmitting || isLoading}
              data-testid="login-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo Login */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground mb-3">
              Try the demo account
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDemoLogin}
              data-testid="demo-login-btn"
            >
              Use Demo Credentials
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#D4A84C] hover:text-[#D4A84C]/80 font-medium transition-colors">
              Create one
            </Link>
          </div>
          
          <div className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
