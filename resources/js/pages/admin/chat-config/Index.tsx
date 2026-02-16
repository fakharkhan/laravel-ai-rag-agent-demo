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
    has_openai_key?: boolean;
}

interface PageProps {
    chatConfig: ChatConfigRecord;
    useOrganizationKey: boolean;
    openAiModels: string[];
    routes?: { admin?: { chatConfig?: { update?: string } } };
    flash?: { success?: string; error?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Assistant settings', href: '#' },
];

export default function Index({ chatConfig, useOrganizationKey, openAiModels }: PageProps) {
    const { props } = usePage<PageProps>();
    const updateUrl = props.routes?.admin?.chatConfig?.update ?? '/admin/chat-config';

    const { data, setData, put, processing, errors } = useForm({
        system_prompt: chatConfig.system_prompt ?? '',
        provider: chatConfig.provider ?? 'openai',
        model: chatConfig.model ?? 'gpt-4o-mini',
        openai_api_key: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(updateUrl, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assistant settings" />
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
                        <CardTitle>Assistant settings</CardTitle>
                        <CardDescription>
                            Customize how your assistant responds. Set its instructions and choose the AI model it uses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="system_prompt">Instructions for your assistant</Label>
                                <textarea
                                    id="system_prompt"
                                    rows={12}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.system_prompt}
                                    onChange={(e) => setData('system_prompt', e.target.value)}
                                    placeholder="e.g. You are a helpful assistant. Answer only from the documents I've provided. Be concise and accurate."
                                />
                                {errors.system_prompt && (
                                    <p className="text-sm text-destructive">{errors.system_prompt}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_minmax(12rem,auto)] sm:items-end">
                                {useOrganizationKey ? (
                                    <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                                        Your account uses the organization OpenAI API key. No personal key is required.
                                    </p>
                                ) : (
                                    <div className="min-w-0 space-y-2">
                                        <Label htmlFor="openai_api_key">OpenAI API key</Label>
                                        <input
                                            id="openai_api_key"
                                            type="password"
                                            autoComplete="off"
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder={chatConfig.has_openai_key ? '••••••••••••••••' : 'sk-...'}
                                            value={data.openai_api_key}
                                            onChange={(e) => setData('openai_api_key', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {chatConfig.has_openai_key
                                                ? 'Leave blank to keep your current key. Enter a new key to replace it.'
                                                : 'Required for chat and document processing. Get a key from platform.openai.com.'}
                                        </p>
                                        {errors.openai_api_key && (
                                            <p className="text-sm text-destructive">{errors.openai_api_key}</p>
                                        )}
                                    </div>
                                )}
                                <div className="min-w-0 space-y-2 sm:min-w-[12rem]">
                                    <Label>AI model</Label>
                                    <Select
                                        value={data.model}
                                        onValueChange={(v) => setData('model', v)}
                                    >
                                        <SelectTrigger className="w-full">
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
                                    <p className="text-xs text-muted-foreground">
                                        Faster models cost less; smarter models give better answers.
                                    </p>
                                    {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
                                </div>
                            </div>
                            <Button type="submit" disabled={processing}>
                                Save settings
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
