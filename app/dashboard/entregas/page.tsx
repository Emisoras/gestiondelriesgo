
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, List } from "lucide-react";
import Link from "next/link";

export default function EntregasPage() {
  const puedeRegistrar = true; // Assume true for now

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Entregas
        </h1>
        <p className="text-muted-foreground">
          Registre nuevas entregas de ayuda o consulte el historial de entregas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {puedeRegistrar && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Truck className="h-6 w-6" />
                Registro de Entregas
              </CardTitle>
              <CardDescription>
                Utilice este formulario para registrar la entrega de ayuda a un damnificado o albergue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                  <Link href="/dashboard/entregas/registro">Ir al Formulario</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <List className="h-6 w-6" />
                Historial de Entregas
            </CardTitle>
            <CardDescription>
              Visualice, busque y filtre todas las entregas de ayuda realizadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/dashboard/entregas/listado">Ver Historial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
