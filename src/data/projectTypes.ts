export interface ProjectType {
  slug: string;
  name: string;
  category: 'interior' | 'exterior' | 'additions';
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  intro: string;
  description: string[];
  benefits: string[];
  process: string[];
  considerations: string[];
  image: string;
}

export const projectTypes: ProjectType[] = [
  // Interior Renovations
  {
    slug: 'kitchen',
    name: 'Kitchen Remodeling',
    category: 'interior',
    metaTitle: 'Kitchen Remodeling in North Jersey | SmartReno',
    metaDescription: 'Transform your kitchen with SmartReno. Custom cabinets, countertops, appliances & more. Get free estimates from vetted contractors in Bergen, Passaic, Morris, Essex & Hudson County.',
    keywords: ['kitchen remodel', 'kitchen renovation', 'kitchen contractors NJ', 'custom cabinets', 'kitchen design', 'Bergen County kitchen', 'Passaic County kitchen', 'Morris County kitchen', 'Essex County kitchen', 'Hudson County kitchen', 'countertop installation', 'kitchen appliances', 'kitchen backsplash'],
    h1: 'Kitchen Remodeling Services in North Jersey',
    intro: 'Your kitchen is the heart of your home. SmartReno connects you with experienced kitchen remodeling contractors who deliver beautiful, functional kitchens across North Jersey.',
    description: [
      'Kitchen renovations are among the most impactful home improvements you can make. Modern kitchens combine style and functionality with custom cabinetry, quality countertops, professional-grade appliances, and thoughtful layouts.',
      'Whether you\'re looking for a complete gut renovation or a cosmetic update, our network of vetted contractors has the expertise to bring your vision to life while navigating local building codes and permitting requirements.'
    ],
    benefits: [
      'Increase home value by 60-80% of investment',
      'Improve functionality and workflow',
      'Enhance energy efficiency with new appliances',
      'Create a gathering space for family and friends',
      'Modernize outdated layouts and finishes'
    ],
    process: [
      'Initial consultation to understand your needs and budget',
      'Design development with layout options and material selections',
      'Detailed estimate with transparent pricing',
      'Permitting and preparation',
      'Demolition and rough-in work',
      'Installation of cabinets, countertops, and appliances',
      'Final finishes and inspection'
    ],
    considerations: [
      'Timeline typically 4-8 weeks depending on scope',
      'Plan for temporary kitchen setup during renovation',
      'Budget for potential hidden issues (plumbing, electrical)',
      'Consider appliance lead times in project schedule',
      'Coordinate finishes early to avoid delays'
    ],
    image: '/assets/kitchen-remodel.jpg'
  },
  {
    slug: 'bathroom',
    name: 'Bathroom Renovations',
    category: 'interior',
    metaTitle: 'Bathroom Renovations in North Jersey | SmartReno',
    metaDescription: 'Luxury bathroom remodels from powder rooms to primary suites. Walk-in showers, soaking tubs, custom vanities. Free estimates from vetted NJ contractors.',
    keywords: ['bathroom remodel', 'bathroom renovation', 'bathroom contractors NJ', 'walk-in shower', 'soaking tub', 'custom vanity', 'bathroom tile', 'Bergen County bathroom', 'primary bathroom', 'powder room', 'bathroom plumbing', 'heated floors', 'bathroom design'],
    h1: 'Bathroom Renovation Services in North Jersey',
    intro: 'Transform your bathroom into a personal retreat. SmartReno connects you with skilled contractors specializing in bathroom renovations throughout North Jersey.',
    description: [
      'Bathroom renovations range from simple updates to complete luxury transformations. Popular upgrades include walk-in showers, freestanding tubs, heated floors, double vanities, and high-end tile work.',
      'Our contractors bring expertise in plumbing, waterproofing, and finish carpentry to ensure your bathroom is both beautiful and built to last.'
    ],
    benefits: [
      'Increase home value and appeal to buyers',
      'Improve daily comfort and functionality',
      'Enhance water efficiency and reduce utility costs',
      'Create a spa-like atmosphere at home',
      'Update outdated fixtures and finishes'
    ],
    process: [
      'Design consultation and space planning',
      'Material selection (tile, fixtures, vanities)',
      'Detailed cost estimate',
      'Demolition and rough plumbing/electrical',
      'Waterproofing and tile installation',
      'Fixture and vanity installation',
      'Final details and inspection'
    ],
    considerations: [
      'Timeline typically 2-4 weeks per bathroom',
      'Ensure proper ventilation to prevent moisture issues',
      'Plan for alternative bathroom during renovation',
      'Budget for potential plumbing upgrades',
      'Consider long-term maintenance of materials'
    ],
    image: '/assets/bathroom-remodel.jpg'
  },
  {
    slug: 'flooring',
    name: 'Flooring Installation',
    category: 'interior',
    metaTitle: 'Flooring Installation in North Jersey | SmartReno',
    metaDescription: 'Professional flooring installation. Hardwood, tile, luxury vinyl, carpet & more. Get free estimates from experienced North Jersey flooring contractors.',
    keywords: ['flooring installation', 'hardwood floors', 'tile flooring', 'luxury vinyl plank', 'LVP flooring', 'carpet installation', 'floor refinishing', 'NJ flooring contractors', 'Bergen County flooring', 'laminate flooring', 'engineered hardwood'],
    h1: 'Flooring Installation Services in North Jersey',
    intro: 'New flooring transforms your home\'s look and feel. SmartReno connects you with expert flooring contractors offering a wide range of materials and installation services.',
    description: [
      'Flooring options include hardwood, engineered wood, luxury vinyl plank (LVP), tile, carpet, and more. Each material offers unique benefits in terms of durability, maintenance, and aesthetics.',
      'Our contractors help you select the right flooring for each space based on traffic, moisture, and your design preferences, then ensure professional installation for lasting beauty.'
    ],
    benefits: [
      'Dramatic improvement in home\'s appearance',
      'Increase home value and marketability',
      'Improve acoustics and comfort',
      'Easier cleaning and maintenance',
      'Better indoor air quality with proper materials'
    ],
    process: [
      'In-home consultation and material selection',
      'Accurate measurements and estimate',
      'Subfloor preparation and leveling',
      'Professional installation',
      'Trim and transition installation',
      'Final cleanup and inspection'
    ],
    considerations: [
      'Acclimate materials before installation',
      'Consider moisture levels in basements',
      'Plan for furniture moving and storage',
      'Factor in subfloor condition and repairs',
      'Allow proper cure time before use'
    ],
    image: '/assets/kitchen-remodel.jpg'
  },
  {
    slug: 'painting',
    name: 'Interior & Exterior Painting',
    category: 'interior',
    metaTitle: 'Painting Services in North Jersey | SmartReno',
    metaDescription: 'Professional interior and exterior painting. Transform your home with expert painters. Free estimates from licensed North Jersey painting contractors.',
    keywords: ['interior painting', 'exterior painting', 'house painting NJ', 'professional painters', 'paint contractors', 'Bergen County painters', 'wall painting', 'ceiling painting', 'trim painting', 'color consultation'],
    h1: 'Professional Painting Services in North Jersey',
    intro: 'A fresh coat of paint is one of the most cost-effective ways to transform your home. SmartReno connects you with skilled painters who deliver flawless results.',
    description: [
      'Professional painting involves proper surface preparation, quality materials, and expert application techniques. Whether interior or exterior, our contractors ensure smooth, even finishes that last.',
      'Services include color consultation, surface repair, priming, painting, and detailed finish work for trim, doors, and cabinets.'
    ],
    benefits: [
      'Most affordable way to refresh your home',
      'Protect surfaces from wear and weather',
      'Cover imperfections and damage',
      'Update color schemes to current trends',
      'Improve curb appeal dramatically'
    ],
    process: [
      'Color consultation and selection',
      'Surface preparation and repairs',
      'Priming as needed',
      'Professional paint application',
      'Trim and detail work',
      'Final walkthrough and touch-ups'
    ],
    considerations: [
      'Quality paint pays off in longevity',
      'Proper prep is key to lasting results',
      'Weather conditions affect exterior timing',
      'Multiple coats ensure even coverage',
      'Protect floors and furniture during work'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'trim-carpentry',
    name: 'Trim Carpentry',
    category: 'interior',
    metaTitle: 'Trim Carpentry in North Jersey | SmartReno',
    metaDescription: 'Custom trim carpentry and millwork. Crown molding, baseboards, wainscoting & more. Expert craftsmen serving North Jersey.',
    keywords: ['trim carpentry', 'crown molding', 'baseboards', 'wainscoting', 'chair rail', 'custom millwork', 'finish carpentry', 'NJ carpentry', 'interior trim', 'craftsman details'],
    h1: 'Trim Carpentry & Millwork Services',
    intro: 'Quality trim work adds elegance and character to any home. SmartReno connects you with skilled finish carpenters who deliver precision craftsmanship.',
    description: [
      'Trim carpentry includes crown molding, baseboards, chair rails, wainscoting, door and window casings, built-in shelving, and decorative millwork.',
      'Our craftsmen bring attention to detail and traditional techniques to create beautiful, lasting results that enhance your home\'s architectural character.'
    ],
    benefits: [
      'Add architectural interest and character',
      'Increase perceived home value',
      'Cover gaps and imperfections',
      'Create custom built-in storage',
      'Enhance period-appropriate styling'
    ],
    process: [
      'Design consultation and style selection',
      'Precise measurements',
      'Material sourcing and preparation',
      'Installation with expert joinery',
      'Finishing (paint or stain)',
      'Final inspection'
    ],
    considerations: [
      'Match existing trim styles when adding',
      'Quality materials ensure clean lines',
      'Consider ceiling height for crown molding',
      'Plan painting/staining separately',
      'Allow time for wood acclimation'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'staircase',
    name: 'Staircase Renovation',
    category: 'interior',
    metaTitle: 'Staircase Renovation in North Jersey | SmartReno',
    metaDescription: 'Staircase remodeling and renovation. New treads, railings, balusters & more. Transform your stairs with North Jersey experts.',
    keywords: ['staircase renovation', 'stair remodel', 'custom stairs', 'hardwood stairs', 'stair railings', 'iron balusters', 'staircase design', 'stair installation NJ', 'modern staircase'],
    h1: 'Staircase Renovation & Remodeling',
    intro: 'Your staircase is a focal point. SmartReno connects you with experienced contractors who transform outdated stairs into stunning architectural features.',
    description: [
      'Staircase renovations can include new treads, risers, railings, balusters, and posts. Options range from modern glass and metal to traditional wood designs.',
      'Our contractors ensure all work meets building codes for safety while creating the aesthetic you desire.'
    ],
    benefits: [
      'Dramatic visual impact',
      'Improve safety with updated railings',
      'Increase home value',
      'Modernize dated styles',
      'Create open, airy feel'
    ],
    process: [
      'Design consultation and style selection',
      'Code compliance review',
      'Material selection',
      'Demolition of old components',
      'Installation of new treads and railings',
      'Finishing and inspection'
    ],
    considerations: [
      'Building codes dictate railing heights',
      'Maintain safe access during renovation',
      'Budget for structural repairs if needed',
      'Consider noise reduction materials',
      'Match or complement existing decor'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'basement',
    name: 'Basement Finishing',
    category: 'interior',
    metaTitle: 'Basement Finishing in North Jersey | SmartReno',
    metaDescription: 'Finish your basement and add valuable living space. Family rooms, home offices, gyms & more. Free estimates from vetted NJ contractors.',
    keywords: ['basement finishing', 'basement remodel', 'finished basement', 'basement renovation NJ', 'basement waterproofing', 'basement entertainment room', 'basement bathroom', 'Bergen County basement', 'basement living space'],
    h1: 'Basement Finishing Services in North Jersey',
    intro: 'Unlock your basement\'s potential. SmartReno connects you with contractors who transform unfinished basements into beautiful, functional living spaces.',
    description: [
      'Finished basements add significant square footage and value to your home. Popular uses include family rooms, home theaters, offices, gyms, guest suites, and playrooms.',
      'Our contractors handle waterproofing, insulation, framing, drywall, flooring, and all finish work while ensuring compliance with egress and ceiling height requirements.'
    ],
    benefits: [
      'Add substantial square footage',
      'Increase home value by 70% of investment',
      'Create flexible multi-use space',
      'Improve home energy efficiency',
      'Accommodate growing families'
    ],
    process: [
      'Assessment of existing conditions',
      'Waterproofing and moisture control',
      'Insulation and framing',
      'Electrical and HVAC work',
      'Drywall and flooring installation',
      'Trim and finish work',
      'Final inspection and approval'
    ],
    considerations: [
      'Ensure proper waterproofing first',
      'Meet egress window requirements',
      'Maintain minimum ceiling heights',
      'Plan for adequate heating/cooling',
      'Consider moisture-resistant materials'
    ],
    image: '/assets/basement-finished.jpg'
  },
  {
    slug: 'attic',
    name: 'Attic Conversion',
    category: 'interior',
    metaTitle: 'Attic Conversion in North Jersey | SmartReno',
    metaDescription: 'Convert your attic into livable space. Bedrooms, offices, studios & more. Expert attic renovation contractors in North Jersey.',
    keywords: ['attic conversion', 'attic remodel', 'attic bedroom', 'attic office', 'dormer installation', 'attic insulation', 'attic finishing NJ', 'skylight installation', 'bonus room'],
    h1: 'Attic Conversion & Renovation Services',
    intro: 'Transform unused attic space into valuable living areas. SmartReno connects you with contractors experienced in attic conversions throughout North Jersey.',
    description: [
      'Attic conversions create additional bedrooms, home offices, art studios, or bonus rooms. Work typically includes insulation, flooring, dormers, stairs, and finish work.',
      'Our contractors navigate building codes, structural requirements, and access challenges to deliver functional, comfortable living spaces.'
    ],
    benefits: [
      'Add square footage without expanding footprint',
      'Increase home value',
      'Create private spaces away from main living areas',
      'Improve home energy efficiency with insulation',
      'Cost-effective compared to additions'
    ],
    process: [
      'Structural assessment and code review',
      'Design and planning',
      'Stair installation or modification',
      'Insulation and ventilation',
      'Flooring and drywall',
      'Electrical and HVAC',
      'Finish work and inspection'
    ],
    considerations: [
      'Ensure adequate headroom (7\' minimum)',
      'Plan for proper stair access',
      'Address insulation and ventilation',
      'Consider dormers for additional space',
      'Budget for HVAC extension'
    ],
    image: '/assets/home-addition.jpg'
  },
  // Exterior Renovations
  {
    slug: 'roofing',
    name: 'Roofing Services',
    category: 'exterior',
    metaTitle: 'Roofing Services in North Jersey | SmartReno',
    metaDescription: 'Professional roofing installation and repair. Asphalt, metal, tile & more. Licensed roofing contractors serving North Jersey.',
    keywords: ['roof replacement', 'roofing contractors NJ', 'new roof installation', 'shingle roofing', 'roof repair', 'Bergen County roofing', 'architectural shingles', 'flat roof', 'roof inspection'],
    h1: 'Roofing Installation & Repair Services',
    intro: 'Protect your home with a quality roof. SmartReno connects you with licensed roofing contractors who deliver lasting results across North Jersey.',
    description: [
      'Roofing services include new installations, re-roofs, repairs, and maintenance. Materials range from asphalt shingles to metal, tile, and slate.',
      'Our contractors ensure proper installation, ventilation, and weatherproofing to protect your home for decades.'
    ],
    benefits: [
      'Protect home from water damage',
      'Improve energy efficiency',
      'Increase home value and curb appeal',
      'Reduce insurance costs',
      'Peace of mind with warranty coverage'
    ],
    process: [
      'Roof inspection and assessment',
      'Material selection and estimate',
      'Tear-off of old roofing (if needed)',
      'Deck repair and preparation',
      'Underlayment and ice/water shield',
      'Shingle or material installation',
      'Final inspection and cleanup'
    ],
    considerations: [
      'Choose materials suited to local climate',
      'Ensure proper ventilation',
      'Check for homeowner association restrictions',
      'Consider insurance claim if storm damage',
      'Plan around weather conditions'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'siding',
    name: 'Siding Installation',
    category: 'exterior',
    metaTitle: 'Siding Installation in North Jersey | SmartReno',
    metaDescription: 'Professional siding installation. Vinyl, fiber cement, wood & more. Transform your home\'s exterior with expert North Jersey contractors.',
    keywords: ['siding installation', 'vinyl siding', 'fiber cement siding', 'siding replacement NJ', 'James Hardie siding', 'house siding', 'Bergen County siding', 'exterior cladding', 'siding contractors'],
    h1: 'Siding Installation & Replacement Services',
    intro: 'New siding transforms your home\'s appearance and protection. SmartReno connects you with experienced siding contractors throughout North Jersey.',
    description: [
      'Siding options include vinyl, fiber cement, wood, engineered wood, and metal. Each offers different benefits in terms of maintenance, durability, and aesthetics.',
      'Our contractors ensure proper installation with adequate insulation, moisture barriers, and attention to detail for lasting beauty and protection.'
    ],
    benefits: [
      'Dramatically improve curb appeal',
      'Increase home value',
      'Reduce maintenance requirements',
      'Improve energy efficiency',
      'Protect against weather and pests'
    ],
    process: [
      'Inspection and measurement',
      'Material selection and color choice',
      'Removal of old siding',
      'Repair of sheathing if needed',
      'Installation of moisture barrier',
      'Siding installation',
      'Trim and finishing details'
    ],
    considerations: [
      'Choose materials appropriate for climate',
      'Plan for proper ventilation behind siding',
      'Consider long-term maintenance',
      'Budget for window trim replacement',
      'Check local color restrictions'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'windows',
    name: 'Window Replacement',
    category: 'exterior',
    metaTitle: 'Window Replacement in North Jersey | SmartReno',
    metaDescription: 'Professional window replacement services. Energy-efficient windows installed by experienced North Jersey contractors. Free estimates.',
    keywords: ['window replacement', 'new windows NJ', 'energy-efficient windows', 'vinyl windows', 'window installation', 'Bergen County windows', 'double-pane windows', 'bay windows', 'sliding windows'],
    h1: 'Window Replacement Services in North Jersey',
    intro: 'New windows improve energy efficiency and curb appeal. SmartReno connects you with professional window installers across North Jersey.',
    description: [
      'Window replacement improves energy efficiency, reduces noise, and enhances your home\'s appearance. Options include double-hung, casement, sliding, bay, and picture windows.',
      'Our contractors ensure proper installation with correct flashing, insulation, and sealing for optimal performance and longevity.'
    ],
    benefits: [
      'Reduce energy costs by 20-30%',
      'Improve home comfort',
      'Reduce outside noise',
      'Increase home value',
      'Easier operation and maintenance'
    ],
    process: [
      'In-home measurement and consultation',
      'Window selection and ordering',
      'Removal of old windows',
      'Preparation of rough openings',
      'Installation and sealing',
      'Interior and exterior trim',
      'Final inspection and testing'
    ],
    considerations: [
      'Choose energy-efficient ratings (U-factor, SHGC)',
      'Match architectural style',
      'Consider installation method (retrofit vs. new construction)',
      'Plan for interior finishing',
      'Allow lead time for custom sizes'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'doors',
    name: 'Door Installation',
    category: 'exterior',
    metaTitle: 'Door Installation in North Jersey | SmartReno',
    metaDescription: 'Professional door installation. Entry doors, patio doors, storm doors & more. Experienced installers serving North Jersey.',
    keywords: ['door installation', 'entry door replacement', 'front door NJ', 'exterior doors', 'door contractors', 'fiberglass doors', 'steel doors', 'sliding doors', 'French doors'],
    h1: 'Door Installation & Replacement Services',
    intro: 'New doors enhance security, energy efficiency, and curb appeal. SmartReno connects you with skilled door installers throughout North Jersey.',
    description: [
      'Door services include entry doors, patio doors, storm doors, and garage doors. Materials range from steel and fiberglass to wood and composite.',
      'Our contractors ensure proper installation with weatherstripping, secure locks, and proper operation for years of reliable performance.'
    ],
    benefits: [
      'Improve home security',
      'Enhance energy efficiency',
      'Boost curb appeal dramatically',
      'Reduce drafts and noise',
      'Increase home value'
    ],
    process: [
      'Consultation and selection',
      'Accurate measurements',
      'Door ordering and delivery',
      'Removal of old door',
      'Installation of new door and frame',
      'Hardware installation',
      'Final adjustment and weatherproofing'
    ],
    considerations: [
      'Choose appropriate security features',
      'Match architectural style',
      'Consider swing direction',
      'Plan for proper weatherproofing',
      'Budget for hardware and locks'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'masonry',
    name: 'Masonry Services',
    category: 'exterior',
    metaTitle: 'Masonry Services in North Jersey | SmartReno',
    metaDescription: 'Professional masonry work. Stone, brick, concrete & more. Experienced masons serving North Jersey homes.',
    keywords: ['masonry work', 'brick masonry', 'stone masonry NJ', 'brickwork', 'stone veneer', 'masonry repairs', 'Bergen County masonry', 'chimney repair', 'retaining walls'],
    h1: 'Masonry Services in North Jersey',
    intro: 'Quality masonry adds beauty and value. SmartReno connects you with skilled masons throughout North Jersey for all your stonework needs.',
    description: [
      'Masonry services include stone and brick veneers, retaining walls, patios, walkways, chimneys, and foundation repairs.',
      'Our masons bring traditional skills and modern techniques to create durable, beautiful work that enhances your home.'
    ],
    benefits: [
      'Increase home value and curb appeal',
      'Extremely durable and long-lasting',
      'Low maintenance requirements',
      'Natural fire and pest resistance',
      'Timeless aesthetic appeal'
    ],
    process: [
      'Site assessment and design',
      'Material selection',
      'Site preparation and excavation',
      'Foundation or base preparation',
      'Masonry work',
      'Pointing and finishing',
      'Sealing and cleanup'
    ],
    considerations: [
      'Ensure proper drainage',
      'Match existing masonry when repairing',
      'Plan for weather delays',
      'Budget for proper foundation',
      'Consider maintenance of pointing'
    ],
    image: '/assets/home-addition.jpg'
  },
  // Additions
  {
    slug: 'extension',
    name: 'Home Extensions',
    category: 'additions',
    metaTitle: 'Home Extensions in North Jersey | SmartReno',
    metaDescription: 'Professional home extensions. Add square footage with room additions. Expert contractors serving North Jersey.',
    keywords: ['home extension', 'house addition', 'room addition NJ', 'home expansion', 'first floor addition', 'family room addition', 'Bergen County additions', 'home remodeling', 'residential expansion'],
    h1: 'Home Extension Services in North Jersey',
    intro: 'Expand your living space with a home extension. SmartReno connects you with experienced contractors who deliver seamless additions.',
    description: [
      'Home extensions add square footage on your existing floor plan. Common projects include kitchen extensions, family room additions, sunrooms, and primary bedroom suites.',
      'Our contractors handle design, structural work, foundation, and all finish trades to create additions that blend seamlessly with your existing home.'
    ],
    benefits: [
      'Add square footage without moving',
      'Increase home value significantly',
      'Customize to your exact needs',
      'Stay in your neighborhood',
      'Often more cost-effective than moving'
    ],
    process: [
      'Design consultation and planning',
      'Architectural drawings and permits',
      'Site preparation and excavation',
      'Foundation work',
      'Framing and roof',
      'Rough-ins (plumbing, electrical, HVAC)',
      'Insulation and drywall',
      'Finish work and inspection'
    ],
    considerations: [
      'Requires local permits and approvals',
      'Must match existing home architecture',
      'Budget 6-12 months for completion',
      'Plan for disruption during construction',
      'Ensure adequate lot coverage'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'add-a-level',
    name: 'Add-A-Level',
    category: 'additions',
    metaTitle: 'Add-A-Level Projects in North Jersey | SmartReno',
    metaDescription: 'Add-a-level home additions. Double your square footage by building up. Expert contractors serving North Jersey.',
    keywords: ['add-a-level', 'second story addition', 'vertical expansion', 'second floor addition NJ', 'home vertical expansion', 'Bergen County additions', 'two-story addition', 'upward expansion'],
    h1: 'Add-A-Level Home Addition Services',
    intro: 'Double your square footage by building up. SmartReno connects you with contractors experienced in add-a-level projects throughout North Jersey.',
    description: [
      'Add-a-level projects involve building a complete second story on your home, effectively doubling your living space. This is ideal when lot constraints prevent expanding outward.',
      'Our contractors handle structural engineering, temporary housing arrangements, and all construction to deliver a seamless second floor addition.'
    ],
    benefits: [
      'Double your square footage',
      'Increase home value dramatically',
      'Ideal for constrained lots',
      'Create private bedroom suites',
      'Maintain yard space'
    ],
    process: [
      'Structural assessment and engineering',
      'Architectural design and permits',
      'Temporary relocation planning',
      'Roof removal',
      'Second floor framing',
      'New roof installation',
      'Complete interior finish work',
      'Final inspections'
    ],
    considerations: [
      'Requires temporary relocation',
      'Significant structural work',
      'Timeline typically 4-6 months',
      'Budget $200-300 per square foot',
      'Check zoning height restrictions'
    ],
    image: '/assets/home-addition.jpg'
  },
  {
    slug: 'dormers',
    name: 'Dormer Additions',
    category: 'additions',
    metaTitle: 'Dormer Additions in North Jersey | SmartReno',
    metaDescription: 'Dormer additions to expand attic space. Shed dormers, gable dormers & more. North Jersey experts.',
    keywords: ['dormer addition', 'shed dormer', 'gable dormer', 'dormer installation NJ', 'attic dormer', 'roof dormer', 'Bergen County dormers', 'dormer windows', 'roof expansion'],
    h1: 'Dormer Addition Services in North Jersey',
    intro: 'Transform attic space with dormer additions. SmartReno connects you with contractors who create functional living areas from unused attics.',
    description: [
      'Dormers add headroom and usable space to attics, creating bedrooms, offices, or bonus rooms. Types include shed dormers, gable dormers, and hip dormers.',
      'Our contractors handle structural modifications, roofing, and interior finish work to create beautiful, code-compliant living spaces.'
    ],
    benefits: [
      'Add square footage cost-effectively',
      'Increase natural light in attic',
      'Enhance home curb appeal',
      'Create private spaces',
      'Less disruptive than full additions'
    ],
    process: [
      'Attic assessment and planning',
      'Structural engineering',
      'Permit acquisition',
      'Roof cutting and framing',
      'Dormer construction',
      'Roofing and weatherproofing',
      'Interior finishing',
      'Final inspection'
    ],
    considerations: [
      'Ensure adequate attic height',
      'Match existing roof style',
      'Plan for proper insulation',
      'Consider adding dormers in pairs for symmetry',
      'Budget for HVAC extension'
    ],
    image: '/assets/home-addition.jpg'
  }
];

export function getProjectTypeBySlug(slug: string): ProjectType | undefined {
  return projectTypes.find(pt => pt.slug === slug);
}

export function getProjectTypesByCategory(category: 'interior' | 'exterior' | 'additions'): ProjectType[] {
  return projectTypes.filter(pt => pt.category === category);
}
