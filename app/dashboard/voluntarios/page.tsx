import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartHandshake, List } from "lucide-react";
import Link from "next/link";

export default function VoluntariosPage() {
  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Voluntarios
        </h1>
        <p className="text-muted-foreground">
          Registre nuevos voluntarios o consulte la lista de personas registradas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <HeartHandshake className="h-6 w-6" />
              Registro de Voluntarios
            </CardTitle>
            <CardDescription>
              Complete el formulario para unirse como voluntario a las labores de apoyo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/dashboard/voluntarios/registro">Ir al Formulario</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <List className="h-6 w-6" />
                Listado de Voluntarios
            </CardTitle>
            <CardDescription>
              Busque, filtre y visualice la información de todos los voluntarios inscritos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/dashboard/voluntarios/listado">Ver Listado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
