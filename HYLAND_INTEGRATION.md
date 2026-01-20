# Hyland IDP Integration - Testing Guide

## Configuration

The backend is now configured with **real Hyland credentials**:

- **IDP URL**: `https://auth.app.hyland.com/idp/connect/token`
- **Client ID**: `sc-31c0c400-8eb3-49da-9776-aadb6773fdef`
- **Content API**: `https://dev-3841c76e0c964fd786c773e3327d09a2.content.experience.hyland.com/api`

## Current Mode

✅ **MOCK MODE** (enabled by default)
- Set `USE_MOCK_HYLAND=true` in backend/.env
- Backend is currently running on port 3001 in MOCK mode

## Switch to Real Hyland API

To use the real Hyland IDP integration:

1. Edit `backend/.env`:
   ```env
   USE_MOCK_HYLAND=false
   ```

2. Restart the backend:
   ```bash
   cd backend
   npm run dev
   ```

## What's Implemented

### Authentication
- ✅ OAuth2 client credentials flow
- ✅ Token caching with automatic refresh
- ✅ 30-second expiry buffer for safety

### Document Upload
- ✅ Multipart form-data with JSON metadata
- ✅ Base64 image to buffer conversion
- ✅ Proper content types (application/json + image/jpeg)
- ✅ Upload ID generation
- ✅ File name handling

### Upload Format
```javascript
// JSON part (main)
{
  "sys_primaryType": "SysFile",
  "sys_title": "document_1768567529478.jpg",
  "sysfile_blob": {
    "uploadId": "1768567529478"
  }
}

// File part (uploadId)
Binary image data with filename and content-type
```

### API Flow
1. **Frontend** → Captures photo (base64)
2. **Backend** → Authenticates with Hyland IDP
3. **Backend** → Uploads document to Hyland Content API
4. **Backend** → Stores Hyland document ID
5. **Backend** → Triggers IDP extraction (webhook endpoint)
6. **Hyland** → Processes document (~2 minutes)
7. **Hyland** → Calls webhook with results
8. **Backend** → Emits WebSocket event
9. **Frontend** → Updates UI instantly

## Test Authentication

```bash
# Test token endpoint directly
curl --location 'https://auth.app.hyland.com/idp/connect/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'client_id=sc-31c0c400-8eb3-49da-9776-aadb6773fdef' \
--data-urlencode 'client_secret=hyx_cs_6xsPZvf1dB1GaSvA2eK0wlpBt9QR41nEbQjyh1okm0kMidnsk4'
```

## Backend Logs

When `USE_MOCK_HYLAND=false`, you'll see:
```
[HylandService] Authentication successful, token expires at: 2026-01-19T...
[HylandService] Document uploaded successfully: b510d3a1-9685-48e7-821b-86be7aaf8f26
[HylandService] Extraction triggered for: b510d3a1-9685-48e7-821b-86be7aaf8f26
```

## Webhook Configuration

The backend expects Hyland to call:
```
POST http://localhost:3001/api/webhook/hyland/extraction
```

For production, use ngrok or similar:
```bash
ngrok http 3001
# Then update BACKEND_URL in .env to ngrok URL
```

## Next Steps

1. **Test Mock Mode**: Verify everything works with mock data
2. **Switch to Real API**: Set `USE_MOCK_HYLAND=false`
3. **Test Upload**: Capture a document and check backend logs
4. **Configure Webhook**: Set up public URL for Hyland callbacks
5. **Test End-to-End**: Full flow from capture to extraction results

## Troubleshooting

### Authentication Fails
- Verify credentials in .env
- Check token endpoint is reachable
- Ensure client_id and client_secret are correct

### Upload Fails
- Check base64 data is properly formatted
- Verify Content API URL is correct
- Ensure token is valid (not expired)

### No Webhook Callback
- Verify BACKEND_URL in .env
- Use ngrok for local development
- Check Hyland IDP webhook configuration

## Environment Variables

```env
# backend/.env
USE_MOCK_HYLAND=false          # Set to false for real API
HYLAND_IDP_URL=https://auth.app.hyland.com/idp/connect/token
HYLAND_CLIENT_ID=sc-31c0c400-8eb3-49da-9776-aadb6773fdef
HYLAND_CLIENT_SECRET=hyx_cs_6xsPZvf1dB1GaSvA2eK0wlpBt9QR41nEbQjyh1okm0kMidnsk4
HYLAND_CONTENT_API_URL=https://dev-3841c76e0c964fd786c773e3327d09a2.content.experience.hyland.com/api
BACKEND_URL=http://localhost:3001  # Or ngrok URL
```
