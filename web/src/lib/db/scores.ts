import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeScore } from "@reporank/core";
import type { ScoreFactors } from "@reporank/core";
import { mapRepoDataToFactors } from "@/lib/github/factors";

export async function computeAndStoreScore(repoId: string, rawRepo: any) {
  const factors = mapRepoDataToFactors(rawRepo);
  const scoreResult = computeScore(factors);

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("score_runs")
    .insert({
      repo_id: repoId,
      computed_at: new Date().toISOString(),
      total_score: Math.round(scoreResult.total),
      subscores_json: {
        maintenance: Math.round(scoreResult.subscores.maintenance),
        community: Math.round(scoreResult.subscores.community),
        security: Math.round(scoreResult.subscores.security),
        documentation: Math.round(scoreResult.subscores.documentation),
        adoption: Math.round(scoreResult.subscores.adoption),
      },
      factors_json: scoreResult.evidence,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestScore(repoId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("score_runs")
    .select("*")
    .eq("repo_id", repoId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[db] getLatestScore:", error);
    return null;
  }
  return data ?? null;
}