# AI Cost Estimator Widget

## Overview
The AI Cost Estimator Widget is a public-facing tool that provides instant, AI-powered cost estimates for renovation projects. It's designed to help homeowners understand potential costs before engaging with SmartReno's services.

## Features

### 1. **Instant Estimates**
- Real-time AI-powered cost analysis
- Comprehensive breakdown by category
- Regional pricing adjustments
- Material quality considerations

### 2. **User-Friendly Interface**
- Simple form with key project parameters
- Dropdown selections for consistency
- Mobile-responsive design
- Clear, actionable results

### 3. **Detailed Breakdowns**
- Cost range (low/mid/high estimates)
- Category breakdown (materials, labor, permits, contingency)
- Key cost drivers identification
- Cost-saving opportunities
- Timeline impact analysis
- Regional pricing factors

### 4. **Lead Generation**
- Tracks estimate requests anonymously
- Provides opportunity to convert to consultation
- Integrated with SmartReno workflow

## Components

### Database Schema
The widget logs activity to `ai_agent_activity` table:
```sql
- agent_type: 'cost_estimator'
- user_id: '00000000-0000-0000-0000-000000000000' (anonymous)
- user_role: 'homeowner'
- input: project parameters
- output: generated estimate
- status: 'completed'
```

### Edge Function
**Location**: `supabase/functions/ai-cost-estimator/index.ts`

**Endpoint**: `/functions/v1/ai-cost-estimator`

**Input**:
```typescript
{
  projectType: string;      // Kitchen, bathroom, etc.
  location: string;         // City, State or ZIP
  squareFootage: string;    // Project size
  materials: string;        // budget | standard | premium | luxury
  timeline: string;         // rushed | standard | flexible
}
```

**Output**:
```typescript
{
  success: boolean;
  estimate: {
    totalCostRange: {
      low: number;
      mid: number;
      high: number;
    };
    breakdown: {
      materials: number;
      labor: number;
      permits: number;
      contingency: number;
    };
    costDrivers: string[];
    savingOpportunities: string[];
    timelineImpact: string;
    regionalFactors: string;
  }
}
```

### UI Component
**Location**: `src/components/website/CostEstimatorWidget.tsx`

**Props**: None (standalone widget)

**Features**:
- Form validation
- Loading states
- Error handling
- Responsive design
- Toast notifications
- Currency formatting

## AI Prompting Strategy

### System Prompt
The AI is instructed to act as an expert renovation cost estimator, providing:
1. Realistic cost ranges (low/mid/high)
2. Detailed category breakdowns
3. Transparent assumptions
4. Regional pricing considerations
5. Cost-saving opportunities
6. Timeline impact analysis

### User Prompt
Includes all project parameters for context:
- Project type
- Location
- Square footage
- Materials quality
- Timeline constraints

### AI Model
- **Model**: `google/gemini-2.5-flash`
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Output**: Structured JSON

## Usage

### Embedding on Public Website
```tsx
import { CostEstimatorWidget } from "@/components/website/CostEstimatorWidget";

export function HomePage() {
  return (
    <div className="container mx-auto py-12">
      <h2>Get Your Free Estimate</h2>
      <CostEstimatorWidget />
    </div>
  );
}
```

### Preview in Admin
Currently displayed in `/admin/ai` for testing and demonstration.

## Cost Estimation Logic

### Base Calculations
1. **Materials**: Based on project type, size, and quality tier
2. **Labor**: Regional rates × estimated hours
3. **Permits**: Municipality-specific fees
4. **Contingency**: 10% of subtotal

### Regional Adjustments
- Urban vs. suburban pricing
- State/local cost of living
- Permit fee variations
- Labor market conditions

### Material Quality Tiers
- **Budget**: Entry-level materials, DIY-friendly
- **Standard**: Mid-range, contractor-grade
- **Premium**: High-quality, designer brands
- **Luxury**: Top-tier, custom options

### Timeline Impact
- **Rushed**: 15-20% premium for expedited work
- **Standard**: Baseline pricing
- **Flexible**: Potential 5-10% savings

## Security & Privacy

### Anonymous Tracking
- No user authentication required
- Anonymous user ID for activity logging
- No personal data collection in widget

### Rate Limiting
Consider implementing if public-facing:
- Per-IP request limits
- CAPTCHA for abuse prevention

### Data Validation
- Input sanitization
- Range validation for numeric inputs
- Location format validation

## Performance

### Response Time
- Target: < 3 seconds for estimate generation
- AI model: Fast inference with Gemini 2.5 Flash
- Async processing with loading states

### Caching Strategies
Future enhancement:
- Cache estimates for common project types
- Store regional cost data
- Pre-compute material price ranges

## Integration with SmartReno Workflow

### Lead Conversion
Future enhancement:
1. Collect email after estimate
2. "Schedule Consultation" CTA
3. Pass estimate data to CRM
4. Track conversion metrics

### Project Creation
Estimate data can pre-populate:
- Project type
- Location
- Square footage
- Budget expectations

## Future Enhancements

### 1. **Enhanced Estimations**
- Historical project data integration
- Machine learning for accuracy improvement
- Seasonal pricing adjustments
- Supply chain impact factors

### 2. **User Experience**
- Image upload for scope analysis
- Interactive cost sliders
- Comparison of material options
- PDF estimate export

### 3. **Business Intelligence**
- Track popular project types
- Analyze regional demand
- Identify pricing trends
- Lead quality scoring

### 4. **Personalization**
- Save estimates for logged-in users
- Compare multiple estimates
- Track estimate accuracy vs. actual costs
- Referral tracking

## Testing

### Manual Testing
1. Fill form with various project types
2. Test different locations
3. Try different material/timeline combos
4. Verify cost breakdowns make sense
5. Check mobile responsiveness

### Edge Cases
- Very small projects (< 50 sq ft)
- Very large projects (> 5000 sq ft)
- Rural locations
- Rush timelines
- Luxury materials

## Troubleshooting

### Common Issues

**Estimate seems too high/low**:
- Review AI prompt for accuracy
- Check regional pricing data
- Validate material cost assumptions
- Consider labor market conditions

**Slow response times**:
- Check AI Gateway performance
- Review network requests
- Optimize prompt length
- Consider caching strategies

**Parsing errors**:
- Validate JSON structure in AI response
- Add fallback parsing logic
- Improve prompt clarity
- Handle edge cases

## Technical Notes

### Dependencies
- Supabase Functions
- Lovable AI Gateway
- Shadcn UI components
- React Hook Form
- Zod validation (future)

### Environment Variables
- `LOVABLE_API_KEY`: For AI Gateway access
- `SUPABASE_URL`: For database logging
- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers
