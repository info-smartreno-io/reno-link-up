# Site Health Copilot - Documentation

## Overview

The Site Health Copilot is an AI-powered assistant that helps administrators monitor and maintain SmartReno.io. It provides intelligent answers to questions about SEO, performance, errors, broken links, and content strategy by analyzing all monitoring system reports.

## Features

### 🤖 AI-Powered Analysis
- Uses Lovable AI (Google Gemini 2.5 Flash)
- Streams responses for better UX
- Maintains conversation context
- References actual report data

### 📊 Data Sources
The copilot has access to:
- **SEO Reports**: Page analysis, recommendations, optimization status
- **Performance Audits**: Lighthouse metrics, Core Web Vitals, speed issues
- **Broken Link Scans**: 404s, redirect suggestions, link health
- **Error Logs**: Critical errors, warnings, suggested fixes
- **Content Pipeline**: Blog ideas, cost guides, keyword research

### 💬 Conversation Features
- Real-time streaming responses
- Conversation history (last 10 messages)
- Persistent sessions stored in database
- Context-aware answers

## How It Works

### 1. User Asks Question
```typescript
"Why did my performance score drop?"
```

### 2. System Fetches Context
The copilot automatically:
- Fetches latest reports from all monitoring systems
- Identifies relevant data based on question keywords
- Pulls detailed information if needed (e.g., specific error logs)

### 3. AI Generates Answer
```typescript
const systemPrompt = `You are the Site Health Copilot for SmartReno.io...

Current Status:
- Performance Score: 87/100
- Broken Links: 3
- Critical Errors: 0
...

[Detailed context based on query]
`;
```

### 4. Response Streaming
Responses are streamed token-by-token for instant feedback

## Example Conversations

### Performance Questions
**User:** "Why is my homepage slow?"

**Copilot:** "Based on the latest performance audit, your homepage has a performance score of 78/100. The main issues are:
1. LCP of 3.2s (should be under 2.5s) - likely due to large hero image
2. CLS of 0.15 - layout shifts from dynamic content loading

Recommendations:
- Optimize and lazy-load the hero image
- Reserve space for dynamic content to prevent layout shifts"

### Error Investigation
**User:** "Show me critical errors from this week"

**Copilot:** "There are 2 critical error groups from the past week:

1. DatabaseError in contractor-scoring function
   - 12 occurrences
   - Cause: Connection timeout to Supabase
   - Fix: Increase timeout and add retry logic

2. TimeoutError in ai-seo-content-generator
   - 5 occurrences
   - Cause: AI API taking too long
   - Fix: Implement request timeout handling"

### SEO Questions
**User:** "Which pages need SEO updates?"

**Copilot:** "Based on the latest SEO report, 8 pages need attention:

High Priority:
- /bergen-county/ridgewood - Missing meta description
- /services/roofing - Title too long (72 chars)

Medium Priority:
- 6 town pages with outdated content (last updated 45+ days ago)

I recommend starting with the high-priority items as they have the most impact on search visibility."

## Technical Implementation

### Edge Function
**Location:** `supabase/functions/ai-site-health-copilot/index.ts`

**Key Features:**
- Fetches latest reports on each query
- Smart context building based on keywords
- Supports streaming responses
- Stores conversation history

### Frontend Component
**Location:** `src/components/admin/SiteHealthCopilot.tsx`

**Key Features:**
- Real-time streaming display
- Message history
- Auto-scroll to latest message
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### Dashboard Page
**Location:** `src/pages/admin/AIDashboard.tsx`

**Features:**
- Copilot interface
- System health overview
- Recent activity feed
- Example questions
- Quick stats

## Access

### URL
`/admin/ai-dashboard`

### Required Permissions
- Admin role
- Authenticated user

## Database Schema

### Tables Used
```sql
-- Session tracking
ai_copilot_sessions (
  id, user_id, title, created_at, updated_at
)

-- Message history
ai_copilot_messages (
  id, session_id, role, content, context_used, created_at
)
```

### Report Tables Referenced
- `ai_seo_reports` + `ai_seo_recommendations`
- `ai_performance_reports` + `ai_performance_audits` + `ai_performance_recommendations`
- `ai_redirect_reports` + `ai_redirect_recommendations`
- `ai_error_log_reports` + `ai_error_groups`
- `ai_content_reports` + `ai_content_ideas`

## Best Practices

### For Admins
1. **Be Specific:** "Why is the Ridgewood page slow?" is better than "Why is it slow?"
2. **Ask Follow-ups:** The copilot maintains context, so you can drill down
3. **Reference Time:** "Show me errors from yesterday" or "What changed this week?"
4. **Use for Triage:** Quick diagnosis before diving into detailed dashboards

### For Developers
1. **Keep Context Fresh:** Reports are fetched on each query to ensure current data
2. **Monitor Costs:** Each message uses Lovable AI credits
3. **Add More Context:** Update the edge function to include new data sources
4. **Improve Prompts:** Refine the system prompt for better responses

## Future Enhancements

### Potential Additions
- **Tool Calling:** Let copilot trigger actions (e.g., "Apply this redirect")
- **Visual Charts:** Generate graphs and visualizations in responses
- **Report Scheduling:** "Send me a weekly summary every Monday"
- **Proactive Alerts:** "Your performance dropped 10 points today"
- **Team Collaboration:** Tag team members, share conversations

### Integration Ideas
- Connect to Google Search Console for real keyword data
- Link to Google Analytics for traffic insights
- Pull contractor performance metrics
- Access lead conversion funnels

## Troubleshooting

### Issue: Copilot gives generic answers
**Solution:** Ensure reports are running regularly. Check that latest reports exist in database.

### Issue: Slow responses
**Solution:** This is normal during first message as it fetches all reports. Subsequent messages use cached context.

### Issue: "API key not configured" error
**Solution:** Verify LOVABLE_API_KEY is set in Supabase secrets.

### Issue: Conversation doesn't maintain context
**Solution:** Check that `conversationHistory` is being passed correctly in API calls.

## Credits & Costs

- Uses **Lovable AI** (included with Lovable Cloud)
- Each message consumes AI credits based on:
  - Context size (report data)
  - Response length
  - Streaming overhead

**Estimated Cost:** ~1-2 AI credits per question (depending on complexity)

## Security

### Access Control
- Admin-only endpoint
- JWT verification enabled
- Session tied to authenticated user

### Data Privacy
- Conversations stored in database
- No external services (Lovable AI gateway only)
- Reports contain system data, not user PII

## Support

For questions or issues:
1. Check edge function logs: Cloud → Edge Functions → ai-site-health-copilot
2. Review conversation history in database
3. Test with simple questions first
4. Contact support if issues persist

---

**Last Updated:** November 2024
**Version:** 1.0
**Status:** Production Ready ✅
