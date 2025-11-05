
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
import { MoreHorizontal, Loader2, Trash2, Pencil, Search, DollarSign } from "lucide-react";
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
    monto?: number;
    descripcion_general?: string;
    articulos: { nombre: string, cantidad: number, unidad: string }[];
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
      const searchInArticulos = donacion.articulos?.some(a => a.nombre.toLowerCase().includes(lowerCaseSearchTerm));

      return (
          donacion.donante.toLowerCase().includes(lowerCaseSearchTerm) ||
          (donacion.tipo_donacion && donacion.tipo_donacion.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (donacion.descripcion_general && donacion.descripcion_general.toLowerCase().includes(lowerCaseSearchTerm)) ||
          searchInArticulos ||
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
              description: "La donación ha sido eliminada y el inventario ajustado.",
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

  const getSummary = (donacion: Donacion) => {
    if (donacion.tipo_donacion === 'monetaria') {
        return (
            <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(donacion.monto || 0)}
                </span>
                {donacion.descripcion_general && <span className="text-muted-foreground text-xs">({donacion.descripcion_general})</span>}
            </div>
        )
    }
    if (!donacion.articulos || donacion.articulos.length === 0) return 'N/A';
    const summary = donacion.articulos.map(a => `${a.cantidad} ${a.unidad} de ${a.nombre}`).join(', ');
    return summary.length > 80 ? summary.substring(0, 80) + '...' : summary;
  }
  
  const getDonationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
        monetaria: "Monetaria",
        alimentos: "Alimentos",
        ropa: "Ropa y Calzado",
        medicamentos: "Medicamentos",
        aseo: "Útiles de Aseo",
        cocina: "Útiles de Cocina",
        frazadas: "Frazadas y Cobijas",
        otro: "Otro"
    };
    return labels[type] || type;
  }


  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por donante, tipo, artículo..."
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
                    <TableHead>Contenido / Monto</TableHead>
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
                            <Badge variant="secondary" className="capitalize">{getDonationTypeLabel(donacion.tipo_donacion)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="truncate">{getSummary(donacion)}</span>
                        </TableCell>
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
                    {selectedDonacion && ` ${selectedDonacion.donante}`} y devolverá los artículos al inventario.
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
