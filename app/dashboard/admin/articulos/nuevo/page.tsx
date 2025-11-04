
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticuloForm } from "../articulo-form";
import { PackagePlus } from "lucide-react";

export default function NuevoArticuloPage() {

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <PackagePlus className="h-6 w-6" />
            Crear Nuevo Artículo
          </CardTitle>
          <CardDescription>
            Añada un nuevo artículo al catálogo maestro de inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArticuloForm />
        </CardContent>
      </Card>
    </div>
  );
}
