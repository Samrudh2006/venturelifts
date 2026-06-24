# Penetration Testing Checklist

## Authentication
- [ ] Test brute force login attempts (rate limited to 100/min)
- [ ] Verify JWT tokens cannot be forged (HMAC-SHA256)
- [ ] Test refresh token rotation (old tokens invalidated)
- [ ] Verify email verification bypass
- [ ] Test password reset token predictability
- [ ] Verify 2FA cannot be bypassed

## Authorization
- [ ] Test role escalation (founder -> admin)
- [ ] Verify user A cannot access user B's ventures
- [ ] Test API endpoint access without proper role
- [ ] Verify session revocation works across devices

## Input Validation
- [ ] Test XSS via venture name/problem fields
- [ ] Verify SQL injection blocked (parameterized queries)
- [ ] Test for prototype pollution
- [ ] Verify file upload validation (CNN image)
- [ ] Test for command injection in Python ML calls

## Session Management
- [ ] Test session fixation
- [ ] Verify cookies have HttpOnly + SameSite flags
- [ ] Test token expiration enforcement
- [ ] Verify logout invalidates all sessions

## API Security
- [ ] Test rate limiting on all endpoints
- [ ] Verify CORS allowlist is restrictive
- [ ] Test for mass assignment vulnerabilities
- [ ] Verify proper HTTP methods enforced

## Infrastructure
- [ ] Verify no secrets in source code
- [ ] Test container isolation (Docker)
- [ ] Verify network policies restrict DB access
- [ ] Test for dependency vulnerabilities (`npm audit`)

## Data Protection
- [ ] Verify passwords are hashed (scrypt)
- [ ] Test for information disclosure in errors
- [ ] Verify HTTPS enforced in production
