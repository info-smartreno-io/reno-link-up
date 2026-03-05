import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FileText, Download } from "lucide-react";

const NJ_FORM_TEMPLATES = [
  {
    code: "UCC-F100",
    name: "Construction Permit Application",
    authority: "NJ DCA",
    url: "https://www.nj.gov/dca/codes/resources/pdf/uccF100.pdf",
    description: "Main construction permit application jacket"
  },
  {
    code: "UCC-F110",
    name: "Building Subcode Technical Section",
    authority: "NJ DCA",
    url: "https://www.nj.gov/dca/codes/resources/pdf/uccF110.pdf",
    description: "Required for structural, addition, and interior remodel work"
  },
  {
    code: "UCC-F120",
    name: "Electrical Subcode Technical Section",
    authority: "NJ DCA",
    url: "https://www.nj.gov/dca/codes/resources/pdf/uccF120.pdf",
    description: "Required for all electrical work"
  },
  {
    code: "UCC-F130",
    name: "Plumbing Subcode Technical Section",
    authority: "NJ DCA",
    url: "https://www.nj.gov/dca/codes/resources/pdf/uccF130.pdf",
    description: "Required for all plumbing work"
  },
  {
    code: "UCC-F140",
    name: "Fire Protection Subcode Technical Section",
    authority: "NJ DCA",
    url: "https://www.nj.gov/dca/codes/resources/pdf/uccF140.pdf",
    description: "Required for fire protection systems"
  },
  {
    code: "UCC-F145",
    name: "Mechanical Subcode Technical Section",
    authority: "NJ DCA",
    url: "https://www.nj.gov/dca/codes/resources/pdf/uccF145.pdf",
    description: "Required for HVAC, water heaters, and boilers"
  }
];

export function PermitFormTemplates() {
  const handleDownloadTemplate = (url: string, fileName: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          NJ UCC Form Templates & Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Official NJ DCA (Department of Community Affairs) forms. Download and review before submission.
          </p>

          <div className="grid gap-3">
            {NJ_FORM_TEMPLATES.map((form) => (
              <div
                key={form.code}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {form.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {form.authority}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-1">{form.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadTemplate(form.url, form.code)}
                  className="ml-4"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Additional Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                <a
                  href="https://www.nj.gov/dca/codes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground underline"
                >
                  NJ DCA Uniform Construction Code
                </a>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                <a
                  href="https://www.nj.gov/dca/codes/resources/constructionpermitforms.shtml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground underline"
                >
                  All NJ Construction Permit Forms
                </a>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
