
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Snippet } from "@/types/snippet";
import { v4 as uuidv4 } from 'uuid';
import { UseSnippetsQueryResult } from "@/types/snippetQueries";

const LOCAL_STORAGE_KEY = "codeSnippets";

export function useSnippetsQuery(): UseSnippetsQueryResult {
  const [localSnippets, setLocalSnippets] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main query for fetching snippets
  const { data: snippets = [], isLoading, error } = useQuery({
    queryKey: ['snippets', user?.id] as const,
    queryFn: async () => {
      let allSnippets: Snippet[] = [];
      let localSnippetIds: string[] = [];
      
      const savedSnippets = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localSnippetsData: Snippet[] = [];
      
      if (savedSnippets) {
        localSnippetsData = JSON.parse(savedSnippets);
        localSnippetIds = localSnippetsData.map(s => s.id);
      }
      
      if (user) {
        const { data, error } = await supabase
          .from("snippets")
          .select("*")
          .eq("user_id", user.id);
        
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
        
        setLocalSnippets(localSnippetsData
          .filter(local => !dbSnippets.some(db => db.id === local.id))
          .map(s => s.id)
        );
      } else {
        allSnippets = localSnippetsData;
        setLocalSnippets(localSnippetsData.map(s => s.id));
      }
      
      return allSnippets;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Save to local storage when snippets change
  useEffect(() => {
    if (isLoading || !snippets) return;
    
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
  }, [snippets, user, isLoading, localSnippets]);

  // Mutations
  const createSnippet = () => {
    try {
      const id = uuidv4();
      const newSnippet: Snippet = {
        id,
        name: `Snippet ${(snippets?.length || 0) + 1}`,
        code: ""
      };
      
      queryClient.setQueryData(['snippets', user?.id], (old: Snippet[] = []) => {
        return [...old, newSnippet];
      });
      
      setLocalSnippets(prev => [...prev, id]);
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

  const updateSnippetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Snippet> }) => {
      if (updates.name !== undefined && updates.name.trim() === '') {
        throw new Error("Snippet name cannot be empty");
      }
      
      const snippetToUpdate = snippets?.find(s => s.id === id);
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
            updated_at: new Date().toISOString(),
            user_id: user.id
          })
          .eq("id", id);
        
        if (error) throw error;
      }
      
      return updatedSnippet;
    },
    onSuccess: (updatedSnippet) => {
      queryClient.setQueryData(['snippets', user?.id], (old: Snippet[] = []) => {
        return old.map(snippet => {
          if (snippet.id === updatedSnippet.id) {
            return updatedSnippet;
          }
          return snippet;
        });
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update snippet: " + error.message,
        variant: "destructive",
      });
    }
  });

  const saveNewSnippetMutation = useMutation({
    mutationFn: async (snippet: Snippet) => {
      if (!user) return false;
      
      if (snippet.name.trim() === '') {
        throw new Error("Snippet name cannot be empty");
      }
      
      if (snippet.code.trim() === '') {
        throw new Error("Snippet code cannot be empty");
      }
      
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
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets', user?.id] });
      toast({
        title: "Success",
        description: "Snippet saved to your account",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save snippet: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: async (id: string) => {
      if (user && !localSnippets.includes(id)) {
        const { error } = await supabase
          .from("snippets")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
      }
      
      setLocalSnippets(prev => prev.filter(snippetId => snippetId !== id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['snippets', user?.id], (old: Snippet[] = []) => {
        return old.filter(snippet => snippet.id !== id);
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete snippet: " + error.message,
        variant: "destructive",
      });
    }
  });

  const migrateLocalSnippetsToDbMutation = useMutation({
    mutationFn: async () => {
      if (!user || localSnippets.length === 0) return false;
      
      const localSnippetsData = snippets?.filter(s => localSnippets.includes(s.id)) || [];
      
      if (localSnippetsData.length === 0) return false;
      
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
      return true;
    },
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['snippets', user?.id] });
        toast({
          title: "Success",
          description: "Local snippets migrated to your account",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to migrate local snippets: " + error.message,
        variant: "destructive",
      });
    }
  });

  return {
    snippets: snippets || [],
    isLoading,
    error: error as Error | null,
    localSnippets,
    createSnippet,
    updateSnippet: async (id: string, updates: Partial<Snippet>) => {
      return await updateSnippetMutation.mutateAsync({ id, updates });
    },
    saveNewSnippet: (snippet: Snippet) => 
      saveNewSnippetMutation.mutateAsync(snippet),
    deleteSnippet: (id: string) => 
      deleteSnippetMutation.mutateAsync(id),
    migrateLocalSnippetsToDb: () => 
      migrateLocalSnippetsToDbMutation.mutateAsync()
  };
}
