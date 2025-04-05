
import { useEffect, useRef } from "react";
import { Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Import Monaco editor dynamically to avoid SSR issues
import * as monaco from "monaco-editor";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onExecute: () => void;
  onSave?: () => void;
  disabled?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  onExecute,
  onSave,
  disabled 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { toast } = useToast();

  // Initialize Monaco editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize Monaco editor
    const editor = monaco.editor.create(editorRef.current, {
      value: code,
      language: "javascript",
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', monospace",
      tabSize: 2,
      lineNumbers: "on",
      scrollbar: {
        vertical: "auto",
        horizontal: "auto",
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      readOnly: disabled
    });

    // Update code when editor content changes
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    // Store reference to editor
    monacoEditorRef.current = editor;

    // Add keyboard shortcut for execution (Cmd/Ctrl + Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!disabled) {
        toast({
          title: "Executing snippet",
          description: "Running your code...",
        });
        onExecute();
      }
    });

    // Add keyboard shortcut for saving (Cmd/Ctrl + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (!disabled && onSave && code.trim() !== '') {
        toast({
          title: "Saving snippet",
          description: "Saving your code...",
        });
        onSave();
        return true; // Prevents the browser's save dialog from opening
      }
      return false;
    });

    // Clean up editor on unmount
    return () => {
      editor.dispose();
    };
  }, [disabled]); // We only want to initialize once

  // Update editor content if code prop changes
  useEffect(() => {
    if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== code) {
      monacoEditorRef.current.setValue(code);
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center">
        <h2 className="font-semibold">Editor</h2>
        <div className="flex space-x-2">
          {onSave && (
            <Button 
              onClick={onSave} 
              disabled={disabled || code.trim() === ''}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
              title={code.trim() === '' ? "Add code before saving" : "Save snippet"}
            >
              <Save size={16} className="mr-1" />
              Save
            </Button>
          )}
          <Button 
            onClick={onExecute} 
            disabled={disabled || code.trim() === ''}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
            title={code.trim() === '' ? "Add code before running" : "Run snippet"}
          >
            <Play size={16} className="mr-1" />
            Run
          </Button>
        </div>
      </div>
      
      {disabled ? (
        <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-400 italic">
          Select or create a snippet to start coding
        </div>
      ) : (
        <div 
          ref={editorRef} 
          className="flex-1 w-full"
          style={{
            opacity: disabled ? 0.7 : 1
          }}
        />
      )}

      <div className="p-2 bg-slate-800 text-xs text-slate-400">
        <span>Press Ctrl+Enter to run • Ctrl+S to save</span>
      </div>
    </div>
  );
};
