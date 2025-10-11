
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { UsersTable } from "./users-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminUsersPage() {
    const { userProfile, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userProfile?.role !== 'administrador') {
            router.push('/dashboard');
        }
    }, [userProfile, loading, router]);


    if (loading) {
        return <div>Cargando...</div>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Users className="h-6 w-6" />
          Administración de Usuarios
        </CardTitle>
        <CardDescription>
          Gestione los roles de los usuarios del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable />
      </CardContent>
    </Card>
  );
}
