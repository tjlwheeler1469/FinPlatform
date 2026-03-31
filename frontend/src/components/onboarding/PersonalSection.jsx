import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Users } from "lucide-react";

const PersonalSection = ({ factFindData, updateField, addDependant }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <User className="h-5 w-5 text-[#D4A84C]" />
        Personal Details
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Select value={factFindData.personal.title} onValueChange={(v) => updateField('personal', 'title', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">Mr</SelectItem>
              <SelectItem value="mrs">Mrs</SelectItem>
              <SelectItem value="ms">Ms</SelectItem>
              <SelectItem value="miss">Miss</SelectItem>
              <SelectItem value="dr">Dr</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input value={factFindData.personal.first_name} onChange={(e) => updateField('personal', 'first_name', e.target.value)} data-testid="first-name-input" />
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input value={factFindData.personal.last_name} onChange={(e) => updateField('personal', 'last_name', e.target.value)} data-testid="last-name-input" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Date of Birth *</Label>
          <Input type="date" value={factFindData.personal.date_of_birth} onChange={(e) => updateField('personal', 'date_of_birth', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Marital Status</Label>
          <Select value={factFindData.personal.marital_status} onValueChange={(v) => updateField('personal', 'marital_status', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="de_facto">De Facto</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tax File Number</Label>
          <Input value={factFindData.personal.tax_file_number} onChange={(e) => updateField('personal', 'tax_file_number', e.target.value)} placeholder="XXX XXX XXX" />
        </div>
      </div>
      <div className="border-t pt-4">
        <h4 className="font-medium mb-4">Contact Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={factFindData.personal.email} onChange={(e) => updateField('personal', 'email', e.target.value)} data-testid="email-input" />
          </div>
          <div className="space-y-2">
            <Label>Mobile Phone *</Label>
            <Input value={factFindData.personal.phone_mobile} onChange={(e) => updateField('personal', 'phone_mobile', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <Input value={factFindData.personal.address_street} onChange={(e) => updateField('personal', 'address_street', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Suburb</Label>
            <Input value={factFindData.personal.address_suburb} onChange={(e) => updateField('personal', 'address_suburb', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Select value={factFindData.personal.address_state} onValueChange={(v) => updateField('personal', 'address_state', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Postcode</Label>
            <Input value={factFindData.personal.address_postcode} onChange={(e) => updateField('personal', 'address_postcode', e.target.value)} />
          </div>
        </div>
      </div>
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Dependants</h4>
          <Button variant="outline" size="sm" onClick={addDependant}><Users className="h-4 w-4 mr-2" /> Add Dependant</Button>
        </div>
        {factFindData.personal.dependants.map((dep, index) => (
          <div key={`dep-${index}`} className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-lg">
            <Input placeholder="Name" value={dep.name} onChange={(e) => { const d = [...factFindData.personal.dependants]; d[index].name = e.target.value; updateField('personal', 'dependants', d); }} />
            <Input type="date" value={dep.dob} onChange={(e) => { const d = [...factFindData.personal.dependants]; d[index].dob = e.target.value; updateField('personal', 'dependants', d); }} />
            <Select value={dep.relationship} onValueChange={(v) => { const d = [...factFindData.personal.dependants]; d[index].relationship = v; updateField('personal', 'dependants', d); }}>
              <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default PersonalSection;
