
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitaForm } from "../visita-form";
import { Siren } from "lucide-react";

export default function VisitaRegistroPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Siren className="h-6 w-6" />
            Registro de Visita Técnica / Emergencia
          </CardTitle>
          <CardDescription>
            Complete este formulario para generar el acta de visita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VisitaForm />
        </CardContent>
      </Card>
    </div>
  );
}
