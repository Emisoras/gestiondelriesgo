"use client";

import { useFormStatus } from "react-dom";
import { handleGenerateImpactStatement } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useActionState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

const initialState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Generar Declaración
    </Button>
  );
}

export function ImpactoForm() {
  const [state, formAction] = useActionState(handleGenerateImpactStatement, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.errors) {
        if(state.impactStatement) {
            toast({
                title: "Éxito",
                description: state.message,
                className: "bg-accent text-accent-foreground",
            });
            formRef.current?.reset();
        } else {
             toast({
                title: "Error",
                description: state.message,
                variant: "destructive",
            });
        }
    }
  }, [state, toast]);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form ref={formRef} action={formAction} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="eventDescription">Descripción del Evento</Label>
          <Textarea id="eventDescription" name="eventDescription" placeholder="Ej: Inundaciones en la región costera de Anzoátegui" required />
          {state.errors?.eventDescription && <p className="text-sm font-medium text-destructive">{state.errors.eventDescription[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="affectedPeopleCount">Número de Personas Afectadas</Label>
          <Input id="affectedPeopleCount" name="affectedPeopleCount" type="number" placeholder="Ej: 1500" required />
          {state.errors?.affectedPeopleCount && <p className="text-sm font-medium text-destructive">{state.errors.affectedPeopleCount[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="donationsReceived">Donaciones Recibidas</Label>
          <Textarea id="donationsReceived" name="donationsReceived" placeholder="Ej: 5 toneladas de alimentos, 2000L de agua, ropa variada" required />
          {state.errors?.donationsReceived && <p className="text-sm font-medium text-destructive">{state.errors.donationsReceived[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="volunteerHours">Horas de Voluntariado</Label>
          <Input id="volunteerHours" name="volunteerHours" type="number" placeholder="Ej: 800" required />
          {state.errors?.volunteerHours && <p className="text-sm font-medium text-destructive">{state.errors.volunteerHours[0]}</p>}
        </div>
        <SubmitButton />
      </form>
      
      <div className="flex flex-col">
        <Card className={`flex-grow flex flex-col transition-all duration-500 ${state.impactStatement ? 'bg-card' : 'bg-muted'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Sparkles className="text-primary"/>Declaración de Impacto Generada</CardTitle>
            <CardDescription>
              Este es el borrador generado por la IA. Revíselo y edítelo según sea necesario.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {state.impactStatement ? (
              <p className="text-sm whitespace-pre-wrap">{state.impactStatement}</p>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>La declaración aparecerá aquí...</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button disabled={!state.impactStatement} className="w-full">
                Copiar al Portapapeles
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
