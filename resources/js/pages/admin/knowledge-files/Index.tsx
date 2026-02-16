import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FileText, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

interface KnowledgeFileRecord {
    id: number;
    name: string;
    path: string;
    status: string;
    error_message: string | null;
    chunks_count: number;
    created_at: string;
    updated_at: string;
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

interface Props {
    knowledgeFiles: KnowledgeFileRecord[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Your documents', href: '#' },
];

export default function Index({ knowledgeFiles }: Props) {
    const { routes } = usePage<SharedData>().props;
    const adminRoutes = (routes as any)?.admin?.knowledgeFiles;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, processing, errors } = useForm<{ files: File[] }>({
        files: [],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.files.length === 0 || !adminRoutes?.store) return;
        const formData = new FormData();
        data.files.forEach((file) => formData.append('files[]', file));
        router.post(adminRoutes.store, formData, { forceFormData: true });
        setData('files', []);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const destroy = (id: number) => {
        if (!adminRoutes?.destroyPath) return;
        router.delete(adminRoutes.destroyPath + id);
    };

    const reprocess = (id: number) => {
        if (!adminRoutes?.reprocessPath) return;
        router.post(adminRoutes.reprocessPath + id + '/reprocess');
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        const labels: Record<string, string> = {
            pending: 'In queue',
            processing: 'Preparing…',
            completed: 'Ready',
            failed: 'Error',
        };
        return (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-800'}`}>
                {labels[status] ?? status}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Your documents" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Add your documents</CardTitle>
                        <CardDescription>
                            Upload PDFs, text files, or spreadsheets. The assistant will learn from them to answer your questions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.md,.csv,.pdf"
                                multiple
                                className="hidden"
                                onChange={(e) =>
                                    setData(
                                        'files',
                                        e.target.files ? Array.from(e.target.files) : [],
                                    )
                                }
                            />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 size-4" />
                                Choose files
                            </Button>
                            {data.files.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    {data.files.length} file{data.files.length !== 1 ? 's' : ''} selected
                                    {data.files.length <= 3
                                        ? `: ${data.files.map((f) => f.name).join(', ')}`
                                        : ''}
                                </span>
                            )}
                            <Button type="submit" disabled={data.files.length === 0 || processing}>
                                {processing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                Add documents
                            </Button>
                            {(() => {
                                const fileErrorKey = Object.keys(errors).find((k) =>
                                    k.startsWith('files'),
                                );
                                return fileErrorKey ? (
                                    <p className="w-full text-sm text-destructive">
                                        {(errors as Record<string, string>)[fileErrorKey]}
                                    </p>
                                ) : null;
                            })()}
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your documents</CardTitle>
                        <CardDescription>Documents are prepared in the background. Use refresh to update a file if you've changed it.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {knowledgeFiles.length === 0 ? (
                            <p className="text-sm text-muted-foreground">You haven't added any documents yet. Upload a file above to get started.</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {knowledgeFiles.map((file) => (
                                    <li key={file.id} className="flex items-center justify-between py-3 first:pt-0">
                                        <div className="flex items-center gap-3">
                                            <FileText className="size-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {file.chunks_count} sections
                                                    {file.error_message && ` · ${file.error_message}`}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Added: {formatDateTime(file.created_at)}
                                                    {' · '}
                                                    Last updated: {formatDateTime(file.updated_at)}
                                                </p>
                                            </div>
                                            {statusBadge(file.status)}
                                        </div>
                                        <div className="flex gap-2">
                                            {(file.status === 'completed' || file.status === 'failed') && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => reprocess(file.id)}
                                                    title="Update document"
                                                >
                                                    <RefreshCw className="size-4" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => destroy(file.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
