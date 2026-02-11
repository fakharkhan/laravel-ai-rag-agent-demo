import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ChatConfigRecord {
    id: number;
    system_prompt: string | null;
    provider: string;
    model: string | null;
}

interface PageProps {
    chatConfig: ChatConfigRecord;
    openAiModels: string[];
    routes?: { admin?: { chatConfig?: { update?: string } } };
    flash?: { success?: string; error?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Chat configuration', href: '#' },
];

export default function Index({ chatConfig, openAiModels }: PageProps) {
    const { props } = usePage<PageProps>();
    const updateUrl = props.routes?.admin?.chatConfig?.update ?? '/admin/chat-config';

    const { data, setData, put, processing, errors } = useForm({
        system_prompt: chatConfig.system_prompt ?? '',
        provider: chatConfig.provider ?? 'openai',
        model: chatConfig.model ?? 'gpt-4o-mini',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(updateUrl, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat configuration" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                {props.flash?.success && (
                    <p className="rounded-md bg-green-500/10 px-4 py-2 text-sm text-green-600 dark:text-green-400" role="alert">
                        {props.flash.success}
                    </p>
                )}
                {props.flash?.error && (
                    <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive" role="alert">
                        {props.flash.error}
                    </p>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Chatbot settings</CardTitle>
                        <CardDescription>
                            Configure the system prompt and model for the chat assistant. OpenAI is used for embeddings and chat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="system_prompt">System prompt</Label>
                                <textarea
                                    id="system_prompt"
                                    rows={6}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.system_prompt}
                                    onChange={(e) => setData('system_prompt', e.target.value)}
                                    placeholder="e.g. You are a helpful assistant for Fakhar Khan and SoftPyramid. Answer only from the provided context. See docs/chat-agent-system-prompt.md for examples."
                                />
                                {errors.system_prompt && (
                                    <p className="text-sm text-destructive">{errors.system_prompt}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Model</Label>
                                <Select
                                    value={data.model}
                                    onValueChange={(v) => setData('model', v)}
                                >
                                    <SelectTrigger className="w-full max-w-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {openAiModels.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
                            </div>
                            <Button type="submit" disabled={processing}>
                                Save configuration
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
