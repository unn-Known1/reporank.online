import { Feed } from "feed";
import { listBlogPosts } from "@/lib/blog/service";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export async function GET() {
  const { posts } = await listBlogPosts({
    page: 1,
    limit: 50,
    includeDrafts: false,
    type: "user",
  });

  const feed = new Feed({
    title: "RepoRank Community",
    description: "Community posts about GitHub repositories",
    id: `${BASE_URL}/blog/community`,
    link: `${BASE_URL}/blog/community`,
    language: "en",
    updated: posts.length > 0 && posts[0].published_at
      ? new Date(posts[0].published_at)
      : new Date(),
    generator: "RepoRank",
    copyright: `All rights reserved ${new Date().getFullYear()}, RepoRank`,
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${BASE_URL}/blog/${post.slug}`,
      link: `${BASE_URL}/blog/${post.slug}`,
      description: post.excerpt ?? "",
      content: post.excerpt ?? "",
      date: post.published_at ? new Date(post.published_at) : new Date(),
      author: post.author?.name
        ? [{ name: post.author.name }]
        : [],
    });
  }

  const xml = feed.rss2();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
