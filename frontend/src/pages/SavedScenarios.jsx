import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  Plus, 
  Search,
  Building2,
  User,
  Trash2,
  Edit,
  MoreVertical,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePortfolio } from "@/App";
import { toast } from "sonner";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Demo scenarios using the portfolio data
const DEMO_SCENARIOS = [
  {
    scenario_id: "demo_001",
    name: "Current Portfolio Analysis",
    entity_type: "personal",
    taxable_income: 185000,
    investments: {
      cash_savings: 75000,
      shares_value: 320000,
      bonds_value: 80000,
      etf_value: 145000,
      properties: [{}, {}]
    },
    created_at: "2024-03-01T10:00:00Z",
    updated_at: "2024-03-10T15:30:00Z"
  },
  {
    scenario_id: "demo_002",
    name: "Retirement Planning 2030",
    entity_type: "personal",
    taxable_income: 150000,
    investments: {
      cash_savings: 100000,
      shares_value: 400000,
      bonds_value: 150000,
      etf_value: 200000,
      properties: [{}]
    },
    created_at: "2024-02-15T09:00:00Z",
    updated_at: "2024-03-05T11:20:00Z"
  },
  {
    scenario_id: "demo_003",
    name: "Company Structure Analysis",
    entity_type: "company",
    taxable_income: 350000,
    investments: {
      cash_savings: 200000,
      shares_value: 500000,
      bonds_value: 100000,
      etf_value: 0,
      properties: [{}, {}, {}]
    },
    created_at: "2024-01-20T14:00:00Z",
    updated_at: "2024-02-28T16:45:00Z"
  },
  {
    scenario_id: "demo_004",
    name: "Family Trust Structure",
    entity_type: "trust",
    taxable_income: 150000,
    investments: {
      cash_savings: 50000,
      shares_value: 400000,
      bonds_value: 50000,
      etf_value: 100000,
      properties: [{}]
    },
    created_at: "2024-03-05T10:00:00Z",
    updated_at: "2024-03-10T14:00:00Z"
  }
];

const SavedScenarios = () => {
  const navigate = useNavigate();
  const { portfolio } = usePortfolio();
  const [scenarios, setScenarios] = useState(DEMO_SCENARIOS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const deleteScenario = async () => {
    if (!deleteId) return;
    setScenarios(scenarios.filter(s => s.scenario_id !== deleteId));
    toast.success("Scenario deleted");
    setDeleteId(null);
  };

  const filteredScenarios = scenarios.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8" data-testid="saved-scenarios-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Saved Scenarios
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your investment scenarios
            </p>
          </div>
          <Button 
            onClick={() => navigate("/scenario-builder")}
            className="bg-[#1a2744] hover:bg-[#1a2744]/90"
            data-testid="new-scenario-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Scenario
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>

        {/* Scenarios Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={`item-${i}`} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredScenarios.length === 0 && searchQuery ? (
          <Card data-testid="empty-state">
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No scenarios found</h3>
              <p className="text-muted-foreground mb-6">
                No scenarios match your search. Try a different query.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map((scenario) => (
              <Card 
                key={scenario.scenario_id} 
                className="card-hover cursor-pointer relative group"
                data-testid={`scenario-card-${scenario.scenario_id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        scenario.entity_type === 'company' 
                          ? 'bg-[#D4A84C]/10' 
                          : 'bg-[#1a2744]/10'
                      }`}>
                        {scenario.entity_type === 'company' 
                          ? <Building2 className="h-5 w-5 text-[#D4A84C]" />
                          : <User className="h-5 w-5 text-[#1a2744]" />
                        }
                      </div>
                      <div>
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {scenario.entity_type}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`scenario-menu-${scenario.scenario_id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scenario-builder/${scenario.scenario_id}`);
                          }}
                          data-testid={`edit-${scenario.scenario_id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(scenario.scenario_id);
                          }}
                          className="text-destructive focus:text-destructive"
                          data-testid={`delete-${scenario.scenario_id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent 
                  className="pt-0"
                  onClick={() => navigate(`/scenario-builder/${scenario.scenario_id}`)}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxable Income</span>
                      <span className="font-semibold">{formatCurrency(scenario.taxable_income || 0)}</span>
                    </div>
                    
                    {scenario.investments && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Properties</span>
                          <span className="font-semibold">
                            {scenario.investments.properties?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Investments</span>
                          <span className="font-semibold text-[#10B981]">
                            {formatCurrency(
                              (scenario.investments.cash_savings || 0) +
                              (scenario.investments.shares_value || 0) +
                              (scenario.investments.bonds_value || 0) +
                              (scenario.investments.etf_value || 0)
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      {formatDate(scenario.updated_at || scenario.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this scenario? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={deleteScenario}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default SavedScenarios;
