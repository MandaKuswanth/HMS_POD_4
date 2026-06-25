# API Testing Guide - Forgot & Reset Password

## Quick Test Scenarios

### Scenario 1: Happy Path (Complete Flow)

#### Step 1.1: Send OTP
```bash
curl -X POST http://localhost:3000/api/patient-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com"}'
```

**Expected Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "email": "patient@example.com"
  },
  "message": "OTP sent successfully to your email",
  "success": true
}
```

---

#### Step 1.2: Verify OTP (Check email for OTP)
```bash
curl -X POST http://localhost:3000/api/patient-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "otp":"123456"
  }'
```

**Expected Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "patient@example.com"
  },
  "message": "OTP verified successfully",
  "success": true
}
```

---

#### Step 1.3: Reset Password
```bash
curl -X POST http://localhost:3000/api/patient-auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "newPassword":"NewSecurePass123",
    "confirmPassword":"NewSecurePass123"
  }'
```

**Expected Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "email": "patient@example.com"
  },
  "message": "Password reset successfully",
  "success": true
}
```

---

#### Step 1.4: Login with New Password
```bash
curl -X POST http://localhost:3000/api/patient-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "password":"NewSecurePass123"
  }'
```

**Expected Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "patient": { /* patient details */ },
    "user": { /* user details */ }
  },
  "message": "Patient logged in successfully",
  "success": true
}
```

---

### Scenario 2: Error Cases

#### 2.1: Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/patient-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Email is required",
  "success": false
}
```

---

#### 2.2: Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/patient-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com"}'
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Email and OTP are required",
  "success": false
}
```

---

#### 2.3: Wrong OTP
```bash
curl -X POST http://localhost:3000/api/patient-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "otp":"000000"
  }'
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid OTP",
  "success": false
}
```

---

#### 2.4: OTP Expired
```bash
curl -X POST http://localhost:3000/api/patient-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "otp":"123456"
  }'
```

**Response (400):** (if >10 minutes have passed)
```json
{
  "statusCode": 400,
  "message": "OTP has expired",
  "success": false
}
```

---

#### 2.5: Too Many Failed Attempts
```bash
curl -X POST http://localhost:3000/api/patient-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "otp":"000000"
  }'
```

**Response (403):** (after 5 failed attempts)
```json
{
  "statusCode": 403,
  "message": "Too many failed OTP attempts. Please request a new OTP",
  "success": false
}
```

---

#### 2.6: Weak Password
```bash
curl -X POST http://localhost:3000/api/patient-auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "newPassword":"weak",
    "confirmPassword":"weak"
  }'
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Password must be at least 8 characters long",
  "success": false
}
```

---

#### 2.7: Passwords Don't Match
```bash
curl -X POST http://localhost:3000/api/patient-auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"patient@example.com",
    "newPassword":"Password123",
    "confirmPassword":"Password456"
  }'
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Passwords do not match",
  "success": false
}
```

---

#### 2.8: Rate Limiting (Too Many OTP Requests)
```bash
# Request 1 - Success
curl -X POST http://localhost:3000/api/patient-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com"}'

# Request 2 (immediately) - Rate Limited
curl -X POST http://localhost:3000/api/patient-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com"}'
```

**Response (429):**
```json
{
  "statusCode": 429,
  "message": "Too many OTP requests. Please wait before requesting another OTP",
  "success": false
}
```

---

### Scenario 3: Security Tests

#### 3.1: Non-existent Email (Security Feature)
```bash
curl -X POST http://localhost:3000/api/patient-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}'
```

**Response (200):** (Generic message - doesn't reveal if email exists)
```json
{
  "statusCode": 200,
  "data": {
    "email": "nonexistent@example.com"
  },
  "message": "If an account with this email exists, an OTP has been sent",
  "success": true
}
```

---

#### 3.2: SQL Injection Attempt
```bash
curl -X POST http://localhost:3000/api/patient-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com\" OR \"1\"=\"1"}'
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid email format or User not found",
  "success": false
}
```

---

### Scenario 4: Frontend Test Cases

#### 4.1: OTP Input - Only Numbers Accepted
```
User Input: "12abc34"
Actual Value Stored: "123456" (truncated to 6 digits, non-numerics removed)
```

#### 4.2: Password Requirements Real-time Validation
```
User types: "pass"
Validation: ✗ Too short, ✗ No uppercase, ✗ No number

User types: "Password1"
Validation: ✓ 8+ chars, ✓ Has uppercase, ✓ Has number
Status: Ready to submit
```

#### 4.3: Timer Countdown
```
At 600s: Blue timer, normal display
At 60s:  Orange timer, expiring soon
At 0s:   Timer stops, Verify button disabled, Resend button enabled
```

---

## Testing Checklist

### Backend Tests:
- [ ] OTP generation (6 digits)
- [ ] OTP expiry (10 minutes)
- [ ] OTP hashing (SHA256)
- [ ] Rate limiting (1 per 15 min)
- [ ] Attempt limiting (5 max)
- [ ] Email validation
- [ ] Password validation (8+ chars, uppercase, number)
- [ ] Password hashing (bcrypt)
- [ ] OTP cleanup after reset
- [ ] Generic responses for non-existent users

### Frontend Tests:
- [ ] Email input validation
- [ ] OTP input (6 digits only)
- [ ] OTP timer (10 min countdown)
- [ ] Password requirements display
- [ ] Show/hide password toggle
- [ ] Loading states
- [ ] Error messages
- [ ] Success messages
- [ ] Navigation flow
- [ ] Resend OTP functionality

### Integration Tests:
- [ ] Complete happy path
- [ ] Expired OTP handling
- [ ] Wrong OTP handling
- [ ] Weak password rejection
- [ ] Rate limiting trigger
- [ ] Attempt limiting trigger
- [ ] Network error handling
- [ ] Timeout handling

---

## Performance Benchmarks

| Operation | Target Time | Notes |
|-----------|------------|-------|
| Send OTP | < 1s | Depends on email service |
| Verify OTP | < 200ms | Crypto comparison |
| Reset Password | < 500ms | Bcrypt hashing |
| OTP expiry check | < 100ms | DB query with index |

---

## Database Query Examples

### Find users with expired OTPs:
```javascript
db.collection('users').find({
  resetOTPExpiry: { $lt: new Date() },
  resetOTP: { $ne: null }
})
```

### Find users with many failed attempts:
```javascript
db.collection('users').find({
  resetOTPAttempts: { $gte: 5 }
})
```

### Check rate limiting:
```javascript
db.collection('users').find({
  lastOTPRequestTime: {
    $gt: new Date(Date.now() - 15 * 60 * 1000)
  }
})
```

---

## Common Issues & Solutions

### Email not received?
1. Check BREVO_API_KEY configuration
2. Check BREVO_SENDER_EMAIL is set
3. Verify email is not in spam folder
4. Check server logs for API errors

### OTP always invalid?
1. Ensure exact OTP copy from email
2. Check OTP hasn't expired (10 min window)
3. Verify hashing is consistent
4. Check attempt counter not exceeded

### Password reset fails?
1. Verify password meets all requirements
2. Ensure OTP verification passed
3. Check OTP hasn't expired
4. Verify email exists in system

### Rate limit error?
1. Wait 15 minutes for rate limit reset
2. Or use resend button on OTP screen
3. Check lastOTPRequestTime in DB

---

## Monitoring & Logs

### Key Metrics to Monitor:
- OTP request frequency (rate limiting effectiveness)
- Failed OTP attempts (brute force detection)
- Password reset success rate
- Email delivery time
- API response times

### Logs to Check:
```bash
# Backend logs
console.error("Forgot Password Error:", error);
console.error("Verify OTP Error:", error);
console.error("Reset Password Error:", error);

# Email service logs
console.log(`Email sent successfully to ${email}`);
console.error("Brevo email error:", error.message);
```

---

## Postman Collection Import

1. Copy `Postman_Collection_ForgotReset_Password.json`
2. Open Postman
3. Click "Import" > "File"
4. Select the JSON file
5. Set `BASE_URL` environment variable to `http://localhost:3000/api`
6. Run requests in order

---

**Last Updated:** 2024
**Version:** 1.0
