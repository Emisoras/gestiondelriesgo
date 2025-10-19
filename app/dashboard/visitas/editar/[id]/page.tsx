
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitaForm } from "../../visita-form";
import { Pencil } from "lucide-react";
import { useDoc } from "@/firebase";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function VisitaEditarPage() {
  const params = useParams();
  const { id } = params;
  const { data: visita, loading } = useDoc(id ? `visitas/${id}` : '');

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Pencil className="h-6 w-6" />
            Editar Acta de Visita Técnica
          </CardTitle>
          <CardDescription>
            Modifique la información del acta de visita seleccionada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          ) : visita ? (
            <VisitaForm visitaId={id as string} initialValues={visita} />
          ) : (
            <p>No se encontró el registro del acta de visita.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
