
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, List } from "lucide-react";
import Link from "next/link";

export default function DonacionesPage() {
  const puedeRegistrar = true; // Assume true for now

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Donaciones
        </h1>
        <p className="text-muted-foreground">
          Registre nuevas donaciones o consulte la lista de donaciones recibidas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {puedeRegistrar && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Box className="h-6 w-6" />
                Registro de Donaciones
              </CardTitle>
              <CardDescription>
                Utilice este formulario para registrar nuevas donaciones de artículos o monetarias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                  <Link href="/dashboard/donaciones/registro">Ir al Formulario</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <List className="h-6 w-6" />
                Listado de Donaciones
            </CardTitle>
            <CardDescription>
              Visualice, busque y filtre todas las donaciones registradas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/dashboard/donaciones/listado">Ver Listado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
