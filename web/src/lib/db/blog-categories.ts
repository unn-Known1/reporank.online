import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface BlogCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export async function listCategories(): Promise<BlogCategoryRow[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    console.warn("[db] listCategories:", error);
    return [];
  }
  return data || [];
}

export async function getCategoryById(id: string): Promise<BlogCategoryRow | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<BlogCategoryRow | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<BlogCategoryRow | null> {
  const supabase = supabaseAdmin();
  const { data: category, error } = await supabase
    .from("blog_categories")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn("[db] createCategory:", error);
    return null;
  }
  return category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) {
    console.warn("[db] deleteCategory:", error);
    return false;
  }
  return true;
}
