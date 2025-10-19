
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
import { deleteVisita } from "@/firebase/visita-actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { exportVisitaToPDF } from "@/lib/pdf-generator-visita";
import type { VisitaTecnica } from "./visita-form";


export function VisitasTable() {
  const { data: visitas, loading, forceRefetch } = useCollection<VisitaTecnica>('visitas', { orderBy: ['fechaVisita', 'desc']});
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<VisitaTecnica | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useUser();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'yyyy-MM-dd');
  }

  const handleDeleteClick = (visita: VisitaTecnica) => {
    setSelectedVisita(visita);
    setIsAlertOpen(true);
  };
  
  const handleEditClick = (visitaId: string) => {
    router.push(`/dashboard/visitas/editar/${visitaId}`);
  };

  const handleExportClick = (visita: VisitaTecnica) => {
    try {
        exportVisitaToPDF(visita, userProfile);
        toast({
            title: "Exportación Exitosa",
            description: `Se ha generado el PDF para el acta ${visita.actaNumero}.`
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
    if (selectedVisita) {
        try {
            await deleteVisita(selectedVisita.id!);
            toast({
              title: "Registro Eliminado",
              description: "El acta de visita ha sido eliminada correctamente.",
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
    setSelectedVisita(null);
  };


  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nro. Acta</TableHead>
            <TableHead>Damnificado</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Fecha de Visita</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex justify-center items-center">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Cargando visitas...
                </div>
              </TableCell>
            </TableRow>
          ) : visitas && visitas.length > 0 ? (
            visitas.map((visita) => (
              <TableRow key={visita.id}>
                <TableCell className="font-medium">{visita.actaNumero}</TableCell>
                <TableCell>{visita.nombreDamnificado} {visita.apellidoDamnificado}</TableCell>
                <TableCell>{visita.profesionalAsignado}</TableCell>
                <TableCell>{formatDate(visita.fechaVisita)}</TableCell>
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
                         <DropdownMenuItem onSelect={() => handleEditClick(visita.id!)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleExportClick(visita)}>
                          <FileDown className="mr-2 h-4 w-4" />
                          <span>Exportar PDF</span>
                        </DropdownMenuItem>
                        {userProfile?.role === 'administrador' && (
                          <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => handleDeleteClick(visita)}
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
                No se encontraron visitas técnicas.
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
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el acta de visita
                    {selectedVisita && ` ${selectedVisita.actaNumero}`}.
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
