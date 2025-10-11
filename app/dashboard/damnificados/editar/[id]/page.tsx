
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DamnificadoForm } from "../../damnificado-form";
import { Pencil } from "lucide-react";
import { useDoc } from "@/firebase";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DamnificadoEditarPage() {
  const params = useParams();
  const { id } = params;
  const { data: damnificado, loading } = useDoc(id ? `damnificados/${id}` : '');

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Pencil className="h-6 w-6" />
            Editar Registro de Damnificado
          </CardTitle>
          <CardDescription>
            Modifique la información del damnificado seleccionado.
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
          ) : damnificado ? (
            <DamnificadoForm damnificadoId={id as string} initialValues={damnificado} />
          ) : (
            <p>No se encontró el registro del damnificado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

