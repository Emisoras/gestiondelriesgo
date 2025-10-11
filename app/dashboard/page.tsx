
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardList, HeartHandshake, Box, Truck, Activity, Sparkles, Loader2, FilePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCollection } from "@/firebase";

const StatCard = ({ title, value, icon: Icon, link, imageId, imageHint, loading }: { title: string, value: string | number, icon: React.ElementType, link: string, imageId: string, imageHint: string, loading: boolean }) => {
  const image = PlaceHolderImages.find(p => p.id === imageId);
  return (
    <Card className="overflow-hidden transition-transform hover:scale-105 hover:shadow-lg">
      <Link href={link}>
        <div className="relative h-40">
          {image && <Image src={image.imageUrl} alt={title} fill style={{objectFit: "cover"}} data-ai-hint={imageHint} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <Icon className="h-8 w-8 text-white mb-2" />
            <CardTitle className="text-white font-headline">{title}</CardTitle>
          </div>
        </div>
        <CardContent className="p-4">
          {loading ? (
             <div className="flex items-center">
                <Loader2 className="h-8 w-8 mr-2 animate-spin text-muted-foreground" />
                <p className="text-2xl font-bold text-muted-foreground">...</p>
             </div>
          ) : (
            <p className="text-4xl font-bold">{value}</p>
          )}
          <p className="text-sm text-muted-foreground">Registros activos</p>
        </CardContent>
      </Link>
    </Card>
  )
};

const ActivityItem = ({ icon: Icon, text, time }: { icon: React.ElementType, text: React.ReactNode, time: string }) => (
    <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <Icon className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div className="flex-1">
            <p className="text-sm">{text}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
        </div>
    </div>
);

const toDate = (timestamp: any): Date | null => {
    if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
        return new Date(timestamp.seconds * 1000);
    }
    return null;
};

export default function DashboardPage() {
  const { data: damnificados, loading: loadingDamnificados } = useCollection('damnificados');
  const { data: voluntarios, loading: loadingVoluntarios } = useCollection('voluntarios');
  const { data: donaciones, loading: loadingDonaciones } = useCollection('donaciones');
  const { data: entregas, loading: loadingEntregas } = useCollection('entregas');

  const loading = loadingDamnificados || loadingVoluntarios || loadingDonaciones || loadingEntregas;

  const stats = {
      damnificados: damnificados?.length ?? 0,
      voluntarios: voluntarios?.length ?? 0,
      donaciones: donaciones?.length ?? 0,
      entregas: entregas?.length ?? 0,
  };

  const recentActivity = useMemo(() => {
    const allActivity = [
      ...(damnificados?.map(d => ({ ...d, type: 'damnificado', date: toDate(d.createdAt) })) || []),
      ...(voluntarios?.map(v => ({ ...v, type: 'voluntario', date: toDate(v.createdAt) })) || []),
      ...(donaciones?.map(d => ({ ...d, type: 'donacion', date: toDate(d.createdAt) })) || []),
      ...(entregas?.map(e => ({ ...e, type: 'entrega', date: toDate(e.createdAt) })) || []),
    ];

    return allActivity
      .filter(item => item.date)
      .sort((a, b) => b.date!.getTime() - a.date!.getTime())
      .slice(0, 5);
  }, [damnificados, voluntarios, donaciones, entregas]);
  
  const isLoadingActivity = loading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Dashboard de ResQ Hub
        </h1>
        <p className="text-muted-foreground">
          Vista general del estado actual de las operaciones de ayuda.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Personas Afectadas" value={stats.damnificados} icon={ClipboardList} link="/dashboard/damnificados" imageId="affected-people" imageHint="people aid" loading={loading} />
        <StatCard title="Voluntarios Activos" value={stats.voluntarios} icon={HeartHandshake} link="/dashboard/voluntarios" imageId="active-volunteers" imageHint="volunteers supplies" loading={loading} />
        <StatCard title="Donaciones Recibidas" value={stats.donaciones} icon={Box} link="/dashboard/donaciones" imageId="donations-received" imageHint="donation boxes" loading={loading} />
        <StatCard title="Entregas Realizadas" value={stats.entregas} icon={Truck} link="/dashboard/entregas" imageId="deliveries-made" imageHint="supply truck" loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity /> Actividad Reciente</CardTitle>
                <CardDescription>Últimos registros y movimientos en el sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingActivity ? (
                    <div className="flex items-center justify-center h-40">
                         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : recentActivity.length > 0 ? (
                    <div className="space-y-4">
                        {recentActivity.map((activity: any) => {
                            const time = activity.date ? formatDistanceToNow(activity.date, { addSuffix: true, locale: es }) : '';
                            if (activity.type === 'damnificado') {
                                return <ActivityItem key={`d-${activity.id}`} icon={FilePlus} text={<>Nuevo damnificado registrado: <span className="font-semibold">{activity.nombre} {activity.apellido}</span></>} time={time} />
                            }
                             if (activity.type === 'voluntario') {
                                return <ActivityItem key={`v-${activity.id}`} icon={HeartHandshake} text={<>Nuevo voluntario: <span className="font-semibold">{activity.nombre} {activity.apellido}</span> se ha unido.</>} time={time} />
                            }
                             if (activity.type === 'donacion') {
                                return <ActivityItem key={`do-${activity.id}`} icon={Box} text={<>Nueva donación de <span className="font-semibold">{activity.donante}</span>: {activity.descripcion}.</>} time={time} />
                            }
                             if (activity.type === 'entrega') {
                                return <ActivityItem key={`e-${activity.id}`} icon={Truck} text={<>Entrega realizada a <span className="font-semibold">{activity.receptorNombre}</span>.</>} time={time} />
                            }
                            return null;
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
                        <p>No hay actividad reciente para mostrar. <br/>¡Comienza a registrar datos!</p>
                    </div>
                )}
            </CardContent>
        </Card>
        <Card className="flex flex-col justify-between">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles /> Generador de Impacto</CardTitle>
                <CardDescription>Crea informes de impacto basados en los datos recopilados.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Usa la IA para generar un resumen del impacto de un evento específico, combinando datos de voluntarios, donaciones y personas afectadas.</p>
                 <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/dashboard/impacto">Generar Declaración</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    