import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Snippet } from "@/types/snippet";
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = "codeSnippets";

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localSnippets, setLocalSnippets] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadSnippets = async () => {
      setIsLoading(true);
      let allSnippets: Snippet[] = [];
      let localSnippetIds: string[] = [];
      
      try {
        const savedSnippets = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localSnippetsData: Snippet[] = [];
        
        if (savedSnippets) {
          localSnippetsData = JSON.parse(savedSnippets);
          localSnippetIds = localSnippetsData.map(s => s.id);
        }
        
        if (user) {
          const { data, error } = await supabase
            .from("snippets")
            .select("*");
          
          if (error) throw error;
          
          const dbSnippets = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.code
          }));
          
          allSnippets = [
            ...dbSnippets,
            ...localSnippetsData.filter(local => 
              !dbSnippets.some(db => db.id === local.id)
            )
          ];
          
          localSnippetIds = localSnippetsData
            .filter(local => !dbSnippets.some(db => db.id === local.id))
            .map(s => s.id);
        } else {
          allSnippets = localSnippetsData;
        }
      } catch (error: any) {
        console.error("Error loading snippets:", error);
        toast({
          title: "Error",
          description: "Failed to load snippets: " + error.message,
          variant: "destructive",
        });
        
        const savedSnippets = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedSnippets) {
          allSnippets = JSON.parse(savedSnippets);
          localSnippetIds = allSnippets.map(s => s.id);
        }
      } finally {
        setSnippets(allSnippets);
        setLocalSnippets(localSnippetIds);
        setIsLoading(false);
      }
    };
    
    loadSnippets();
  }, [user, toast]);
  
  useEffect(() => {
    if (isLoading) return;
    
    const saveSnippets = async () => {
      try {
        if (!user) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snippets));
        } else {
          const localOnlySnippets = snippets.filter(snippet => 
            localSnippets.includes(snippet.id)
          );
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localOnlySnippets));
        }
      } catch (error) {
        console.error("Error saving snippets:", error);
      }
    };
    
    saveSnippets();
  }, [snippets, user, isLoading, localSnippets]);
  
  const createSnippet = () => {
    try {
      const id = uuidv4();
      
      const newSnippet: Snippet = {
        id,
        name: `Snippet ${snippets.length + 1}`,
        code: ""
      };
      
      setLocalSnippets(prev => [...prev, id]);
      setSnippets(prevSnippets => [...prevSnippets, newSnippet]);
      return newSnippet;
    } catch (error: any) {
      console.error("Error creating snippet:", error);
      toast({
        title: "Error",
        description: "Failed to create snippet: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const updateSnippet = async (id: string, updates: Partial<Snippet>) => {
    try {
      if (updates.name !== undefined && updates.name.trim() === '') {
        toast({
          title: "Error",
          description: "Snippet name cannot be empty",
          variant: "destructive",
        });
        throw new Error("Snippet name cannot be empty");
      }
      
      const snippetToUpdate = snippets.find(s => s.id === id);
      if (!snippetToUpdate) {
        throw new Error("Snippet not found");
      }
      
      const updatedSnippet = { 
        ...snippetToUpdate, 
        ...updates 
      };
      
      if (user && !localSnippets.includes(id)) {
        const { error } = await supabase
          .from("snippets")
          .update({
            name: updatedSnippet.name,
            code: updatedSnippet.code,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
        
        if (error) throw error;
      }
      
      const updatedSnippets = snippets.map(snippet => {
        if (snippet.id === id) {
          return updatedSnippet;
        }
        return snippet;
      });
      
      setSnippets(updatedSnippets);
      return updatedSnippet;
    } catch (error: any) {
      console.error("Error updating snippet:", error);
      toast({
        title: "Error",
        description: "Failed to update snippet: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const saveNewSnippet = async (snippet: Snippet) => {
    try {
      if (snippet.name.trim() === '') {
        toast({
          title: "Error",
          description: "Snippet name cannot be empty",
          variant: "destructive",
        });
        throw new Error("Snippet name cannot be empty");
      }
      
      if (snippet.code.trim() === '') {
        toast({
          title: "Error",
          description: "Snippet code cannot be empty",
          variant: "destructive",
        });
        throw new Error("Snippet code cannot be empty");
      }
      
      if (user) {
        const { error } = await supabase
          .from("snippets")
          .insert({
            id: snippet.id,
            name: snippet.name,
            code: snippet.code,
            user_id: user.id
          });
        
        if (error) throw error;
        
        setLocalSnippets(prev => prev.filter(id => id !== snippet.id));
        
        toast({
          title: "Success",
          description: "Snippet saved to your account",
        });
        
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      console.error("Error saving new snippet:", error);
      toast({
        title: "Error",
        description: "Failed to save snippet: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const migrateLocalSnippetsToDb = async () => {
    if (!user || localSnippets.length === 0) return;
    
    try {
      const localSnippetsData = snippets.filter(s => localSnippets.includes(s.id));
      
      if (localSnippetsData.length === 0) return;
      
      const { error } = await supabase
        .from("snippets")
        .insert(
          localSnippetsData.map(s => ({
            id: s.id,
            name: s.name,
            code: s.code,
            user_id: user.id
          }))
        );
      
      if (error) throw error;
      
      setLocalSnippets([]);
      
      toast({
        title: "Success",
        description: `Migrated ${localSnippetsData.length} local snippet(s) to your account`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error migrating local snippets:", error);
      toast({
        title: "Error",
        description: "Failed to migrate local snippets: " + error.message,
        variant: "destructive",
      });
      return false;
    }
  };
  
  const deleteSnippet = async (id: string) => {
    try {
      if (user && !localSnippets.includes(id)) {
        const { error } = await supabase
          .from("snippets")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
      }
      
      const filteredSnippets = snippets.filter(snippet => snippet.id !== id);
      setSnippets(filteredSnippets);
      
      setLocalSnippets(prev => prev.filter(snippetId => snippetId !== id));
    } catch (error: any) {
      console.error("Error deleting snippet:", error);
      toast({
        title: "Error",
        description: "Failed to delete snippet: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  return {
    snippets,
    isLoading,
    localSnippets,
    createSnippet,
    updateSnippet,
    saveNewSnippet,
    deleteSnippet,
    migrateLocalSnippetsToDb
  };
}
