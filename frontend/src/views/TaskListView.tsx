import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { Document, DocumentStatus } from '../types';

export const TaskListView: React.FC = () => {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useDocuments();
  const deleteDocument = useDeleteDocument();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    active: true,
    completed: true,
    failed: true,
  });

  const toggleSection = (section: 'active' | 'completed' | 'failed') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const activeDocuments = documents?.filter(
    (doc) => doc.status === 'uploading' || doc.status === 'processing'
  ) || [];

  const completedDocuments = documents?.filter(
    (doc) => doc.status === 'completed'
  ) || [];

  const failedDocuments = documents?.filter(
    (doc) => doc.status === 'failed'
  ) || [];

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'uploading':
        return (
          <span className="badge-uploading">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Uploading
          </span>
        );
      case 'processing':
        return (
          <span className="badge-processing">
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-neon-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-neon-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-neon-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="badge-completed">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="badge-failed">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Failed
          </span>
        );
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setDocumentToDelete(docId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      await deleteDocument.mutateAsync(documentToDelete);
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const toggleSelection = (docId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    const promises = Array.from(selectedIds).map(id => deleteDocument.mutateAsync(id));
    await Promise.all(promises);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setShowDeleteConfirm(false);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const DocumentCard: React.FC<{ doc: Document }> = ({ doc }) => {
    const isSelected = selectedIds.has(doc.id);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
      setTouchEnd(e.targetTouches[0].clientX);

      // Long press to enter selection mode
      if (!selectionMode) {
        const timer = setTimeout(() => {
          setSelectionMode(true);
          toggleSelection(doc.id);
          // Haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }, 500);
        setLongPressTimer(timer);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
      // Cancel long press if user moves finger
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      const swipeDistance = touchStart - touchEnd;
      const isLeftSwipe = swipeDistance > 75;

      // Swipe left to delete (only for completed/failed, not processing)
      if (isLeftSwipe && !selectionMode && doc.status !== 'processing') {
        handleDeleteClick(new MouseEvent('click') as any, doc.id);
      }
    };

    return (
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <GlassCard
          className={`p-4 transition-all active:scale-[0.98] ${
            selectionMode ? '' : 'cursor-pointer'
          } ${doc.status === 'completed' && !selectionMode ? 'active:shadow-neon-glow/30' : ''} ${
            isSelected ? 'ring-2 ring-neon-teal' : ''
          }`}
          onClick={() => {
            if (selectionMode) {
              toggleSelection(doc.id);
            } else if (doc.status === 'completed') {
              navigate(`/document/${doc.id}`);
            }
          }}
          glow={doc.status === 'completed' && !selectionMode}
        >
          <div className="flex items-center gap-4">
            {/* Selection checkbox (in selection mode) */}
            {selectionMode && (
              <div className="flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-neon-teal border-neon-teal'
                      : 'border-gray-500 hover:border-neon-teal'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-midnight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            )}

            {/* Thumbnail placeholder */}
            <div className="w-16 h-20 bg-midnight-border rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* Document info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white truncate">
                  {doc.documentType || 'Document'}
                </h3>
                {getStatusBadge(doc.status)}
              </div>

              <p className="text-sm text-gray-400">
                {formatTimestamp(doc.createdAt)}
              </p>

              {doc.confidence && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Confidence:</span>
                  <span className="text-xs text-neon-teal font-semibold">
                    {Math.round(doc.confidence)}%
                  </span>
                </div>
              )}

              {doc.errorMessage && doc.status === 'failed' && (
                <p className="mt-2 text-xs text-red-400">{doc.errorMessage}</p>
              )}
            </div>

            {/* Progress indicator for processing */}
            {doc.status === 'processing' && (
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-midnight-border"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-neon-teal"
                    strokeDasharray={126}
                    initial={{ strokeDashoffset: 126 }}
                    animate={{ strokeDashoffset: [126, 0, 126] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Action buttons row - below main content */}
          {!selectionMode && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-end gap-2">
              {doc.status === 'processing' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(e, doc.id);
                  }}
                  className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors rounded-lg flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
              )}
              {doc.status !== 'processing' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectionMode(true);
                      toggleSelection(doc.id);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-neon-teal hover:bg-neon-teal/10 transition-colors rounded-lg flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Select</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, doc.id)}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-lg flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-midnight pt-6 pb-24 px-4">
        <h1 className="text-2xl font-bold mb-6">Task List</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-20 bg-midnight-border rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight pt-6 pb-24 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-shadow-glow">Task List</h1>

        {/* Selection mode toolbar */}
        {selectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-sm text-gray-400">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="p-2 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
              title="Delete selected"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={toggleSelectionMode}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              title="Cancel selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>

      {/* Active Processing Section */}
      {activeDocuments.length > 0 && (
        <section className="mb-6">
          <button
            onClick={() => toggleSection('active')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-lg font-semibold text-neon-teal flex items-center gap-2">
              <svg
                className={`w-5 h-5 transition-transform ${expandedSections.active ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Active Processing ({activeDocuments.length})
            </h2>
          </button>
          <AnimatePresence>
            {expandedSections.active && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                {activeDocuments.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Completed Section */}
      {completedDocuments.length > 0 && (
        <section className="mb-6">
          <button
            onClick={() => toggleSection('completed')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-lg font-semibold text-green-400 flex items-center gap-2">
              <svg
                className={`w-5 h-5 transition-transform ${expandedSections.completed ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Completed ({completedDocuments.length})
            </h2>
          </button>
          <AnimatePresence>
            {expandedSections.completed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                {completedDocuments.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Failed Section */}
      {failedDocuments.length > 0 && (
        <section className="mb-6">
          <button
            onClick={() => toggleSection('failed')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
              <svg
                className={`w-5 h-5 transition-transform ${expandedSections.failed ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Failed ({failedDocuments.length})
            </h2>
          </button>
          <AnimatePresence>
            {expandedSections.failed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                {failedDocuments.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Empty state */}
      {documents?.length === 0 && (
        <GlassCard className="p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 mb-4">No documents yet</p>
          <button
            onClick={() => navigate('/camera')}
            className="btn-primary"
          >
            Capture Document
          </button>
        </GlassCard>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={handleCancelDelete}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            >
              <GlassCard className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {selectedIds.size > 0 ? 'Delete Documents?' : 'Delete Document?'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {selectedIds.size > 0
                        ? `Are you sure you want to delete ${selectedIds.size} document${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
                        : 'Are you sure you want to delete this document? This action cannot be undone.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 px-4 py-2 glass-card hover:bg-midnight-lighter/50 transition-colors rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={selectedIds.size > 0 ? handleConfirmBulkDelete : handleConfirmDelete}
                    disabled={deleteDocument.isPending}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg font-semibold text-white"
                  >
                    {deleteDocument.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
