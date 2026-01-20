# Testing Hyland IDP API Integration

## ✅ Setup Complete

The Hyland API integration is **fully implemented** and ready for testing!

### Current Status
- ✅ Backend running on `http://localhost:3001`
- ✅ Mode: **MOCK** (simulated Hyland responses)
- ✅ Real Hyland credentials configured
- ✅ form-data package installed for multipart uploads
- ✅ Authentication flow implemented (OAuth2)
- ✅ Document upload implemented (multipart/form-data)

## Quick Start Test

### 1. Test with Mock Mode (Current)

The app is currently running in **MOCK mode** which simulates Hyland IDP:

```bash
# Backend is already running at http://localhost:3001
# Check status
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T...",
  "mode": "mock"
}
```

### 2. Test Document Upload (Mock)

Open the frontend at `http://localhost:5173`:
1. Click **"Capture Document"**
2. Take a photo or allow camera access
3. Click the capture button
4. Watch the document appear in **View Tasks**
5. After ~2 minutes, status changes to **"completed"**

Check backend logs for:
```
[HylandService] MOCK MODE: Generating mock Hyland doc ID
[HylandService] Mock upload successful: HYLAND-1768842387777
[MockWebhook] Simulating extraction for: 12345
[MockWebhook] Document completed: 12345
```

### 3. Switch to Real Hyland API

To test with the **real Hyland IDP API**:

#### Step 1: Update Environment
```bash
cd /Users/oliver.beerhenke/Documents/cic/webcap/backend
```

Edit `.env` and change:
```env
USE_MOCK_HYLAND=false
```

#### Step 2: Restart Backend
The backend is watching for changes, so kill the current process:
```bash
# Press Ctrl+C in the terminal running the backend
# Then restart:
npm run dev
```

You should see:
```
🔧 Mode: PRODUCTION
```

#### Step 3: Test Real Upload

1. Open frontend: `http://localhost:5173`
2. Capture a document
3. Check backend logs for:

```
[HylandService] Authenticating with Hyland IDP...
[HylandService] Authentication successful, token expires at: ...
[HylandService] Uploading document...
[HylandService] Document uploaded successfully: b510d3a1-9685-48e7-821b-86be7aaf8f26
```

## Detailed Testing Guide

### Test 1: Authentication

Test the Hyland token endpoint directly:

```bash
curl --location 'https://auth.app.hyland.com/idp/connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=sc-31c0c400-8eb3-49da-9776-aadb6773fdef' \
  --data-urlencode 'client_secret=hyx_cs_6xsPZvf1dB1GaSvA2eK0wlpBt9QR41nEbQjyh1okm0kMidnsk4'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "..."
}
```

### Test 2: Document Upload (via API)

Test the backend upload endpoint:

```bash
# First, get a base64 image
IMAGE_BASE64=$(base64 -i /Users/oliver.beerhenke/Documents/cic/webcap/unnamed.jpg)

# Upload via API
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\": \"data:image/jpeg;base64,$IMAGE_BASE64\"}"
```

Expected response:
```json
{
  "id": "12345",
  "status": "uploading",
  "hylandDocId": "b510d3a1-9685-48e7-821b-86be7aaf8f26",
  "createdAt": "2026-01-19T..."
}
```

### Test 3: WebSocket Updates

Connect to WebSocket and listen for events:

```javascript
// In browser console at http://localhost:5173
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ WebSocket connected');
});

socket.on('document:statusUpdate', (data) => {
  console.log('📄 Status update:', data);
});

socket.on('document:completed', (data) => {
  console.log('✅ Document completed:', data);
});

socket.on('document:failed', (data) => {
  console.error('❌ Document failed:', data);
});
```

### Test 4: Webhook (Requires ngrok)

For testing the complete flow with webhook callbacks:

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3001
```

Copy the forwarding URL (e.g., `https://abc123.ngrok.io`) and update `.env`:

```env
BACKEND_URL=https://abc123.ngrok.io
```

Then configure this webhook URL in your Hyland IDP dashboard:
```
https://abc123.ngrok.io/api/webhook/hyland/extraction
```

## Expected Behavior

### Mock Mode Flow
1. **Upload** → Mock Hyland doc ID generated (`HYLAND-1768842387777`)
2. **Status: uploading** → Immediate
3. **Mock webhook triggers** → After 2 minutes
4. **Status: processing** → Brief
5. **Status: completed** → With realistic extracted data (invoice/resume/receipt)

### Production Mode Flow
1. **Upload** → Real authentication with Hyland IDP
2. **Token retrieved** → Cached for 3600 seconds
3. **Document uploaded** → Real Hyland doc ID (`b510d3a1-9685-48e7...`)
4. **Status: uploading** → Immediate
5. **IDP extraction triggered** → Real Hyland processing
6. **Webhook callback** → Hyland calls your endpoint after processing
7. **Status: completed** → With real extracted data

## Troubleshooting

### Issue: Authentication Fails

**Symptoms:**
```
Error: Request failed with status code 401
```

**Solutions:**
1. Verify credentials in `.env` are correct
2. Check token endpoint: `https://auth.app.hyland.com/idp/connect/token`
3. Ensure `HYLAND_CLIENT_ID` and `HYLAND_CLIENT_SECRET` match exactly

### Issue: Upload Fails

**Symptoms:**
```
Error: Request failed with status code 400
```

**Solutions:**
1. Check base64 image format: `data:image/jpeg;base64,...`
2. Verify Content API URL: `https://dev-3841c76e0c964fd786c773e3327d09a2.content.experience.hyland.com/api`
3. Ensure token is valid (not expired)
4. Check network logs for exact error response

### Issue: No Webhook Callback

**Symptoms:**
- Document stuck in "uploading" or "processing" status
- No webhook logs in backend

**Solutions:**
1. Verify webhook URL is publicly accessible (use ngrok)
2. Check Hyland IDP webhook configuration
3. Test webhook endpoint manually:
   ```bash
   curl -X POST http://localhost:3001/api/webhook/hyland/extraction \
     -H "Content-Type: application/json" \
     -d '{"documentId": "test-123", "status": "completed", "extractedData": {}}'
   ```

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at 'http://localhost:3001' from origin 'http://localhost:5173' has been blocked by CORS
```

**Solutions:**
1. Ensure backend CORS is configured for `http://localhost:5173`
2. Check `FRONTEND_URL` in `.env`
3. Restart backend after .env changes

## Backend Logs to Watch

### Successful Mock Upload
```
[HylandService] MOCK MODE: Generating mock Hyland doc ID
[HylandService] Mock upload successful: HYLAND-1768842387777
[MockWebhook] Simulating extraction for: 12345
[MockWebhook] Extraction results will be sent in ~2 minutes
[MockWebhook] Document completed: 12345
```

### Successful Real Upload
```
[HylandService] Authenticating with Hyland IDP...
[HylandService] Authentication successful, token expires at: 2026-01-19T20:30:00.000Z
[HylandService] Uploading document to Hyland Content API...
[HylandService] Document uploaded successfully: b510d3a1-9685-48e7-821b-86be7aaf8f26
[HylandService] Triggering IDP extraction...
[HylandService] Extraction triggered for: b510d3a1-9685-48e7-821b-86be7aaf8f26
[Webhook] Received extraction completion for doc: 12345
[Webhook] Document updated, emitting WebSocket event
```

## Next Steps

1. ✅ **Test Mock Mode** - Verify full flow with simulated data
2. ⏳ **Test Real API** - Switch to `USE_MOCK_HYLAND=false` and test authentication
3. ⏳ **Configure Webhook** - Set up ngrok and configure webhook in Hyland
4. ⏳ **End-to-End Test** - Full flow from capture to extraction results
5. ⏳ **Phase 4** - PWA features, error handling, polish

## Environment Reference

```env
# backend/.env

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001  # Change to ngrok URL for webhooks

# Database
DATABASE_URL="file:./dev.db"

# Hyland IDP
USE_MOCK_HYLAND=true  # Set to 'false' for real API
HYLAND_IDP_URL=https://auth.app.hyland.com/idp/connect/token
HYLAND_CLIENT_ID=sc-31c0c400-8eb3-49da-9776-aadb6773fdef
HYLAND_CLIENT_SECRET=hyx_cs_6xsPZvf1dB1GaSvA2eK0wlpBt9QR41nEbQjyh1okm0kMidnsk4
HYLAND_CONTENT_API_URL=https://dev-3841c76e0c964fd786c773e3327d09a2.content.experience.hyland.com/api
```

---

**Ready to test!** 🚀

The integration is complete. Start with mock mode to verify everything works, then switch to real API mode when ready.
