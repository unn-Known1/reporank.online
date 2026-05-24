import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import BlogAdminPage from "@/components/admin/BlogAdminPage";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const user = await getUser();

  if (!user) {
    redirect("/");

  }

  return <BlogAdminPage />;
}
