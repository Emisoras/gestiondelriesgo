
"use client";

import { useMemo, useState, useEffect } from "react";
import { useCollection, useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Landmark, ArrowDownCircle, ArrowUpCircle, CircleDollarSign, Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { deleteGasto } from "@/firebase/gasto-actions";
import { GastoForm } from "./gasto-form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

type DonacionMonetaria = {
  id: string;
  monto: number;
};

type Gasto = {
  id: string;
  monto: number;
  descripcion: string;
  fecha: { seconds: number; nanoseconds: number; } | Date;
  responsable: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export default function FinanzasPage() {
  const { userProfile, loading: userLoading } = useUser();
  const { data: donaciones, loading: loadingDonaciones } = useCollection<DonacionMonetaria>('donaciones', { where: ['tipo_donacion', '==', 'monetaria'] });
  const { data: gastos, loading: loadingGastos, forceRefetch } = useCollection<Gasto>('gastos', { orderBy: ['fecha', 'desc'] });
  const { toast } = useToast();
  const router = useRouter();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    if (!userLoading && userProfile?.role !== 'administrador') {
        router.push('/dashboard');
    }
  }, [userProfile, userLoading, router]);

  const loading = userLoading || loadingDonaciones || loadingGastos;

  const totalDonado = useMemo(() => {
    return donaciones?.reduce((sum, d) => sum + (d.monto || 0), 0) ?? 0;
  }, [donaciones]);

  const totalGastado = useMemo(() => {
    return gastos?.reduce((sum, g) => sum + (g.monto || 0), 0) ?? 0;
  }, [gastos]);

  const saldoDisponible = totalDonado - totalGastado;
  
  const handleEditClick = (gasto: Gasto) => {
    setSelectedGasto(gasto);
    setIsSheetOpen(true);
  }
  
  const handleDeleteClick = (gasto: Gasto) => {
    setSelectedGasto(gasto);
    setIsAlertOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (selectedGasto) {
      try {
        await deleteGasto(selectedGasto.id);
        toast({ title: "Gasto Eliminado", description: "El registro del gasto ha sido eliminado." });
        forceRefetch();
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "No se pudo eliminar el gasto.", variant: "destructive" });
      }
    }
    setIsAlertOpen(false);
    setSelectedGasto(null);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return format(d, 'dd/MM/yyyy');
  };
  
  if (loading) {
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


  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Landmark className="h-8 w-8" />
            Módulo de Finanzas
          </h1>
          <p className="text-muted-foreground">
            Control de ingresos por donaciones monetarias y egresos.
          </p>
        </div>
        <Button onClick={() => { setSelectedGasto(null); setIsSheetOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Gasto
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Donaciones)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{formatCurrency(totalDonado)}</div>}
            <p className="text-xs text-muted-foreground">Total de donaciones monetarias recibidas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos (Gastos)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{formatCurrency(totalGastado)}</div>}
            <p className="text-xs text-muted-foreground">Total de gastos registrados.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponible</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{formatCurrency(saldoDisponible)}</div>}
            <p className="text-xs text-muted-foreground">Fondos totales disponibles para operar.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Gastos</CardTitle>
          <CardDescription>Listado de todos los egresos registrados.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                {userProfile?.role === 'administrador' && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin inline" /> Cargando gastos...
                  </TableCell>
                </TableRow>
              ) : gastos && gastos.length > 0 ? (
                gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell>{formatDate(gasto.fecha)}</TableCell>
                    <TableCell className="font-medium">{gasto.descripcion}</TableCell>
                    <TableCell>{gasto.responsable}</TableCell>
                    <TableCell className="text-right">{formatCurrency(gasto.monto)}</TableCell>
                    {userProfile?.role === 'administrador' && 
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(gasto)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(gasto)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                    }
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No se han registrado gastos.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedGasto ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</SheetTitle>
            <SheetDescription>
              {selectedGasto ? 'Modifique la información del gasto.' : 'Complete el formulario para registrar una nueva salida de dinero.'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <GastoForm
              gastoId={selectedGasto?.id}
              initialValues={selectedGasto}
              onFinished={() => {
                setIsSheetOpen(false);
                forceRefetch();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
      
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este Gasto?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. El registro del gasto de {formatCurrency(selectedGasto?.monto || 0)} por "{selectedGasto?.descripcion}" será eliminado permanentemente.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                    Eliminar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
