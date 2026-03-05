# Site Health Copilot

## Overview
The Site Health Copilot is an AI-powered chatbot that provides intelligent answers about your website's health by analyzing data from all AI maintenance modules (SEO, performance, redirects, errors, and content).

## Features

### Conversational AI Interface
- Natural language queries
- Context-aware responses
- References real report data
- Maintains conversation history
- Suggested starter questions

### Intelligent Analysis
- Synthesizes data from all AI modules
- Identifies critical issues automatically
- Provides prioritized recommendations
- Explains technical metrics in business terms
- Suggests concrete next steps

### Context Integration
The copilot automatically gathers context from:
- **SEO Reports**: Recommendations, pages analyzed, optimization priorities
- **Performance Audits**: Lighthouse scores, Core Web Vitals, bottlenecks
- **Redirect Reports**: Broken links, redirect suggestions, crawl data
- **Error Logs**: Critical errors, error patterns, affected systems
- **Content Pipeline**: Content ideas, keyword opportunities, publishing priorities

## Components

### Database Tables

#### `ai_copilot_sessions`
- Tracks conversation sessions
- User-scoped (RLS enforced)
- Session titles and timestamps

#### `ai_copilot_messages`
- Individual chat messages
- Role-based (user/assistant/system)
- Stores context used for each response
- Linked to sessions

### Edge Function: `site-health-copilot`
Located at: `supabase/functions/site-health-copilot/index.ts`

**Workflow:**
1. Authenticates user
2. Gathers context from all AI reports
3. Builds comprehensive system prompt
4. Queries Lovable AI (Gemini 2.5 Flash)
5. Saves conversation to database
6. Returns AI response with context metadata

**API:**
```typescript
// Send message
POST /functions/v1/site-health-copilot
Headers: { Authorization: "Bearer <user_token>" }
Body: {
  sessionId?: string,  // null for new session
  message: string,
  history?: Array<{ role: string; content: string }>
}

// Response
{
  success: true,
  sessionId: "uuid",
  response: "AI response text",
  contextUsed: { /* report data */ }
}
```

### Admin UI: Site Health Copilot Tab
Located in: `src/pages/AdminAI.tsx`

**Features:**
- Clean chat interface
- Message bubbles (user vs assistant)
- Auto-scroll to latest message
- Suggested starter questions
- Textarea input with Enter-to-send
- Loading indicators
- Session persistence

## System Prompt Design

The copilot is provided with:
- **Role**: Site Health Copilot for SmartReno
- **Capabilities**: SEO, performance, errors, content analysis
- **Current Context**: All latest report data
- **Guidelines**: Be concise, actionable, prioritize critical issues
- **Common Questions**: Pre-defined answer patterns

## Example Queries

### Critical Issues
**Q**: "What are the most critical issues right now?"
**A**: Analyzes all reports, identifies high-priority items, provides ordered list with severity levels

### SEO Performance
**Q**: "How's our SEO performance?"
**A**: References latest SEO report, highlights key metrics, suggests top 3 optimizations

### Broken Links
**Q**: "Are there any broken links I should fix?"
**A**: Checks redirect report, lists most impactful broken links, explains redirect strategies

### Error Debugging
**Q**: "What errors are affecting the site?"
**A**: Reviews error log report, groups by severity, explains root causes, suggests fixes

### Content Strategy
**Q**: "What content should we create next?"
**A**: References content pipeline, highlights high-priority ideas, explains keyword opportunities

### Performance Optimization
**Q**: "How can I improve our Core Web Vitals?"
**A**: Analyzes performance report, explains metrics, provides specific optimization steps

## Context Gathering Strategy

The copilot gathers:
1. **Latest Reports**: One from each module (SEO, perf, redirects, errors, content)
2. **Key Metrics**: Summary statistics from each report
3. **Critical Counts**: High-priority pending items across all systems
4. **Report IDs**: For reference and drill-down

This context ensures answers are grounded in real data, not hallucinations.

## Best Practices

### For Users
- Ask specific questions for better answers
- Reference specific metrics or pages when possible
- Follow up on suggested next steps
- Run fresh reports before asking about latest data

### For AI Responses
- Always reference specific report data
- Quantify issues (numbers, percentages)
- Provide concrete next steps
- Link to relevant sections/reports
- Explain "why" not just "what"

## Usage

### Starting a Conversation
1. Navigate to `/admin/ai` → "AI Copilot" tab
2. Click a suggested question or type your own
3. Press Enter or click Send
4. Review AI response
5. Continue conversation

### Suggested Questions
Pre-defined questions help users discover capabilities:
- Critical issues overview
- SEO performance check
- Broken link status
- Error analysis
- Content priorities
- Performance optimization

### Conversation History
- Sessions are saved to database
- History maintained within session
- Last 6 messages sent as context to AI
- Auto-scroll to latest message

## Security

- **RLS Enforced**: Users can only access their own sessions
- **Authentication Required**: Must be logged in
- **User-Scoped**: Sessions tied to auth.uid()
- **No Sensitive Data**: Reports summarized, not full dumps

## Performance

- **Response Time**: 2-5 seconds typical
- **Context Size**: ~500-2000 tokens
- **AI Model**: Gemini 2.5 Flash (fast, cost-effective)
- **History Limit**: Last 6 messages (3 exchanges)

## AI Model Configuration

**Model**: `google/gemini-2.5-flash`
- Fast response times
- Cost-effective
- Strong reasoning
- Good at technical explanations
- Conversational tone

## Future Enhancements

### Planned Features
- Multi-session management (view/switch)
- Export conversations
- Share insights with team
- Scheduled health checks
- Proactive alerts/suggestions
- Voice input/output
- Rich media responses (charts, graphs)

### Advanced Capabilities
- Trend analysis over time
- Predictive issue detection
- Automated fix application
- Integration with project management tools
- Custom alert rules
- Team collaboration features

## Troubleshooting

### Common Issues

**"I don't have enough data to answer"**
- Solution: Run relevant reports first (SEO, performance, etc.)

**"Let me check the latest reports"**
- Solution: Reports may be stale, run fresh analysis

**"I need more specific information"**
- Solution: Ask more detailed questions or reference specific pages/metrics

**Slow responses**
- Possible causes: Large context, complex query, API latency
- Solution: Be more specific, break down questions

## Integration Points

The copilot integrates with:
- `ai_seo_reports` and `ai_seo_recommendations`
- `ai_performance_reports` and `ai_performance_recommendations`
- `ai_redirect_reports` and `ai_redirect_recommendations`
- `ai_error_log_reports` and `ai_error_groups`
- `ai_content_reports` and `ai_content_ideas`
- `ai_keyword_research`

## Monitoring

Track copilot usage:
- Message volume per day
- Common question patterns
- Response quality ratings (future)
- Session duration
- User satisfaction

## Cost Considerations

- Uses Lovable AI credits
- Average cost: ~0.01-0.02 credits per message
- Context size optimized to reduce costs
- History limited to 6 messages

## Example Conversation

**User**: "What are the most critical issues?"

**Copilot**: "Based on the latest reports, here are your critical issues:

🔴 **SEO (2 high-priority)**
- 15 pages missing meta descriptions
- 8 pages with duplicate titles

🔴 **Errors (3 critical)**
- Database connection timeout (45 occurrences)
- Edge function crash in 'ai-seo-refresh'

🟡 **Performance (1 high-impact)**
- LCP score of 4.2s on homepage (should be <2.5s)

**Recommended Actions:**
1. Fix database connection pool settings
2. Add meta descriptions to top 5 traffic pages
3. Optimize homepage images (lazy loading, WebP format)

Would you like details on any of these?"

**User**: "Tell me more about the database errors"

**Copilot**: "The database connection timeout is occurring in your edge functions. Here's what I found:

**Error Details:**
- 45 occurrences in last 24 hours
- Affects 'ai-seo-refresh' and 'site-health-copilot' functions
- First seen 6 hours ago

**Root Cause:**
Connection pool exhaustion during high-traffic periods.

**Suggested Fix:**
```typescript
// In your edge function
const supabase = createClient(url, key, {
  db: {
    pool: {
      min: 2,
      max: 10  // Increase from default
    }
  }
});
```

**Next Steps:**
1. Update edge functions with new pool settings
2. Monitor error rates for 24 hours
3. Consider upgrading database tier if persists

Need help implementing this?"
