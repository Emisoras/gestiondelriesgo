
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitasTable } from "../visitas-table";

export default function VisitasListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Historial de Visitas Técnicas</CardTitle>
        <CardDescription>
          Listado de todas las actas de visita y emergencia generadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VisitasTable />
      </CardContent>
    </Card>
  );
}
