import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User,
  Users,
  Briefcase,
  ArrowRight,
  Shield,
  Home,
  Eye,
  Settings,
  Sparkles
} from "lucide-react";

const ModeSelector = () => {
  const navigate = useNavigate();

  const selectMode = (mode, path) => {
    localStorage.setItem("app_mode", mode);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F392B] to-[#1a5c45] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-[#D4AF37] flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-[#0F392B]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Wheeler Financial</h1>
          <p className="text-white/70">Australian Investment & Tax Planning Platform</p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Use */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer group" onClick={() => selectMode("personal", "/daily-briefing")}>
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0F392B]/10 flex items-center justify-center mb-4 group-hover:bg-[#0F392B]/20 transition-colors">
                <User className="h-8 w-8 text-[#0F392B]" />
              </div>
              <CardTitle className="text-2xl">Personal Use</CardTitle>
              <CardDescription className="text-base">
                Manage your own investments, tax planning, and financial goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-4 w-4 text-[#10B981]" />
                  Full portfolio management
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4 text-[#10B981]" />
                  All calculators & tools
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-[#10B981]" />
                  Tax analysis & CGT tracking
                </div>
              </div>
              <Button className="w-full bg-[#0F392B] group-hover:bg-[#0F392B]/90">
                Enter Personal Mode <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Adviser Use */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer group" onClick={() => selectMode("adviser", "/adviser-dashboard")}>
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                <Briefcase className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Adviser Portal</CardTitle>
                <Badge className="bg-[#D4AF37] text-[#0F392B]">Pro</Badge>
              </div>
              <CardDescription className="text-base">
                Manage multiple clients with full access to their accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-[#D4AF37]" />
                  Multi-client management
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 text-[#D4AF37]" />
                  Drill into client accounts
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-[#D4AF37]" />
                  AFSL compliance tools
                </div>
              </div>
              <Button className="w-full bg-[#D4AF37] text-[#0F392B] hover:bg-[#D4AF37]/90">
                Enter Adviser Mode <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Client Access Link */}
        <div className="text-center mt-8">
          <button 
            onClick={() => selectMode("client", "/client-portal")}
            className="text-white/70 hover:text-white text-sm underline underline-offset-4"
          >
            Are you a client? Access your Client Portal →
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/50 text-sm">
          <p>Australian Financial Services • ASIC Compliant</p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
