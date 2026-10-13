import React, { useEffect } from 'react';
import { useStudioStore } from './store/studioStore';
import { StudioHeader } from './components/layout/StudioHeader';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import { RightInspector } from './components/inspector/RightInspector';
import { MultiTrackTimeline } from './components/timeline/MultiTrackTimeline';
import { PhotoEditorWorkspace } from './components/photo/PhotoEditorWorkspace';
import { TemplatesWorkspace } from './components/templates/TemplatesWorkspace';
import { AiToolsWorkspace } from './components/ai/AiToolsWorkspace';
import { ExportModal } from './components/export/ExportModal';
import { DesktopBridgeModal } from './components/desktop/DesktopBridgeModal';

export default function App() {
  const { activeMode, saveProjectLocally } = useStudioStore();

  // Autosave project every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      saveProjectLocally();
    }, 30000);
    return () => clearInterval(timer);
  }, [saveProjectLocally]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c0d12] text-[#f1f2f6] overflow-hidden select-none font-sans">
      {/* Top Application Header */}
      <StudioHeader />

      {/* Main Workspace based on active mode */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeMode === 'video' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Center editing stage: Sidebar, Preview, Inspector */}
            <div className="flex-1 flex overflow-hidden">
              <LeftSidebar />
              <PreviewPlayer />
              <RightInspector />
            </div>

            {/* Bottom Multi-Track Timeline */}
            <MultiTrackTimeline />
          </div>
        )}

        {activeMode === 'photo' && <PhotoEditorWorkspace />}

        {activeMode === 'templates' && <TemplatesWorkspace />}

        {activeMode === 'ai_tools' && <AiToolsWorkspace />}
      </main>

      {/* 4K Video Export Modal */}
      <ExportModal />

      {/* Desktop Tauri & Python Bridge Modal */}
      <DesktopBridgeModal />
    </div>
  );
}
