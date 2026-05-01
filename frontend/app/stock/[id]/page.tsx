import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getOneComposant } from "@/lib/stock-api"
import {  Edit, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from 'next/navigation';


type Props = {
  params: Promise<{ id: string }>;  // ✅ Promise !
};

export default async function StockDetail({ params }: Props) {
    const { id } = await params;  // ✅ Unwrap !

    let composant;
    try {
        composant = await getOneComposant(id);  // Maintenant OK !
    } catch {
        notFound();
    }

    return(
         <div className="container mx-auto p-6">
        `    <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">{composant.nom}</h1>
                <Button asChild>
                <Link href={`/stock/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                </Link>
                </Button>
            </div>`

            <div className="grid md:grid-cols-2 gap-8">
                {composant.photo_url && (
                <Card>
                    <CardContent className="p-6">
                    <Image src={composant.photo_url} alt={composant.nom} className="w-full h-64 object-cover rounded-lg" />
                    </CardContent>
                </Card>
                )}
                
                <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                    <Label>Référence</Label>
                    <Badge>{composant.reference}</Badge>
                    </div>
                    <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Badge variant="secondary">{composant.categorie}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Prix</Label>
                        <p className="font-mono text-lg">€{composant.prix}</p>
                    </div>
                    <div className="flex items-end">
                        <Label>Quantité</Label>
                        <Badge variant={composant.quantite === 0 ? 'destructive' : 'default'}>
                        {composant.quantite}
                        </Badge>
                    </div>
                    </div>
                    <div>
                    <Label className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Emplacement
                    </Label>
                    <p className="font-mono">{composant.emplacement}</p>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
    );
}