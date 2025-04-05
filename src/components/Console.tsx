
import { useRef, useEffect, useState } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConsoleProps {
  output: Array<{
    type: string;
    content: string;
  }>;
  onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ output, onClear }) => {
  const consoleRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  const getLogTypeStyles = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      case "return":
        return "text-purple-400 italic";
      default:
        return "text-white";
    }
  };

  const handleConsoleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      // Create a custom event that will be caught by the parent component
      const customEvent = new CustomEvent("console:input", { 
        detail: { command: inputValue } 
      });
      window.dispatchEvent(customEvent);
      
      // Clear the input after sending
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center">
        <h2 className="font-semibold">Console</h2>
        <Button 
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClear}
          title="Clear console"
        >
          <Trash size={16} />
        </Button>
      </div>
      
      <div 
        ref={consoleRef}
        className="flex-1 bg-slate-950 p-2 overflow-y-auto font-mono text-sm whitespace-pre-wrap"
        style={{ minHeight: 0 }} // This helps with flexbox to allow shrinking below min-content
      >
        {output.length === 0 ? (
          <div className="text-slate-500 p-2">Console output will appear here</div>
        ) : (
          output.map((log, index) => (
            <div 
              key={index} 
              className={`py-1 px-2 border-b border-slate-800 ${getLogTypeStyles(log.type)}`}
            >
              {log.type === "error" && <span className="font-bold mr-2">Error:</span>}
              {log.type === "warn" && <span className="font-bold mr-2">Warning:</span>}
              {log.content}
            </div>
          ))
        )}
      </div>

      <div className="px-2 py-2 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center">
          <span className="text-green-400 mr-2">&gt;</span>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleConsoleInput}
            placeholder="Type JavaScript expression and press Enter..."
            className="bg-slate-800 border-slate-700 text-white font-mono"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};
