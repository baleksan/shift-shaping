import React, { useState, useCallback } from 'react';
import ShapieHeader from './components/layout/ShapieHeader';
import Sidebar from './components/layout/Sidebar';
import ShapeList from './components/shapes/ShapeList';
import NewShape from './components/shapes/NewShape';
import ShapeEditor from './components/shapes/ShapeEditor';
import WolfieSelector from './components/session/WolfieSelector';
import ShapingSession from './components/session/ShapingSession';
import ReportPreview from './components/report/ReportPreview';
import SettingsPanel from './components/settings/SettingsPanel';
import { loadShapes, saveShapes } from './store/shapesStore';
import { loadConfig, saveConfig } from './store/configStore';
import { generateId } from './utils/ids';
import { defaultShapeTemplate } from './data/templates';

export default function App() {
  // --- Navigation state (simple page-based routing) ---
  const [page, setPage] = useState('shapes');       // shapes | editor | session | report | settings
  const [selectedShapeId, setSelectedShapeId] = useState(null);

  // --- Data ---
  const [shapes, setShapes] = useState(loadShapes);
  const [config, setConfig] = useState(loadConfig);

  // --- Persistence wrappers ---
  const persistShapes = useCallback((updater) => {
    setShapes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveShapes(next);
      return next;
    });
  }, []);

  const handleConfigChange = useCallback((newConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  }, []);

  // --- Shape CRUD ---
  const handleNewShape = useCallback(() => {
    setSelectedShapeId(null);
    setPage('new');
  }, []);

  const handleCreateShape = useCallback((name) => {
    const now = new Date().toISOString();
    const shape = { ...defaultShapeTemplate(), id: generateId(), name: name || '', createdAt: now, updatedAt: now };
    persistShapes((prev) => [...prev, shape]);
    setSelectedShapeId(shape.id);
    setPage('editor');
  }, [persistShapes]);

  const handleUpdateShape = useCallback((id, updates) => {
    persistShapes((prev) => prev.map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    ));
  }, [persistShapes]);

  const handleDeleteShape = useCallback((id) => {
    persistShapes((prev) => prev.filter((s) => s.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
      setPage('shapes');
    }
  }, [persistShapes, selectedShapeId]);

  const handleSelectShape = useCallback((id) => {
    setSelectedShapeId(id);
    setPage('editor');
  }, []);

  const handleStartSession = useCallback((shapeId) => {
    setSelectedShapeId(shapeId);
    setPage('ui_select');
  }, []);

  const handleUiSelected = useCallback((choice) => {
    // choice: 'current_wolfie' | 'sync_latest'
    // Set shape to in_progress if not already completed
    if (selectedShapeId) {
      const shape = shapes.find((s) => s.id === selectedShapeId);
      if (shape && shape.status !== 'completed') {
        handleUpdateShape(selectedShapeId, { status: 'in_progress' });
      }
    }
    setPage('session');
  }, [selectedShapeId, shapes, handleUpdateShape]);

  const handleViewReport = useCallback((shapeId) => {
    setSelectedShapeId(shapeId);
    setPage('report');
  }, []);

  // --- Current shape ---
  const currentShape = shapes.find((s) => s.id === selectedShapeId) || null;

  // --- Sidebar navigation ---
  const handleNav = useCallback((target) => {
    if (target === 'shapes') {
      setSelectedShapeId(null);
    }
    setPage(target);
  }, []);

  return (
    <div className="shapie-app">
      <Sidebar
        shapes={shapes}
        selectedShapeId={selectedShapeId}
        currentPage={page}
        onNav={handleNav}
        onSelectShape={handleSelectShape}
        onCreateShape={handleNewShape}
      />

      <div className="shapie-main">
        <ShapieHeader
          page={page}
          shape={currentShape}
          onNav={handleNav}
        />

        <div className="shapie-content">
          {page === 'shapes' && (
            <ShapeList
              shapes={shapes}
              onSelectShape={handleSelectShape}
              onCreateShape={handleNewShape}
              onDeleteShape={handleDeleteShape}
            />
          )}

          {page === 'new' && (
            <NewShape onCreate={handleCreateShape} />
          )}

          {page === 'editor' && currentShape && (
            <ShapeEditor
              shape={currentShape}
              onUpdate={(updates) => handleUpdateShape(currentShape.id, updates)}
              onStartSession={() => handleStartSession(currentShape.id)}
              onViewReport={() => handleViewReport(currentShape.id)}
              onDelete={() => handleDeleteShape(currentShape.id)}
            />
          )}

          {page === 'ui_select' && currentShape && (
            <WolfieSelector
              shape={currentShape}
              config={config}
              onSelect={handleUiSelected}
            />
          )}

          {page === 'session' && currentShape && (
            <ShapingSession
              shape={currentShape}
              config={config}
              onUpdateShape={(updates) => handleUpdateShape(currentShape.id, updates)}
              onViewReport={() => handleViewReport(currentShape.id)}
            />
          )}

          {page === 'report' && currentShape && (
            <ReportPreview
              shape={currentShape}
              config={config}
              onUpdateShape={(updates) => handleUpdateShape(currentShape.id, updates)}
            />
          )}

          {page === 'settings' && (
            <SettingsPanel
              config={config}
              onConfigChange={handleConfigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
