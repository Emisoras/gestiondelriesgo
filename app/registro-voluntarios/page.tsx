import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoluntarioForm } from "@/app/dashboard/voluntarios/voluntario-form";
import { HeartHandshake } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function PublicVoluntarioRegistroPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background shadow-sm">
            <Link href="/" className="flex items-center justify-center gap-2">
            <Logo className="h-18 w-18 text-primary" />
            <span className="text-lg font-bold font-headline">ResQ Hub</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
                <Button asChild variant="outline">
                    <Link href="/login" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Iniciar Sesión
                    </Link>
                </Button>
            </nav>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full mx-auto">
            <Card>
              <CardHeader className="text-center">
                <HeartHandshake className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="mt-4 font-headline text-2xl">
                  Registro de Voluntarios
                </CardTitle>
                <CardDescription>
                  Gracias por tu interés en ayudar. Completa el formulario para unirte a nuestros equipos de apoyo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoluntarioForm />
              </CardContent>
            </Card>
        </div>
      </main>
      <footer className="py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground text-center">
          Copyright © 2025. Todos los derechos reservados. Diseñado por C & J Soluciones en Ingeniería.
        </p>
      </footer>
    </div>
  );
}