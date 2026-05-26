import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface BlogPostRepoRow {
  id: string;
  post_id: string;
  repo_owner: string;
  repo_name: string;
  display_order: number;
  created_at: string;
}

export async function getReposByPostId(postId: string): Promise<{ owner: string; name: string }[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("blog_post_repos")
    .select("repo_owner, repo_name")
    .eq("post_id", postId)
    .order("display_order", { ascending: true });
  if (error) {
    console.warn("[db] getReposByPostId:", error);
    return [];
  }
  return (data || []).map(r => ({ owner: r.repo_owner, name: r.repo_name }));
}

export async function setReposForPost(
  postId: string,
  repos: { owner: string; name: string }[]
): Promise<boolean> {
  const supabase = supabaseAdmin();

  const { error: deleteError } = await supabase
    .from("blog_post_repos")
    .delete()
    .eq("post_id", postId);
  if (deleteError) {
    console.warn("[db] setReposForPost delete:", deleteError);
    return false;
  }

  if (repos.length === 0) return true;

  const rows = repos.map((r, i) => ({
    post_id: postId,
    repo_owner: r.owner,
    repo_name: r.name,
    display_order: i,
  }));

  const { error: insertError } = await supabase
    .from("blog_post_repos")
    .insert(rows);
  if (insertError) {
    console.warn("[db] setReposForPost insert:", insertError);
    return false;
  }

  return true;
}
