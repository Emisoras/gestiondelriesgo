
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonacionForm } from "../../donacion-form";
import { Pencil } from "lucide-react";
import { useDoc } from "@/firebase";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DonacionEditarPage() {
  const params = useParams();
  const { id } = params;
  const { data: donacion, loading } = useDoc(id ? `donaciones/${id}` : '');

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Pencil className="h-6 w-6" />
            Editar Donación
          </CardTitle>
          <CardDescription>
            Modifique la información de la donación seleccionada.
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
          ) : donacion ? (
            <DonacionForm donacionId={id as string} initialValues={donacion} />
          ) : (
            <p>No se encontró el registro de la donación.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    