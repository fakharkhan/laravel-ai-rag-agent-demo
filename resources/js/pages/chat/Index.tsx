import { Head, router, usePage } from '@inertiajs/react';
import { Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChatMessageBody from '@/components/chat-message-body';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

const MEMORY_STORAGE_KEY = 'chat_memory_enabled';

function getStoredMemoryEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
    return stored === 'true';
}

function formatConversationDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Chat', href: '#' },
];

type Message = { role: 'user' | 'assistant'; content: string };

type Conversation = { id: string; title: string; updated_at: string };

type ChatPageProps = {
    conversations: Conversation[];
    currentConversationId: string | null;
    messages: Message[];
};

export default function ChatIndex() {
    const { props } = usePage<SharedData & ChatPageProps>();
    const { routes } = props;
    const streamUrl = (routes as { chat?: { stream?: string } })?.chat?.stream ?? '/chat/stream';
    const conversationsUrl = (routes as { chat?: { conversations?: string } })?.chat?.conversations ?? '/chat/conversations';
    const chatIndexUrl = (routes as { chat?: { index?: string } })?.chat?.index ?? '/chat';

    const conversations = props.conversations ?? [];
    const currentConversationId = props.currentConversationId ?? null;
    const initialMessages = props.messages ?? [];

    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [memoryEnabled, setMemoryEnabled] = useState(getStoredMemoryEnabled);
    const [chatList, setChatList] = useState<Conversation[]>(conversations);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(initialMessages);
    }, [currentConversationId, initialMessages]);

    useEffect(() => {
        setChatList(conversations);
    }, [conversations]);

    function setMemoryEnabledAndStore(value: boolean) {
        setMemoryEnabled(value);
        localStorage.setItem(MEMORY_STORAGE_KEY, String(value));
    }

    function selectConversation(id: string | null) {
        const url = id ? `${chatIndexUrl}?conversation=${id}` : chatIndexUrl;
        router.visit(url);
    }

    async function fetchConversationsAndSelectNewest() {
        try {
            const res = await fetch(conversationsUrl, { credentials: 'same-origin' });
            if (!res.ok) return;
            const data = (await res.json()) as { conversations?: Conversation[] };
            const list = data.conversations ?? [];
            setChatList(list);
            const newest = list[0];
            if (newest) {
                selectConversation(newest.id);
            }
        } catch {
            // ignore
        }
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || streaming) return;

        setInput('');
        setMessages((m) => [...m, { role: 'user', content: text }]);
        setStreaming(true);
        setStreamingContent('');

        const isNewChat = !currentConversationId && memoryEnabled;

        try {
            const csrf =
                document.cookie
                    .split('; ')
                    .find((r) => r.startsWith('XSRF-TOKEN='))
                    ?.split('=')[1]
                    ?.replace(/%3D/g, '=') ?? '';
            const body: { message: string; memory_enabled: boolean; conversation_id?: string } = {
                message: text,
                memory_enabled: memoryEnabled,
            };
            if (currentConversationId) {
                body.conversation_id = currentConversationId;
            }

            const res = await fetch(streamUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    'X-XSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                let message = res.statusText || 'Failed to stream';
                if (contentType?.includes('application/json')) {
                    try {
                        const data = await res.json();
                        message = (data as { error?: string }).error ?? message;
                    } catch {
                        // use statusText
                    }
                }
                setMessages((m) => [...m, { role: 'assistant', content: 'Error: ' + message }]);
                setStreaming(false);
                return;
            }
            if (!res.body) {
                setMessages((m) => [...m, { role: 'assistant', content: 'Error: No response body' }]);
                setStreaming(false);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let full = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed?.type === 'text-delta' && parsed.delta) {
                                full += parsed.delta;
                                setStreamingContent(full);
                            }
                        } catch {
                            // ignore parse errors
                        }
                    }
                }
            }

            setMessages((m) => [...m, { role: 'assistant', content: full || '(No response)' }]);

            if (isNewChat) {
                await fetchConversationsAndSelectNewest();
            }
        } catch (err) {
            setMessages((m) => [
                ...m,
                { role: 'assistant', content: 'Error: ' + (err instanceof Error ? err.message : 'Unknown error') },
            ]);
        } finally {
            setStreamingContent('');
            setStreaming(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat" />
            <div className="flex h-[calc(100vh-8rem)] flex-1 flex-col gap-4 p-4 md:flex-row">
                <aside className="flex w-full shrink-0 flex-col gap-2 border-r pr-4 md:w-64">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => selectConversation(null)}
                    >
                        <MessageSquarePlus className="size-4" />
                        New chat
                    </Button>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="flex flex-col gap-1">
                            {chatList.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => selectConversation(c.id)}
                                    className={`flex flex-col items-start rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                                        currentConversationId === c.id ? 'bg-accent font-medium' : ''
                                    }`}
                                >
                                    <span className="truncate w-full">{c.title}</span>
                                    <span className="text-xs text-muted-foreground">{formatConversationDate(c.updated_at)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
                <Card className="flex min-h-0 flex-1 flex-col">
                    <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                            <CardTitle>Chat assistant</CardTitle>
                            <CardDescription>
                                Ask anything. Answers are based on your documents when relevant.
                            </CardDescription>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Switch
                                id="chat-memory"
                                checked={memoryEnabled}
                                onCheckedChange={setMemoryEnabledAndStore}
                                aria-label="Save conversation (memory)"
                            />
                            <Label
                                htmlFor="chat-memory"
                                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Memory
                            </Label>
                        </div>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-md border bg-muted/30 p-4">
                            {messages.length === 0 && !streaming && (
                                <p className="text-center text-sm text-muted-foreground">Send a message to start.</p>
                            )}
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`rounded-lg px-3 py-2 ${
                                        msg.role === 'user'
                                            ? 'ml-auto max-w-[85%] bg-primary text-primary-foreground'
                                            : 'mr-auto max-w-[85%] bg-muted'
                                    }`}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                    ) : (
                                        <ChatMessageBody content={msg.content} />
                                    )}
                                </div>
                            ))}
                            {streaming && (
                                <div className="mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2">
                                    <ChatMessageBody content={streamingContent || '…'} />
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                        <form onSubmit={submit} className="mt-4 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message…"
                                className="flex flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={streaming}
                            />
                            <Button type="submit" disabled={streaming || !input.trim()}>
                                {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
