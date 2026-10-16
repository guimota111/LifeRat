export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          avg_hr: number | null
          avg_speed_kmh: number | null
          calories: number | null
          created_at: string
          distance_km: number | null
          duration_s: number
          external_id: string | null
          id: string
          local_date: string
          source: Database["public"]["Enums"]["entry_source"]
          started_at: string
          type: string
          user_id: string
        }
        Insert: {
          avg_hr?: number | null
          avg_speed_kmh?: number | null
          calories?: number | null
          created_at?: string
          distance_km?: number | null
          duration_s: number
          external_id?: string | null
          id?: string
          local_date: string
          source: Database["public"]["Enums"]["entry_source"]
          started_at: string
          type: string
          user_id: string
        }
        Update: {
          avg_hr?: number | null
          avg_speed_kmh?: number | null
          calories?: number | null
          created_at?: string
          distance_km?: number | null
          duration_s?: number
          external_id?: string | null
          id?: string
          local_date?: string
          source?: Database["public"]["Enums"]["entry_source"]
          started_at?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          habit_id: string | null
          handicap_add: number
          handicap_mult: number
          joined_at: string
          team: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          habit_id?: string | null
          handicap_add?: number
          handicap_mult?: number
          joined_at?: string
          team?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          habit_id?: string | null
          handicap_add?: number
          handicap_mult?: number
          joined_at?: string
          team?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          bet: string | null
          club_id: string
          created_at: string
          creator_id: string
          description: string
          ends_on: string
          id: string
          name: string
          proof: Database["public"]["Enums"]["proof_kind"]
          spec: Json
          starts_on: string
          state: Database["public"]["Enums"]["challenge_state"]
          teams: boolean
          updated_at: string
          verified_only: boolean
          winner_id: string | null
        }
        Insert: {
          bet?: string | null
          club_id: string
          created_at?: string
          creator_id: string
          description?: string
          ends_on: string
          id?: string
          name: string
          proof?: Database["public"]["Enums"]["proof_kind"]
          spec: Json
          starts_on: string
          state?: Database["public"]["Enums"]["challenge_state"]
          teams?: boolean
          updated_at?: string
          verified_only?: boolean
          winner_id?: string | null
        }
        Update: {
          bet?: string | null
          club_id?: string
          created_at?: string
          creator_id?: string
          description?: string
          ends_on?: string
          id?: string
          name?: string
          proof?: Database["public"]["Enums"]["proof_kind"]
          spec?: Json
          starts_on?: string
          state?: Database["public"]["Enums"]["challenge_state"]
          teams?: boolean
          updated_at?: string
          verified_only?: boolean
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          joined_at: string
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          cover_path: string | null
          created_at: string
          description: string
          id: string
          invite_code: string
          is_public: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          invite_code?: string
          is_public?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          invite_code?: string
          is_public?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          active_minutes: number | null
          distance_km: number | null
          local_date: string
          sleep_minutes: number | null
          source: Database["public"]["Enums"]["entry_source"]
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          distance_km?: number | null
          local_date: string
          sleep_minutes?: number | null
          source: Database["public"]["Enums"]["entry_source"]
          steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          distance_km?: number | null
          local_date?: string
          sleep_minutes?: number | null
          source?: Database["public"]["Enums"]["entry_source"]
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_events: {
        Row: {
          club_id: string | null
          created_at: string
          habit_id: string | null
          id: string
          kind: Database["public"]["Enums"]["feed_kind"]
          payload: Json
          user_id: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          habit_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["feed_kind"]
          payload?: Json
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          club_id?: string | null
          created_at?: string
          habit_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["feed_kind"]
          payload?: Json
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "feed_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_events_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_entries: {
        Row: {
          created_at: string
          external_id: string | null
          habit_id: string
          id: string
          local_date: string
          note: string | null
          occurred_at: string
          photo_path: string | null
          source: Database["public"]["Enums"]["entry_source"]
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          habit_id: string
          id?: string
          local_date: string
          note?: string | null
          occurred_at?: string
          photo_path?: string | null
          source?: Database["public"]["Enums"]["entry_source"]
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          external_id?: string | null
          habit_id?: string
          id?: string
          local_date?: string
          note?: string | null
          occurred_at?: string
          photo_path?: string | null
          source?: Database["public"]["Enums"]["entry_source"]
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_entries_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          frequency_days: number[] | null
          frequency_kind: Database["public"]["Enums"]["frequency_kind"]
          frequency_n: number | null
          goal_value: number | null
          goal_window: Database["public"]["Enums"]["goal_window"]
          icon: string
          id: string
          integration_metric: string | null
          kind: Database["public"]["Enums"]["habit_kind"]
          name: string
          negative: boolean
          owner_id: string
          sort_order: number
          step_value: number
          unit: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          frequency_days?: number[] | null
          frequency_kind?: Database["public"]["Enums"]["frequency_kind"]
          frequency_n?: number | null
          goal_value?: number | null
          goal_window?: Database["public"]["Enums"]["goal_window"]
          icon?: string
          id?: string
          integration_metric?: string | null
          kind: Database["public"]["Enums"]["habit_kind"]
          name: string
          negative?: boolean
          owner_id: string
          sort_order?: number
          step_value?: number
          unit?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          frequency_days?: number[] | null
          frequency_kind?: Database["public"]["Enums"]["frequency_kind"]
          frequency_n?: number | null
          goal_value?: number | null
          goal_window?: Database["public"]["Enums"]["goal_window"]
          icon?: string
          id?: string
          integration_metric?: string | null
          kind?: Database["public"]["Enums"]["habit_kind"]
          name?: string
          negative?: boolean
          owner_id?: string
          sort_order?: number
          step_value?: number
          unit?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "habits_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          handle: string | null
          id: string
          locale: string
          plan: Database["public"]["Enums"]["plan"]
          timezone: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          handle?: string | null
          id: string
          locale?: string
          plan?: Database["public"]["Enums"]["plan"]
          timezone?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          handle?: string | null
          id?: string
          locale?: string
          plan?: Database["public"]["Enums"]["plan"]
          timezone?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "feed_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_metrics_resolved: {
        Row: {
          active_minutes: number | null
          distance_km: number | null
          local_date: string | null
          sleep_minutes: number | null
          steps: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_see_event: {
        Args: {
          author: string
          club: string
          vis: Database["public"]["Enums"]["visibility"]
        }
        Returns: boolean
      }
      challenge_leaderboard: {
        Args: { challenge: string }
        Returns: {
          avatar_url: string
          display_name: string
          raw_score: number
          reached_at: string
          score: number
          team: string
          user_id: string
        }[]
      }
      gen_invite_code: { Args: never; Returns: string }
      is_club_admin: { Args: { club: string; who: string }; Returns: boolean }
      is_club_member: { Args: { club: string; who: string }; Returns: boolean }
      is_friend: { Args: { a: string; b: string }; Returns: boolean }
      join_club: { Args: { code: string }; Returns: string }
    }
    Enums: {
      challenge_state: "draft" | "active" | "finished"
      club_role: "owner" | "admin" | "member"
      entry_source:
        | "manual"
        | "healthkit"
        | "health_connect"
        | "strava"
        | "shortcut"
      feed_kind:
        | "entry"
        | "item_completed"
        | "record"
        | "challenge_joined"
        | "challenge_won"
      frequency_kind: "daily" | "times_per_week" | "weekdays" | "every_n_days"
      friendship_status: "pending" | "accepted" | "blocked"
      goal_window: "day" | "week" | "month"
      habit_kind:
        | "bool"
        | "counter"
        | "duration"
        | "quantity"
        | "catalog"
        | "integration"
      plan: "free" | "pro"
      proof_kind: "none" | "photo_optional" | "photo_required"
      visibility: "private" | "friends" | "public"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      challenge_state: ["draft", "active", "finished"],
      club_role: ["owner", "admin", "member"],
      entry_source: [
        "manual",
        "healthkit",
        "health_connect",
        "strava",
        "shortcut",
      ],
      feed_kind: [
        "entry",
        "item_completed",
        "record",
        "challenge_joined",
        "challenge_won",
      ],
      frequency_kind: ["daily", "times_per_week", "weekdays", "every_n_days"],
      friendship_status: ["pending", "accepted", "blocked"],
      goal_window: ["day", "week", "month"],
      habit_kind: [
        "bool",
        "counter",
        "duration",
        "quantity",
        "catalog",
        "integration",
      ],
      plan: ["free", "pro"],
      proof_kind: ["none", "photo_optional", "photo_required"],
      visibility: ["private", "friends", "public"],
    },
  },
} as const
