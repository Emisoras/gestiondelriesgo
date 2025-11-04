
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventarioTable } from "./inventario-table";
import { Archive } from "lucide-react";

export default function InventarioPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Archive className="h-6 w-6" />
          Inventario de Donaciones
        </CardTitle>
        <CardDescription>
          Stock actual de todos los artículos recibidos en donación. El inventario se actualiza automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InventarioTable />
      </CardContent>
    </Card>
  );
}

    