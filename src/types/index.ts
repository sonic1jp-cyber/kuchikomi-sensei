// ===== データベース型定義 =====

export interface Clinic {
  id: string;
  user_id: string;
  name: string;
  google_place_id: string | null;
  google_maps_url: string | null;
  department: string;
  address: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  clinic_id: string;
  google_review_id: string | null;
  author_name: string;
  rating: number;
  text: string;
  published_at: string;
  reply_text: string | null;
  replied_at: string | null;
  is_flagged: boolean;
  created_at: string;
}

export interface AiReply {
  id: string;
  review_id: string;
  tone: 'formal' | 'friendly' | 'concise';
  content: string;
  guideline_warnings: string[];
  created_at: string;
}

export interface Feedback {
  id: string;
  clinic_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// ===== API レスポンス型 =====

export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  unrepliedCount: number;
  thisMonthCount: number;
  ratingDistribution: { rating: number; count: number }[];
  monthlyTrend: { month: string; count: number; avgRating: number }[];
}
