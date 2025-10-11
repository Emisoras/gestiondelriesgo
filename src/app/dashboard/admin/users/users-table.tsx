
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
import { Search, Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useUser } from "@/firebase";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AdminUserForm } from "./admin-user-form";
import { Button } from "@/components/ui/button";

export type UserProfile = {
    id: string;
    displayName: string;
    email: string;
    role: 'administrador' | 'empleado';
    estado: 'activo' | 'inactivo' | 'pendiente';
};

export function UsersTable() {
  const { user: currentUser } = useUser();
  const { data: users, loading, forceRefetch } = useCollection<UserProfile>('users');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredUsers = users?.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleEditClick = (user: UserProfile) => {
    if(user.id === currentUser?.uid) return; // Prevent admin from editing themselves in this view
    setSelectedUser(user);
    setIsSheetOpen(true);
  }

  const handleSheetClose = (open: boolean) => {
    if (!open) {
        setSelectedUser(null);
    }
    setIsSheetOpen(open);
  }

  const getStatusVariant = (status: UserProfile['estado']) => {
    switch (status) {
        case 'activo': return 'default';
        case 'inactivo': return 'destructive';
        case 'pendiente': return 'secondary';
        default: return 'outline';
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre o email..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Cargando usuarios...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                     <Badge variant={user.role === 'administrador' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(user.estado)} className="capitalize">{user.estado}</Badge>
                  </TableCell>
                   <TableCell className="text-right">
                    {user.id !== currentUser?.uid && (
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                            <Pencil className="h-4 w-4"/>
                            <span className="sr-only">Editar Usuario</span>
                        </Button>
                    )}
                   </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Editar Usuario</SheetTitle>
                    <SheetDescription>
                        Modifique la información del usuario. Haga clic en guardar cuando haya terminado.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  {selectedUser && (
                    <AdminUserForm 
                      user={selectedUser} 
                      onFinished={() => {
                        handleSheetClose(false);
                        forceRefetch();
                      }}
                    />
                  )}
                </div>
            </SheetContent>
        </Sheet>
    </div>
  );
}
