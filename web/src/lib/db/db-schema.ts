export type WatchlistItemRow = {
  id: string;
  user_id: string;
  repo_id: string;
  added_at: string;
  last_viewed_at: string | null;
};

export type DashboardItem = {
  id: string;
  repo_id: string;
  owner: string;
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  total_score: number | null;
  score_delta: number | null;
  delta_direction: "up" | "down" | "flat" | null;
  added_at: string;
  last_viewed_at: string | null;
};

export type TrendingEntry = {
  repo_id: string;
  full_name: string;
  owner: string;
  name: string;
  language: string | null;
  stars: number;
  total_score: number;
  score_velocity: number;
  computed_at: string;
  generated_at: string;
};
