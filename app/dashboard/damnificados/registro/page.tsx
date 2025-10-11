import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DamnificadoForm } from "../damnificado-form";
import { ClipboardList } from "lucide-react";

export default function DamnificadosRegistroPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <ClipboardList className="h-6 w-6" />
            Registro de Damnificados
          </CardTitle>
          <CardDescription>
            Complete este formulario para registrar a una persona o familia afectada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DamnificadoForm />
        </CardContent>
      </Card>
    </div>
  );
}
