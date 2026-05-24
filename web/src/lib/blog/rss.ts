import { Feed } from "feed";
import { listBlogPosts } from "@/lib/blog/service";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export async function generateRssFeed(): Promise<string> {
  const { posts } = await listBlogPosts({
    page: 1,
    limit: 50,
    includeDrafts: false,
  });

  const feed = new Feed({
    title: "RepoRank Blog",
    description: "Insights and analysis about GitHub repositories",
    id: `${BASE_URL}/blog`,
    link: `${BASE_URL}/blog`,
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

  return feed.rss2();
}
