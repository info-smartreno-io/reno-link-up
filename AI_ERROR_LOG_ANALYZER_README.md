# AI Error Log Analyzer

## Overview
The AI Error Log Analyzer is a production error monitoring and analysis system that automatically scans server logs, groups errors by similarity, and uses AI to suggest actionable fixes.

## Features

### Automated Error Detection
- Scans edge function logs, database logs, and auth logs
- Configurable time range (24h default, 7 days available)
- Groups similar errors by signature
- Tracks first/last occurrence and frequency

### AI-Powered Analysis
- Uses Lovable AI (Gemini 2.5 Flash) to analyze error patterns
- Provides root cause analysis
- Generates specific fix suggestions with code examples
- Calculates confidence scores for suggested fixes

### Error Categorization
- **Error Types**: Edge Function, Database, Auth, Storage
- **Severity Levels**: Low, Medium, High, Critical
- **Status Tracking**: New, Investigating, Resolved, Ignored

### Smart Grouping
- Groups errors by signature (pattern-based matching)
- Replaces dynamic values (UUIDs, numbers, URLs) for better grouping
- Stores sample log entries for context
- Tracks affected functions and tables

## Components

### Database Tables

#### `ai_error_log_reports`
- Stores each analysis run
- Tracks status, timeframe, error counts
- Summary statistics (total errors, critical count, warnings)

#### `ai_error_groups`
- Grouped errors with AI analysis
- Error signatures and patterns
- Sample log entries
- AI-generated fix suggestions
- Confidence scores

#### `ai_error_actions`
- Tracks fix attempts and outcomes
- Action history (auto-fix, manual, ignored, escalated)
- Results and notes

### Edge Function: `ai-error-log-analyzer`
Located at: `supabase/functions/ai-error-log-analyzer/index.ts`

**Workflow:**
1. Creates analysis report
2. Fetches logs from Supabase analytics (edge functions, DB, auth)
3. Groups errors by signature
4. Determines severity for each group
5. Uses AI to analyze and suggest fixes
6. Stores results in database
7. Updates report with summary statistics

**API:**
```typescript
// Run analysis
POST /functions/v1/ai-error-log-analyzer
Body: { timeRangeHours: 24 }

// Response
{
  success: true,
  reportId: "uuid",
  summary: {
    totalErrors: 156,
    groupedErrors: 8,
    criticalErrors: 2,
    warnings: 4
  }
}
```

### Admin UI Component: `ErrorLogAnalyzerPanel`
Located at: `src/components/admin/ai/ErrorLogAnalyzerPanel.tsx`

**Features:**
- Run analysis with 24h or 7-day timeframe
- View report history
- Browse error groups by severity/status
- Expand error details to see AI analysis
- Update error status (investigating, resolved, ignored)
- View sample log entries and stack traces

## Severity Determination

### Critical
- More than 100 occurrences
- Out of memory errors
- Database connection failures
- Authentication failures
- Database-level errors

### High
- More than 50 occurrences
- Timeout errors
- 500 Internal Server errors

### Medium
- More than 10 occurrences
- Rate limiting (429 errors)

### Low
- Everything else

## Error Signature Algorithm

Generates unique signatures for grouping by:
1. Replacing numbers with 'N'
2. Replacing UUIDs with 'UUID'
3. Replacing URLs with 'URL'
4. Combining: `{type}:{function}:{cleaned_message}`

This ensures similar errors are grouped together regardless of dynamic values.

## AI Analysis

The system prompts Lovable AI with:
- Error type and message
- Occurrence count and timeframe
- Affected functions/tables
- Sample log entries

AI provides:
1. **Root cause analysis** (2-3 sentences)
2. **Specific fix suggestion** (with code if applicable)
3. **Confidence level** (0.0-1.0)

## Usage

### Running an Analysis
1. Navigate to `/admin/ai` → "Error Logs" tab
2. Click "Run Analysis (24h)" or "Run (7 days)"
3. Wait for completion (usually 30-60 seconds)
4. Review error groups

### Managing Errors
1. Click on a report to view its error groups
2. Use tabs to filter: All, Critical, New
3. Click "Show Details" on an error to see AI analysis
4. Update status:
   - **Investigating**: Currently working on it
   - **Mark Resolved**: Fixed and deployed
   - **Ignore**: False positive or acceptable

### Best Practices
- Run analysis daily to catch new errors early
- Prioritize critical and high-severity errors
- Review AI suggestions but verify before implementing
- Mark errors as resolved after fixing
- Use "ignored" status sparingly

## Integration

### Accessing Logs
The function uses Supabase RPC calls to access analytics:
- `get_edge_function_errors(time_threshold)`
- `get_database_errors(time_threshold)`
- `get_auth_errors(time_threshold)`

**Note:** These RPC functions need to be created in Supabase to query analytics tables. They are not included in this implementation but follow standard Supabase analytics query patterns.

### Automated Scheduling
To run analysis automatically:
1. Create a cron job (pg_cron)
2. Schedule daily at low-traffic hours
3. Call the edge function endpoint

## Future Enhancements

### Planned Features
- Auto-fix for common errors
- Slack/email notifications for critical errors
- Trend analysis across reports
- Error forecasting
- Integration with APM tools
- Custom error grouping rules

### Integration Ideas
- GitHub issue creation from errors
- Jira ticket automation
- PagerDuty alerting for critical errors
- Error replay/debugging tools

## Security Considerations

- All tables protected by RLS (admin-only access)
- Service role key required for edge function
- Sensitive data (API keys, passwords) stripped from logs
- Error samples limited to 5 entries per group

## Performance

- Efficient grouping algorithm (Map-based)
- Limited sample storage (5 entries max)
- Indexed queries for fast retrieval
- AI analysis only for new error groups

## Monitoring the Monitor

The system itself logs:
- Analysis start/completion
- Error counts per source
- AI API failures
- Database operation errors

Check edge function logs for system health.
