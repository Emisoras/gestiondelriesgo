
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, MoreHorizontal, Trash2, Pencil, FileDown } from "lucide-react";
import { format } from 'date-fns';
import { useCollection, useUser } from "@/firebase";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteEntrega } from "@/firebase/entrega-actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { exportEntregaToPDF } from "@/lib/pdf-generator-entrega";

type Entrega = {
    id: string;
    receptorNombre: string;
    descripcion_entrega: string;
    responsable: string;
    fecha_entrega: {
        seconds: number;
        nanoseconds: number;
    } | null;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | null;
    fotos_entrega?: string[];
    [key: string]: any;
};

export function EntregasTable() {
  const { data: entregas, loading, forceRefetch } = useCollection<Entrega>('entregas', { orderBy: ['createdAt', 'desc']});
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useUser();

  const formatDate = (timestamp: Entrega['fecha_entrega']) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'yyyy-MM-dd');
  }

  const handleDeleteClick = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setIsAlertOpen(true);
  };
  
  const handleEditClick = (entregaId: string) => {
    router.push(`/dashboard/entregas/editar/${entregaId}`);
  };

  const handleExportClick = (entrega: Entrega) => {
    try {
        exportEntregaToPDF(entrega);
        toast({
            title: "Exportación Exitosa",
            description: `Se ha generado el PDF para la entrega a ${entrega.receptorNombre}.`
        })
    } catch(error) {
        console.error("Error al exportar a PDF: ", error);
        toast({
            title: "Error de Exportación",
            description: "No se pudo generar el archivo PDF.",
            variant: "destructive"
        })
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedEntrega) {
        try {
            await deleteEntrega(selectedEntrega.id);
            toast({
              title: "Registro Eliminado",
              description: "La entrega ha sido eliminada correctamente.",
            });
            forceRefetch();
        } catch(error) {
            toast({
              title: "Error al eliminar",
              description: "No se pudo eliminar el registro. Verifique sus permisos.",
              variant: "destructive",
            });
        }
    }
    setIsAlertOpen(false);
    setSelectedEntrega(null);
  };


  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receptor</TableHead>
            <TableHead>Artículos Entregados</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Fecha de Entrega</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex justify-center items-center">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Cargando entregas...
                </div>
              </TableCell>
            </TableRow>
          ) : entregas && entregas.length > 0 ? (
            entregas.map((entrega) => (
              <TableRow key={entrega.id}>
                <TableCell className="font-medium">{entrega.receptorNombre}</TableCell>
                <TableCell>{entrega.descripcion_entrega}</TableCell>
                <TableCell>{entrega.responsable}</TableCell>
                <TableCell>{formatDate(entrega.fecha_entrega)}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem onSelect={() => handleEditClick(entrega.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleExportClick(entrega)}>
                          <FileDown className="mr-2 h-4 w-4" />
                          <span>Exportar</span>
                        </DropdownMenuItem>
                        {userProfile?.role === 'administrador' && (
                          <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => handleDeleteClick(entrega)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No se encontraron entregas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este registro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la entrega a
                    {selectedEntrega && ` ${selectedEntrega.receptorNombre}`}.
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
    </>
  );
}
