# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript monorepo for an **Intelligent Document Processing (IDP) mobile web application**. Users capture documents with their camera, which are uploaded to Hyland's IDP API for OCR and data extraction. Results are delivered in real-time via WebSocket.

**Technology Stack:**
- **Backend:** Node.js + Express + Socket.io + Prisma (SQLite) + TypeScript
- **Frontend:** React + Vite + Tailwind CSS + TanStack Query + Zustand + TypeScript
- **Real-time:** Socket.io (WebSocket bidirectional communication)
- **Integration:** Hyland Content REST API with OAuth2

**Dual-Mode Operation:**
- **Mock Mode** (default): Simulates Hyland processing with 2-minute delay, no external API calls
- **Production Mode**: Real Hyland IDP API integration with OAuth2 authentication

## Development Commands

### Backend (`/backend`)

```bash
# Initial setup
cd backend
npm install
npx prisma generate          # Generate Prisma client types
npx prisma migrate dev       # Run database migrations

# Development
npm run dev                  # Start dev server with hot reload (tsx watch)
                            # Runs on http://localhost:3001

# Production
npm run build               # Compile TypeScript to dist/
npm start                   # Run compiled server

# Database management
npm run prisma:generate     # Regenerate Prisma client after schema changes
npm run prisma:migrate      # Create and run new migration
npx prisma studio           # Open database GUI at http://localhost:5555
```

### Frontend (`/frontend`)

```bash
# Initial setup
cd frontend
npm install

# Development
npm run dev                 # Start Vite dev server with HMR
                            # Runs on http://localhost:5173

# Production
npm run build               # TypeScript check + Vite build to dist/
npm run preview             # Preview production build locally

# Code quality
npm run lint                # Run ESLint
```

### Starting the Full Application

Run in separate terminals:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

**No test suite currently exists** - consider adding Jest/Vitest if implementing tests.

## High-Level Architecture

### Webhook + WebSocket Real-Time Architecture

The application uses a **webhook-driven, event-based architecture** for real-time updates without polling:

```
User Camera → Frontend Upload → Backend API → Hyland IDP
                                      ↓
                               Prisma Database
                                      ↓
Hyland Webhook → Backend Webhook Handler → Database Update
                                      ↓
                         WebSocket Broadcast (Socket.io)
                                      ↓
                         All Connected Clients Update UI
```

**Key Flow:**
1. Frontend captures photo and sends base64 image to `POST /api/documents/upload`
2. Backend creates document record (status: "uploading") and uploads to Hyland
3. Backend updates status to "processing" and broadcasts via WebSocket
4. Hyland processes document asynchronously (~2 min in mock mode)
5. Hyland calls webhook `POST /api/webhook/hyland/extraction` with results
6. Backend updates database with extracted data (status: "completed")
7. Backend broadcasts completion event via WebSocket to all clients
8. Frontend updates UI instantly without manual refresh

### Project Structure

```
webcap/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── documents.ts      # CRUD + upload endpoint
│   │   │   └── webhook.ts        # Hyland callback receiver
│   │   ├── services/
│   │   │   ├── HylandService.ts  # Mock + real Hyland API client
│   │   │   └── WebSocketService.ts # Socket.io event manager
│   │   ├── types/index.ts        # Shared TypeScript interfaces
│   │   └── server.ts             # Express + Socket.io setup
│   ├── prisma/
│   │   └── schema.prisma         # Database schema (Document model)
│   └── .env                      # Backend configuration
│
└── frontend/
    ├── src/
    │   ├── views/                # Page components (one per route)
    │   │   ├── HomeView.tsx
    │   │   ├── CaptureView.tsx   # Camera interface
    │   │   ├── TaskListView.tsx  # Document list
    │   │   ├── DocumentDetailView.tsx
    │   │   └── SettingsView.tsx
    │   ├── hooks/
    │   │   ├── useWebSocket.ts   # Socket.io connection hook
    │   │   └── useDocuments.ts   # TanStack Query data fetching
    │   ├── services/api.ts       # Axios HTTP client
    │   ├── lib/socket.ts         # Socket.io client setup
    │   └── App.tsx               # Router + WebSocket initialization
    └── .env                      # Frontend configuration
```

### API Endpoints

**Backend (http://localhost:3001):**
```
POST   /api/documents/upload          # Upload document image (base64)
GET    /api/documents                 # List all documents
GET    /api/documents/:id             # Get document details
DELETE /api/documents/:id             # Delete document
POST   /api/webhook/hyland/extraction # Webhook for Hyland results
GET    /api/health                    # Health check
```

### WebSocket Events

**Server → Client broadcasts:**
```typescript
socket.emit('document:statusUpdate', { id, status })
socket.emit('document:completed', { id, extractedData, confidence })
socket.emit('document:failed', { id, error })
```

Frontend listens via `useWebSocket()` hook in App.tsx and automatically updates UI.

### Document Statuses

```typescript
type DocumentStatus =
  | 'uploading'    // Initial upload in progress
  | 'processing'   // Sent to Hyland, awaiting extraction
  | 'completed'    // Extraction successful, data available
  | 'failed'       // Processing failed with error
```

## Database Management

### Prisma Workflow

**After schema changes in `prisma/schema.prisma`:**
```bash
cd backend
npx prisma migrate dev --name description_of_change
npx prisma generate  # Regenerate TypeScript types
```

**View/edit data:**
```bash
npx prisma studio  # Opens GUI at http://localhost:5555
```

**Reset database (development):**
```bash
cd backend
rm dev.db dev.db-journal
npx prisma migrate dev  # Recreates from migrations
```

### Schema Overview

The main model is `Document`:
```prisma
model Document {
  id              String    @id @default(uuid())
  status          String    # "uploading" | "processing" | "completed" | "failed"
  documentType    String?   # "invoice" | "resume" | "receipt"
  imageBase64     String?   # Original captured image
  hylandDocId     String?   # Hyland document ID
  extractedData   String?   # JSON with field-level extraction results
  confidence      Float?    # Overall confidence score (0-100)
  errorMessage    String?
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
  // ... additional fields
}
```

SQLite database stored at `backend/dev.db` (gitignored).

## Mock vs Production Mode

### Switching Modes

Edit `backend/.env`:
```env
USE_MOCK_HYLAND=true   # Mock mode (default, no external API)
USE_MOCK_HYLAND=false  # Production mode (real Hyland API)
```

Backend auto-restarts (tsx watch) and logs the active mode on startup.

### Mock Mode Behavior

When `USE_MOCK_HYLAND=true`:
- No actual Hyland API calls made
- Simulates 2-minute processing time (`MOCK_PROCESSING_TIME_MS=120000`)
- Generates realistic extraction data for 3 document types:
  - **Invoices:** Vendor, dates, amounts, line items table
  - **Resumes:** Contact info, skills, work experience
  - **Receipts:** Merchant, totals, payment method
- Backend self-triggers webhook after delay to simulate Hyland callback
- Useful for frontend development without external dependencies

### Production Mode Setup

**Prerequisites:**
1. Valid Hyland credentials in `backend/.env`:
   ```env
   HYLAND_IDP_URL=https://auth.app.hyland.com/idp/connect/token
   HYLAND_CLIENT_ID=sc-31c0c400-8eb3-49da-9776-aadb6773fdef
   HYLAND_CLIENT_SECRET=your-secret-here
   HYLAND_CONTENT_API_URL=https://your-tenant.app.hyland.com/api
   ```

2. **Publicly accessible webhook URL** (required for Hyland to call back):
   ```bash
   # Use ngrok to expose local backend
   ngrok http 3001
   # Configure webhook URL in Hyland IDP dashboard:
   # https://your-ngrok-url.ngrok.io/api/webhook/hyland/extraction
   ```

**OAuth2 Flow:**
- Uses client credentials grant
- Token automatically cached and refreshed (3600s expiry with 30s buffer)
- Implemented in `HylandService.ts`

## Key Development Patterns

### Camera API Restrictions

**Important:** Browser camera API requires HTTPS **except** for `localhost`.

- ✅ Development: `http://localhost:5173` works
- ❌ Development: `http://192.168.x.x:5173` fails (no camera access)
- ✅ Production: Must use HTTPS
- 💡 Local network testing: Use ngrok for HTTPS tunnel

### Image Upload Format

Frontend sends base64 with data URL prefix:
```typescript
const base64 = canvas.toDataURL('image/jpeg', 0.95)
// Result: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

Backend strips `data:image/jpeg;base64,` prefix before uploading to Hyland.

### WebSocket Connection Management

WebSocket automatically connects when app loads via `useWebSocket()` hook in `App.tsx`:
```typescript
const socket = useWebSocket()  // Connects to backend WebSocket
```

- Handles reconnection automatically
- Events logged to console in dev mode
- All connected clients receive broadcasts (no per-user filtering)

### Hot Reload Setup

**Backend:** Uses `tsx watch` for TypeScript execution + file watching
- No need for separate nodemon or ts-node-dev
- Automatically restarts on any file change in `src/`

**Frontend:** Vite HMR (Hot Module Replacement)
- Instant updates without full page reload
- React Fast Refresh preserves component state

### Switching to Real Hyland API

1. Set `USE_MOCK_HYLAND=false` in `backend/.env`
2. Verify Hyland credentials are configured
3. Start ngrok: `ngrok http 3001`
4. Configure webhook URL in Hyland dashboard
5. Check backend logs for "Mode: PRODUCTION"
6. Upload document and monitor webhook calls

## Environment Configuration

### Backend `.env` (required)

```env
# Server
PORT=3001

# Database
DATABASE_URL="file:./dev.db"

# Mock Mode Toggle
USE_MOCK_HYLAND=true                    # false for production
MOCK_PROCESSING_TIME_MS=120000          # 2 minutes

# Hyland IDP API (production only)
HYLAND_IDP_URL=https://auth.app.hyland.com/idp/connect/token
HYLAND_CLIENT_ID=sc-31c0c400-8eb3-49da-9776-aadb6773fdef
HYLAND_CLIENT_SECRET=your-secret-here
HYLAND_CONTENT_API_URL=https://your-tenant.app.hyland.com/api
```

Copy from `backend/.env.example` and fill in secrets.

### Frontend `.env` (already configured)

```env
VITE_API_URL=http://localhost:3001/api
VITE_BACKEND_URL=http://localhost:3001
```

These are pre-configured for local development. Update for production deployment.

## Design System

**Color Palette ("Technical Modern"):**
- Midnight Navy: `#0A0F1E` (background)
- Neon Teal: `#2DD4BF` (primary accent)
- Cyber Blue: `#3B82F6` (secondary accent)

**Glassmorphism Pattern:**
- Uses `backdrop-blur-md` for frosted glass effect
- Semi-transparent backgrounds: `bg-white/5`, `bg-black/20`
- Subtle borders with glow effects
- See `GlassCard.tsx` component for reusable implementation

**Typography:**
- UI text: Inter (sans-serif)
- Data/technical: JetBrains Mono (monospace)

## Mobile-First UI Patterns

### TaskListView Features

The TaskListView ([frontend/src/views/TaskListView.tsx](frontend/src/views/TaskListView.tsx)) implements a mobile-first design with the following features:

**Document Management:**
- **Delete Functionality:**
  - Individual delete buttons on each card (horizontal action row)
  - Bulk selection mode with multi-select checkboxes
  - Swipe left gesture to delete (mobile pattern)
  - Long-press (500ms) to enter selection mode with haptic feedback
  - Confirmation dialog for all delete operations

- **Cancel Processing:**
  - Processing documents show a "Cancel" button
  - Allows users to stop/delete documents mid-processing

- **Collapsible Sections:**
  - Three sections: Active Processing, Completed, Failed
  - Click section header to expand/collapse
  - Animated chevron indicates state
  - All sections expanded by default
  - Smooth height/opacity transitions (200ms)

**Touch Gestures:**
- Long press (500ms) → Enter selection mode
- Swipe left (>75px) → Show delete confirmation
- Active state feedback (scale 0.98 on press)
- Haptic feedback on long press (if supported)

**Selection Mode:**
- Activated by long press or "Select" button
- Checkboxes appear on all cards
- Header toolbar shows count and actions
- Delete icon button for bulk delete
- X button to exit selection mode

**Action Buttons:**
- Horizontal row below card content
- Large touch targets (48px recommended)
- Text labels + icons for clarity
- Different actions based on document status:
  - Processing: "Cancel"
  - Completed/Failed: "Select" and "Delete"

**Implementation Notes:**
- Uses Framer Motion for animations
- TanStack Query for data management
- Component structure: DocumentCard (inner component)
- State management: useState for UI, TanStack Query for data
- Touch event handlers: onTouchStart, onTouchMove, onTouchEnd

## Additional Context

### Project Status
- **Completed:** Full backend + frontend implementation, real-time WebSocket, mock mode, camera capture
- **Pending:** Real Hyland API testing, PWA features, Docker setup, testing framework

### Absolute Project Path
`/Users/oliver.beerhenke/Documents/cic/webcap`

### Important Documentation
- [README.md](README.md) - Project overview and setup
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Implementation details
- [HYLAND_INTEGRATION.md](HYLAND_INTEGRATION.md) - Hyland API details
- [TESTING_HYLAND_API.md](TESTING_HYLAND_API.md) - Step-by-step testing guide
- [2026-01-15-idp-mobile-app-design.md](2026-01-15-idp-mobile-app-design.md) - Original design spec

### Missing Infrastructure
- No automated tests (Jest/Vitest not configured)
- No CI/CD pipeline
- No Docker containerization
- No production deployment scripts
