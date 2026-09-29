import React, { useState } from 'react';
import {
  X,
  Terminal,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  FolderSync,
  FileText,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { useOsIntegration } from '../hooks/useOsIntegration';

interface OsIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OsIntegrationModal: React.FC<OsIntegrationModalProps> = ({ isOpen, onClose }) => {
  const { isRegistered, isLoading, message, enableContextMenu, disableContextMenu } =
    useOsIntegration();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const cliSnippets = [
    {
      title: 'Invert Single PDF (Default Venom Dark)',
      cmd: 'venom-pdf -i document.pdf',
    },
    {
      title: 'OLED Black with Dimmed Images',
      cmd: 'venom-pdf -i paper.pdf -t "OLED Black" -m dim -o paper_oled.pdf',
    },
    {
      title: 'Selective Page Range (e.g., Pages 1 to 5 and Page 8)',
      cmd: 'venom-pdf -i manual.pdf -p 1-5,8 -t Dracula',
    },
    {
      title: 'Parallel Batch Inversion (Rayon Multi-threaded)',
      cmd: 'venom-pdf -b "C:\\Documents\\PDFs" -d "C:\\Documents\\Inverted" -t Nord',
    },
    {
      title: 'Register Windows Context Menu via CLI',
      cmd: 'venom-pdf --register-menu',
    },
    {
      title: 'List All Available Color Themes',
      cmd: 'venom-pdf --list-themes',
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background-sidebar border border-background-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-text-body">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-border bg-background-main/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-toxic/10 border border-accent-toxic/30 flex items-center justify-center text-accent-toxic">
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                OS Integration & CLI Mode
              </h2>
              <p className="text-xs text-gray-400">
                Windows Explorer right-click integration and headless command-line automation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-main text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Windows Explorer Context Menu */}
          <div className="bg-background-main border border-background-border rounded-lg p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold text-sm">
                    Windows File Explorer Context Menu
                  </h3>
                  {isRegistered ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-accent-toxic bg-accent-toxic/10 border border-accent-toxic/20 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-800/80 border border-gray-700 px-2 py-0.5 rounded-full">
                      Not Registered
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Adds native right-click entries directly into Windows 10 & 11 File Explorer.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isRegistered ? (
                  <button
                    onClick={disableContextMenu}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Remove Menu'}
                  </button>
                ) : (
                  <button
                    onClick={enableContextMenu}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 rounded text-xs font-medium bg-accent-toxic text-black hover:bg-emerald-400 transition-colors shadow-[0_0_10px_rgba(57,255,20,0.3)] disabled:opacity-50"
                  >
                    {isLoading ? 'Registering...' : 'Enable Right-Click'}
                  </button>
                )}
              </div>
            </div>

            {/* Feature bullets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 pt-4 border-t border-background-border/60 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <FileText size={14} className="text-accent-toxic shrink-0" />
                <span>Right-click any PDF &rarr; &quot;Invert with Venom PDF&quot;</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FolderSync size={14} className="text-emerald-400 shrink-0" />
                <span>Right-click folder &rarr; &quot;Batch Invert PDFs&quot;</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                <span>Per-user HKCU registration (No Admin prompt needed)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Sliders size={14} className="text-purple-400 shrink-0" />
                <span>Instant headless conversion in the background</span>
              </div>
            </div>

            {message && (
              <div className="mt-3 p-2.5 rounded bg-background-sidebar border border-background-border text-xs text-accent-toxic flex items-center gap-2">
                <CheckCircle size={14} />
                <span>{message}</span>
              </div>
            )}
          </div>

          {/* Section 2: Headless CLI Reference */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Terminal size={15} className="text-accent-toxic" />
                Headless CLI Quick Reference
              </h3>
              <span className="text-[11px] text-gray-400 font-mono">
                venom-pdf [OPTIONS]
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Automate dark-mode inversions from PowerShell, Windows Terminal, scripts, or CI/CD pipelines.
            </p>

            <div className="space-y-2">
              {cliSnippets.map((snippet, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-background-main border border-background-border hover:border-gray-700 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-400 font-medium mb-1">
                      {snippet.title}
                    </p>
                    <code className="text-xs text-emerald-300 font-mono block truncate select-all">
                      {snippet.cmd}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopy(snippet.cmd, idx)}
                    className="p-1.5 rounded bg-background-sidebar hover:bg-gray-800 text-gray-400 hover:text-white transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedIndex === idx ? (
                      <Check size={14} className="text-accent-toxic" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Registry Files Note */}
          <div className="p-3.5 rounded-lg bg-background-main/60 border border-background-border text-xs text-gray-400 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-accent-toxic mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-300 font-medium">Standalone Registry Scripts:</span>
              <p className="mt-0.5">
                Portable <code className="text-gray-200">.reg</code> files are available in{' '}
                <code className="text-emerald-400 font-mono">assets/registry/register-context-menu.reg</code>{' '}
                for scripted workstation setup and enterprise mass deployment.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-background-border bg-background-main/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-background-sidebar hover:bg-gray-800 text-white border border-background-border transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default OsIntegrationModal;
