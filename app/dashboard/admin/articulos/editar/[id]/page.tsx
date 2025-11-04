
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticuloForm } from "../../articulo-form";
import { Pencil } from "lucide-react";
import { useDoc } from "@/firebase";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Articulo } from "../../articulos-table";

export default function EditarArticuloPage() {
  const params = useParams();
  const { id } = params;
  const { data: articulo, loading } = useDoc<Articulo>(id ? `catalogoArticulos/${id}` : '');

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Pencil className="h-6 w-6" />
            Editar Artículo del Catálogo
          </CardTitle>
          <CardDescription>
            Modifique la información del artículo seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : articulo ? (
            <ArticuloForm articuloId={id as string} initialValues={articulo} />
          ) : (
            <p>No se encontró el artículo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
