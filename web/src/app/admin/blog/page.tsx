import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/blog/admin";
import BlogAdminPage from "@/components/admin/BlogAdminPage";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const user = await getUser();

  if (!user || !isAdminEmail(user)) {
    redirect("/");
  }

  return <BlogAdminPage />;
}
