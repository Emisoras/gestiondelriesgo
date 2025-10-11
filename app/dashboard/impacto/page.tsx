import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImpactoForm } from "./impacto-form";
import { Sparkles } from "lucide-react";

export default function ImpactoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="h-6 w-6 text-primary" />
            Generador de Declaración de Impacto
          </CardTitle>
          <CardDescription>
            Utilice IA para generar una declaración de impacto estimada para un evento en particular. Ingrese los datos para crear un resumen convincente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImpactoForm />
        </CardContent>
      </Card>
    </div>
  );
}
