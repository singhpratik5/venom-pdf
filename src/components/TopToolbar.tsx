import React from 'react';
import { FolderOpen, Download, Layers, Settings } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { usePdfEngine } from '../hooks/usePdfEngine';

const TopToolbar: React.FC = () => {
  const { addFile } = useAppStore();
  const { getPdfInfo } = usePdfEngine();

  const handleOpen = async () => {
    // Mock open file
    const mockPath = `C:\\mock\\document_${Math.floor(Math.random() * 100)}.pdf`;
    const info = await getPdfInfo(mockPath);
    addFile(info);
  };

  return (
    <div className="h-12 bg-background-sidebar border-b border-background-border flex items-center px-4 justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-accent-toxic font-bold text-lg mr-4 flex items-center gap-2">
          Venom PDF
        </span>
        <button 
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-main rounded text-sm transition-colors text-text-body hover:text-accent-toxic"
        >
          <FolderOpen size={16} /> Open
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-main rounded text-sm transition-colors text-text-body hover:text-accent-toxic">
          <Download size={16} /> Save As
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-main rounded text-sm transition-colors text-text-body hover:text-accent-toxic">
          <Layers size={16} /> Batch
        </button>
      </div>
      <div>
        <button className="p-2 hover:bg-background-main rounded text-text-body hover:text-accent-toxic transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};

export default TopToolbar;
