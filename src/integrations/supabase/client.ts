
import { createClient } from '@supabase/supabase-js'

// Create Supabase client
export const supabase = createClient(
  'https://dqzzptcdxvkpyunstxcm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxenpwdGNkeHZrcHl1bnN0eGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0ODE0MTgsImV4cCI6MjA1ODA1NzQxOH0.Objfy5zbRQOwY3yKljbbAd45fwMuVB0DxA6W_CZvfbc',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)
