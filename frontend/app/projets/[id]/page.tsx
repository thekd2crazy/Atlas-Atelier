'use client';

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Euro,
  Activity,
  Search,
} from "lucide-react";
import { Projet } from "@/types/type-projet";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Composant } from "@/types/type-composant";
import { CreateBOMInput, DeleteBOMInput, UpdateBOMInput } from "@/types/types-bom";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { se } from "date-fns/locale";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getProgressState(ratio: number) {
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "warning";
  return "normal";
}


type Props = {
  params: Promise<{ id: string }>;
};

type FormValues = {
  composant_id: number;
  qte_requise: number;
};



export default function ProjetDetailPage ({ params }: Props) {
    const { id } = React.use(params);
    const idProjet = Number(id);
    const [projet, setProjet] = useState<Projet | null>(null);
    const [loadingProjet, setLoadingProjet] = useState<boolean>(true);
    const [projError, setProjError] = useState<string | null>(null);
    const [Searchedcomposants, setSearchedcomposants] = useState<Composant[]>([]);
    const [form, setForm] = useState<FormValues>({
        composant_id: 0,
        qte_requise: 1,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [composants, setComposants] = useState<Composant[]>([]);
    const [lineBOM, setLineBOM] = useState<CreateBOMInput[]>([]);
    const router = useRouter();
// update projet
    const [formUpdate, setFormUpdate] = useState<UpdateBOMInput>();  
    const [open, setOpen] = useState(false);
    const [CurrentComponent, setCurrentComponent] = useState<CreateBOMInput | null>(null);
    const [qteRequise, setQteRequise] = useState("");

// Activer la modal d'ajout de ligne BOM 
    const [openAdd, setOpenAdd] = useState(false);
    const handleRefresh = () => {
        router.refresh();
    };

    async function loadProjet() {
        try {
            setLoadingProjet(true);
            const res = await fetch(`/api/projets/${idProjet}`);
            if (!res.ok) {
                setProjError(`Erreur API: ${res.status}`);
                setProjet(null);
                return;
            }
            const data: Projet = await res.json();
            setProjet(data);
        } catch (err) {
            console.error('Fetch projet error:', err);
            setProjError('Erreur réseau lors du chargement du projet');
        } finally {
            setLoadingProjet(false);
        }
    }
    
    async function loadComponents() {
        try {
            setLoading(true);
            const res = await fetch('/api/stock');
            if (!res.ok) {
                console.error('API Status:', res.status, await res.text());
                setComposants([]);  // Liste vide
                return;
            }
            const data: Composant[] = await res.json();
            setComposants(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setComposants([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadBOM() {
        try {
            setLoading(true);
            const res = await fetch(`/api/projets/${idProjet}/bom`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) {
                console.error('API Status:', res.status, await res.text());
                setLineBOM([]);  // Liste vide
                return;
            }
            const data: CreateBOMInput[] = await res.json();
            setLineBOM(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setLineBOM([]);
        } finally {
            setLoading(false);
        }
    }

    async function Delete(component: CreateBOMInput) {
        if (!component?.composant_id) {
            console.error("Missing composant_id", component);
            return;
        }

        const idProjetNum = Number(idProjet);
        const idComposantNum = Number(component.composant_id);

        if (isNaN(idProjetNum) || isNaN(idComposantNum)) {
            console.error("Invalid IDs", {
            idProjet,
            composant_id: component.composant_id,
            });
            return;
        }

        try {
            const res = await fetch(
            `/api/projets/${idProjetNum}/bom/${idComposantNum}`,
            {
                method: "DELETE",
            }
            );

            const text = await res.text();

            if (!res.ok) {
            console.error("API Error:", res.status, text);
            return;
            }

            handleRefresh();
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }
    async function updateProjetBOM(
        id_projet: number,
        id_composant: number,
        qte_requise: number
        ): Promise<any> {
        try {
            if (!id_projet || !id_composant) {
            throw new Error("IDs manquants");
            }

            if (qte_requise <= 0) {
            throw new Error("La quantité doit être > 0");
            }

            const response = await fetch(
            `/api/projets/${id_projet}/bom/${id_composant}`,
            {
                method: "PATCH",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                qte_requise,
                }),
            }
            );

            const text = await response.text();

            let data;
            try {
            data = JSON.parse(text);
            } catch {
            data = text;
            }

            if (!response.ok) {
            throw new Error(data?.detail || "Erreur update BOM");
            }

            return data;
        } catch (error) {
            console.error("updateProjetBOM error:", error);
            throw error;
        }
    }

    useEffect(() => {
        
        loadProjet();
        loadComponents();
        loadBOM();
        
    }, []);

    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        if (!query) return composants;

        return setSearchedcomposants(composants.filter((c) =>
        `${c.nom} ${c.reference}`
            .toLowerCase()
            .includes(query.toLowerCase())
        ));
    }, [query, composants]);

   

    function updateField<K extends keyof FormValues>(
        key: K,
        value: FormValues[K]
    ) {
        setForm((prev) => ({
        ...prev,
        [key]: value,
        }));
    }
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError(null);


        try {
        const res = await fetch(`/api/projets/${idProjet}/bom`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) {
                // Normalize backend validation errors (arrays/objects) to a readable string
                const payload = data.error ?? data.detail ?? data;
                let message = "Erreur";
                if (Array.isArray(payload)) {
                    message = payload
                        .map((item: any) => item.msg || item.message || JSON.stringify(item))
                        .join("; ");
                } else if (typeof payload === "string") {
                    message = payload;
                } else if (typeof payload === "object" && payload !== null) {
                    // If it's an object like {detail: [...]}
                    if (Array.isArray((payload as any).detail)) {
                        message = (payload as any).detail
                            .map((it: any) => it.msg || it.message || JSON.stringify(it))
                            .join("; ");
                    } else {
                        message = JSON.stringify(payload);
                    }
                }
                setError(message);
            return;
        }

        setForm({
            composant_id: 0,
            qte_requise: 1,
        });

        setLineBOM((prev) => [...prev, data]);

        loadProjet(); // Recharger les données du projet pour mettre à jour le BOM et le budget consommé
        alert("Composant ajouté !");
        } catch (err) {
        setError("Erreur serveur");
        } finally {
        setLoading(false);
        }
    }

    if (loadingProjet) {
        return <p>Chargement du projet…</p>;
    }

    if (projError) {
        return <p className="text-red-500">{projError}</p>;
    }

    if (!projet) {
        return <p>Projet introuvable.</p>;
    }



    const handleSubmit = async (C : UpdateBOMInput ) => {
        const qty = Number(C.qte_requise);
        const id_composant = C.composant_id;
        if (!idProjet || !id_composant) {
            setError("IDs manquants");
            return;
        }

        if (!Number.isFinite(qty) || qty <= 0) {
            setError("La quantité doit être > 0");
            return;
        }

        try {
        setLoading(true);
        setError("");

        await updateProjetBOM(idProjet, id_composant, qty);

        setLineBOM((prev) =>
            prev.map((l) =>
                l.composant_id === id_composant ? { ...l, qte_requise: qty } : l
            )
        );
        await loadProjet();

        setOpen(false);
        setFormUpdate(undefined);
        } catch (e: any) {
        setError(e?.message || "Erreur update BOM");
        } finally {
        setLoading(false);
        }
    };



    // Logique metier :      
    const ratio = projet.budget_alloue > 0
    ? projet.budget_consomme / projet.budget_alloue
    : 0;

    const progress = Math.min(ratio * 100, 100);
    const state = getProgressState(ratio);
    const remaining = projet.budget_alloue - projet.budget_consomme;

    const progressClassName =
        state === "over"
        ? "[&>div]:bg-red-500"
        : state === "warning"
        ? "[&>div]:bg-amber-500"
        : "[&>div]:bg-emerald-500";

    return (
        <>
            <Card className="group overflow-hidden border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
                <CardHeader className="space-y-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white pb-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                    <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold tracking-tight">
                        {projet.nom}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4" />
                        Créé le {formatDate(projet.date)}
                        </CardDescription>
                    </div>

                    <CardAction className="shrink-0">
                        <Badge
                        variant={projet.statut === "actif" ? "default" : "secondary"}
                        className={
                            projet.statut === "actif"
                            ? "bg-emerald-600 text-white hover:bg-emerald-600"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                        }
                        >
                        {projet.statut === "actif" ? "Actif" : "Archivé"}
                        </Badge>
                    </CardAction>
                    </div>

                    <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Budget suivi
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                        <Euro className="h-3.5 w-3.5" />
                        {formatCurrency(projet.budget_alloue)}
                    </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-5">
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {projet.description ?? "Aucune description renseignée pour ce projet."}
                    </p>

                    <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                        Budget consommé
                        </span>
                        <span className="tabular-nums text-slate-600 dark:text-slate-300">
                        {formatCurrency(projet.budget_consomme)} / {formatCurrency(projet.budget_alloue)}
                        </span>
                    </div>

                    <Progress value={progress} className={`h-2 ${progressClassName}`} />

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                        {state === "over"
                            ? "Budget dépassé"
                            : state === "warning"
                            ? "Budget proche de la limite"
                            : "Budget sous contrôle"}
                        </span>
                        <span className="tabular-nums">
                        {progress.toFixed(0)}%
                        </span>
                    </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Restant</p>
                        <p className={`mt-1 text-sm font-semibold tabular-nums ${remaining < 0 ? "text-red-600" : "text-slate-900 dark:text-slate-100"}`}>
                        {formatCurrency(remaining)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">ID projet</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        #{projet.id_projet}
                        </p>
                    </div>
                    </div>
                    <Separator />

                    {/* BILL OF MATERIAL (BOM) TABLE */}
                    <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="sticky top-0 z-10 bg-slate-50/90 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200 flex items-center justify-between">
                            Bill of Material
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setOpenAdd(true)}
                            >
                                <FaPlus size={12} />
                            </Button>
                        </div>

                        {composants.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[30%]">ID du Composant</TableHead>
                                        <TableHead className="w-[55%]">Nom du Composant</TableHead>
                                        <TableHead className="w-[15%] text-right">Quantité</TableHead>
                                        <TableHead className="w-[15%] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lineBOM.map((c) => (
                                        <TableRow
                                            key={c.composant_id}
                                            className="group/item transition hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                                        >
                                            <TableCell className="font-medium">{c.composant_id}</TableCell>
                                            <TableCell>{composants.find((comp) => comp.id_composant === c.composant_id)?.nom || "Composant inconnu"}</TableCell>
                                            <TableCell className="text-right tabular-nums items-center-safe">
                                            {typeof c.qte_requise === "number" ? c.qte_requise : `${c.qte_requise}`}
                                            </TableCell>
                                            <TableCell className=" w-30">
                                                <div className="flex justify-end gap-2 ">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setFormUpdate({ composant_id: c.composant_id, qte_requise: Number(c.qte_requise) });
                                                            setError(null);
                                                            setOpen(true);
                                                        }}
                                                    >
                                                        <FaEdit size={12} />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        onClick={() => Delete(c)}
                                                    >
                                                        <FaTrash size={12} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            ) : (
                                <div className="flex h-20 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                     Aucun composant dans ce projet.
                                </div>
                            )}
                    </div>
                </CardContent>

        
            </Card>

            <Separator/>
            
           <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800">
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                        <DialogTitle className="text-xl font-semibold tracking-tight">
                        Ajouter une ligne BOM
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                        Associer un composant du stock à ce projet avec une quantité.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onSubmit}>
                        <Card className="border-0 shadow-none bg-transparent">
                        <CardContent className="px-6 py-6 space-y-6">
                            <div className="space-y-2">
                            <label
                                htmlFor="composant-select"
                                className="text-sm font-medium text-slate-700 dark:text-slate-200"
                            >
                                Composant
                            </label>
                            
                            <Select
                                value={String(form.composant_id || "")}
                                onValueChange={(val) =>
                                updateField("composant_id", Number(val))
                                }
                            >

                                <SelectTrigger
                                id="composant-select"
                                className="w-full h-11 rounded-xl"
                                >
                                
                                <SelectValue placeholder="Choisir un composant" />
                                </SelectTrigger>
                               
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                            placeholder="Rechercher par nom, référence, ..."
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                
                                <SelectContent>
                                    
                                    {Searchedcomposants.map((c) => (
                                        <SelectItem
                                        key={c.id_composant}
                                        value={String(c.id_composant)}
                                        >
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{c.nom}</span>
                                            <span className="text-slate-500 text-xs">
                                            ({c.reference})
                                            </span>
                                        </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            </div>

                            <div className="space-y-2">
                            <label
                                htmlFor="qte"
                                className="text-sm font-medium text-slate-700 dark:text-slate-200"
                            >
                                Quantité
                            </label>
                            <Input
                                id="qte"
                                type="number"
                                min={1}
                                inputMode="numeric"
                                value={form.qte_requise}
                                onChange={(e) =>
                                updateField("qte_requise", Number(e.target.value))
                                }
                                placeholder="1"
                                className="h-11 rounded-xl"
                            />
                            </div>

                            {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                {error}
                            </div>
                            )}

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpenAdd(false)}
                                className="rounded-xl"
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-xl"
                                disabled={loading}
                            >
                                {loading ? "Ajout en cours..." : "Ajouter au projet"}
                            </Button>
                            </div>
                        </CardContent>
                        </Card>
                    </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal d'édition de la quantité dans le BOM (à implémenter) */}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mettre à jour le BOM</DialogTitle>
                        <DialogDescription>
                            Modifie la quantité requise pour ce composant.
                        </DialogDescription>
                    </DialogHeader>
                    {formUpdate && (
                        <div className="grid gap-3 py-4">
                        <label className="text-sm font-medium">Quantité requise</label>
                        <span className="text-xs text-slate-500">
                           #{formUpdate.composant_id} Composant: {composants.find((comp) => comp.id_composant === formUpdate.composant_id)?.nom || "Inconnu"}
                        </span>
                        <Input
                            id="qte_requise"
                            type="number"
                            min={1}
                            value={ formUpdate?.qte_requise !== undefined
                                    ? String(formUpdate.qte_requise)
                                    : qteRequise
                            }
                            onChange={(e) => setFormUpdate({ ...formUpdate, qte_requise: Number(e.target.value) })}
                            placeholder="Ex: 10"
                        />

                        {error && <p className="text-sm text-red-600">{error}</p>}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button type="button" onClick={() => handleSubmit(formUpdate!)} disabled={loading}>
                            {loading ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
        
    );
}