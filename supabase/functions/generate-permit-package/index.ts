import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratePackageRequest {
  permitId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { permitId }: GeneratePackageRequest = await req.json();
    console.log(`Generating permit package for permit: ${permitId}`);

    // Fetch permit with all related data
    const { data: permit, error: permitError } = await supabase
      .from("permits")
      .select(`
        *,
        projects:project_id (
          id,
          client_name,
          client_email,
          client_phone,
          address,
          project_type,
          project_description,
          estimated_contract_value,
          square_footage
        )
      `)
      .eq("id", permitId)
      .maybeSingle();

    if (permitError) throw permitError;
    if (!permit) throw new Error("Permit not found");

    const project = Array.isArray(permit.projects) ? permit.projects[0] : permit.projects;
    if (!project) throw new Error("No project associated with this permit");

    // Fetch required forms for this permit
    const { data: forms, error: formsError } = await supabase
      .from("permit_required_forms")
      .select("*")
      .eq("permit_id", permitId)
      .order("form_code");

    if (formsError) throw formsError;

    console.log(`Generating ${forms?.length || 0} forms`);

    // Create master PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add cover page
    await addCoverPage(pdfDoc, permit, project, forms || [], font, boldFont);

    // Generate each form
    for (const form of forms || []) {
      console.log(`Generating form: ${form.form_code}`);
      await addFormPage(pdfDoc, form, permit, project, font, boldFont);
    }

    // Add checklist page
    await addChecklistPage(pdfDoc, forms || [], font, boldFont);

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Save to storage
    const fileName = `permit-package-${permitId}-${Date.now()}.pdf`;
    const filePath = `permits/packages/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("permit-documents")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get signed URL for download
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("permit-documents")
      .createSignedUrl(filePath, 3600); // 1 hour

    if (urlError) throw urlError;

    // Update permit with package info
    await supabase
      .from("permits")
      .update({ 
        updated_at: new Date().toISOString(),
        notes: permit.notes ? `${permit.notes}\n\nPackage generated: ${new Date().toISOString()}` : `Package generated: ${new Date().toISOString()}`
      })
      .eq("id", permitId);

    console.log("Permit package generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        downloadUrl: signedUrlData.signedUrl,
        fileName,
        formCount: forms?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error generating permit package:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

async function addCoverPage(
  pdfDoc: PDFDocument,
  permit: any,
  project: any,
  forms: any[],
  font: any,
  boldFont: any
) {
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  // Header
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 100,
    color: rgb(0.2, 0.3, 0.5)
  });

  page.drawText("PERMIT APPLICATION PACKAGE", {
    x: 50,
    y: height - 50,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1)
  });

  page.drawText(`${permit.jurisdiction_municipality}, ${permit.jurisdiction_state}`, {
    x: 50,
    y: height - 75,
    size: 14,
    font,
    color: rgb(1, 1, 1)
  });

  // Project Information
  let yPos = height - 140;
  const lineHeight = 20;

  page.drawText("PROJECT INFORMATION", {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont
  });

  yPos -= lineHeight * 1.5;

  const projectInfo = [
    [`Owner:`, project.client_name || "N/A"],
    [`Address:`, project.address || "N/A"],
    [`Project Type:`, project.project_type || "N/A"],
    [`Estimated Value:`, project.estimated_contract_value ? `$${Number(project.estimated_contract_value).toLocaleString()}` : "N/A"],
    [`Square Footage:`, project.square_footage ? `${project.square_footage} sq ft` : "N/A"],
  ];

  for (const [label, value] of projectInfo) {
    page.drawText(label, { x: 50, y: yPos, size: 11, font: boldFont });
    page.drawText(value, { x: 180, y: yPos, size: 11, font });
    yPos -= lineHeight;
  }

  // Forms Included
  yPos -= lineHeight;
  page.drawText("FORMS INCLUDED IN THIS PACKAGE", {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont
  });

  yPos -= lineHeight * 1.5;

  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    page.drawText(`${i + 1}.`, { x: 50, y: yPos, size: 11, font: boldFont });
    page.drawText(`${form.form_code} - ${form.form_name}`, { x: 70, y: yPos, size: 11, font });
    yPos -= lineHeight;
  }

  // Footer
  page.drawText(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, {
    x: 50,
    y: 30,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });

  page.drawText("SmartReno Permit Management System", {
    x: width - 250,
    y: 30,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });
}

async function addFormPage(
  pdfDoc: PDFDocument,
  form: any,
  permit: any,
  project: any,
  font: any,
  boldFont: any
) {
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  // Form header
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(0.95, 0.95, 0.95)
  });

  page.drawText(form.form_code, {
    x: 50,
    y: height - 35,
    size: 18,
    font: boldFont
  });

  page.drawText(form.form_name, {
    x: 50,
    y: height - 52,
    size: 12,
    font
  });

  // Form content based on form type
  let yPos = height - 100;
  const lineHeight = 18;

  if (form.form_code === "UCC-F100") {
    // Construction Permit Application
    const fields = [
      ["1. OWNER INFORMATION", ""],
      ["   Name:", project.client_name || ""],
      ["   Address:", project.address || ""],
      ["   Phone:", project.client_phone || ""],
      ["   Email:", project.client_email || ""],
      ["", ""],
      ["2. CONSTRUCTION LOCATION", ""],
      ["   Address:", project.address || ""],
      ["   Municipality:", permit.jurisdiction_municipality || ""],
      ["   Block/Lot:", "To be filled by applicant"],
      ["", ""],
      ["3. TYPE OF WORK", ""],
      ["   Description:", project.project_type || ""],
      ["   " + (project.project_description || "Residential renovation")],
      ["", ""],
      ["4. ESTIMATED COST", ""],
      ["   Value:", project.estimated_contract_value ? `$${Number(project.estimated_contract_value).toLocaleString()}` : ""],
      ["", ""],
      ["5. CONTRACTOR INFORMATION", ""],
      ["   To be provided by licensed contractor"],
    ];

    for (const [label, value] of fields) {
      if (label.startsWith("   ")) {
        page.drawText(label, { x: 70, y: yPos, size: 10, font });
        if (value) {
          page.drawText(value, { x: 200, y: yPos, size: 10, font });
        }
      } else if (label) {
        page.drawText(label, { x: 50, y: yPos, size: 11, font: boldFont });
      }
      yPos -= lineHeight;
    }
  } else if (form.form_code === "UCC-F110") {
    // Building Subcode
    addBuildingSubcodeContent(page, project, yPos, lineHeight, font, boldFont);
  } else if (form.form_code === "UCC-F120") {
    // Electrical Subcode
    addElectricalSubcodeContent(page, project, yPos, lineHeight, font, boldFont);
  } else if (form.form_code === "UCC-F130") {
    // Plumbing Subcode
    addPlumbingSubcodeContent(page, project, yPos, lineHeight, font, boldFont);
  } else if (form.form_code === "UCC-F145") {
    // Mechanical Subcode
    addMechanicalSubcodeContent(page, project, yPos, lineHeight, font, boldFont);
  } else {
    // Generic form
    page.drawText("This form requires manual completion.", {
      x: 50,
      y: yPos,
      size: 11,
      font
    });
    yPos -= lineHeight * 2;
    page.drawText(`Project: ${project.project_type}`, { x: 50, y: yPos, size: 10, font });
    yPos -= lineHeight;
    page.drawText(`Location: ${project.address}`, { x: 50, y: yPos, size: 10, font });
  }

  // Footer
  page.drawText(`Form ${form.form_code} - Page 1`, {
    x: 50,
    y: 30,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });
}

function addBuildingSubcodeContent(page: any, project: any, startY: number, lineHeight: number, font: any, boldFont: any) {
  let yPos = startY;
  const fields = [
    ["BUILDING SUBCODE TECHNICAL SECTION", ""],
    ["", ""],
    ["Construction Type:", "Type V-B (Wood Frame Residential - typical)"],
    ["Use Group:", "R-5 (One and Two Family Residential)"],
    ["Square Footage:", project.square_footage ? `${project.square_footage} sq ft` : "To be measured"],
    ["Number of Stories:", "To be determined"],
    ["", ""],
    ["Structural Work:", "As described in plans"],
    ["Foundation:", "Existing / New construction - see plans"],
    ["Framing:", "Wood frame construction per IRC"],
    ["", ""],
    ["Fire Protection:", "Smoke detectors per code"],
    ["Egress:", "Windows and doors per code requirements"],
  ];

  for (const [label, value] of fields) {
    if (label) {
      page.drawText(label, { x: 50, y: yPos, size: 10, font: boldFont });
      if (value) {
        page.drawText(value, { x: 250, y: yPos, size: 10, font });
      }
    }
    yPos -= lineHeight;
  }
}

function addElectricalSubcodeContent(page: any, project: any, startY: number, lineHeight: number, font: any, boldFont: any) {
  let yPos = startY;
  page.drawText("ELECTRICAL WORK SCOPE", { x: 50, y: yPos, size: 11, font: boldFont });
  yPos -= lineHeight * 1.5;
  page.drawText("□ Service upgrade", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ New circuits", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ Lighting fixtures", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ Receptacle outlets", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight * 2;
  page.drawText("Licensed electrician required. Detailed plans to be submitted.", { x: 50, y: yPos, size: 9, font });
}

function addPlumbingSubcodeContent(page: any, project: any, startY: number, lineHeight: number, font: any, boldFont: any) {
  let yPos = startY;
  page.drawText("PLUMBING WORK SCOPE", { x: 50, y: yPos, size: 11, font: boldFont });
  yPos -= lineHeight * 1.5;
  page.drawText("□ New fixtures", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ Rough-in plumbing", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ Water heater", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ Gas piping", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight * 2;
  page.drawText("Licensed plumber required. Detailed plans to be submitted.", { x: 50, y: yPos, size: 9, font });
}

function addMechanicalSubcodeContent(page: any, project: any, startY: number, lineHeight: number, font: any, boldFont: any) {
  let yPos = startY;
  page.drawText("MECHANICAL WORK SCOPE", { x: 50, y: yPos, size: 11, font: boldFont });
  yPos -= lineHeight * 1.5;
  page.drawText("□ HVAC system", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ Ductwork", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight;
  page.drawText("□ Ventilation", { x: 70, y: yPos, size: 10, font });
  yPos -= lineHeight * 2;
  page.drawText("Licensed HVAC contractor required. Load calculations to be submitted.", { x: 50, y: yPos, size: 9, font });
}

async function addChecklistPage(
  pdfDoc: PDFDocument,
  forms: any[],
  font: any,
  boldFont: any
) {
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();

  let yPos = height - 50;
  const lineHeight = 20;

  page.drawText("SUBMISSION CHECKLIST", {
    x: 50,
    y: yPos,
    size: 18,
    font: boldFont
  });

  yPos -= lineHeight * 2;

  page.drawText("Before submitting to the municipality, ensure you have:", {
    x: 50,
    y: yPos,
    size: 11,
    font
  });

  yPos -= lineHeight * 1.5;

  const checklist = [
    "□ Completed and signed all required forms",
    "□ Detailed construction plans and drawings",
    "□ Site plan / plot plan",
    "□ Contractor license information",
    "□ Proof of homeowner authorization",
    "□ Application fee (check with municipality)",
    "□ Any additional municipality-specific requirements",
  ];

  for (const item of checklist) {
    page.drawText(item, { x: 70, y: yPos, size: 11, font });
    yPos -= lineHeight;
  }

  yPos -= lineHeight;

  page.drawText("NEXT STEPS:", { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= lineHeight * 1.5;

  const steps = [
    "1. Review all forms for accuracy and completeness",
    "2. Gather supporting documentation",
    "3. Have contractor review and sign applicable sections",
    "4. Submit to municipal building department",
    "5. Pay required fees",
    "6. Await permit approval",
  ];

  for (const step of steps) {
    page.drawText(step, { x: 70, y: yPos, size: 10, font });
    yPos -= lineHeight;
  }
}

serve(handler);
