import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonacionForm } from "../donacion-form";
import { Box } from "lucide-react";

export default function DonacionRegistroPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Box className="h-6 w-6" />
            Registro de Donaciones
          </CardTitle>
          <CardDescription>
            Complete el formulario para registrar una nueva donación recibida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DonacionForm />
        </CardContent>
      </Card>
    </div>
  );
}
