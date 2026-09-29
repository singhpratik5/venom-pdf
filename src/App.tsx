import React from 'react';
import TopToolbar from './components/TopToolbar';
import FileExplorer from './components/FileExplorer';
import ThemePicker from './components/ThemePicker';
import PDFPreview from './components/PDFPreview';
import ControlPanel from './components/ControlPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  // Mount global keyboard shortcuts (Ctrl+O, Ctrl+S, Ctrl+Shift+D, F1, Arrow keys, Zoom)
  useKeyboardShortcuts();

  return (
    <div className="flex flex-col h-full w-full bg-background-main text-text-body overflow-hidden">
      <TopToolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[250px] min-w-[250px] bg-background-sidebar border-r border-background-border flex flex-col overflow-y-auto">
          <FileExplorer />
          <ThemePicker />
        </div>

        {/* Center Panel */}
        <div className="flex-1 bg-background-main overflow-hidden flex flex-col">
          <PDFPreview />
        </div>

        {/* Right Sidebar */}
        <div className="w-[300px] min-w-[300px] bg-background-sidebar border-l border-background-border flex flex-col overflow-y-auto">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
