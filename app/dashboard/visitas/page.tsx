
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, List } from "lucide-react";
import Link from "next/link";

export default function VisitasPage() {

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Visitas Técnicas y Emergencias
        </h1>
        <p className="text-muted-foreground">
          Registre nuevas visitas o consulte el historial de actas generadas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Siren className="h-6 w-6" />
              Registrar Visita Técnica
            </CardTitle>
            <CardDescription>
              Genere una nueva acta de visita técnica o de atención de emergencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/dashboard/visitas/registro">Ir al Formulario</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <List className="h-6 w-6" />
                Historial de Visitas
            </CardTitle>
            <CardDescription>
              Consulte, edite y exporte todas las actas de visita registradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/dashboard/visitas/listado">Ver Historial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
