import { Head, Link, usePage } from '@inertiajs/react';
import { MessageSquare, BookOpen, Settings, Sparkles, MessageSquarePlus } from 'lucide-react';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="AI Chat Assistant – Answers from your documents">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                        <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                            <MessageSquare className="size-6 text-indigo-600 dark:text-indigo-400" />
                            Chat Assistant
                        </span>
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                        >
                                            Get started
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
                    <section className="text-center">
                        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            <Sparkles className="size-3.5" />
                            AI-powered
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
                            Get answers from
                            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                                {' '}your documents
                            </span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                            Add your files, customize how your assistant responds, and get instant answers based on your own content. Create multiple chats and pick up where you left off anytime.
                        </p>
                        {!auth.user && (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                                <Link
                                    href={register()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                >
                                    Get started free
                                </Link>
                                <Link
                                    href={login()}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    Log in
                                </Link>
                            </div>
                        )}
                    </section>

                    <section className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                                <BookOpen className="size-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Add your documents
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Upload PDFs, Word docs, or text files. The assistant learns from them so it can find and reference your content when answering.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                                <Settings className="size-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Customize your assistant
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Set how your assistant should behave and choose how capable you want it to be. Your preferences are private to you.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                                <MessageSquare className="size-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Ask and get answers
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Type any question and get instant answers. When relevant, the assistant uses your documents to respond.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                                <MessageSquarePlus className="size-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Multiple chats &amp; history
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Start new chats anytime, browse past conversations, and choose whether to remember context or start fresh.
                            </p>
                        </div>
                    </section>

                    <section className="mt-24 rounded-2xl border border-slate-200/80 bg-slate-800 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/80">
                        <h2 className="text-2xl font-bold text-white sm:text-3xl">
                            Ready to try it?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-slate-300">
                            Sign in or register to get your own workspace. Upload documents and start chatting.
                        </p>
                        {!auth.user && (
                            <div className="mt-6">
                                <Link
                                    href={register()}
                                    className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                                >
                                    Create account
                                </Link>
                            </div>
                        )}
                    </section>
                </main>

                <footer className="mt-24 border-t border-slate-200 py-8 dark:border-slate-800">
                    <div className="mx-auto max-w-5xl px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        <p>Chat Assistant · Secure · Private · Your data stays yours</p>
                        <p className="mt-2">
                            Powered by{' '}
                            <a
                                href="https://softpyramid.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                SOFT PYRAMID LLC
                            </a>
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
