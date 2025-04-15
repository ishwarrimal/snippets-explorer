
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SnippetManager } from "@/components/SnippetManager";
import { CodeEditor } from "@/components/CodeEditor";
import { Console } from "@/components/Console";
import { Snippet } from "@/types/snippet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Cloud, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSnippetsQuery } from "@/hooks/useSnippetsQuery";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

const Index = () => {
  const { user, signOut } = useAuth();
  const { 
    snippets, 
    isLoading, 
    localSnippets,
    createSnippet, 
    updateSnippet, 
    saveNewSnippet, 
    deleteSnippet,
    migrateLocalSnippetsToDb
  } = useSnippetsQuery();
  const [activeSnippet, setActiveSnippet] = useState<Snippet | null>(null);
  const [isNewUnsavedSnippet, setIsNewUnsavedSnippet] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<Array<{
    type: string;
    content: string;
  }>>([]);
  const [currentCode, setCurrentCode] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Show migration dialog if user logs in and has local snippets
  useEffect(() => {
    if (user && localSnippets.length > 0) {
      setShowMigrationDialog(true);
    } else {
      setShowMigrationDialog(false);
    }
  }, [user, localSnippets]);

  // Set active snippet when snippets load
  useEffect(() => {
    if (!isLoading && snippets.length > 0 && !activeSnippet) {
      setActiveSnippet(snippets[0]);
      setCurrentCode(snippets[0].code || "");
      setIsNewUnsavedSnippet(false);
    }
  }, [snippets, isLoading, activeSnippet]);

  // Update current code when active snippet changes
  useEffect(() => {
    if (activeSnippet) {
      setCurrentCode(activeSnippet.code || "");
    } else {
      setCurrentCode("");
    }
  }, [activeSnippet]);

  // Listen for console input events
  useEffect(() => {
    const handleConsoleInput = (event: any) => {
      const { command } = event.detail;
      
      // Log the input as a user command
      setConsoleOutput(prev => [...prev, {
        type: "log",
        content: `> ${command}`
      }]);
      
      // Evaluate the command
      try {
        // Create a custom console object to capture logs
        const originalConsole = console;
        const customConsole = {
          log: (...args: any[]) => {
            originalConsole.log(...args);
            setConsoleOutput(prev => [...prev, {
              type: "log",
              content: args.map(formatConsoleOutput).join(" ")
            }]);
          },
          error: (...args: any[]) => {
            originalConsole.error(...args);
            setConsoleOutput(prev => [...prev, {
              type: "error",
              content: args.map(formatConsoleOutput).join(" ")
            }]);
          },
          warn: (...args: any[]) => {
            originalConsole.warn(...args);
            setConsoleOutput(prev => [...prev, {
              type: "warn",
              content: args.map(formatConsoleOutput).join(" ")
            }]);
          },
          info: (...args: any[]) => {
            originalConsole.info(...args);
            setConsoleOutput(prev => [...prev, {
              type: "info",
              content: args.map(formatConsoleOutput).join(" ")
            }]);
          }
        };

        // Replace console with our custom implementation for execution
        window.console = {
          ...originalConsole,
          ...customConsole
        };

        // Execute the command
        const result = new Function(`return ${command}`)();

        // If the function returns a value, log it
        if (result !== undefined) {
          setConsoleOutput(prev => [...prev, {
            type: "return",
            content: formatConsoleOutput(result)
          }]);
        }

        // Restore the original console
        window.console = originalConsole;
      } catch (error) {
        setConsoleOutput(prev => [...prev, {
          type: "error",
          content: `${error}`
        }]);
      }
    };

    window.addEventListener("console:input", handleConsoleInput);
    return () => {
      window.removeEventListener("console:input", handleConsoleInput);
    };
  }, []);

  // Create a new snippet
  const handleCreateSnippet = () => {
    try {
      const newSnippet = createSnippet();
      setActiveSnippet(newSnippet);
      setCurrentCode("");
      
      // For logged-in users, don't mark as unsaved - we'll save directly to DB when they update the name
      setIsNewUnsavedSnippet(!user);
      
      toast({
        title: "New snippet created",
        description: user 
          ? "Enter a name and save to store it in your account" 
          : "Add code and save to store it locally",
      });
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Update a snippet's name (will also save code if it exists)
  const handleUpdateSnippet = async (id: string, updates: Partial<Snippet>) => {
    try {
      // Find the target snippet to update
      const targetSnippet = snippets.find(s => s.id === id);
      
      if (!targetSnippet) {
        throw new Error("Snippet not found");
      }
      
      // Create the full updated snippet preserving existing code if not provided
      const fullUpdates: Partial<Snippet> = {
        ...updates
      };
      
      // Only include code if it's not provided in updates and exists in the target snippet
      if (!updates.code && targetSnippet.code) {
        fullUpdates.code = targetSnippet.code;
      }
      
      const updatedSnippet = await updateSnippet(id, fullUpdates);
      
      // If we're updating the active snippet, update the local state too
      if (activeSnippet?.id === id) {
        setActiveSnippet(updatedSnippet);
        
        // If this was a new unsaved snippet and we just updated it
        // (meaning we effectively saved it), mark it as saved
        if (isNewUnsavedSnippet && updatedSnippet.code && updatedSnippet.code.trim() !== '') {
          // For logged in users, save directly to DB
          if (user) {
            await saveNewSnippet(updatedSnippet);
          }
          setIsNewUnsavedSnippet(false);
          
          toast({
            title: "Snippet saved",
            description: user 
              ? "Your snippet has been saved to your account." 
              : "Your snippet has been saved locally.",
          });
        }
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Update the current code without saving
  const handleCodeChange = (code: string) => {
    setCurrentCode(code);
  };

  // Save the current snippet
  const handleSaveSnippet = async () => {
    if (!activeSnippet) return;
    
    // First, update the active snippet with the current code
    try {
      // Create a new updated snippet with the current code
      const updatedSnippet = {
        ...activeSnippet,
        code: currentCode
      };
      
      // Validate snippet before saving
      if (updatedSnippet.name.trim() === '') {
        toast({
          title: "Error",
          description: "Snippet name cannot be empty",
          variant: "destructive",
        });
        return;
      }
      
      if (updatedSnippet.code.trim() === '') {
        toast({
          title: "Error",
          description: "Snippet code cannot be empty",
          variant: "destructive",
        });
        return;
      }
      
      // If not signed in, show dialog for non-authenticated users
      if (!user && !showSaveDialog) {
        setShowSaveDialog(true);
        return;
      }
      
      toast({
        title: "Saving",
        description: "Saving your snippet...",
      });
      
      // Update the active snippet reference with the latest code
      setActiveSnippet(updatedSnippet);
      
      // If user is logged in and this is a local-only snippet, save to DB
      if (user && localSnippets.includes(activeSnippet.id)) {
        await saveNewSnippet(updatedSnippet);
      } else {
        // Otherwise, just update it
        // Make sure we're only updating the active snippet
        await updateSnippet(activeSnippet.id, { 
          name: updatedSnippet.name,
          code: updatedSnippet.code 
        });
        setIsNewUnsavedSnippet(false);

      }
      
      toast({
        title: "Success",
        description: "Snippet saved successfully",
      });
      
      setShowSaveDialog(false);
    } catch (error: any) {
      // Error is already handled in the hook
    }
  };

  // Delete a snippet
  const handleDeleteSnippet = async (id: string) => {
    try {
      await deleteSnippet(id);
      
      if (activeSnippet?.id === id) {
        // Find next snippet to make active
        const remainingSnippets = snippets.filter(s => s.id !== id);
        setActiveSnippet(remainingSnippets.length > 0 ? remainingSnippets[0] : null);
        setIsNewUnsavedSnippet(false);
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Handle migration of local snippets to DB
  const handleMigrateSnippets = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const success = await migrateLocalSnippetsToDb();
    if (success) {
      setShowMigrationDialog(false);
    }
  };

  // Clear console output
  const clearConsole = () => {
    setConsoleOutput([]);
  };

  // Execute the active snippet
  const executeSnippet = () => {
    if (!currentCode || currentCode.trim() === '') return;

    // Clear previous output
    setConsoleOutput([]);
    try {
      // Create a custom console object to capture logs
      const originalConsole = console;
      const customConsole = {
        log: (...args: any[]) => {
          originalConsole.log(...args);
          setConsoleOutput(prev => [...prev, {
            type: "log",
            content: args.map(formatConsoleOutput).join(" ")
          }]);
        },
        error: (...args: any[]) => {
          originalConsole.error(...args);
          setConsoleOutput(prev => [...prev, {
            type: "error",
            content: args.map(formatConsoleOutput).join(" ")
          }]);
        },
        warn: (...args: any[]) => {
          originalConsole.warn(...args);
          setConsoleOutput(prev => [...prev, {
            type: "warn",
            content: args.map(formatConsoleOutput).join(" ")
          }]);
        },
        info: (...args: any[]) => {
          originalConsole.info(...args);
          setConsoleOutput(prev => [...prev, {
            type: "info",
            content: args.map(formatConsoleOutput).join(" ")
          }]);
        }
      };

      // Replace console with our custom implementation for execution
      const originalConsoleRef = window.console;
      window.console = {
        ...originalConsoleRef,
        ...customConsole
      };

      // Execute the code
      const result = new Function(currentCode)();

      // If the function returns a value, log it
      if (result !== undefined) {
        setConsoleOutput(prev => [...prev, {
          type: "return",
          content: formatConsoleOutput(result)
        }]);
      }

      // Restore the original console
      window.console = originalConsoleRef;
    } catch (error) {
      setConsoleOutput([{
        type: "error",
        content: `${error}`
      }]);
    }
  };

  // Helper function to format console output
  const formatConsoleOutput = (value: any): string => {
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return `${value}`;
      }
    }
    return `${value}`;
  };

  // Handle user authentication
  const handleAuth = () => {
    if (user) {
      signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } else {
      navigate("/auth");
    }
  };

  // Continue with local storage dialog
  const handleContinueWithLocalStorage = () => {
    setShowSaveDialog(false);
    handleSaveSnippet();
  };

  // Go to sign in page
  const handleGoToSignIn = () => {
    setShowSaveDialog(false);
    navigate("/auth");
  };

  // Dismiss the migration dialog
  const handleDismissMigration = () => {
    setShowMigrationDialog(false);
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        <header className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">Code Snippet Explorer</h1>
          <div className="flex items-center space-x-2">
            {user && <span className="text-sm text-gray-300">{user.email}</span>}
            {user && localSnippets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMigrationDialog(true)}
                className="flex items-center space-x-1 bg-amber-700 text-white border-amber-600 hover:bg-amber-600"
              >
                <Cloud size={16} /> <span>Migrate Local Snippets</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAuth}
              className="flex items-center space-x-1 bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              {user ? (
                <>
                  <LogOut size={16} /> <span>Sign Out</span>
                </>
              ) : (
                <>
                  <LogIn size={16} /> <span>Sign In</span>
                </>
              )}
            </Button>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40} className="bg-gray-800">
              <div className="h-full w-full">
                <SnippetManager 
                  snippets={snippets} 
                  activeSnippet={activeSnippet} 
                  onSelectSnippet={(snippet) => {
                    setActiveSnippet(snippet); 
                    setCurrentCode(snippet.code || "");
                    setIsNewUnsavedSnippet(false);
                  }} 
                  onCreateSnippet={handleCreateSnippet} 
                  onUpdateSnippet={handleUpdateSnippet} 
                  onDeleteSnippet={handleDeleteSnippet}
                  isLoading={isLoading}
                  unsavedSnippets={localSnippets}
                  isAuthenticated={!!user}
                />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={80}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={60} minSize={20}>
                  <CodeEditor 
                    code={currentCode} 
                    onChange={handleCodeChange} 
                    onExecute={executeSnippet}
                    onSave={handleSaveSnippet} 
                    disabled={!activeSnippet} 
                  />
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel defaultSize={40} minSize={15} className="bg-gray-800">
                  <Console output={consoleOutput} onClear={clearConsole} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        
        {/* Save dialog for non-authenticated users only */}
        <Dialog open={showSaveDialog && !user} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Snippet</DialogTitle>
              <DialogDescription>
                You are not signed in. Your snippet will be saved only in your browser's local storage and may be lost if you clear your browser data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleGoToSignIn}>
                Sign In to Save Online
              </Button>
              <Button onClick={handleContinueWithLocalStorage}>
                Continue with Local Storage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Migration dialog for local snippets */}
        <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Local Snippets Detected
              </DialogTitle>
              <DialogDescription>
                You have {localSnippets.length} snippet(s) stored only in your browser's local storage. 
                Would you like to save them to your account to ensure they're not lost?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={handleDismissMigration}>
                  Maybe Later
                </Button>
              </DialogClose>
              <Button onClick={handleMigrateSnippets}>
                Save to My Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Index;
