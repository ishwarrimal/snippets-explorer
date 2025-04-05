
export interface Snippet {
  id: string;
  name: string;
  code: string;
}

export interface SupabaseSnippet extends Snippet {
  user_id: string;
  created_at: string;
  updated_at: string;
}
