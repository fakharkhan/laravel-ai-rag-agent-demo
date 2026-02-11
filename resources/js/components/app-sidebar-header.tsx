import { MessageSquare } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <SidebarTrigger className="-ml-1" />
            <span className="flex shrink-0 items-center gap-2 border-r border-sidebar-border/60 pr-3">
                <MessageSquare className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span className="truncate text-sm font-semibold text-sidebar-foreground">
                    Chat Assistant
                </span>
            </span>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
        </header>
    );
}
