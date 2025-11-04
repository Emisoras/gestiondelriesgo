
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { useCollection } from "@/firebase";

type InventarioItem = {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  lastUpdatedAt?: {
    seconds: number;
  }
};

export function InventarioTable() {
  const { data: inventario, loading } = useCollection<InventarioItem>('inventario', { orderBy: ['nombre', 'asc']});
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInventario = inventario?.filter(
    (item) =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unidad.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStockVariant = (cantidad: number) => {
    if (cantidad <= 0) return 'destructive';
    if (cantidad <= 10) return 'secondary';
    return 'default';
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre o unidad..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead className="text-right">Cantidad en Stock</TableHead>
              <TableHead>Unidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Cargando inventario...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInventario && filteredInventario.length > 0 ? (
              filteredInventario.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell className="text-right">
                     <Badge variant={getStockVariant(item.cantidad)} className="text-lg">
                        {item.cantidad}
                     </Badge>
                  </TableCell>
                  <TableCell>{item.unidad}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No hay artículos en el inventario.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

    