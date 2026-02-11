import { Head, usePage } from '@inertiajs/react';
import { Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Chat', href: '#' },
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function ChatIndex() {
    const { routes } = usePage<SharedData>().props;
    const streamUrl = (routes as { chat?: { stream?: string } })?.chat?.stream ?? '/chat/stream';
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [memoryEnabled, setMemoryEnabled] = useState(getStoredMemoryEnabled);
    const bottomRef = useRef<HTMLDivElement>(null);

    function setMemoryEnabledAndStore(value: boolean) {
        setMemoryEnabled(value);
        localStorage.setItem(MEMORY_STORAGE_KEY, String(value));
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || streaming) return;

        setInput('');
        setMessages((m) => [...m, { role: 'user', content: text }]);
        setStreaming(true);
        setStreamingContent('');

        try {
            const csrf =
                document.cookie
                    .split('; ')
                    .find((r) => r.startsWith('XSRF-TOKEN='))
                    ?.split('=')[1]
                    ?.replace(/%3D/g, '=') ?? '';
            const res = await fetch(streamUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    'X-XSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ message: text, memory_enabled: memoryEnabled }),
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
        } catch (err) {
            setMessages((m) => [...m, { role: 'assistant', content: 'Error: ' + (err instanceof Error ? err.message : 'Unknown error') }]);
        } finally {
            setStreamingContent('');
            setStreaming(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat" />
            <div className="flex h-[calc(100vh-8rem)] flex-1 flex-col gap-4 p-4">
                <Card className="flex min-h-0 flex-1 flex-col">
                    <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                            <CardTitle>Chat assistant</CardTitle>
                            <CardDescription>
                                Ask questions. Answers use your uploaded knowledge base when relevant.
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
