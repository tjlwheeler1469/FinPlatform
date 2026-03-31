import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const ReportsTab = ({ reportTypes, onDownloadReport }) => {
  return (
    <div className="space-y-4" data-testid="reports-tab">
      <h2 className="text-lg font-semibold">Download Reports</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes?.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#D4A84C]" />
                {report.name}
              </CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadReport(report.id === "audit_export" ? "audit-logs" : report.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )) || (
          <DefaultReportCards onDownloadReport={onDownloadReport} />
        )}
      </div>
    </div>
  );
};

const DefaultReportCards = ({ onDownloadReport }) => (
  <>
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">Audit Logs Export</CardTitle>
        <CardDescription>Full audit trail for regulatory compliance</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={() => onDownloadReport("audit-logs")}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </CardContent>
    </Card>
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">Scenarios Export</CardTitle>
        <CardDescription>Historical scenarios with compliance status</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={() => onDownloadReport("scenarios")}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </CardContent>
    </Card>
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">Breaches Export</CardTitle>
        <CardDescription>Compliance breaches and resolutions</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={() => onDownloadReport("breaches")}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </CardContent>
    </Card>
  </>
);

export default ReportsTab;
