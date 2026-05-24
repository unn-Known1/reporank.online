interface BlogPostContentProps {
  html: string;
}

export default function BlogPostContent({ html }: BlogPostContentProps) {
  return (
    <div
      className="blog-post-body-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
