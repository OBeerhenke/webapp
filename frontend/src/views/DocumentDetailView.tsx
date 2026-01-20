import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { useDocument } from '../hooks/useDocuments';
import { ExtractedField } from '../types';

export const DocumentDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: document, isLoading } = useDocument(id!);
  const [showOriginal, setShowOriginal] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-neon-teal';
    if (confidence >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const renderConfidenceDots = (confidence: number) => {
    const filled = Math.round((confidence / 100) * 5);
    return (
      <div className="flex items-center gap-1 mt-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < filled ? 'bg-neon-teal' : 'bg-midnight-border'
            }`}
          />
        ))}
        <span className={`ml-2 text-xs font-semibold ${getConfidenceColor(confidence)}`}>
          {Math.round(confidence)}%
        </span>
      </div>
    );
  };

  const renderField = (field: ExtractedField) => (
    <GlassCard key={field.name} className="p-4 grid-pattern">
      <div className="field-label">{field.name}</div>
      <div className="field-value">{String(field.value)}</div>
      {renderConfidenceDots(field.confidence)}
    </GlassCard>
  );

  const groupFieldsByCategory = (fields: ExtractedField[]) => {
    const grouped: Record<string, ExtractedField[]> = {};
    
    fields.forEach((field) => {
      const category = field.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(field);
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-midnight pt-6 pb-24 px-4">
        <div className="glass-card p-4 animate-pulse">
          <div className="h-64 bg-midnight-border rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-midnight-border rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-midnight pt-6 pb-24 px-4">
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400">Document not found</p>
          <button onClick={() => navigate('/tasks')} className="btn-primary mt-4">
            Back to Tasks
          </button>
        </GlassCard>
      </div>
    );
  }

  const groupedFields = document.extractedData?.fields
    ? groupFieldsByCategory(document.extractedData.fields)
    : {};

  return (
    <div className="min-h-screen bg-midnight pt-6 pb-24 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-2 text-gray-400 hover:text-neon-teal transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-3">
          <button className="p-2 glass-card rounded-lg hover:bg-midnight-lighter/50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button className="p-2 glass-card rounded-lg hover:bg-midnight-lighter/50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Document header card */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              {document.documentType || 'Document'}
            </h1>
            <p className="text-sm text-gray-400">
              {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>
          {document.confidence && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Overall Confidence</p>
              <p className={`text-2xl font-bold ${getConfidenceColor(document.confidence)}`}>
                {Math.round(document.confidence)}%
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Original document section */}
      <GlassCard className="mb-6 overflow-hidden">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="w-full p-4 flex items-center justify-between hover:bg-midnight-lighter/30 transition-colors"
        >
          <span className="font-semibold text-white">Original Document</span>
          <svg
            className={`w-5 h-5 transition-transform ${showOriginal ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showOriginal && document.imageBase64 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 border-t border-white/10"
          >
            {document.imageBase64.includes('image/tiff') ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>TIFF images cannot be displayed in browser</p>
                <p className="text-sm mt-2">Please upload JPEG or PNG images</p>
              </div>
            ) : (
              <img
                src={document.imageBase64}
                alt="Original document"
                className="w-full rounded-lg"
                onError={(e) => {
                  console.error('Image load error:', document.imageBase64?.substring(0, 50));
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="p-8 text-center text-gray-400">Failed to load image</div>';
                }}
              />
            )}
          </motion.div>
        )}
      </GlassCard>

      {/* Extracted data */}
      <div className="space-y-6">
        {Object.keys(groupedFields).length > 0 ? (
          Object.entries(groupedFields).map(([category, fields]) => (
            <section key={category}>
              <h2 className="text-lg font-semibold text-neon-teal mb-4 uppercase tracking-wide">
                {category}
              </h2>
              <div className="space-y-3">
                {fields.map(renderField)}
              </div>
            </section>
          ))
        ) : (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-400">No extracted data available</p>
          </GlassCard>
        )}

        {/* Tables section */}
        {document.extractedData?.tables && document.extractedData.tables.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-neon-teal mb-4 uppercase tracking-wide">
              Tables
            </h2>
            {document.extractedData.tables.map((table, idx) => (
              <GlassCard key={idx} className="p-4 mb-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-white mb-3">{table.name}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {Object.keys(table.rows[0] || {}).map((key) => (
                        <th key={key} className="px-3 py-2 text-left text-neon-teal font-medium uppercase text-xs">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-midnight-lighter/20' : ''}>
                        {Object.values(row).map((value, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 font-mono text-white">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};
