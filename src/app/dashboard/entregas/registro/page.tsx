import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntregaForm } from "../entrega-form";
import { Truck } from "lucide-react";

export default function EntregaRegistroPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Truck className="h-6 w-6" />
            Registro de Entrega de Ayuda
          </CardTitle>
          <CardDescription>
            Complete este formulario para registrar la entrega de ayuda a un receptor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EntregaForm />
        </CardContent>
      </Card>
    </div>
  );
}
