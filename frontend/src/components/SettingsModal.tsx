import { X, Sliders, Moon, Sun, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#171717] dark:bg-[#171717] light:bg-white border border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] rounded-xl shadow-2xl overflow-hidden font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5]">
          <div className="flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold">Workspace Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#222222] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Theme Option */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Appearance Theme</div>
              <div className="text-zinc-500 text-[11px]">Select interface color mode</div>
            </div>

            <button
              onClick={onToggleTheme}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] bg-[#111111] dark:bg-[#111111] light:bg-zinc-100 text-xs hover:bg-[#1f1f1f] transition"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-zinc-600" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>

          {/* System Spec */}
          <div className="pt-3 border-t border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] space-y-2">
            <div className="flex items-center space-x-1.5 font-medium text-zinc-400 text-[11px]">
              <Server className="h-3.5 w-3.5" />
              <span>SYSTEM ARCHITECTURE</span>
            </div>
            <div className="p-3 rounded-md bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#242424] font-mono text-[11px] space-y-1 text-zinc-400">
              <div className="flex justify-between">
                <span>Architecture</span>
                <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">Clean Modular Monolith</span>
              </div>
              <div className="flex justify-between">
                <span>Backend Runtime</span>
                <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">Java 17 / Spring Boot 3.3.4</span>
              </div>
              <div className="flex justify-between">
                <span>Inventory Store</span>
                <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">PostgreSQL 16</span>
              </div>
              <div className="flex justify-between">
                <span>Streams &amp; Cache</span>
                <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">Redis 7</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-100 light:bg-zinc-900 text-zinc-900 dark:text-zinc-900 light:text-white font-medium hover:opacity-90 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
