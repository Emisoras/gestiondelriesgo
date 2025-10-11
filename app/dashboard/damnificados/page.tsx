
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Users } from "lucide-react";
import Link from "next/link";

export default function DamnificadosPage() {
  const puedeRegistrar = true; // Assume true for now

  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Damnificados
        </h1>
        <p className="text-muted-foreground">
          Registre nuevos afectados o consulte la lista de personas registradas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {puedeRegistrar && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <ClipboardList className="h-6 w-6" />
                Registro de Damnificados
              </CardTitle>
              <CardDescription>
                Complete el formulario para registrar a una persona o familia afectada por la emergencia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                  <Link href="/dashboard/damnificados/registro">Ir al Formulario</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <Users className="h-6 w-6" />
                Listado de Damnificados
            </CardTitle>
            <CardDescription>
              Busque, filtre y visualice la información de todos los damnificados registrados en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/dashboard/damnificados/listado">Ver Listado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
