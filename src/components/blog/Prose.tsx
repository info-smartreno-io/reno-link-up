import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

interface ProseProps {
  children: React.ReactNode;
}

export default function Prose({ children }: ProseProps) {
  // If children is a string, render as markdown
  if (typeof children === 'string') {
    return (
      <div className="prose prose-neutral lg:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-img:rounded-xl prose-pre:bg-muted prose-pre:border">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => {
              const href = props.href || "";
              if (href.startsWith("/")) {
                return <Link to={href} {...props} />;
              }
              return <a {...props} target="_blank" rel="noopener noreferrer" />;
            },
          }}
        >
          {children}
        </ReactMarkdown>
      </div>
    );
  }

  // Otherwise render as MDX component
  return (
    <div className="prose prose-neutral lg:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-img:rounded-xl prose-pre:bg-muted prose-pre:border">
      {children}
    </div>
  );
}

