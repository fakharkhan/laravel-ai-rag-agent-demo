import { Link } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import { dashboard } from '@/routes';

export default function AppLogo() {
    return (
        <Link href={dashboard()} className="flex items-center gap-2">
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white dark:bg-indigo-500">
                <MessageSquare className="size-5 shrink-0" />
            </div>
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
                Chat Assistant
            </span>
        </Link>
    );
}
