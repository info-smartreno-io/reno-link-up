export const PROJECT_TYPES = [
  { value: "full_kitchen_remodel", label: "Full Kitchen Remodel" },
  { value: "kitchen_refresh", label: "Kitchen Refresh" },
  { value: "full_bathroom_remodel", label: "Full Bathroom Remodel" },
  { value: "bathroom_refresh", label: "Bathroom Refresh" },
  { value: "basement_finishing", label: "Basement Finishing" },
  { value: "home_addition", label: "Home Addition" },
  { value: "whole_home_renovation", label: "Whole Home Renovation" },
  { value: "exterior_renovation", label: "Exterior Renovation" },
  { value: "roofing_windows_siding", label: "Roofing / Windows / Siding" },
  { value: "deck_patio_outdoor", label: "Deck / Patio / Outdoor Living" },
  { value: "masonry_hardscape", label: "Masonry / Hardscape" },
  { value: "flooring_interior_finish", label: "Flooring / Interior Finish Work" },
  { value: "garage_conversion", label: "Garage Conversion" },
  { value: "adu", label: "Accessory Dwelling Unit (ADU)" },
  { value: "other", label: "Other" },
] as const;

export const PROJECT_DESCRIPTIONS: Record<string, string> = {
  full_kitchen_remodel: `Possible kitchen remodel projects include:

• Complete kitchen gut and rebuild
• Cabinet replacement and new layout
• Countertop upgrade (granite, quartz, marble)
• Backsplash installation
• New appliance package
• Lighting and electrical updates
• Plumbing relocation
• Island addition or expansion
• Flooring replacement

You can edit this description to better explain your project.`,

  kitchen_refresh: `Possible kitchen refresh projects include:

• Cabinet refacing or repainting
• New countertops on existing layout
• Backsplash update
• Hardware replacement
• Lighting fixture swap
• Faucet and sink upgrade
• Fresh paint and minor cosmetic updates

You can edit this description to better explain your project.`,

  full_bathroom_remodel: `Possible bathroom remodel projects include:

• Complete bathroom gut and rebuild
• Shower/tub conversion or replacement
• Vanity and sink replacement
• Tile work (floor and walls)
• Plumbing fixture upgrades
• Lighting and ventilation updates
• Heated flooring
• Glass shower enclosure

You can edit this description to better explain your project.`,

  bathroom_refresh: `Possible bathroom refresh projects include:

• New vanity and mirror
• Fixture upgrades (faucet, showerhead)
• Tile refresh or reglazing
• Paint and lighting updates
• Hardware and accessory replacement

You can edit this description to better explain your project.`,

  basement_finishing: `Possible basement finishing projects include:

• Full basement buildout
• Egress window installation
• Bathroom addition
• Home theater / media room
• Home office or gym space
• Wet bar or kitchenette
• Bedroom suite
• Waterproofing and moisture control
• HVAC extension

You can edit this description to better explain your project.`,

  home_addition: `Possible addition projects include:

• Rear home addition
• Second story addition
• Bump-out addition
• Kitchen expansion
• Master suite addition
• Garage conversion
• Accessory dwelling unit (ADU)
• Sunroom or enclosed porch
• In-law suite addition

You can edit this description to better explain your project.`,

  whole_home_renovation: `Possible whole home renovation projects include:

• Full interior renovation
• Open concept floor plan conversion
• Multiple room remodels
• Structural modifications
• Complete MEP (mechanical, electrical, plumbing) updates
• New flooring throughout
• Window and door replacement
• Insulation and energy efficiency upgrades

You can edit this description to better explain your project.`,

  exterior_renovation: `Possible exterior renovation projects include:

• Siding replacement
• Exterior painting
• Window and door replacement
• Front porch or portico addition
• Driveway and walkway work
• Landscaping overhaul
• Gutter and drainage systems
• Exterior lighting

You can edit this description to better explain your project.`,

  roofing_windows_siding: `Possible roofing/windows/siding projects include:

• Full roof replacement
• Roof repair or patching
• Window replacement (vinyl, wood, fiberglass)
• Siding installation or replacement
• Gutter installation
• Soffit and fascia repair
• Storm damage restoration

You can edit this description to better explain your project.`,

  deck_patio_outdoor: `Possible outdoor living projects include:

• New deck construction (wood, composite, PVC)
• Patio installation (pavers, concrete, stone)
• Outdoor kitchen or built-in grill
• Pergola or gazebo
• Fire pit or fireplace
• Screened porch
• Pool deck
• Outdoor lighting

You can edit this description to better explain your project.`,

  masonry_hardscape: `Possible masonry/hardscape projects include:

• Retaining walls
• Paver walkways and patios
• Stone veneer installation
• Brick repair or repointing
• Chimney repair or rebuild
• Stucco application
• Outdoor steps and landings
• Decorative stone walls

You can edit this description to better explain your project.`,

  flooring_interior_finish: `Possible flooring/finish projects include:

• Hardwood floor installation or refinishing
• Tile installation
• Luxury vinyl plank (LVP)
• Carpet installation
• Trim and molding work
• Interior painting
• Wainscoting or paneling
• Built-in shelving or cabinetry

You can edit this description to better explain your project.`,

  garage_conversion: `Possible garage conversion projects include:

• Living space conversion
• Home office or studio
• Guest suite or in-law apartment
• Home gym
• Workshop or hobby room
• Insulation and climate control
• Electrical and plumbing additions
• Code-compliant egress

You can edit this description to better explain your project.`,

  adu: `Possible ADU (Accessory Dwelling Unit) projects include:

• Detached ADU new construction
• Garage conversion to ADU
• Basement apartment conversion
• Above-garage apartment
• In-law suite with separate entrance
• Tiny home on property
• Rental unit construction

You can edit this description to better explain your project.`,

  other: "",
};

export const BUDGET_OPTIONS = [
  { value: "$10k-$25k", label: "$10k – $25k" },
  { value: "$25k-$60k", label: "$25k – $60k" },
  { value: "$60k-$100k", label: "$60k – $100k" },
  { value: "$100k-$250k", label: "$100k – $250k" },
  { value: "$250k-$500k", label: "$250k – $500k" },
  { value: "$500k+", label: "$500k+" },
];

export const FINANCING_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe / exploring options" },
];

export const DESIGN_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "have_plans", label: "I already have plans" },
  { value: "not_sure", label: "Not sure yet" },
];

export const MATERIAL_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
];

export const PERMIT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
  { value: "not_sure", label: "Not sure" },
];

export const SIZE_OPTIONS = [
  { value: "under_50", label: "Under 50 sq ft" },
  { value: "50_100", label: "50 – 100 sq ft" },
  { value: "100_200", label: "100 – 200 sq ft" },
  { value: "200_400", label: "200 – 400 sq ft" },
  { value: "400_800", label: "400 – 800 sq ft" },
  { value: "800_plus", label: "800+ sq ft" },
  { value: "not_sure", label: "Not sure" },
];
