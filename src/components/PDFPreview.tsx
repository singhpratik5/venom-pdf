import React from 'react';
import { useAppStore } from '../stores/appStore';
import { FileUp } from 'lucide-react';

const PDFPreview: React.FC = () => {
  const { files, activeFileIndex } = useAppStore();
  const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#1a1a1a]">
      {!activeFile ? (
        <div className="border-2 border-dashed border-background-border rounded-xl p-12 flex flex-col items-center justify-center text-gray-500 w-full max-w-2xl h-full max-h-[600px]">
          <FileUp size={48} className="mb-4 text-gray-600" />
          <h2 className="text-xl font-medium text-text-body mb-2">No PDF Selected</h2>
          <p className="text-sm text-center">
            Drop a PDF here or click Open File in the toolbar to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white text-black w-full h-full shadow-2xl flex flex-col">
          {/* Placeholder for actual PDF rendering */}
          <div className="border-b bg-gray-200 p-2 text-sm flex justify-between items-center">
            <span>{activeFile.name}</span>
            <span>Page 1 / {activeFile.pageCount}</span>
          </div>
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <p className="text-lg text-gray-600 mb-2">PDF Viewer Placeholder</p>
              <p className="text-sm text-gray-500">pdf.js will render {activeFile.name} here.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFPreview;
