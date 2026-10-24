/**
 * TypeScript Type Definitions for Astro AI Platform
 */

export interface AstrologerPersona {
  id: string;
  slug: string;
  name: string;
  name_hi?: string;
  title: string;
  title_hi?: string;
  avatar: string;
  bio: string;
  bio_hi?: string;
  experience_years: number;
  rating: number;
  review_count: number;
  consultations_count: number;
  price_per_minute: number;
  currency: string;
  is_ai: boolean;
  ai_persona_id?: string;
  availability: 'online' | 'busy' | 'offline';
  languages: string[];
  specialties: string[];
  is_featured: boolean;
  is_verified: boolean;
  reviews?: Array<{
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
}

export interface ConsultationSession {
  id: string;
  user_id?: string;
  astrologer_id: string;
  chart_id?: string;
  language: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ConsultationMessage {
  id: string;
  consultation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  chart_svg?: string;
  is_demo_mode: boolean;
  tokens_used: number;
  created_at: string;
}

export interface BirthChartPayload {
  name: string;
  date_of_birth: string;
  time_of_birth: string;
  latitude: number;
  longitude: number;
  timezone_offset: number;
  city?: string;
  country?: string;
}
