export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: number
          project_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: never
          project_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: never
          project_id?: string | null
        }
        Relationships: []
      }
      change_request_comments: {
        Row: {
          author_id: string
          body: string
          change_request_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string
          body: string
          change_request_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          change_request_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          code: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          impact: Json | null
          project_id: string
          proposed_by: string
          proposed_description: string
          proposed_title: string
          reason: string
          requirement_id: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          impact?: Json | null
          project_id: string
          proposed_by?: string
          proposed_description?: string
          proposed_title: string
          reason: string
          requirement_id: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          impact?: Json | null
          project_id?: string
          proposed_by?: string
          proposed_description?: string
          proposed_title?: string
          reason?: string
          requirement_id?: string
          status?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          name: string
          project_id: string
        }
        Insert: {
          id?: string
          name: string
          project_id: string
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          joined_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          joined_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          current_sprint: number
          description: string
          id: string
          name: string
          total_sprints: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          current_sprint?: number
          description?: string
          id?: string
          name: string
          total_sprints?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          current_sprint?: number
          description?: string
          id?: string
          name?: string
          total_sprints?: number
        }
        Relationships: []
      }
      requirement_dependencies: {
        Row: {
          depends_on_id: string
          requirement_id: string
        }
        Insert: {
          depends_on_id: string
          requirement_id: string
        }
        Update: {
          depends_on_id?: string
          requirement_id?: string
        }
        Relationships: []
      }
      requirement_versions: {
        Row: {
          change_request_id: string | null
          changed_by: string | null
          created_at: string
          description: string
          id: string
          requirement_id: string
          title: string
          version: number
        }
        Insert: {
          change_request_id?: string | null
          changed_by?: string | null
          created_at?: string
          description: string
          id?: string
          requirement_id: string
          title: string
          version: number
        }
        Update: {
          change_request_id?: string | null
          changed_by?: string | null
          created_at?: string
          description?: string
          id?: string
          requirement_id?: string
          title?: string
          version?: number
        }
        Relationships: []
      }
      requirements: {
        Row: {
          code: string
          created_at: string
          created_by: string
          current_version: number
          description: string
          id: string
          module_id: string | null
          priority: string
          project_id: string
          quality_score: number | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          current_version?: number
          description?: string
          id?: string
          module_id?: string | null
          priority?: string
          project_id: string
          quality_score?: number | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          current_version?: number
          description?: string
          id?: string
          module_id?: string | null
          priority?: string
          project_id?: string
          quality_score?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          due_date: string | null
          id: string
          project_id: string
          requirement_id: string | null
          sprint: number | null
          status: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          project_id: string
          requirement_id?: string | null
          sprint?: number | null
          status?: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          project_id?: string
          requirement_id?: string | null
          sprint?: number | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      test_case_requirements: {
        Row: {
          requirement_id: string
          test_case_id: string
        }
        Insert: {
          requirement_id: string
          test_case_id: string
        }
        Update: {
          requirement_id?: string
          test_case_id?: string
        }
        Relationships: []
      }
      test_cases: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expected_result: string
          id: string
          project_id: string
          steps: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          expected_result?: string
          id?: string
          project_id: string
          steps?: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expected_result?: string
          id?: string
          project_id?: string
          steps?: string
          title?: string
        }
        Relationships: []
      }
      test_runs: {
        Row: {
          id: string
          notes: string
          result: string
          run_at: string
          run_by: string | null
          seq: number
          test_case_id: string
        }
        Insert: {
          id?: string
          notes?: string
          result: string
          run_at?: string
          run_by?: string | null
          seq?: never
          test_case_id: string
        }
        Update: {
          id?: string
          notes?: string
          result?: string
          run_at?: string
          run_by?: string | null
          seq?: never
          test_case_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      test_case_status: {
        Row: {
          last_run_at: string | null
          project_id: string | null
          result: string | null
          test_case_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_member: {
        Args: { member_email: string; member_role?: string; p: string }
        Returns: undefined
      }
      decide_change_request: {
        Args: { approve: boolean; comment?: string; cr: string }
        Returns: Database["public"]["Tables"]["change_requests"]["Row"]
      }
      impact_of: {
        Args: { req: string }
        Returns: {
          code: string
          item_id: string
          kind: string
          label: string
          level: number
          via: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"]
