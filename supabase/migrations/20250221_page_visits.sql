-- ============================================================
-- Live Community Insights: page_visits table + RPC functions
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS page_visits (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at  timestamptz NOT NULL    DEFAULT now(),
  country_code text                    -- 2-letter ISO, nullable (no PII)
);

-- 2. RLS
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (visitors recording page hits)
CREATE POLICY "anon_insert_page_visits"
  ON page_visits FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous selects (frontend reads aggregates)
CREATE POLICY "anon_select_page_visits"
  ON page_visits FOR SELECT
  TO anon
  USING (true);

-- No UPDATE / DELETE policies → denied by default (tamper-proof)

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at
  ON page_visits (visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_visits_country_recent
  ON page_visits (visited_at DESC, country_code);

-- 4. RPC: monthly visit count
CREATE OR REPLACE FUNCTION get_monthly_visit_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT count(*)
  FROM page_visits
  WHERE visited_at >= date_trunc('month', now());
$$;

-- 5. RPC: top countries in the last N hours
CREATE OR REPLACE FUNCTION get_top_countries(
  hours_ago    int DEFAULT 24,
  result_limit int DEFAULT 5
)
RETURNS TABLE(country_code text, visit_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT pv.country_code, count(*) AS visit_count
  FROM page_visits pv
  WHERE pv.visited_at >= now() - make_interval(hours => hours_ago)
    AND pv.country_code IS NOT NULL
  GROUP BY pv.country_code
  ORDER BY visit_count DESC
  LIMIT result_limit;
$$;
