export interface CountyStats {
  projectsCompleted: string;
  averageRating: string;
  contractorsVerified: string;
  townsServed: number;
}

export interface CountyFAQ {
  question: string;
  answer: string;
}

export interface CountyTestimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  projectType: string;
}

export const COUNTY_STATS: Record<string, CountyStats> = {
  bergen: {
    projectsCompleted: "2,500+",
    averageRating: "4.9",
    contractorsVerified: "150+",
    townsServed: 70
  },
  passaic: {
    projectsCompleted: "1,800+",
    averageRating: "4.8",
    contractorsVerified: "120+",
    townsServed: 16
  },
  morris: {
    projectsCompleted: "2,200+",
    averageRating: "4.9",
    contractorsVerified: "140+",
    townsServed: 39
  },
  essex: {
    projectsCompleted: "2,100+",
    averageRating: "4.8",
    contractorsVerified: "135+",
    townsServed: 22
  },
  hudson: {
    projectsCompleted: "1,900+",
    averageRating: "4.9",
    contractorsVerified: "125+",
    townsServed: 12
  }
};

export const COUNTY_FAQS: Record<string, CountyFAQ[]> = {
  bergen: [
    {
      question: "What types of renovation projects are most common in Bergen County?",
      answer: "Kitchen and bathroom remodels are extremely popular in Bergen County, followed by basement finishing, home additions, and exterior upgrades. Many homeowners in towns like Ridgewood, Paramus, and Fort Lee are also investing in open-concept layouts and modern kitchen expansions."
    },
    {
      question: "How long does a typical renovation take in Bergen County?",
      answer: "Timeline varies by project scope. A kitchen remodel typically takes 6-12 weeks, bathroom renovations 3-6 weeks, and home additions 3-6 months. Bergen County permits can add 2-4 weeks to the timeline, which our contractors factor into their schedules."
    },
    {
      question: "Do I need permits for renovations in Bergen County?",
      answer: "Yes, most structural changes, electrical work, plumbing, and additions require permits in Bergen County. Each municipality has specific requirements. SmartReno contractors are experienced with local building codes and will handle all necessary permits for your project."
    },
    {
      question: "What's the average cost of a kitchen remodel in Bergen County?",
      answer: "Kitchen remodels in Bergen County typically range from $25,000 to $75,000+ depending on size, materials, and scope. High-end renovations in areas like Ridgewood or Franklin Lakes can exceed $100,000. Get a free estimate to understand costs for your specific project."
    }
  ],
  passaic: [
    {
      question: "What renovation projects add the most value in Passaic County?",
      answer: "Kitchen remodels, bathroom updates, and basement finishing provide the best ROI in Passaic County. Many Wayne and Clifton homeowners are also adding home offices and updating exterior features like roofing and siding."
    },
    {
      question: "How do I choose the right contractor in Passaic County?",
      answer: "SmartReno pre-vets all contractors for licensing, insurance, and quality of work. You'll receive multiple bids from qualified professionals who know Passaic County building codes and have proven track records in areas like Wayne, Clifton, and Paterson."
    },
    {
      question: "What permits are required for renovations in Passaic County?",
      answer: "Building permits are required for structural work, electrical, plumbing, HVAC, and additions. Each town in Passaic County has specific requirements. Our contractors handle all permit applications and inspections as part of their service."
    },
    {
      question: "Can I renovate during winter in Passaic County?",
      answer: "Yes! Interior renovations (kitchens, bathrooms, basements) can be done year-round. Exterior projects like roofing and siding are weather-dependent but can often proceed during mild winter periods. Contractors will advise on optimal timing for your specific project."
    }
  ],
  morris: [
    {
      question: "What are the most popular renovations in Morris County?",
      answer: "Morris County homeowners frequently invest in kitchen expansions, luxury bathroom remodels, basement finishing, and home additions. In towns like Morristown, Parsippany, and Madison, open-concept designs and high-end finishes are particularly popular."
    },
    {
      question: "How much does it cost to finish a basement in Morris County?",
      answer: "Basement finishing in Morris County typically costs $30,000 to $75,000 depending on size, finishes, and features. Adding a bathroom, wet bar, or home theater increases costs. Request free estimates to get accurate pricing for your space."
    },
    {
      question: "What should I know about Morris County building codes?",
      answer: "Morris County has specific requirements for structural work, electrical, plumbing, and energy efficiency. Each municipality may have additional local codes. SmartReno contractors are well-versed in Morris County regulations and ensure all work meets or exceeds code requirements."
    },
    {
      question: "How do I finance my renovation in Morris County?",
      answer: "Options include home equity loans, home equity lines of credit (HELOC), cash-out refinancing, personal loans, or contractor financing. Many Morris County homeowners use a combination. Discuss financing options with your contractor during the estimate process."
    }
  ],
  essex: [
    {
      question: "What renovation projects are trending in Essex County?",
      answer: "Essex County homeowners are investing in modern kitchen upgrades, spa-like bathrooms, and converting underutilized spaces. In Montclair, West Orange, and Newark, sustainable upgrades and smart home integration are increasingly popular."
    },
    {
      question: "Do contractors in Essex County offer design services?",
      answer: "Many SmartReno contractors offer design consultation as part of their service. Some partner with designers or have in-house design teams. You'll discuss design support during the initial consultation and estimate process."
    },
    {
      question: "What's the typical timeline for a bathroom remodel in Essex County?",
      answer: "A full bathroom remodel in Essex County typically takes 4-6 weeks from demolition to completion, including permit approval. Powder room updates may take 2-3 weeks. Timeline depends on scope, tile work complexity, and custom fixture availability."
    },
    {
      question: "Are there rebates or incentives for energy-efficient upgrades in Essex County?",
      answer: "Yes! New Jersey offers rebates for energy-efficient windows, insulation, HVAC systems, and solar installations. Federal tax credits may also apply. Ask your SmartReno contractor about available incentives for your renovation project."
    }
  ],
  hudson: [
    {
      question: "What makes Hudson County renovations unique?",
      answer: "Hudson County has many historic buildings, condos, and townhomes requiring specialized renovation approaches. Jersey City, Hoboken, and Bayonne projects often involve working within building co-op/condo rules and historic preservation guidelines."
    },
    {
      question: "Can I renovate a condo or co-op in Hudson County?",
      answer: "Yes, but you'll need board approval and must follow building rules. SmartReno contractors experienced with Hudson County buildings understand alteration agreements, insurance requirements, and working within building restrictions."
    },
    {
      question: "How much does a kitchen renovation cost in Hudson County?",
      answer: "Hudson County kitchen renovations range from $20,000 for basic updates to $80,000+ for high-end remodels. Costs in Jersey City and Hoboken waterfront buildings may be higher due to building requirements and material delivery logistics."
    },
    {
      question: "What are the most valuable renovations for Hudson County homes?",
      answer: "Kitchen and bathroom updates provide the best ROI, especially in Jersey City and Hoboken. Modern, open layouts, energy-efficient upgrades, and outdoor space improvements (roof decks, terraces) are highly valued in the Hudson County market."
    }
  ]
};

export const COUNTY_TESTIMONIALS: Record<string, CountyTestimonial[]> = {
  bergen: [
    {
      name: "Sarah M.",
      location: "Ridgewood",
      rating: 5,
      text: "Our kitchen remodel exceeded expectations! The contractor was professional, on time, and the quality is outstanding. SmartReno made comparing bids so easy.",
      projectType: "Kitchen Remodel"
    },
    {
      name: "Michael R.",
      location: "Paramus",
      rating: 5,
      text: "Finished our basement and it's now our favorite space. The whole process was smooth and the contractor answered all our questions promptly.",
      projectType: "Basement Finishing"
    }
  ],
  passaic: [
    {
      name: "Jennifer L.",
      location: "Wayne",
      rating: 5,
      text: "Amazing bathroom transformation! The attention to detail was impressive. Highly recommend using SmartReno to find quality contractors.",
      projectType: "Bathroom Remodel"
    },
    {
      name: "David K.",
      location: "Clifton",
      rating: 5,
      text: "Our home addition turned out beautiful. The contractor kept us informed throughout and finished on schedule. Great experience!",
      projectType: "Home Addition"
    }
  ],
  morris: [
    {
      name: "Emily T.",
      location: "Morristown",
      rating: 5,
      text: "The kitchen remodel transformed our home! Professional crew, clean work site, and stunning results. Worth every penny.",
      projectType: "Kitchen Remodel"
    },
    {
      name: "Robert H.",
      location: "Parsippany",
      rating: 5,
      text: "Excellent craftsmanship on our basement renovation. The contractor suggested great ideas that improved our original plan.",
      projectType: "Basement Finishing"
    }
  ],
  essex: [
    {
      name: "Lisa C.",
      location: "Montclair",
      rating: 5,
      text: "Our master bathroom is now a spa retreat! The contractor was reliable, communicated well, and delivered exceptional quality.",
      projectType: "Bathroom Remodel"
    },
    {
      name: "James P.",
      location: "West Orange",
      rating: 5,
      text: "Kitchen renovation was seamless. SmartReno connected us with a fantastic contractor who understood our vision perfectly.",
      projectType: "Kitchen Remodel"
    }
  ],
  hudson: [
    {
      name: "Amanda S.",
      location: "Jersey City",
      rating: 5,
      text: "Renovating our condo was stress-free thanks to SmartReno. The contractor handled all building requirements expertly.",
      projectType: "Condo Renovation"
    },
    {
      name: "Chris D.",
      location: "Hoboken",
      rating: 5,
      text: "Our kitchen and bathroom upgrades are amazing! Fast, professional service and the results are exactly what we wanted.",
      projectType: "Kitchen & Bath"
    }
  ]
};
