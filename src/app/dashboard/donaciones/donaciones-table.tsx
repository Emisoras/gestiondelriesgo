
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Loader2, Trash2, Pencil, Search } from "lucide-react";
import { format } from 'date-fns';
import { useCollection, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteDonacion } from "@/firebase/donacion-actions";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

type Donacion = {
    id: string;
    donante: string;
    tipo_donacion: string;
    descripcion: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | null;
};

export function DonacionesTable() {
  const { data: donaciones, loading, forceRefetch } = useCollection<Donacion>('donaciones', { orderBy: ['createdAt', 'desc'] });
  const [searchTerm, setSearchTerm] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedDonacion, setSelectedDonacion] = useState<Donacion | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useUser();

  const formatDate = (timestamp: Donacion['createdAt']) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'yyyy-MM-dd');
  }
  
  const filteredDonaciones = donaciones?.filter((donacion) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const fecha = formatDate(donacion.createdAt).toLowerCase();

      return (
          donacion.donante.toLowerCase().includes(lowerCaseSearchTerm) ||
          donacion.tipo_donacion.replace(/_/g, " ").toLowerCase().includes(lowerCaseSearchTerm) ||
          donacion.descripcion.toLowerCase().includes(lowerCaseSearchTerm) ||
          fecha.includes(lowerCaseSearchTerm)
      );
  });


  const handleDeleteClick = (donacion: Donacion) => {
    setSelectedDonacion(donacion);
    setIsAlertOpen(true);
  };
  
  const handleEditClick = (donacionId: string) => {
    router.push(`/dashboard/donaciones/editar/${donacionId}`);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDonacion) {
        try {
            await deleteDonacion(selectedDonacion.id);
            toast({
              title: "Registro Eliminado",
              description: "La donación ha sido eliminada correctamente.",
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
    setSelectedDonacion(null);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por donante, tipo, descripción o fecha..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Donante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad/Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Cargando donaciones...
                        </div>
                    </TableCell>
                    </TableRow>
                ) : filteredDonaciones && filteredDonaciones.length > 0 ? (
                    filteredDonaciones.map((donacion) => (
                    <TableRow key={donacion.id}>
                        <TableCell className="font-medium">{donacion.donante}</TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            donacion.tipo_donacion === "monetaria"
                                ? "default"
                                : donacion.tipo_donacion === "medicamentos"
                                ? "destructive"
                                : "secondary"
                            }
                            className="capitalize"
                        >
                            {donacion.tipo_donacion.replace(/_/g, " ")}
                        </Badge>
                        </TableCell>
                        <TableCell>{donacion.descripcion}</TableCell>
                        <TableCell>{formatDate(donacion.createdAt)}</TableCell>
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
                                <DropdownMenuItem onSelect={() => handleEditClick(donacion.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                                </DropdownMenuItem>
                                {userProfile?.role === 'administrador' && (
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onSelect={() => handleDeleteClick(donacion)}
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
                        No se encontraron donaciones con ese criterio.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      </div>
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este registro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la donación de
                    {selectedDonacion && ` ${selectedDonacion.donante}`}.
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
