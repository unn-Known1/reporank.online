// Auto-generated database types — regenerate with:
//   npx supabase gen types typescript --linked > apps/web/src/lib/db/database.types.ts
//
// This file mirrors the schema from supabase/migrations/ (00001–00010).
// Run the command above when connected to a linked Supabase project.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      repos: {
        Row: {
          id: string
          platform: string
          owner: string
          name: string
          full_name: string
          description: string | null
          language: string | null
          topics: string[]
          stars: number
          forks: number
          watchers: number
          archived: boolean
          disabled: boolean
          default_branch: string | null
          last_fetched_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          platform: string
          owner: string
          name: string
          full_name: string
          description?: string | null
          language?: string | null
          topics?: string[]
          stars?: number
          forks?: number
          watchers?: number
          archived?: boolean
          disabled?: boolean
          default_branch?: string | null
          last_fetched_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          platform?: string
          owner?: string
          name?: string
          full_name?: string
          description?: string | null
          language?: string | null
          topics?: string[]
          stars?: number
          forks?: number
          watchers?: number
          archived?: boolean
          disabled?: boolean
          default_branch?: string | null
          last_fetched_at?: string | null
          created_at?: string
        }
      }
      score_runs: {
        Row: {
          id: string
          repo_id: string
          computed_at: string
          total_score: number
          subscores_json: Json
          factors_json: Json
        }
        Insert: {
          id?: string
          repo_id: string
          computed_at?: string
          total_score: number
          subscores_json: Json
          factors_json: Json
        }
        Update: {
          id?: string
          repo_id?: string
          computed_at?: string
          total_score?: number
          subscores_json?: Json
          factors_json?: Json
        }
      }
      reviews: {
        Row: {
          id: string
          repo_id: string
          user_id: string
          ratings_json: Json
          body: string
          created_at: string
          is_outdated: boolean
          spam_flagged: boolean
        }
        Insert: {
          id?: string
          repo_id: string
          user_id: string
          ratings_json: Json
          body: string
          created_at?: string
          is_outdated?: boolean
          spam_flagged?: boolean
        }
        Update: {
          id?: string
          repo_id?: string
          user_id?: string
          ratings_json?: Json
          body?: string
          created_at?: string
          is_outdated?: boolean
          spam_flagged?: boolean
        }
      }
      review_votes: {
        Row: {
          id: string
          review_id: string
          user_id: string
          vote_type: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          vote_type: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string
          created_at?: string
        }
      }
      ai_reviews: {
        Row: {
          id: string
          repo_id: string
          generated_at: string
          model_used: string
          scores_json: Json
          evidence_json: Json
          summary: string
          verdict: string | null
          best_for: string | null
          strengths: string[]
          concerns: string[]
          red_flags: string[]
          injection_flagged: boolean
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          theme: string | null
          created_at: string
          updated_at: string
        }
      }
      site_stats: {
        Row: {
          id: string
          repos_scored_count: number
          reviews_count: number
          ai_reviews_count: number
          updated_at: string
        }
      }
      watchlist_items: {
        Row: {
          id: string
          user_id: string
          repo_id: string
          added_at: string
          last_viewed_at: string | null
        }
      }
      trending_cache: {
        Row: {
          id: string
          data: Json
          generated_at: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
