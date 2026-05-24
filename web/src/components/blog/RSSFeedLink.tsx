import Link from "next/link";

export default function RSSFeedLink() {
  return (
    <Link
      href="/blog/feed.xml"
      className="rss-feed-link"
      title="RSS Feed"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="6" cy="18" r="3" />
        <path d="M4 11a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 4a16 16 0 0 1 16 16" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      RSS
    </Link>
  );
}
