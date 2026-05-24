import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "img"],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "loading", "width", "height"],
    a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
  },
};

let processor: ReturnType<typeof unified> | undefined;

function getProcessor() {
  if (!processor) {
    processor = unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: false })
      .use(rehypeSanitize, sanitizeSchema)
      .use(rehypeStringify) as unknown as ReturnType<typeof unified>;
  }
  return processor;
}

export async function renderMarkdown(markdown: string): Promise<string> {
  try {
    const result = await getProcessor().process(markdown);
    return String(result);
  } catch (err) {
    console.warn("[markdown] render error:", err);
    return "<p>Failed to render content</p>";
  }
}
