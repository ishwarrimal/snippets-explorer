import { Snippet } from "./snippet";

export type SnippetQueryKey = ["snippets"];

export interface UseSnippetsQueryResult {
  snippets: Snippet[];
  isLoading: boolean;
  error: Error | null;
  localSnippets: string[];
  createSnippet: () => Snippet;
  updateSnippet: (id: string, updates: Partial<Snippet>) => Promise<Snippet>;
  saveNewSnippet: (snippet: Snippet) => Promise<boolean>;
  deleteSnippet: (id: string) => Promise<void>;
  migrateLocalSnippetsToDb: () => Promise<boolean>;
}

export interface SnippetOperations {
  createSnippet: () => Snippet;
  updateSnippet: (id: string, updates: Partial<Snippet>) => Promise<void>;
  saveNewSnippet: (snippet: Snippet) => Promise<boolean>;
  deleteSnippet: (id: string) => Promise<void>;
  migrateLocalSnippetsToDb: () => Promise<boolean>;
}