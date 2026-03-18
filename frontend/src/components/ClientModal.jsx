import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Save, Users, Building2, Shield, Briefcase } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const ClientModal = ({ open, onOpenChange, client = null, onSuccess }) => {
  const isEditing = !!client;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(client || {
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "individual",
    status: "prospect",
    risk_profile: "TBD",
    adviser: "Mark Thompson",
    annual_income: 0,
    notes: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    setLoading(true);

    try {
      const url = isEditing 
        ? `${API_URL}/api/crm/clients/${client.client_id}`
        : `${API_URL}/api/crm/clients`;
      
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(isEditing ? "Client updated successfully" : "Client created successfully");
        onSuccess?.(data.client);
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save client");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "household": return Users;
      case "trust": return Building2;
      case "smsf": return Shield;
      case "partnership": return Briefcase;
      default: return UserPlus;
    }
  };

  const TypeIcon = getTypeIcon(formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="client-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-[#D4A84C]" />
            {isEditing ? "Edit Client" : "New Client"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update client information" : "Add a new client to your practice"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., John & Jane Smith"
              data-testid="client-name-input"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@example.com"
                data-testid="client-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="0400 000 000"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Street, City, State, Postcode"
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Type</Label>
              <Select 
                value={formData.type}
                onValueChange={(v) => handleChange("type", v)}
              >
                <SelectTrigger data-testid="client-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="household">Household/Couple</SelectItem>
                  <SelectItem value="trust">Family Trust</SelectItem>
                  <SelectItem value="smsf">SMSF</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="review">Review Due</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Risk Profile & Adviser */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Risk Profile</Label>
              <Select 
                value={formData.risk_profile}
                onValueChange={(v) => handleChange("risk_profile", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TBD">To Be Determined</SelectItem>
                  <SelectItem value="Conservative">Conservative</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
                  <SelectItem value="Aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned Adviser</Label>
              <Select 
                value={formData.adviser}
                onValueChange={(v) => handleChange("adviser", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mark Thompson">Mark Thompson</SelectItem>
                  <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                  <SelectItem value="James Wilson">James Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Annual Income */}
          <div className="space-y-2">
            <Label htmlFor="income">Estimated Annual Income</Label>
            <Input
              id="income"
              type="number"
              value={formData.annual_income}
              onChange={(e) => handleChange("annual_income", Number(e.target.value))}
              placeholder="0"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about this client..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-[#1a2744] hover:bg-[#1a2744]/90"
            data-testid="save-client-btn"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Update Client" : "Create Client"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientModal;
