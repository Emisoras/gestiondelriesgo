
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <SidebarProvider>
        <div className="flex">
          <SidebarNav />
          <div className="flex-1 flex flex-col min-h-screen">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
              <SidebarTrigger className="md:hidden" />
              <div />
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 overflow-y-auto">
              {children}
            </main>
            <footer className="py-4 px-6 mt-auto">
              <p className="text-xs text-muted-foreground text-center">
                Copyright © 2025. Todos los derechos reservados. Diseñado por C & J Soluciones en Ingeniería.
              </p>
            </footer>
          </div>
        </div>
      </SidebarProvider>
  );
}
