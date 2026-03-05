// Service pricing and configuration data

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  popular?: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType?: 'flat' | 'per_unit';
  unit?: string;
}

export interface ServiceData {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  basePrice: number;
  options: ServiceOption[];
  addOns: AddOn[];
  serviceAreas: string[];
  faqs: { question: string; answer: string }[];
  features: string[];
  processDuration: string;
}

export const drainCleaningService: ServiceData = {
  id: 'drain_cleaning',
  slug: 'drain-cleaning',
  name: 'Drain Cleaning',
  tagline: 'Professional drain clearing - same day service',
  description: 'Fast, effective drain cleaning for clogged sinks, showers, tubs, and main sewer lines. Our licensed plumbers use professional-grade equipment to clear blockages and restore proper flow.',
  heroImage: '/images/services/drain-cleaning-hero.jpg',
  basePrice: 225,
  options: [
    {
      id: 'sink-shower',
      name: 'Sink or Shower Drain',
      description: 'Single fixture drain clearing with cable machine',
      price: 225,
    },
    {
      id: 'tub-drain',
      name: 'Bathtub Drain',
      description: 'Bathtub drain clearing including P-trap',
      price: 275,
    },
    {
      id: 'floor-drain',
      name: 'Floor Drain',
      description: 'Basement or utility floor drain clearing',
      price: 295,
      popular: true,
    },
    {
      id: 'main-line',
      name: 'Main Sewer Line',
      description: 'Full main line clearing with heavy-duty equipment',
      price: 495,
    },
  ],
  addOns: [
    {
      id: 'camera-inspection',
      name: 'Camera Inspection',
      description: 'HD video inspection to diagnose issues and verify clearing',
      price: 175,
      priceType: 'flat',
    },
    {
      id: 'root-treatment',
      name: 'Root Treatment',
      description: 'Chemical treatment to slow root regrowth',
      price: 95,
      priceType: 'flat',
    },
  ],
  serviceAreas: ['Bergen County', 'Passaic County', 'Essex County', 'Morris County'],
  features: [
    'Same-day service available',
    'Licensed & insured plumbers',
    'Upfront flat-rate pricing',
    '30-day guarantee on clearing',
    'No hidden fees',
  ],
  processDuration: '1-2 hours',
  faqs: [
    {
      question: 'How long does drain cleaning take?',
      answer: 'Most drain cleanings take 1-2 hours. Main sewer line clearing may take 2-3 hours depending on the blockage.',
    },
    {
      question: 'Do you offer same-day service?',
      answer: 'Yes! We offer same-day service for most drain cleaning requests received before 2pm.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, checks, and cash. Payment is due upon completion.',
    },
    {
      question: 'Is there a warranty on the work?',
      answer: 'Yes, we offer a 30-day guarantee on all drain clearing services.',
    },
  ],
};

export const gutterCleaningService: ServiceData = {
  id: 'gutter_cleaning',
  slug: 'gutter-cleaning',
  name: 'Gutter Cleaning',
  tagline: 'Protect your home from water damage',
  description: 'Complete gutter and downspout cleaning to prevent water damage, foundation issues, and pest infestations. Our crew cleans, flushes, and inspects your entire gutter system.',
  heroImage: '/images/services/gutter-cleaning-hero.jpg',
  basePrice: 195,
  options: [
    {
      id: 'small-home',
      name: 'Small Home (up to 1,500 sq ft)',
      description: 'Single-story home with standard gutter run',
      price: 195,
    },
    {
      id: 'medium-home',
      name: 'Medium Home (1,500-2,500 sq ft)',
      description: 'Up to 2-story home with standard gutter system',
      price: 245,
      popular: true,
    },
    {
      id: 'large-home',
      name: 'Large Home (2,500+ sq ft)',
      description: 'Large or multi-story home with extensive gutters',
      price: 295,
    },
  ],
  addOns: [
    {
      id: 'gutter-guards',
      name: 'Gutter Guards Installation',
      description: 'Professional-grade mesh guards to prevent debris buildup',
      price: 15,
      priceType: 'per_unit',
      unit: 'linear foot',
    },
    {
      id: 'downspout-extension',
      name: 'Downspout Extensions',
      description: 'Additional extensions to direct water away from foundation',
      price: 45,
      priceType: 'flat',
    },
    {
      id: 'minor-repairs',
      name: 'Minor Repairs',
      description: 'Fix loose brackets, seal small leaks',
      price: 75,
      priceType: 'flat',
    },
  ],
  serviceAreas: ['Bergen County', 'Passaic County', 'Essex County', 'Morris County'],
  features: [
    'Full system cleaning & flush',
    'Downspout clearing included',
    'Debris removal & cleanup',
    'Basic inspection included',
    'Before/after photos provided',
  ],
  processDuration: '1-3 hours',
  faqs: [
    {
      question: 'How often should gutters be cleaned?',
      answer: 'We recommend cleaning gutters at least twice per year - once in late spring and once in late fall after leaves have fallen.',
    },
    {
      question: 'Do you clean up the debris?',
      answer: 'Yes! All debris is removed from your property. We leave your yard cleaner than we found it.',
    },
    {
      question: 'Can you repair damaged gutters?',
      answer: 'We can handle minor repairs (loose brackets, small leaks) during the cleaning visit. Major repairs may require a separate estimate.',
    },
    {
      question: 'Are gutter guards worth it?',
      answer: 'Gutter guards can significantly reduce cleaning frequency and prevent clogs. They typically pay for themselves within 2-3 years.',
    },
  ],
};

export const handymanService: ServiceData = {
  id: 'handyman',
  slug: 'handyman',
  name: 'Handyman Services',
  tagline: 'Your to-do list, done right',
  description: 'Professional handyman services for home repairs, installations, and maintenance. Book by the hour and tackle multiple projects in one visit.',
  heroImage: '/images/services/handyman-hero.jpg',
  basePrice: 440,
  options: [
    {
      id: '4-hour',
      name: '4-Hour Block',
      description: 'Half-day of handyman services - great for small projects',
      price: 440,
      popular: true,
    },
    {
      id: '8-hour',
      name: '8-Hour Block (Full Day)',
      description: 'Full day of handyman services - best value for larger projects',
      price: 880,
    },
  ],
  addOns: [
    {
      id: 'materials-run',
      name: 'Materials Pickup',
      description: 'We\'ll pick up materials from local hardware store',
      price: 50,
      priceType: 'flat',
    },
    {
      id: 'disposal',
      name: 'Debris Disposal',
      description: 'Haul away and properly dispose of project debris',
      price: 75,
      priceType: 'flat',
    },
  ],
  serviceAreas: ['Bergen County', 'Passaic County', 'Essex County', 'Morris County'],
  features: [
    'Skilled, background-checked technicians',
    'Tackle multiple projects in one visit',
    'Materials cost separate (transparent pricing)',
    'No minimum project size',
    'Satisfaction guaranteed',
  ],
  processDuration: '4 or 8 hours',
  faqs: [
    {
      question: 'What kinds of projects can a handyman do?',
      answer: 'Our handymen handle a wide range of tasks: TV mounting, furniture assembly, drywall repair, painting touch-ups, door/hardware installation, shelving, caulking, weatherstripping, and much more.',
    },
    {
      question: 'Is the materials cost included?',
      answer: 'No, materials are billed separately at cost. We\'ll provide receipts for all materials purchased.',
    },
    {
      question: 'Can I provide my own materials?',
      answer: 'Absolutely! If you have the materials ready, we\'ll just charge for labor.',
    },
    {
      question: 'What if the project takes less time than booked?',
      answer: 'No problem! Use the remaining time for other projects on your to-do list. We\'ll tackle as much as we can within your booked time.',
    },
  ],
};

export const allServices: ServiceData[] = [
  drainCleaningService,
  gutterCleaningService,
  handymanService,
];

export const getServiceBySlug = (slug: string): ServiceData | undefined => {
  return allServices.find((s) => s.slug === slug);
};

export const getServiceById = (id: string): ServiceData | undefined => {
  return allServices.find((s) => s.id === id);
};
