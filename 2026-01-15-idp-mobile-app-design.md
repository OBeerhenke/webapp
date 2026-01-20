# IDP Mobile Application Design
**Date**: 2026-01-15
**Status**: Validated (v2 - Webhook Architecture)
**Design Phase**: Complete
**Last Updated**: 2026-01-15

## Overview

A mobile-first React web application for intelligent document processing (IDP) that captures documents via camera, submits them to Hyland Content REST API, receives extraction results via webhook callback, and displays extracted data in a beautiful, generic interface with real-time WebSocket updates.

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: TanStack Query v5 (server state) + Zustand (client state)
- **Routing**: React Router v6
- **Camera**: react-camera-pro
- **Real-time**: Socket.io Client (WebSocket connection to backend)
- **PWA**: Manifest for home screen installation (PWA-lite)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.io Server (WebSocket for instant updates)
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma (type-safe database access)
- **External APIs**: Hyland Content REST API + Hyland Identity Provider (OIDC)

## Project Structure

```
/
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components (GlassCard, BottomNav, etc.)
│       ├── views/         # Main screens (CaptureView, TaskListView, DocumentDetailView)
│       ├── services/      # API client for backend
│       ├── hooks/         # useWebSocket, useCameraCapture, useDocuments
│       ├── lib/           # Theme config, utilities, socket.io client
│       ├── types/         # TypeScript interfaces
│       └── assets/        # Icons, fonts
│
├── backend/
│   └── src/
│       ├── routes/        # Express routes (webhook, documents, upload)
│       ├── services/      # HylandService, WebSocketService
│       ├── models/        # Prisma database models
│       ├── middleware/    # Auth, error handling
│       ├── sockets/       # Socket.io event handlers
│       └── types/         # TypeScript interfaces
│
└── shared/
    └── types/             # Shared TypeScript types between frontend/backend
```

## Visual Design System

### Color Palette - "Technical Modern"

```javascript
colors: {
  midnight: {
    DEFAULT: '#0A0F1E',  // Primary background
    lighter: '#151B2E',   // Card backgrounds
    border: '#1F2937'     // Subtle borders
  },
  neon: {
    teal: '#2DD4BF',      // Primary accent
    blue: '#3B82F6',      // Secondary accent
    glow: 'rgba(45, 212, 191, 0.5)' // For glows/shadows
  }
}
```

### Glassmorphism Pattern

All cards use these properties:
- `backdrop-blur-md` - Signature blur effect
- `bg-midnight-lighter/30` - Semi-transparent background
- `border border-white/10` - Subtle luminous border
- `shadow-lg shadow-neon-glow/20` - Soft teal glow

### Typography

- **Headers**: `font-sans font-bold tracking-tight` (Inter)
- **Body**: `font-sans font-normal`
- **Data values**: `font-mono` (JetBrains Mono) for code-editor aesthetic
- **Accent text**: `text-neon-teal` with optional pulse animation

### Layout Principles

- Mobile-first with fixed bottom navigation (64px)
- Safe area insets for notched devices
- Touch-friendly tap targets (min 44px)
- Content scrolls within viewport minus nav height

## Navigation & Routing

### Routes

- `/` - Redirects to `/camera`
- `/camera` - Camera capture interface
- `/tasks` - Task list / processing queue
- `/document/:id` - Document detail with extracted data
- `/settings` - App settings

### Bottom Navigation

Fixed bottom bar with 3 tabs:
- **Camera Icon** - Capture documents
- **Tasks Icon + Badge** - View processing queue (badge shows active count)
- **Settings Icon** - App configuration

**States**:
- Active: Neon teal with subtle glow
- Inactive: Muted gray (#6B7280)
- Transitions: Framer Motion scale + color fade

### Mobile Gestures

- Swipe right on document detail → back to tasks
- Pull-to-refresh on task list → manual status refresh
- Swipe down from top on camera → dismiss to tasks

## View 1: Camera Interface (CaptureView)

### Layout Layers

1. `react-camera-pro` viewfinder (full viewport)
2. Document alignment guide overlay
3. Top controls (flash, flip camera)
4. Bottom controls (shutter button)
5. Capture feedback animations

### Document Alignment Guide

Centered rectangle overlay:
- 2px solid neon teal border with subtle pulse
- Glowing L-shaped corner brackets
- 8.5:11 aspect ratio (letter size)
- Darkened background outside guide (`bg-black/60`)

### Capture Flow

1. User taps shutter → Button press animation
2. Camera captures → White flash overlay (100ms)
3. "Scanning" animation → Horizontal teal line sweeps 3x (800ms)
4. Upload begins → Toast: "Uploading document..."
5. Success → Navigate to `/tasks` with toast: "Document sent to IDP engine"
6. Error → Red toast with retry button

### Permissions Handling

- First load requests camera permission
- If denied: Show glass card with "Camera access required" + settings button
- Fallback: File upload button alternative

## View 2: Task List (TaskListView)

### Sections

1. **Active Processing** - Currently analyzing (animated)
2. **Completed** - Finished in last 24 hours
3. **Failed** - Errors with retry action

### Task Card Design

Each card contains:
- **Thumbnail**: 80x100px image preview
- **Status badge**: Pill with icon and state
  - "Uploading" (gray, spinner)
  - "Processing" (teal, animated dots, progress ring)
  - "Completed" (green, checkmark, glow pulse)
  - "Failed" (red, error icon)
- **Metadata**: Document type, timestamp
- **Progress indicator**: Circular ring (0-100%)
- **Estimated time**: Countdown timer

### Real-time Updates (WebSocket)

**Instant updates via Socket.io**:
- Frontend connects to backend via WebSocket on app load
- Backend emits events when document status changes
- No polling needed - updates are pushed instantly
- Reconnection logic for network interruptions

```typescript
// Frontend listens for real-time events
socket.on('document:statusUpdate', (update) => {
  // Update document status in UI instantly
  queryClient.setQueryData(['document', update.docId], update);
});

socket.on('document:completed', (data) => {
  // Trigger completion animation and notification
  showCompletionAnimation(data.docId);
});
```

### Visual Transitions

- Status change to "Completed": Card glows teal for 2s
- First completion: Confetti micro-animation
- Card tap: Navigate to `/document/:id`

### Empty States

- No active: "No documents processing" + capture button
- No completed: "Completed documents appear here"

## View 3: Document Detail (DocumentDetailView)

### Layout Structure

1. **Header** (fixed)
   - Thumbnail + document type badge
   - Overall confidence score
   - Actions: Share, Download, Delete

2. **Original Document** (collapsible)
   - Full-size image viewer with pinch-zoom
   - Starts collapsed

3. **Extracted Data Grid** (main content)
   - Generic key-value rendering
   - No hardcoded fields (works for any document type)
   - Grouped by category if available

### Field Display Pattern

Each field as a glass card:

```
┌─────────────────────────────┐
│ FIELD_NAME                  │ ← text-neon-teal, uppercase, text-xs
│ Field Value                 │ ← font-mono, text-white, text-lg
│ ●●●○○ 87% confidence        │ ← Visual dots + percentage
└─────────────────────────────┘
```

### Confidence Score Color Coding

- **>90%**: `text-neon-teal` (High confidence)
- **70-90%**: `text-yellow-400` (Medium confidence)
- **<70%**: `text-orange-400` (Low confidence - needs review)
- Visual: 5 dots filled proportionally

### Code-Editor Aesthetic

- Subtle grid pattern background
- Monospaced font (JetBrains Mono) for values
- All-caps labels with letter spacing
- Syntax highlighting color scheme

### Table Data Handling

For line items (e.g., invoice items):
- Horizontal scroll table
- Sticky header row
- Alternating row shading
- Future: Tap to edit cells
- Export to CSV option

## Authentication & Security

### Backend Authentication with Hyland

- Backend handles OIDC flow with Hyland IDP
- Backend stores and manages Hyland access tokens
- Backend authenticates all Hyland API calls
- Frontend never sees Hyland credentials (secure)

```typescript
// Backend HylandService
class HylandService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  async getToken(): Promise<string> {
    if (!this.token || this.isTokenExpired()) {
      await this.authenticate();
    }
    return this.token;
  }

  private async authenticate(): Promise<void> {
    // OIDC client credentials flow
    const response = await axios.post(HYLAND_IDP_URL, {
      client_id: process.env.HYLAND_CLIENT_ID,
      client_secret: process.env.HYLAND_CLIENT_SECRET,
      grant_type: 'client_credentials'
    });

    this.token = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
  }
}
```

### Frontend Authentication (Optional)

- If user authentication is needed, implement JWT-based auth for frontend
- Backend issues JWT tokens to frontend users
- Frontend includes JWT in requests to backend API
- For MVP: Can start with no frontend auth (trusted network)

## Development Phases

### Phase 1: Foundation & Mock Backend (Week 1)
- **Backend skeleton**: Express + Socket.io + Prisma setup
- **Database**: Prisma schema + SQLite
- **Mock webhook**: Simulate Hyland IDP callback with delay
- **WebSocket**: Basic real-time event system
- **Frontend skeleton**: Vite + React + Tailwind + theme config
- No Hyland integration yet - all mocked

### Phase 2: Frontend UI with Real-time Mocks (Week 2)
- **Camera Interface**: Full capture flow with animations
- **Task List View**: Real-time updates via WebSocket
- **Document Detail View**: Generic data display
- **Bottom Navigation**: React Router integration
- Backend serves mock data, frontend looks production-ready

### Phase 3: Hyland API Integration (Week 3)
- **Backend HylandService**: Real OIDC + Content API
- **Real uploads**: Documents go to Hyland
- **Webhook receiver**: Accept real Hyland IDP callbacks
- **Testing**: End-to-end with live Hyland instance
- Frontend unchanged - just connects to real backend

### Phase 4: Polish & PWA (Week 4)
- **PWA manifest**: Home screen installation
- **Error handling**: Retry logic, user-friendly messages
- **Loading states**: Skeletons and optimistic UI
- **Performance**: Image optimization, bundle splitting
- **Security**: Webhook signature validation
- **Deployment**: Docker containers for frontend + backend

## Service Layer Architecture

### Backend API Endpoints

```typescript
// Document upload and management
POST   /api/documents/upload        // Upload document image, returns docId
GET    /api/documents               // List all documents
GET    /api/documents/:id           // Get document details and extracted data
DELETE /api/documents/:id           // Delete document

// Hyland IDP webhook receiver
POST   /api/webhook/hyland/extraction  // Receives extraction results from Hyland IDP

// Health and status
GET    /api/health                  // Server health check
```

### Backend HylandService

**Responsibilities**:
- OIDC authentication with Hyland IDP
- Upload documents to Hyland Content API
- Trigger IDP extraction process
- Store document metadata in database
- No polling - waits for webhook callback

```typescript
class HylandService {
  async authenticate(): Promise<AuthToken>;
  async uploadDocument(imageBase64: string): Promise<DocumentId>;
  async triggerExtraction(docId: string): Promise<void>;
}
```

### Webhook Handler

**When Hyland IDP completes extraction**:
1. Receives webhook POST with extracted data
2. Validates webhook signature/auth
3. Stores extracted data in database
4. Emits WebSocket event to connected frontend clients
5. Frontend instantly displays updated status

```typescript
// Backend webhook endpoint
app.post('/api/webhook/hyland/extraction', async (req, res) => {
  const { docId, extractedData, status } = req.body;

  // Store in database
  await db.document.update({
    where: { id: docId },
    data: { extractedData, status: 'completed' }
  });

  // Emit to all connected clients
  io.emit('document:completed', { docId, extractedData });

  res.status(200).send('OK');
});
```

### MockHylandService (Development)

- Simulates upload and extraction trigger
- Uses `setTimeout` to simulate 2-minute processing
- Calls own webhook endpoint after delay
- Returns sample JSON (invoice, resume, etc.)
- Configurable via environment variable

## Database Schema (Prisma)

```prisma
model Document {
  id              String    @id @default(uuid())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Document metadata
  status          String    // "uploading", "processing", "completed", "failed"
  documentType    String?   // Auto-detected: "invoice", "resume", etc.
  imageUrl        String?   // Path to stored image
  imageBase64     String?   // Original image data
  thumbnailUrl    String?   // Generated thumbnail

  // Hyland references
  hylandDocId     String?   // Document ID in Hyland Content API

  // Extraction results
  extractedData   Json?     // Generic JSON object with extracted fields
  confidence      Float?    // Overall confidence score (0-100)

  // Timestamps
  uploadedAt      DateTime?
  processingStartedAt DateTime?
  completedAt     DateTime?

  // Error handling
  errorMessage    String?
  retryCount      Int       @default(0)
}
```

**Key Features**:
- `status` tracks document through lifecycle
- `extractedData` as JSON allows generic storage for any document type
- Timestamps for analytics and debugging
- Error handling with retry logic

## Data Flow

### Document Upload & Processing

1. **Capture**: User takes photo with camera
   - `react-camera-pro` captures image
   - Convert to Base64

2. **Upload to Backend**: Frontend → Backend API
   - `POST /api/documents/upload` with Base64 image
   - Backend returns `docId`
   - Document stored in DB with status: "uploading"

3. **Upload to Hyland**: Backend → Hyland Content API
   - Backend uploads to Hyland Content API
   - Backend triggers IDP extraction process
   - Backend updates DB status to "processing"
   - Backend emits WebSocket: `document:statusUpdate` to frontend

4. **Frontend Real-time Update**:
   - Frontend receives WebSocket event
   - Task card updates to "Processing" with animation
   - User sees instant feedback

5. **IDP Processing**: Hyland IDP analyzes document (~2 minutes)
   - User can navigate away, WebSocket maintains connection
   - Frontend shows animated processing indicator

6. **Webhook Callback**: Hyland IDP → Backend
   - Hyland IDP completes extraction
   - Sends POST to `/api/webhook/hyland/extraction`
   - Payload contains `docId` and `extractedData`

7. **Backend Processes Webhook**:
   - Validates webhook authenticity
   - Stores `extractedData` in database
   - Updates status to "completed"
   - Emits WebSocket: `document:completed` with data

8. **Frontend Instant Display**:
   - WebSocket event triggers completion animation
   - Card glows teal, shows "Completed" badge
   - User can tap to view extracted data
   - Navigate to `/document/:id`

9. **View Results**:
   - Frontend fetches from backend: `GET /api/documents/:id`
   - Displays extracted fields with confidence scores
   - Generic rendering works for any document type

## PWA Configuration

### Manifest (PWA-lite)

- Installable on home screen
- App name, icons, theme color
- Display mode: "standalone"
- No offline functionality (requires internet)

### Icons

- 192x192px and 512x512px PNG
- Neon teal camera icon on midnight background
- Rounded square with padding

## Key Design Decisions

1. **Webhook + WebSocket architecture** - Real-time updates without polling overhead
2. **Backend as orchestration layer** - Handles Hyland auth, stores data, pushes updates
3. **Database for state persistence** - SQLite (dev) / PostgreSQL (prod) via Prisma
4. **Socket.io for real-time** - Instant frontend updates when IDP completes
5. **Generic data display** - No hardcoded fields, works for any document type
6. **Monorepo structure** - Frontend and backend in same repo, shared types
7. **TypeScript everywhere** - Type safety across frontend, backend, and shared code
8. **PWA-lite** - Installation benefit without offline complexity
9. **Layered development** - UI first (mocks), then integration (real Hyland API)
10. **Secure by design** - Hyland credentials never exposed to frontend

## Next Steps

Ready to proceed with implementation using:
1. **Git worktrees** - Isolated workspace for development
2. **Implementation plan** - Detailed task breakdown for each phase

---

**Design validated on**: 2026-01-15
**Ready for implementation**: Yes
