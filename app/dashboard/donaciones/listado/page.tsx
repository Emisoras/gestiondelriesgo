import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonacionesTable } from "../donaciones-table";

export default function DonacionesListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Donaciones Recibidas</CardTitle>
        <CardDescription>
          Listado de todas las donaciones registradas en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DonacionesTable />
      </CardContent>
    </Card>
  );
}
