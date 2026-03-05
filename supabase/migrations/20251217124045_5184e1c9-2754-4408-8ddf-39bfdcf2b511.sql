-- Seed pricing_guide with items from the Addition Pricing Guide spreadsheet

-- Design/Planning
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Design/Planning', 'Beam', 'UNIT', 0, 500, 'NJ', 'Structural beam design'),
('Design/Planning', 'Dormer Addition', 'UNIT', 0, 2500, 'NJ', 'Dormer design package'),
('Design/Planning', 'Architectural - Room Addition', 'SQFT', 0, 3, 'NJ', 'Room addition design per sqft'),
('Design/Planning', '2nd Story Addition', 'SQFT', 0, 4, 'NJ', 'Second story design per sqft'),
('Design/Planning', 'Engineering', 'UNIT', 0, 2500, 'NJ', 'Structural engineering'),
('Design/Planning', 'Survey', 'UNIT', 0, 750, 'NJ', 'Property survey');

-- General Conditions
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('General Conditions', 'Permit', 'UNIT', 2500, 0, 'NJ', 'Building permit'),
('General Conditions', 'Outhouse', 'PER DIEM', 250, 0, 'NJ', 'Portable toilet rental'),
('General Conditions', 'Fence', 'UNIT', 500, 0, 'NJ', 'Construction fencing');

-- Dumpster
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Dumpster', 'OTS 18 Yarder', 'UNIT', 750, 0, 'NJ', '18 yard dumpster'),
('Dumpster', '30 Yard Dumpster', 'UNIT', 900, 0, 'NJ', '30 yard dumpster'),
('Dumpster', '15 Yard Dirt/Concrete', 'UNIT', 650, 0, 'NJ', '15 yard for heavy debris');

-- Demo
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Demo', 'Interior Demo', 'SQFT', 0, 4, 'NJ', 'Interior demolition'),
('Demo', 'Misc Demo', 'UNIT', 0, 500, 'NJ', 'Miscellaneous demolition'),
('Demo', 'Demo Material', 'SQFT', 0, 2, 'NJ', 'Material removal'),
('Demo', 'Full House Demo', 'SQFT', 0, 8, 'NJ', 'Complete house demolition'),
('Demo', 'Demo Roofing', 'SQFT', 0, 1.5, 'NJ', 'Roof tear-off');

-- Foundation (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Foundation', 'Close Off Pier Footings', 'LF', 35, 25, 'NJ', 'Close existing pier footings'),
('Foundation', 'Addition Slab', 'SQFT', 8, 7, 'NJ', 'Concrete slab for addition'),
('Foundation', 'Footings', 'LF', 30, 20, 'NJ', 'Foundation footings'),
('Foundation', 'Crawl Space', 'LF', 65, 45, 'NJ', 'Crawl space foundation'),
('Foundation', 'Basement (8ft Wall)', 'LF', 120, 80, 'NJ', '8 foot basement walls'),
('Foundation', 'Basement (9ft Wall)', 'LF', 140, 90, 'NJ', '9 foot basement walls'),
('Foundation', 'Basement Dig', 'SQFT', 12, 8, 'NJ', 'Basement excavation'),
('Foundation', 'Pier Footings', 'UNIT', 250, 150, 'NJ', 'Individual pier footings');

-- Framing (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Framing', '1st Floor Framing', 'SQFT', 12, 10, 'NJ', 'First floor framing'),
('Framing', '2nd Floor Framing', 'SQFT', 14, 12, 'NJ', 'Second floor framing'),
('Framing', 'Dormer Framing', 'SQFT', 18, 15, 'NJ', 'Dormer construction'),
('Framing', 'Gable Roof Framing', 'SQFT', 8, 7, 'NJ', 'Gable roof framing'),
('Framing', 'Hip Roof Framing', 'SQFT', 10, 9, 'NJ', 'Hip roof framing'),
('Framing', 'Beam/LVL', 'LF', 25, 15, 'NJ', 'Engineered beam installation'),
('Framing', 'Steel Beam', 'LF', 50, 30, 'NJ', 'Steel beam installation'),
('Framing', 'Subfloor', 'SQFT', 4, 3, 'NJ', 'Subfloor installation');

-- Roofing (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Roofing', 'Asphalt Shingles', 'SQFT', 3.5, 2.5, 'NJ', 'Standard asphalt shingles'),
('Roofing', 'Architectural Shingles', 'SQFT', 4.5, 3, 'NJ', 'Architectural shingles'),
('Roofing', 'Metal Roofing', 'SQFT', 8, 5, 'NJ', 'Standing seam metal'),
('Roofing', 'Flat Roofing (EPDM)', 'SQFT', 6, 4, 'NJ', 'EPDM flat roofing'),
('Roofing', 'Ice & Water Shield', 'SQFT', 1, 0.5, 'NJ', 'Ice and water barrier'),
('Roofing', 'Ridge Vent', 'LF', 8, 4, 'NJ', 'Ridge ventilation');

-- Siding (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Siding', 'Vinyl Siding', 'SQFT', 4, 3, 'NJ', 'Vinyl siding installation'),
('Siding', 'James Hardie Siding', 'SQFT', 8, 5, 'NJ', 'Fiber cement siding'),
('Siding', 'Cedar Siding', 'SQFT', 10, 6, 'NJ', 'Cedar wood siding'),
('Siding', 'House Wrap', 'SQFT', 0.5, 0.3, 'NJ', 'Weather barrier'),
('Siding', 'Soffit/Fascia', 'LF', 12, 8, 'NJ', 'Soffit and fascia');

-- Gutters (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Gutters', 'Aluminum Gutters', 'LF', 6, 4, 'NJ', '5 inch seamless aluminum'),
('Gutters', '6 Inch Gutters', 'LF', 8, 5, 'NJ', '6 inch seamless gutters'),
('Gutters', 'Downspouts', 'LF', 5, 3, 'NJ', 'Downspout installation'),
('Gutters', 'Gutter Guards', 'LF', 8, 4, 'NJ', 'Leaf guards');

-- Masonry (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Masonry', 'Brick Veneer', 'SQFT', 15, 12, 'NJ', 'Brick veneer installation'),
('Masonry', 'Stone Veneer', 'SQFT', 20, 15, 'NJ', 'Natural stone veneer'),
('Masonry', 'Cultured Stone', 'SQFT', 18, 12, 'NJ', 'Manufactured stone'),
('Masonry', 'Block Foundation', 'SQFT', 12, 10, 'NJ', 'CMU block work'),
('Masonry', 'Chimney Repair', 'UNIT', 500, 400, 'NJ', 'Chimney restoration');

-- Electrical
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Electrical', 'Electrical - Per SQFT', 'SQFT', 0, 12, 'NJ', 'Standard electrical per sqft'),
('Electrical', 'Panel Upgrade (200 Amp)', 'UNIT', 800, 1200, 'NJ', '200 amp panel upgrade'),
('Electrical', 'Sub Panel', 'UNIT', 400, 600, 'NJ', 'Sub panel installation'),
('Electrical', 'Outlet Installation', 'UNIT', 25, 75, 'NJ', 'Standard outlet'),
('Electrical', 'Recessed Lighting', 'UNIT', 50, 100, 'NJ', 'Recessed light fixture'),
('Electrical', 'GFCI Outlet', 'UNIT', 35, 85, 'NJ', 'GFCI protected outlet');

-- Plumbing
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Plumbing', 'Full Bath Rough', 'UNIT', 800, 1500, 'NJ', 'Full bathroom rough-in'),
('Plumbing', 'Half Bath Rough', 'UNIT', 500, 1000, 'NJ', 'Half bathroom rough-in'),
('Plumbing', 'Kitchen Rough', 'UNIT', 600, 1200, 'NJ', 'Kitchen plumbing rough'),
('Plumbing', 'Water Heater', 'UNIT', 800, 500, 'NJ', 'Standard water heater'),
('Plumbing', 'Tankless Water Heater', 'UNIT', 1500, 800, 'NJ', 'Tankless unit'),
('Plumbing', 'Toilet Installation', 'UNIT', 250, 200, 'NJ', 'Toilet install'),
('Plumbing', 'Vanity Installation', 'UNIT', 100, 200, 'NJ', 'Vanity with faucet');

-- HVAC
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('HVAC', 'Mini Split (Single Zone)', 'UNIT', 2000, 1500, 'NJ', 'Single zone mini split'),
('HVAC', 'Mini Split (Multi Zone)', 'UNIT', 4000, 2500, 'NJ', 'Multi-zone mini split'),
('HVAC', 'Central HVAC Per Ton', 'UNIT', 2500, 1500, 'NJ', 'Central AC per ton'),
('HVAC', 'Ductwork', 'LF', 15, 10, 'NJ', 'HVAC ductwork'),
('HVAC', 'Duct Extension', 'UNIT', 200, 150, 'NJ', 'Extend existing ducts');

-- Insulation (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Insulation', 'Wall Insulation (R-15)', 'SQFT', 1.2, 0.8, 'NJ', 'R-15 batt insulation'),
('Insulation', 'Wall Insulation (R-21)', 'SQFT', 1.5, 0.8, 'NJ', 'R-21 batt insulation'),
('Insulation', 'Attic Insulation (R-38)', 'SQFT', 1.8, 0.7, 'NJ', 'R-38 blown insulation'),
('Insulation', 'Spray Foam - Open Cell', 'SQFT', 1.5, 1, 'NJ', 'Open cell spray foam'),
('Insulation', 'Spray Foam - Closed Cell', 'SQFT', 3, 1.5, 'NJ', 'Closed cell spray foam'),
('Insulation', 'Rim Joist Insulation', 'LF', 8, 4, 'NJ', 'Rim joist spray foam');

-- Drywall (Includes Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Drywall', 'Drywall Install & Finish', 'SQFT', 1.5, 2.5, 'NJ', 'Hang, tape, finish Level 4'),
('Drywall', 'Drywall Install Only', 'SQFT', 1, 1.5, 'NJ', 'Hang drywall only'),
('Drywall', 'Ceiling Drywall', 'SQFT', 1.8, 3, 'NJ', 'Ceiling installation'),
('Drywall', 'Moisture Resistant', 'SQFT', 2, 2.5, 'NJ', 'Green board drywall');

-- Flooring
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Flooring', 'Hardwood Flooring', 'SQFT', 8, 5, 'NJ', 'Solid hardwood'),
('Flooring', 'Engineered Hardwood', 'SQFT', 6, 4, 'NJ', 'Engineered wood'),
('Flooring', 'LVP Flooring', 'SQFT', 4, 2.5, 'NJ', 'Luxury vinyl plank'),
('Flooring', 'Tile Flooring', 'SQFT', 6, 8, 'NJ', 'Ceramic/porcelain tile'),
('Flooring', 'Carpet', 'SQFT', 4, 2, 'NJ', 'Carpet with pad'),
('Flooring', 'Floor Prep/Leveling', 'SQFT', 2, 2, 'NJ', 'Subfloor preparation');

-- Doors (Material)
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Doors', 'Interior Door (Hollow Core)', 'DOOR', 150, 150, 'NJ', 'Standard interior door'),
('Doors', 'Interior Door (Solid Core)', 'DOOR', 300, 175, 'NJ', 'Solid core interior door'),
('Doors', 'Exterior Door', 'DOOR', 500, 300, 'NJ', 'Entry door with frame'),
('Doors', 'Sliding Glass Door', 'DOOR', 1200, 400, 'NJ', '6ft sliding door'),
('Doors', 'French Doors', 'DOOR', 1500, 500, 'NJ', 'French door set'),
('Doors', 'Pocket Door', 'DOOR', 400, 350, 'NJ', 'Pocket door with frame');

-- Carpentry
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Carpentry', 'Base Trim', 'LF', 3, 4, 'NJ', 'Baseboard installation'),
('Carpentry', 'Crown Molding', 'LF', 5, 6, 'NJ', 'Crown molding install'),
('Carpentry', 'Door Casing', 'DOOR', 40, 50, 'NJ', 'Door trim package'),
('Carpentry', 'Window Casing', 'WINDOW', 50, 60, 'NJ', 'Window trim package'),
('Carpentry', 'Wainscoting', 'SQFT', 8, 10, 'NJ', 'Wainscoting installation'),
('Carpentry', 'Built-in Shelving', 'LF', 40, 35, 'NJ', 'Custom shelving'),
('Carpentry', 'Closet System', 'LF', 30, 25, 'NJ', 'Closet organizer');

-- Painting
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Painting', 'Interior Paint', 'SQFT', 0.5, 2, 'NJ', 'Interior walls - 2 coats'),
('Painting', 'Ceiling Paint', 'SQFT', 0.5, 2.5, 'NJ', 'Ceiling - 2 coats'),
('Painting', 'Exterior Paint', 'SQFT', 0.75, 3, 'NJ', 'Exterior - 2 coats'),
('Painting', 'Trim Paint', 'LF', 0.5, 2, 'NJ', 'Trim and moldings'),
('Painting', 'Cabinet Paint', 'LF', 15, 25, 'NJ', 'Cabinet refinishing'),
('Painting', 'Staining', 'SQFT', 1, 2.5, 'NJ', 'Wood staining');

-- Deck
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Deck', 'Pressure Treated Deck', 'SQFT', 15, 12, 'NJ', 'PT wood deck'),
('Deck', 'Composite Deck', 'SQFT', 25, 15, 'NJ', 'Trex or similar'),
('Deck', 'Cedar Deck', 'SQFT', 22, 14, 'NJ', 'Cedar wood deck'),
('Deck', 'Deck Railing', 'LF', 35, 20, 'NJ', 'Code compliant railing'),
('Deck', 'Deck Stairs', 'LF', 80, 40, 'NJ', 'Stair construction'),
('Deck', 'Deck Footings', 'UNIT', 150, 100, 'NJ', 'Concrete footings');

-- Cabinets
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Cabinets', 'Stock Cabinets', 'LF', 150, 75, 'NJ', 'Stock kitchen cabinets'),
('Cabinets', 'Semi-Custom Cabinets', 'LF', 300, 100, 'NJ', 'Semi-custom cabinets'),
('Cabinets', 'Custom Cabinets', 'LF', 500, 150, 'NJ', 'Custom built cabinets'),
('Cabinets', 'Vanity Cabinet', 'UNIT', 400, 150, 'NJ', 'Bathroom vanity'),
('Cabinets', 'Cabinet Hardware', 'UNIT', 10, 5, 'NJ', 'Knobs and pulls');

-- Counter Tops
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Counter Tops', 'Granite Countertop', 'SQFT', 60, 25, 'NJ', 'Granite with installation'),
('Counter Tops', 'Quartz Countertop', 'SQFT', 75, 25, 'NJ', 'Quartz with installation'),
('Counter Tops', 'Marble Countertop', 'SQFT', 100, 30, 'NJ', 'Marble with installation'),
('Counter Tops', 'Laminate Countertop', 'SQFT', 25, 15, 'NJ', 'Laminate counter'),
('Counter Tops', 'Butcher Block', 'SQFT', 50, 20, 'NJ', 'Wood butcher block');

-- Tile
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Tile', 'Ceramic Tile', 'SQFT', 5, 8, 'NJ', 'Standard ceramic tile'),
('Tile', 'Porcelain Tile', 'SQFT', 7, 10, 'NJ', 'Porcelain floor/wall tile'),
('Tile', 'Subway Tile', 'SQFT', 4, 12, 'NJ', 'Subway tile backsplash'),
('Tile', 'Mosaic Tile', 'SQFT', 15, 15, 'NJ', 'Mosaic accent tile'),
('Tile', 'Shower Tile Complete', 'SQFT', 12, 18, 'NJ', 'Full shower tile'),
('Tile', 'Tile Backsplash', 'SQFT', 6, 12, 'NJ', 'Kitchen backsplash');

-- Windows
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
('Windows', 'Double Hung Window', 'WINDOW', 400, 200, 'NJ', 'Standard double hung'),
('Windows', 'Casement Window', 'WINDOW', 500, 225, 'NJ', 'Casement style window'),
('Windows', 'Picture Window', 'WINDOW', 600, 250, 'NJ', 'Fixed picture window'),
('Windows', 'Bay Window', 'WINDOW', 1500, 500, 'NJ', 'Bay window unit'),
('Windows', 'Egress Window', 'WINDOW', 800, 400, 'NJ', 'Basement egress window'),
('Windows', 'Skylight', 'WINDOW', 800, 600, 'NJ', 'Skylight installation')
ON CONFLICT DO NOTHING;