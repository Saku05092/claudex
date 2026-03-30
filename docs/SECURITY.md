# Claudex Security Guidelines

## API Server (src/api/)
- ALL POST endpoints must require authentication (Bearer token)
- CORS must restrict to known origins (never `*` in production)
- Rate limiting on all endpoints
- Set CLAUDEX_API_SECRET env var for API authentication

## Dashboard (src/dashboard/)
- NEVER use innerHTML with external data (tweets, AI output)
- Use textContent or escapeHtml() for all dynamic content
- Validate all URLs before rendering as href attributes

## Content Pipeline
- AI (Claude) output is UNTRUSTED data - always sanitize
- When inserting into HTML: escape `<`, `>`, `"`, `'`, `&`
- When inserting into URLs: use encodeURIComponent()

## Platforms (src/platforms/)
- Telegram HTML mode: escape all user/referral data in attributes
- Discord: validate URLs before embedding
- Instagram: check response.ok before parsing JSON

## Secrets Management
- .env is in .gitignore - NEVER commit it
- Only .env.example with placeholders goes in repo
- Rotate all keys if ever exposed in logs/chat/commits
- Twitter API keys: Pay-Per-Use, monitor usage

## Database (SQLite)
- Use parameterized queries (better-sqlite3 .run(?, ?) pattern)
- Never interpolate user input into SQL strings
