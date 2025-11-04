
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useCollection } from "@/firebase";
import { ArticulosTable } from "./articulos-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Package, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { seedCatalogo } from "@/firebase/articulo-actions";
import { useToast } from "@/hooks/use-toast";

function SeedButton({ onSeeding, onFinished } : { onSeeding: (seeding: boolean) => void, onFinished: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSeed = async () => {
        setIsLoading(true);
        onSeeding(true);
        try {
            const result = await seedCatalogo();
            toast({
                title: "Catálogo Cargado",
                description: result.message,
                className: "bg-accent text-accent-foreground"
            });
            onFinished();
        } catch (error: any) {
            toast({
                title: "Error al Cargar",
                description: error.message || "No se pudo cargar el catálogo inicial.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            onSeeding(false);
        }
    };

    return (
        <Button onClick={handleSeed} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isLoading ? 'Cargando...' : 'Cargar Catálogo Inicial Sugerido'}
        </Button>
    );
}

export default function AdminArticulosPage() {
    const { userProfile, loading: userLoading } = useUser();
    const { data: articulos, loading: articulosLoading, forceRefetch } = useCollection('catalogoArticulos');
    const [isSeeding, setIsSeeding] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!userLoading && userProfile?.role !== 'administrador') {
            router.push('/dashboard');
        }
    }, [userProfile, userLoading, router]);

    const loading = userLoading || articulosLoading || isSeeding;

    if (loading && !isSeeding) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2">Cargando...</p>
            </div>
        )
    }

    if (userProfile?.role !== 'administrador') {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>
                    No tienes permisos para acceder a esta sección.
                </AlertDescription>
            </Alert>
        );
    }
    
    if (!loading && articulos?.length === 0) {
        return (
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="font-headline">¡Comienza con el Catálogo de Artículos!</CardTitle>
                    <CardDescription>
                       Tu catálogo de artículos está vacío. Puedes empezar agregando artículos manualmente o puedes cargar una lista sugerida con más de 70 artículos comunes en emergencias.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col items-center">
                     {isSeeding ? (
                        <>
                           <Loader2 className="h-10 w-10 animate-spin text-primary" />
                           <p className="text-muted-foreground">Cargando artículos en la base de datos, por favor espera...</p>
                        </>
                    ) : (
                        <div className="flex gap-4">
                            <SeedButton onSeeding={setIsSeeding} onFinished={forceRefetch} />
                            <Button asChild variant="secondary">
                                <Link href="/dashboard/admin/articulos/nuevo">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Agregar Manualmente
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="flex items-center gap-2 font-headline">
            <Package className="h-6 w-6" />
            Catálogo de Artículos
            </CardTitle>
            <CardDescription>
            Gestione los artículos maestros para el control de inventario.
            </CardDescription>
        </div>
        <Button asChild>
            <Link href="/dashboard/admin/articulos/nuevo">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Artículo
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ArticulosTable />
      </CardContent>
    </Card>
  );
}
