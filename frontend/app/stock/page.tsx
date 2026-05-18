'use client';
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, ClipboardList, Cpu, CpuIcon, Filter, MapPin, Package, Plus, Search, User } from "lucide-react"  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHeader, TableRow, TableBody, TableHead } from "@/components/ui/table";
import { UUID } from "crypto";
import { FaChartSimple } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Composant, ComposantCreate } from "@/types/type-composant";
import { AddComposant, DeleteComposant, UpdateComposant } from "@/lib/stock-api";
import { NextResponse } from "next/server";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FaSave, FaServicestack, FaTrash } from "react-icons/fa";


export default function StockPage () {
    const router = useRouter();
    const [components, setComponents] = useState<Composant[]>([]);
    const [loading, setLoading] = useState(true);


    
    // Chargement de donner qui s'effectue qu'au chargement de la page  
    useEffect(() => {
        async function loadComponents() {
            try {
                setLoading(true);
                const res = await fetch('/api/stock');
                if (!res.ok) {
                    console.error('API Status:', res.status, await res.text());
                    setComponents([]);  // Liste vide
                    return;
                }
                const data: Composant[] = await res.json();
                setComponents(data);
            } catch (error) {
                console.error('Fetch error:', error);
                setComponents([]);
            } finally {
                setLoading(false);
            }
        }

        loadComponents();
        
    }, []);

    

             
// Systeme de filtrage : 
    // Configuration des categories 
    const CAT_CONFIG = {
        mechanical : {
            label: "Mécanique",
            color: "bg-bleu-300",
        },
        electronic: {
            label: "Electronique",
            color : "bg-green-300"    
        },
        food : {
            label : "Alimentaire",
            color : "bg-red-300",
        },
    }

    const categories =  ["all", "Mécanique", "Electronique", "Entretien", "Consommable", "Outil" ];
    const [searchTerm, setSearchTerm] = useState("");
    const [category, setCategoryStatus] = useState("all");

    const filtered = useMemo(() =>{
        return components.filter((Composant) =>{
            const q =  searchTerm.toLowerCase();
            const matchesSearch = 
            Composant.nom.toLowerCase().includes(q)||
            Composant.reference.toLowerCase().includes(q);
            
            const matchesCategory = category === "all" || Composant.categorie ===  category;
            return matchesSearch && matchesCategory;

        })
        
    }, [searchTerm, category, components]);
 
    
    // Page Creation de composant.
    const [open, setOpen] = useState<boolean>(false);
    const [form, setForm] = useState<ComposantCreate>({
        nom: "",
        reference: "",
        categorie: "",
        prix: 0,
        emplacement: "",
        quantite: 0,
        photo_url: "",
        description : "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
        ...prev,
        [name]: name === "prix" || name === "quantite" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Composant à créer :", form);
        try{
            // Ici tu peux appeler une API / server action
            const res = await AddComposant(form);
            setForm({
                nom: "",
                reference: "",
                categorie: "",
                prix: 0,
                emplacement: "",
                description: "",
                quantite: 0,
                photo_url: "",
            }); // reset le formulaire important !
            setOpen(false);
        } 
        catch (error) {
            return console.log("Creation impossible !")
        }
    };
    

    const refresh = () => router.refresh();

    //Page pour modifier les compsants : 
    const [editOpen, setEditOpen] = useState<boolean>(false);
    const [currentComposant, setCurrentComposant] = useState<Composant>();

    const handleDelete = async () => {
        if (!currentComposant) {
            return;
        }
        const confirmed = window.confirm("Supprimer ce composant ?");
        if (!confirmed) {
            return;
        }
        try {
            await DeleteComposant(currentComposant.id_composant);
            setComponents((prev) =>
                prev.filter((c) => c.id_composant !== currentComposant.id_composant)
            );
            setEditOpen(false);
            setCurrentComposant(undefined);
        } catch (err) {
            console.error("Echec de la suppression", err);
            alert("Impossible de supprimer le composant.");
        }
    };

    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Composants</h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez stock de Composants
                    </p>
                </div>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un Composant
                </Button>
            </div>


            {/* Statistiques */}
            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Composants</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{components.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de catégories</CardTitle>
                        <FaChartSimple className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Object.keys(categories).length}</div>
                    </CardContent>
                </Card>
                
                {/* Filtres */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Rechercher par nom, référence, ..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={category} onValueChange={setCategoryStatus}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filtrer par categorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les catégories</SelectItem>
                                    <SelectItem value="Mécanique">Mécanique</SelectItem>
                                    <SelectItem value="Electronique">Electronique</SelectItem>
                                    <SelectItem value="Consommable">Consommable</SelectItem>
                                    <SelectItem value="Outil">Outil</SelectItem>
                                    <SelectItem value="Entretien">Entretien</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Table des clients */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        Composant ({components.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                    
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Référence</TableHead>
                                <TableHead>Emplacement</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Prix</TableHead>
                                <TableHead>Url-photo</TableHead>
                                                
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                                {

                                    filtered.map((c) => {

                                            return (
                                                <TableRow
                                                    onClick={() => router.push(`/stock/${c.id_composant}`)} 
                                                    key={c.id_composant|| crypto.randomUUID()}
                                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                    >
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                        <FaServicestack className="h-4 w-4 text-muted-foreground" />
                                                        <div className="font-medium">{c.nom.split("/")[0].trim()}</div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm">
                                                        <Box className="h-3 w-3 text-muted-foreground" />
                                                        {c.categorie}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm">
                                                        <Box className="h-3 w-3 text-muted-foreground" />
                                                        {c.reference}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        {c.emplacement ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                                            {c.emplacement}
                                                        </div>
                                                        ) : (
                                                        "-"
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {c.quantite !== undefined ? (
                                                        <span>{c.quantite}</span>
                                                        ) : (
                                                        "-"
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {c.prix !== undefined ? (
                                                        <span>{c.prix} €</span>
                                                        ) : (
                                                        "-"
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {c.photo_url ? (
                                                        <img
                                                            src={c.photo_url.split(",")[0].trim()} // Enlève les paramètres de l'URL si présents
                                                            alt={c.nom}
                                                            className="h-10 w-10 object-cover rounded"
                                                        />
                                                        ) : (
                                                        "-"
                                                        )}
                                                    </TableCell>
                                                    
                                                </TableRow>
                                            )
                                })}    
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Dialog open={open} onOpenChange={setOpen}>
                    
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Ajouter un composant</DialogTitle>
                            <DialogDescription>
                                Remplissez les champs ci‑dessous pour ajouter un nouveau composant.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nom">Nom</Label>
                                    <Input
                                        id="nom"
                                        name="nom"
                                        value={form.nom}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reference">Référence</Label>
                                    <Input
                                        id="reference"
                                        name="reference"
                                        value={form.reference}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="categorie">Catégorie</Label>
                                <Input
                                id="categorie"
                                name="categorie"
                                value={form.categorie}
                                onChange={handleChange}
                                required
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prix">Prix (€)</Label>
                                    <Input
                                        id="prix"
                                        name="prix"
                                        type="number"
                                        step="0.01"
                                        value={form.prix || ""}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantite">Quantité</Label>
                                    <Input
                                        id="quantite"
                                        name="quantite"
                                        type="number"
                                        value={form.quantite || ""}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emplacement">Emplacement</Label>
                                    <Input
                                        id="emplacement"
                                        name="emplacement"
                                        value={form.emplacement}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="photo_url">URL de la photo</Label>
                                <Input
                                id="photo_url"
                                name="photo_url"
                                type="url"
                                value={form.photo_url}
                                onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description"> Description </Label>
                                <Textarea
                                    name="description"
                                    placeholder="Décrivez le composant..."
                                    className="resize-vertical min-h-20"  // Tailwind resize
                                    rows={3}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="w-full">
                                Enregistrer le composant
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            
            {/*Modification du composant */}
               <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>Modifier le composant</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations du composant.
                    </DialogDescription>
                    </DialogHeader>

                    {currentComposant && (
                        <form
                            onSubmit={async (e) => {
                            e.preventDefault();

                            // Met à jour le composant (via API / server action)
                            // Ici, tu peux appeler par exemple:
                            try {
                                const updated = await UpdateComposant(
                                currentComposant.id_composant,
                                currentComposant
                                );

                                // 1. Mettez à jour localment les componsants modifiés

                                setComponents((prev) =>
                                prev.map((c) => (c.id_composant === updated.id_composant ? updated : c))
                                );

                                setEditOpen(false);
                            } catch (err) {
                                console.error("Échec de la mise à jour", err);
                                alert("Impossible de mettre à jour le composant.");
                            }      
                            
                            }}
                            className="space-y-4 py-2"
                        >
                            <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-nom">Nom</Label>
                                <Input
                                id="edit-nom"
                                value={currentComposant.nom}
                                onChange={(e) =>
                                    setCurrentComposant({
                                    ...currentComposant,
                                    nom: e.target.value,
                                    })
                                }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-reference">Référence</Label>
                                <Input
                                id="edit-reference"
                                value={currentComposant.reference}
                                onChange={(e) =>
                                    setCurrentComposant({
                                    ...currentComposant,
                                    reference: e.target.value,
                                    })
                                }
                                />
                            </div>
                            </div>

                            <div className="space-y-2">
                            <Label htmlFor="edit-categorie">Catégorie</Label>
                            <Input
                                id="edit-categorie"
                                value={currentComposant.categorie}
                                onChange={(e) =>
                                setCurrentComposant({
                                    ...currentComposant,
                                    categorie: e.target.value,
                                })
                                }
                            />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-prix">Prix (€)</Label>
                                    <Input
                                    id="edit-prix"
                                    type="number"
                                    step="0.01"
                                    value={currentComposant.prix || ""}
                                    onChange={(e) =>
                                        setCurrentComposant({
                                        ...currentComposant,
                                        prix: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-quantite">Quantité</Label>
                                    <Input
                                    id="edit-quantite"
                                    type="number"
                                    value={currentComposant.quantite || ""}
                                    onChange={(e) =>
                                        setCurrentComposant({
                                        ...currentComposant,
                                        quantite: parseInt(e.target.value, 10) || 0,
                                        })
                                    }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-emplacement">Emplacement</Label>
                                    <Input
                                    id="edit-emplacement"
                                    value={currentComposant.emplacement || ""}
                                    onChange={(e) =>
                                        setCurrentComposant({
                                        ...currentComposant,
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
                                value={currentComposant.photo_url || ""}
                                onChange={(e) =>
                                setCurrentComposant({
                                    ...currentComposant,
                                    photo_url: e.target.value,
                                })
                                }
                            />
                            </div>

                            <DialogFooter className="flex items-center ">
                                <div className="mx-2">
                                    <Button type="submit" className="w-auto">
                                        <FaSave size={16}/>
                                        Save
                                    </Button>
                                </div>
                                <div className="mx-">
                                    <Button type="button" className="w-auto" onClick={handleDelete}>
                                        <FaTrash size={16}/>
                                        Delete
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
                </Dialog>                 

            </div>
        </div>
    );
}