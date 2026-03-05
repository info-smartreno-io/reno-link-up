// Central content configuration for the About page
// Edit here (no code changes needed in the route)

export type TeamMember = { name: string; title: string; status: string };
export type AboutConfig = {
  seo: { title: string; description: string };
  hero: { headline: string; subhead: string; ctaHref?: string };
  mission: { title: string; body: string };
  story: { title: string; paragraphs: string[]; signature?: string };
  team: {
    executives: TeamMember[];
    development: TeamMember[];
    operations: TeamMember[];
  };
  values: { title: string; items: { title: string; description: string }[] };
  cta: { title: string; sub: string; to: string };
};

const aboutConfig: AboutConfig = {
  seo: {
    title: "About SmartReno - Built by Contractors, Powered by Technology",
    description:
      "SmartReno is reimagining how homeowners, estimators, and contractors connect — with transparency, accountability, and care at the core of every interaction."
  },
  hero: {
    headline: "Built by contractors, for contractors — powered by technology.",
    subhead:
      "SmartReno is reimagining how homeowners, estimators, and contractors connect — with transparency, accountability, and care at the core of every interaction.",
    ctaHref: "#mission"
  },
  mission: {
    title: "Our Mission",
    body:
      "Every interaction requires our deepest level of care. From the first quote to project completion, SmartReno ensures homeowners, contractors, and estimators work in harmony — powered by a system designed to simplify, clarify, and elevate every renovation experience."
  },
  story: {
    title: "The SmartReno Story",
    paragraphs: [
      "SmartReno was born from years of firsthand experience in residential construction — thousands of estimates, countless conversations, and one common truth: the renovation process needed to be better.",
      "We built SmartReno to bring structure, fairness, and care into every project. Our mission is to take the guesswork out of renovations by combining trusted local professionals with clear communication, transparent pricing, and technology that works for people.",
      "This isn't just a platform — it's a promise to do things the right way, every time."
    ],
    signature: "— Thomas Burns, Founder & CEO"
  },
  team: {
    executives: [
      { name: "Thomas Burns", title: "Founder & CEO", status: "Active" },
      { name: "(Open)", title: "Chief Technology Officer (CTO)", status: "Hiring" },
      { name: "(Open)", title: "Chief Revenue Officer (CRO)", status: "Hiring" },
      { name: "(Open)", title: "Chief Financial Officer (CFO)", status: "Hiring" }
    ],
    development: [
      { name: "Methuseli Mfema", title: "Lead Engineer", status: "Active" },
      { name: "Bhavyashree Putta", title: "Full Stack Developer", status: "Active" },
      { name: "Prashant Jajal", title: "Mobile App Developer", status: "Active" },
      { name: "Umer Muhammad", title: "Front-End Developer", status: "Active" },
      { name: "Halbert Garcia", title: "Senior Graphic Designer", status: "Active" }
    ],
    operations: [
      { name: "(Open)", title: "Client Success Manager", status: "2 Seats" },
      { name: "(Open)", title: "Project Coordinator", status: "2 Seats" },
      { name: "(Open)", title: "Inbound / Outbound Call Center", status: "2 Seats" }
    ]
  },
  values: {
    title: "What We Stand For",
    items: [
      { title: "Care", description: "Every interaction matters." },
      { title: "Transparency", description: "Honest communication and clear expectations." },
      { title: "Craftsmanship", description: "Quality in every detail." },
      { title: "Innovation", description: "Technology that empowers real people." },
      { title: "Community", description: "Built for trust, collaboration, and growth." }
    ]
  },
  cta: {
    title: "Join the team that's redefining renovation.",
    sub: "Whether you're a builder, developer, or designer — SmartReno is shaping the future of residential construction.",
    to: "/careers"
  }
};

export default aboutConfig;
