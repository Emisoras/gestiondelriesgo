import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DamnificadosTable } from "../damnificados-table";

export default function DamnificadosListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Damnificados Registrados</CardTitle>
        <CardDescription>
          Busque y visualice los damnificados registrados en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DamnificadosTable />
      </CardContent>
    </Card>
  );
}
