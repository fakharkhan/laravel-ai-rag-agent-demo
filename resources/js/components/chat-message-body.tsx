import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface ChatMessageBodyProps {
    content: string;
    className?: string;
}

export default function ChatMessageBody({ content, className }: ChatMessageBodyProps) {
    return (
        <div className={cn('chat-message-body text-sm', className)}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    ul: ({ children }) => <ul className="my-2 list-disc space-y-0.5 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-0.5 pl-5">{children}</ol>,
    li: ({ children }) => <li className="pl-0.5">{children}</li>,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/90 dark:text-primary dark:hover:text-primary/90"
        >
            {children}
        </a>
    ),
    code: ({ className, children }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return (
                <pre className="my-2 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
                    <code>{children}</code>
                </pre>
            );
        }
        return (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>
        );
    },
    pre: ({ children }) => <>{children}</>,
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground">
            {children}
        </blockquote>
    ),
    h1: ({ children }) => <h1 className="mb-1 mt-2 text-base font-semibold">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-1 mt-2 text-sm font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>,
    table: ({ children }) => (
        <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border/50">{children}</tr>,
    th: ({ children }) => (
        <th className="px-2 py-1 text-left font-medium">{children}</th>
    ),
    td: ({ children }) => <td className="px-2 py-1">{children}</td>,
};
