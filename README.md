# IDP Mobile Application

A modern, mobile-first web application for intelligent document processing (IDP) with Hyland Content REST API integration.

## 🎨 Features

- **Camera Capture**: Take photos of documents with alignment guide
- **Real-time Processing**: WebSocket-based status updates (no polling!)
- **Generic Data Display**: Works with any document type (invoices, resumes, receipts, etc.)
- **Beautiful UI**: Technical Modern design with glassmorphism and neon accents
- **Mock Mode**: Development mode with simulated 2-minute processing

## 🏗️ Architecture

```
├── backend/          # Node.js + Express + Socket.io + Prisma
│   ├── src/
│   │   ├── routes/      # API endpoints (documents, webhook)
│   │   ├── services/    # HylandService, WebSocketService
│   │   └── server.ts    # Main entry point
│   └── prisma/
│       └── schema.prisma # Database schema
│
└── frontend/         # React + Vite + TypeScript + Tailwind
    └── src/
        ├── components/  # GlassCard, BottomNavigation
        ├── views/       # CaptureView, TaskListView, DocumentDetailView
        ├── hooks/       # useWebSocket, useDocuments
        └── services/    # API client
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Start server (Mock mode enabled by default)
npm run dev
```

Backend runs on: http://localhost:3001

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: http://localhost:5173

## 📱 Usage

1. **Capture Document**
   - Open http://localhost:5173
   - Grant camera permission
   - Align document within the teal guide
   - Tap the shutter button

2. **View Processing Status**
   - Navigate to "Tasks" tab
   - See real-time status updates via WebSocket
   - Watch the progress indicator

3. **View Results**
   - Once completed (after ~2 minutes in mock mode)
   - Tap the completed document card
   - View extracted fields with confidence scores
   - Expand to see original document image

## 🎨 Design System

### Colors
- **Midnight Navy**: #0A0F1E (Background)
- **Neon Teal**: #2DD4BF (Primary accent)
- **Cyber Blue**: #3B82F6 (Secondary accent)

### Typography
- **Sans**: Inter (UI elements)
- **Mono**: JetBrains Mono (Data values)

### Components
- Glassmorphism cards with `backdrop-blur-md`
- Status badges (uploading, processing, completed, failed)
- Confidence dots visualization

## 🔧 Configuration

### Backend (.env)

```env
PORT=3001
USE_MOCK_HYLAND=true          # Enable mock mode
MOCK_PROCESSING_TIME_MS=120000 # 2 minutes
DATABASE_URL="file:./dev.db"

# For production with real Hyland API:
# HYLAND_IDP_URL=https://your-idp-url
# HYLAND_CLIENT_ID=your-client-id
# HYLAND_CLIENT_SECRET=your-client-secret
# HYLAND_CONTENT_API_URL=https://your-content-api-url
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_BACKEND_URL=http://localhost:3001
```

## 📡 API Endpoints

### Documents
- `POST /api/documents/upload` - Upload document image
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Webhook
- `POST /api/webhook/hyland/extraction` - Receive IDP results (from Hyland)

### Health
- `GET /api/health` - Server health check

## 🔌 WebSocket Events

### Client receives:
- `document:statusUpdate` - Document status changed
- `document:completed` - Extraction completed with data
- `document:failed` - Processing failed with error

## 🗄️ Database Schema

```prisma
model Document {
  id              String    @id @default(uuid())
  status          String    // "uploading" | "processing" | "completed" | "failed"
  documentType    String?   // "invoice" | "resume" | "receipt"
  imageBase64     String?   // Original image
  extractedData   String?   // JSON with fields
  confidence      Float?    // Overall confidence (0-100)
  hylandDocId     String?   // Hyland document ID
  errorMessage    String?
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
}
```

## 🎯 Development Phases

- ✅ **Phase 1**: Backend foundation + Frontend setup
- ✅ **Phase 2**: UI components (Camera, TaskList, DocumentDetail)
- ⏳ **Phase 3**: Real Hyland API integration
- ⏳ **Phase 4**: PWA manifest + Production polish

## 📝 Mock Data Examples

The mock service generates realistic extraction data for:
- **Invoices**: Vendor info, amounts, line items, dates
- **Resumes**: Contact info, experience, education, skills
- **Receipts**: Merchant, totals, payment method

## 🚢 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

## 🔐 Security Notes

- Backend handles all Hyland authentication (OAuth2 OIDC)
- Frontend never sees Hyland credentials
- WebSocket connections are validated
- In production: Add JWT auth for frontend users
- In production: Validate webhook signatures from Hyland

## 📚 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **HTTP Client**: Axios

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: TanStack Query + Zustand
- **Routing**: React Router v6
- **Camera**: react-camera-pro
- **WebSocket**: Socket.io Client

## 🎬 Next Steps

1. **Test the Flow**:
   - Capture a document
   - Wait 2 minutes (mock processing)
   - View extracted data

2. **Hyland Integration** (Phase 3):
   - Add real credentials to backend `.env`
   - Set `USE_MOCK_HYLAND=false`
   - Configure webhook URL in Hyland dashboard

3. **PWA Features** (Phase 4):
   - Add manifest.json
   - Implement service worker
   - Add app icons

---

**Status**: Phase 1 & 2 Complete ✅  
**Last Updated**: 2026-01-15  
**Backend**: http://localhost:3001  
**Frontend**: http://localhost:5173
