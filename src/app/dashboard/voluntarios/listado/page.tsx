import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoluntariosTable } from "../voluntarios-table";

export default function VoluntariosListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Voluntarios Registrados</CardTitle>
        <CardDescription>
          Busca y visualiza los voluntarios registrados en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VoluntariosTable />
      </CardContent>
    </Card>
  );
}
