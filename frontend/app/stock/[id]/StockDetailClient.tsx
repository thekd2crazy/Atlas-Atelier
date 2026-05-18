'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeleteComposant, UpdateComposant } from "@/lib/stock-api";
import type { Composant } from "@/types/type-composant";
import { Edit, FileText, MapPin } from "lucide-react";
import { FaSave, FaTrash } from "react-icons/fa";

type Props = {
  initialComposant: Composant;
};

export default function StockDetailClient({ initialComposant }: Props) {
  const router = useRouter();
  const [composant, setComposant] = useState<Composant>(initialComposant);
  const [draft, setDraft] = useState<Composant>(initialComposant);
  const [editOpen, setEditOpen] = useState(false);

  const openEditor = () => {
    setDraft(composant);
    setEditOpen(true);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Supprimer ce composant ?");
    if (!confirmed) {
      return;
    }

    try {
      await DeleteComposant(composant.id_composant);
      router.push("/stock");
      router.refresh();
    } catch (err) {
      console.error("Echec de la suppression", err);
      alert("Impossible de supprimer le composant.");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const updated = await UpdateComposant(draft.id_composant, draft);
      setComposant(updated);
      setEditOpen(false);
    } catch (err) {
      console.error("Echec de la mise a jour", err);
      alert("Impossible de mettre a jour le composant.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-wrap items-center gap-3 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {composant.nom}
        </h1>
        <Button variant="outline" size="sm" className="gap-2" onClick={openEditor}>
          <Edit className="h-4 w-4" />
          Modifier
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-0">
            {composant.photo_url ? (
              <img
                src={composant.photo_url}
                alt={composant.nom}
                className="h-64 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                Aucune photo pour ce composant
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Reference
              </Label>
              <Badge className="font-mono text-sm" variant="secondary">
                {composant.reference}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Categorie
              </Label>
              <Badge className="text-sm">{composant.categorie}</Badge>
            </div>

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
                  Quantite en stock
                </Label>
                <Badge
                  variant={composant.quantite === 0 ? "destructive" : "default"}
                  className="text-lg font-bold tabular-nums"
                >
                  {composant.quantite}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                <MapPin className="h-4 w-4" />
                Emplacement
              </Label>
              <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                {composant.emplacement}
              </p>
            </div>

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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le composant</DialogTitle>
            <DialogDescription>
              Mettez a jour les informations du composant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom</Label>
                <Input
                  id="edit-nom"
                  value={draft.nom}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      nom: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reference">Reference</Label>
                <Input
                  id="edit-reference"
                  value={draft.reference}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      reference: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-categorie">Categorie</Label>
              <Input
                id="edit-categorie"
                value={draft.categorie}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    categorie: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prix">Prix (EUR)</Label>
                <Input
                  id="edit-prix"
                  type="number"
                  step="0.01"
                  value={draft.prix ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      prix: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantite">Quantite</Label>
                <Input
                  id="edit-quantite"
                  type="number"
                  value={draft.quantite ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      quantite: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emplacement">Emplacement</Label>
                <Input
                  id="edit-emplacement"
                  value={draft.emplacement ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      emplacement: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-photo_url">URL de la photo</Label>
              <Input
                id="edit-photo_url"
                type="url"
                value={draft.photo_url ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    photo_url: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={draft.description ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    description: e.target.value,
                  })
                }
                className="min-h-20 resize-vertical"
              />
            </div>

            <DialogFooter className="flex items-center">
              <div className="mx-2">
                <Button type="submit" className="w-auto">
                  <FaSave size={16} />
                  Save
                </Button>
              </div>
              <div className="mx-2">
                <Button type="button" className="w-auto" onClick={handleDelete}>
                  <FaTrash size={16} />
                  Delete
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
