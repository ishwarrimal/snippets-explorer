
import { useState } from "react";
import { Trash, Edit, Plus, Loader2, Database, HardDrive, Check, X } from "lucide-react";
import { Snippet } from "@/types/snippet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SnippetManagerProps {
  snippets: Snippet[];
  activeSnippet: Snippet | null;
  onSelectSnippet: (snippet: Snippet) => void;
  onCreateSnippet: () => void;
  onUpdateSnippet: (id: string, updates: Partial<Snippet>) => void;
  onDeleteSnippet: (id: string) => void;
  isLoading?: boolean;
  unsavedSnippets?: string[];
  isAuthenticated: boolean;
}

export const SnippetManager: React.FC<SnippetManagerProps> = ({
  snippets,
  activeSnippet,
  onSelectSnippet,
  onCreateSnippet,
  onUpdateSnippet,
  onDeleteSnippet,
  isLoading = false,
  unsavedSnippets = [],
  isAuthenticated = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [originalName, setOriginalName] = useState("");

  const startEditing = (snippet: Snippet) => {
    setEditingId(snippet.id);
    setEditName(snippet.name);
    setOriginalName(snippet.name);
  };

  const saveEdit = () => {
    if (editingId) {
      if (editName.trim() === '') {
        // If name is empty, delete the snippet instead
        onDeleteSnippet(editingId);
      } else {
        // Only update the name, preserving the code
        onUpdateSnippet(editingId, { name: editName.trim() });
      }
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const isUnsaved = (id: string) => unsavedSnippets.includes(id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-slate-600">
        <h2 className="font-semibold text-white">Snippets</h2>
        <Button size="icon" variant="ghost" onClick={onCreateSnippet} title="Create new snippet" className="text-white hover:bg-slate-700">
          <Plus size={16} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-white">Loading snippets...</span>
          </div>
        ) : snippets.length === 0 ? (
          <div className="p-4 text-center text-white">
            <p>No snippets yet</p>
            <button 
              className="mt-2 text-blue-400 hover:underline"
              onClick={onCreateSnippet}
            >
              Create your first snippet
            </button>
          </div>
        ) : (
          <ul className="w-full">
            {snippets.map((snippet) => (
              <li 
                key={snippet.id}
                className={cn(
                  "border-b border-slate-600 w-full",
                  activeSnippet?.id === snippet.id 
                    ? "bg-slate-700" 
                    : "hover:bg-slate-700"
                )}
              >
                <div className="flex items-center p-2 w-full">
                  {editingId === snippet.id ? (
                    <div className="flex items-center w-full">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="h-7 text-sm bg-slate-800 border-slate-500 text-white flex-1"
                      />
                      <div className="flex ml-2">
                        <Button 
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-green-500 hover:bg-slate-600"
                          onClick={saveEdit}
                        >
                          <Check size={14} />
                        </Button>
                        <Button 
                          size="icon"
                          variant="ghost" 
                          className="h-6 w-6 text-red-400 hover:bg-slate-600"
                          onClick={cancelEdit}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex-1 truncate cursor-pointer py-1 text-white flex items-center"
                      onClick={() => onSelectSnippet(snippet)}
                      title={snippet.name}
                    >
                      <span className="flex-1 truncate">{snippet.name}</span>
                      
                      {isUnsaved(snippet.id) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 text-amber-400">
                                <HardDrive size={14} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Saved locally only</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {isAuthenticated && !isUnsaved(snippet.id) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 text-blue-400">
                                <Database size={14} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Saved to database</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}

                  {editingId !== snippet.id && (
                    <div className="flex space-x-1">
                      <Button 
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-white hover:bg-slate-600"
                        onClick={() => startEditing(snippet)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        size="icon"
                        variant="ghost" 
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-slate-600"
                        onClick={() => onDeleteSnippet(snippet.id)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
