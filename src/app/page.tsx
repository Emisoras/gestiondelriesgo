
"use client";

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Users, Gift, LogIn, HeartHandshake } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons/logo';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-volunteers') ?? {
    imageUrl: 'https://picsum.photos/seed/1/1200/800',
    imageHint: 'volunteers helping community'
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Logo className="h-18 w-18 text-primary" />
          <span className="text-lg font-bold font-headline">ResQ Hub</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "flex items-center gap-2")}>
              <LogIn className="h-4 w-4" />
              Iniciar Sesión
            </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <Image
            src={heroImage.imageUrl}
            alt="Fondo de Voluntarios"
            fill
            style={{objectFit: "cover"}}
            className="z-0 opacity-20"
            data-ai-hint={heroImage.imageHint}
          />
          <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-foreground">
                Coordinación de Ayuda en Tiempos de Crisis
              </h1>
              <p className="mt-4 text-muted-foreground md:text-xl">
                ResQ Hub centraliza el registro de afectados, voluntarios y donaciones para una respuesta a desastres más eficiente y humana.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/dashboard">Acceder al Dashboard</Link>
                </Button>
                 <Button asChild size="lg" variant="secondary">
                  <Link href="/registro-voluntarios">Conviértete en Voluntario</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter text-center font-headline">Funcionalidades Clave</h2>
            <p className="max-w-2xl mx-auto mt-4 text-center text-muted-foreground">
              Herramientas diseñadas para optimizar cada fase de la gestión de ayuda humanitaria.
            </p>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center">
                <Users className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Registro de Afectados</h3>
                <p className="text-sm text-muted-foreground">
                  Un formulario unificado para registrar de manera rápida y precisa a las personas que necesitan ayuda.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <HeartHandshake className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Gestión de Voluntarios</h3>
                <p className="text-sm text-muted-foreground">
                  Inscribe y organiza voluntarios eficientemente, asignándolos a los grupos de apoyo donde más se necesitan.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Gift className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Seguimiento de Donaciones</h3>
                <p className="text-sm text-muted-foreground">
                  Registra y monitorea todas las donaciones recibidas para garantizar su correcta distribución.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Copyright © 2025. Todos los derechos reservados. Diseñado por C & J Soluciones en Ingeniería.
        </p>
      </footer>
    </div>
  );
}
