export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      cards: {
        Row: {
          arcana_type: string | null;
          blessing: string | null;
          card_code: string;
          card_number: number | null;
          card_type: string;
          created_at: string;
          effect_text: string | null;
          id: string;
          immunity: string | null;
          is_playable: boolean;
          name: string;
          source_note: string | null;
          source_version: string;
          suit: string | null;
          target_type: string | null;
          updated_at: string;
        };
        Insert: {
          arcana_type?: string | null;
          blessing?: string | null;
          card_code: string;
          card_number?: number | null;
          card_type: string;
          created_at?: string;
          effect_text?: string | null;
          id?: string;
          immunity?: string | null;
          is_playable?: boolean;
          name: string;
          source_note?: string | null;
          source_version?: string;
          suit?: string | null;
          target_type?: string | null;
          updated_at?: string;
        };
        Update: {
          arcana_type?: string | null;
          blessing?: string | null;
          card_code?: string;
          card_number?: number | null;
          card_type?: string;
          created_at?: string;
          effect_text?: string | null;
          id?: string;
          immunity?: string | null;
          is_playable?: boolean;
          name?: string;
          source_note?: string | null;
          source_version?: string;
          suit?: string | null;
          target_type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      creature_requirements: {
        Row: {
          clan: string;
          created_at: string;
          creature_card_id: string;
          id: string;
          required_quantity: number;
          side: string;
        };
        Insert: {
          clan: string;
          created_at?: string;
          creature_card_id: string;
          id?: string;
          required_quantity: number;
          side: string;
        };
        Update: {
          clan?: string;
          created_at?: string;
          creature_card_id?: string;
          id?: string;
          required_quantity?: number;
          side?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'creature_requirements_creature_card_id_fkey';
            columns: ['creature_card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};