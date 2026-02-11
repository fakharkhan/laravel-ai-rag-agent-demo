import { Link, usePage } from '@inertiajs/react';
import { BookOpen, LayoutGrid, MessageSquare, Settings, Upload } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'fakharkhan.com',
        href: 'https://fakharkhan.com',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { props } = usePage<{ routes?: { admin?: { knowledgeFiles?: { index?: string }; chatConfig?: { index?: string } }; chat?: { index?: string } } }>();
    const routes = props.routes;
    const mainNavItems: NavItem[] = [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    ];
    if (routes?.admin?.knowledgeFiles?.index) {
        mainNavItems.push({ title: 'Knowledge files', href: routes.admin.knowledgeFiles.index, icon: Upload });
    }
    if (routes?.admin?.chatConfig?.index) {
        mainNavItems.push({ title: 'Chat config', href: routes.admin.chatConfig.index, icon: Settings });
    }
    if (routes?.chat?.index) {
        mainNavItems.push({ title: 'Chat', href: routes.chat.index, icon: MessageSquare });
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
