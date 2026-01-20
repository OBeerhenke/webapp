import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomNavigation } from './components/BottomNavigation';
import { HomeView } from './views/HomeView';
import { CaptureView } from './views/CaptureView';
import { TaskListView } from './views/TaskListView';
import { DocumentDetailView } from './views/DocumentDetailView';
import { SettingsView } from './views/SettingsView';
import { useWebSocket } from './hooks/useWebSocket';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="min-h-screen bg-midnight">
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/camera" element={<CaptureView />} />
        <Route path="/tasks" element={<TaskListView />} />
        <Route path="/document/:id" element={<DocumentDetailView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Routes>

      {/* Bottom navigation - hide on home and camera views */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/camera" element={null} />
        <Route path="*" element={<BottomNavigation />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
