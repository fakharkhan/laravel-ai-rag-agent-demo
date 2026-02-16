import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, MessageSquare, Settings, Upload } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardStats {
    knowledge_files_total: number;
    knowledge_files_ready: number;
    chat_model: string | null;
}

interface DashboardProps {
    stats: DashboardStats;
}

export default function Dashboard({ stats }: DashboardProps) {
    const { routes } = usePage<SharedData>().props;
    const chatIndex = (routes as { chat?: { index?: string } })?.chat?.index;
    const knowledgeFilesIndex = (routes as { admin?: { knowledgeFiles?: { index?: string } } })?.admin?.knowledgeFiles?.index;
    const chatConfigIndex = (routes as { admin?: { chatConfig?: { index?: string } } })?.admin?.chatConfig?.index;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Your workspace at a glance. Add documents, customize your assistant, and start chatting.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Your documents</CardTitle>
                            <Upload className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.knowledge_files_total}</div>
                            <p className="text-muted-foreground text-xs">
                                {stats.knowledge_files_ready} ready to use
                            </p>
                            {knowledgeFilesIndex && (
                                <Button variant="link" className="mt-2 h-auto p-0 text-xs" asChild>
                                    <Link href={knowledgeFilesIndex}>Manage documents</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assistant settings</CardTitle>
                            <MessageSquare className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.chat_model || 'Not set'}
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Personality and AI model
                            </p>
                            {chatConfigIndex && (
                                <Button variant="link" className="mt-2 h-auto p-0 text-xs" asChild>
                                    <Link href={chatConfigIndex}>Customize</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Chat</CardTitle>
                            <MessageSquare className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Ask questions and get answers from your documents.
                            </p>
                            {chatIndex && (
                                <Button className="mt-2" asChild>
                                    <Link href={chatIndex}>Open Chat</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="size-5" />
                            Get started
                        </CardTitle>
                        <CardDescription>
                            Set up your assistant in three simple steps.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="list-decimal space-y-3 pl-5 text-sm">
                            <li>
                                <span className="font-medium">Add your documents</span> — Upload PDFs, Word docs, or text files so the assistant can answer from your content.
                            </li>
                            <li>
                                <span className="font-medium">Customize your assistant</span> — Set how it should behave and choose the AI model in Assistant settings.
                            </li>
                            <li>
                                <span className="font-medium">Start asking questions</span> — Go to Chat and ask anything; answers are based on your documents when relevant.
                            </li>
                        </ol>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {knowledgeFilesIndex && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={knowledgeFilesIndex}>
                                        <Upload className="mr-2 size-4" />
                                        Your documents
                                    </Link>
                                </Button>
                            )}
                            {chatConfigIndex && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={chatConfigIndex}>
                                        <Settings className="mr-2 size-4" />
                                        Assistant settings
                                    </Link>
                                </Button>
                            )}
                            {chatIndex && (
                                <Button size="sm" asChild>
                                    <Link href={chatIndex}>
                                        <MessageSquare className="mr-2 size-4" />
                                        Open Chat
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
