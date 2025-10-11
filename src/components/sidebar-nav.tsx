
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, ClipboardList, HeartHandshake, Box, Truck, Sparkles, User, LogOut, Loader2, LogIn, Users } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useUser } from "@/firebase";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/icons/logo";


export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { user, userProfile, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      router.push('/login');
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };


  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { 
      href: "/dashboard/damnificados", 
      icon: ClipboardList, 
      label: "Damnificados",
      subItems: [
          { href: "/dashboard/damnificados/registro", label: "Registrar" },
          { href: "/dashboard/damnificados/listado", label: "Listado" },
      ]
    },
    { 
      href: "/dashboard/voluntarios", 
      icon: HeartHandshake, 
      label: "Voluntarios",
      subItems: [
          { href: "/dashboard/voluntarios/registro", label: "Registrar" },
          { href: "/dashboard/voluntarios/listado", label: "Listado" },
      ]
    },
    { 
      href: "/dashboard/donaciones", 
      icon: Box, 
      label: "Donaciones",
      subItems: [
        { href: "/dashboard/donaciones/registro", label: "Registrar" },
        { href: "/dashboard/donaciones/listado", label: "Listado" },
      ]
    },
    { 
      href: "/dashboard/entregas", 
      icon: Truck, 
      label: "Entregas",
      subItems: [
        { href: "/dashboard/entregas/registro", label: "Registrar" },
        { href: "/dashboard/entregas/listado", label: "Listado" },
      ]
    },
    { href: "/dashboard/perfil", icon: User, label: "Mi Perfil" },
    { href: "/dashboard/impacto", icon: Sparkles, label: "Generador de Impacto" },
  ];

  const adminNavItems = [
    { 
        href: "/dashboard/admin/users", 
        icon: Users, 
        label: "Adm. Usuarios",
    }
  ];

  const isSubItemActive = (subItems: any[] | undefined) => {
    if (!subItems) return false;
    return subItems.some(item => pathname.startsWith(item.href));
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderNavItems = (items: typeof navItems) => {
    return items.map((item) => {
        const validSubItems = item.subItems?.filter(si => si.href);
        
        if (item.subItems && validSubItems && validSubItems.length === 0) {
            if (item.href === pathname) {
            return (
            <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton asChild isActive={true} tooltip={item.label}>
                            <div>
                                <item.icon />
                                <span>{item.label}</span>
                            </div>
                        </SidebarMenuButton>
                    </Link>
            </SidebarMenuItem>
            )
            }
            return null;
        }

        return (
        <Collapsible.Root asChild key={item.href} defaultOpen={pathname.startsWith(item.href) && item.href !== '/dashboard'}>
        <SidebarMenuItem>
            <Link href={item.href} passHref>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && !item.subItems && item.href !== '/dashboard') || (isSubItemActive(item.subItems))}
                    tooltip={item.label}
                >
                    <div>
                        <item.icon />
                        <span>{item.label}</span>
                    </div>
                </SidebarMenuButton>
            </Link>
            {validSubItems && validSubItems.length > 0 && open && (
            <Collapsible.Content>
                <SidebarMenuSub>
                    {validSubItems.map(subItem => (
                        <SidebarMenuSubItem key={subItem.href}>
                            <Link href={subItem.href} passHref>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                    <span>{subItem.label}</span>
                                </SidebarMenuSubButton>
                            </Link>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            </Collapsible.Content>
            )}
        </SidebarMenuItem>
        </Collapsible.Root>
    )}
    )};

  return (
    <Sidebar>
      <div className="flex flex-col h-full">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 p-2">
              <Logo className="w-8 h-8 text-sidebar-primary" />
              <span className="text-xl font-semibold text-sidebar-foreground font-headline">ResQ Hub</span>
          </div>
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent>
            <SidebarMenu>
              <SidebarGroup>
                {renderNavItems(navItems)}
              </SidebarGroup>
                {userProfile?.role === 'administrador' && (
                  <SidebarGroup>
                    <Collapsible.Root asChild defaultOpen={pathname.startsWith('/dashboard/admin')}>
                        <div>
                           <Collapsible.Trigger asChild>
                             <SidebarMenuButton
                                className="!h-auto !p-0"
                                variant="ghost"
                                isActive={pathname.startsWith('/dashboard/admin')}
                              >
                               <span className="text-xs font-normal text-muted-foreground p-2">Administración</span>
                            </SidebarMenuButton>
                          </Collapsible.Trigger>
                          <Collapsible.Content>
                            <div className="group-data-[collapsible=icon]:hidden">
                              {renderNavItems(adminNavItems)}
                            </div>
                          </Collapsible.Content>
                        </div>
                    </Collapsible.Root>
                  </SidebarGroup>
                )}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
        <SidebarFooter className="p-2 border-t border-sidebar-border flex flex-col gap-2">
            {loading ? (
                <div className="flex items-center gap-2 p-2">
                    <Loader2 className="w-6 h-6 animate-spin text-sidebar-primary"/>
                    <span className="text-sm text-sidebar-foreground">Cargando...</span>
                </div>
            ) : user ? (
                <>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userProfile?.photoURL ?? undefined} alt={userProfile?.displayName ?? "User"}/>
                            <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-sm overflow-hidden">
                            <p className="font-semibold text-sidebar-foreground truncate">{userProfile?.displayName}</p>
                            <p className="text-xs text-sidebar-foreground/70 truncate">{userProfile?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </Button>
                </>
            ) : (
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => router.push('/login')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Iniciar Sesión</span>
                </Button>
            )}
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
