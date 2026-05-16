import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getOneComposant } from "@/lib/stock-api"
import {  Edit, FileText, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from 'next/navigation';


type Props = {
  params: Promise<{ id: string }>;  // ✅ Promise !
};

export default async function StockDetail({ params }: Props) {
    const { id } = await params;  // ✅ Unwrap !
    const idComposant = Number(id);

    let composant;
    try {
        composant = await getOneComposant(idComposant);
    } catch {
        notFound();
    }

    return(
         <div className="container mx-auto p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {composant.nom}
                </h1>

                <Button asChild variant="outline" size="sm">
                <Link href={`/stock/${id}/edit`} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Modifier
                </Link>
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* IMAGE */}
                {composant.photo_url && (
                <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
                    <CardContent className="p-0">
                    <div className="overflow-hidden rounded-t-lg bg-slate-50 dark:bg-slate-900">
                        <Image
                        src={composant.photo_url}
                        alt={composant.nom}
                        className="w-full h-64 object-cover"
                        width={400}
                        height={256}
                        />
                    </div>
                    </CardContent>
                </Card>
                )}

                {/* INFOS TECHNIQUES */}
                <Card>
                    <CardContent className="p-6 space-y-5">
                        {/* RÉFÉRENCE */}
                        <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Référence
                        </Label>
                        <Badge className="font-mono text-sm" variant="secondary">
                            {composant.reference}
                        </Badge>
                        </div>

                        {/* CATÉGORIE */}
                        <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Catégorie
                        </Label>
                        <Badge className="text-sm">
                            {composant.categorie}
                        </Badge>
                        </div>

                        {/* PRIX + QUANTITÉ */}
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Prix unitaire
                            </Label>
                            <p className="font-mono text-xl font-semibold text-slate-900 dark:text-slate-100">
                            €{composant.prix}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Quantité en stock
                            </Label>
                            <Badge
                            variant={composant.quantite === 0 ? "destructive" : "default"}
                            className="text-lg font-bold tabular-nums"
                            >
                            {composant.quantite}
                            </Badge>
                        </div>
                        </div>

                        {/* EMPLACEMENT */}
                        <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <MapPin className="h-4 w-4" />
                            Emplacement
                        </Label>
                        <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                            {composant.emplacement}
                        </p>
                        </div>
                        
                         {/* Description */}
                        <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <FileText className="h-4 w-4" />
                            Description
                        </Label>
                        <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                            {composant.description}
                        </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}