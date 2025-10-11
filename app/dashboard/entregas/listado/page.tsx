import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntregasTable } from "../entregas-table";

export default function EntregasListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Historial de Entregas</CardTitle>
        <CardDescription>
          Listado de todas las entregas de ayuda realizadas y registradas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EntregasTable />
      </CardContent>
    </Card>
  );
}
