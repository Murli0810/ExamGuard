"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, AlertTriangle, GitCommit, FileText, Inbox } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Threats", url: "/threats", icon: AlertTriangle },
  { title: "Memory Log", url: "/memory", icon: GitCommit },
  { title: "Reports", url: "/reports/USER_999_1e54dc", icon: FileText },
  { title: "Review Queue", url: "/review", icon: Inbox },
];

const agents = [
  { name: "Supervisor", state: "ok" },
  { name: "Auditor", state: "warn" },
  { name: "Evaluator", state: "ok" },
  { name: "Memory Mgr", state: "ok" },
  { name: "Reporter", state: "ok" },
];

function dotClass(state: string) {
  if (state === "warn") return "bg-warning glow-amber";
  if (state === "err") return "bg-destructive glow-red";
  return "bg-primary glow-green";
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  
  const isActive = (url: string) => 
    pathname === url || (pathname.startsWith(url.split("/").slice(0, 2).join("/") + "/") && url !== "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/40">
            <Shield className="h-4 w-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary glow-green animate-pulse" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">ExamGuard</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">SOC v2.4</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] tracking-widest">OPERATIONS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="p-2 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Pipeline Status</div>
            <div className="space-y-1.5">
              {agents.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-foreground/80">{a.name}</span>
                  <span className={`h-2 w-2 rounded-full ${dotClass(a.state)}`} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-2">
            {agents.map((a, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${dotClass(a.state)}`} />
            ))}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}