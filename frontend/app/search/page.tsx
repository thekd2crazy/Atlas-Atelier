"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Search,
  SlidersHorizontal,
  Layers3,
  PackageSearch,
  Sparkles,
  Loader2,
  DatabaseZap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import FileDropZone from "../components/FileDrop";

import {
  UploadCloud,
  Image,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { RenderResultMetadata } from "next/dist/server/render-result";

type Item = {
  id: number;
  nom: string;
  reference: string;
  categorie: string;
  emplacement: string;
  quantite: number;
  description: string;
};

const data: Item[] = [
  {
    id: 1,
    nom: "Résistance 1kΩ 1/4W",
    reference: "RES-1K-0603",
    categorie: "Electronique",
    emplacement: "ELEC-A1-03",
    quantite: 250,
    description: "Résistance de précision pour prototypage.",
  },
  {
    id: 2,
    nom: "STM32F103C8T6",
    reference: "MCU-STM32F103",
    categorie: "Microcontrôleur",
    emplacement: "IC-B2-01",
    quantite: 18,
    description: "Microcontrôleur ARM Cortex-M3 pour cartes embarquées.",
  },
  {
    id: 3,
    nom: "Roulement 608ZZ",
    reference: "BEARING-608ZZ",
    categorie: "Mécanique",
    emplacement: "MECA-D4-11",
    quantite: 42,
    description: "Roulement standard pour pièces mobiles.",
  },
];

type ResultMeta = {
  nom: string;
  categorie: string;
  emplacement: string;
};

export default function SearchPage() {
  
{/* Filtrage intelligent */}    
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        item.nom.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.emplacement.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      const matchesCategory = category === "all" || item.categorie === category;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, category]);

  const categories = ["all", "Électronique", "Microcontrôleur", "Mécanique"];

{/* Drag and Drop zone  */} 
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
  setFiles((prev) => {
    const merged = [...prev, ...acceptedFiles];

    return merged.filter(
      (file, index, self) =>
        index ===
        self.findIndex(
          (f) => f.name === file.name && f.size === file.size
        )
    );
  });
}, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".webp"],
        "application/pdf": [".pdf"],
      },
      maxSize: 10 * 1024 * 1024, // 10Mo
      maxFiles: 10,
    });

  const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

  const clearAll = () => setFiles([]);

  // Requete dans le Backend :
  const [results, setResults] = useState<ResultMeta[]>([]);
  const [errorSearch, setErrorSearch] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  /**
   * Ingestion / (ré)indexation des composants dans la base vectorielle (Chroma).
   *
   * Quand faut-il lancer l'ingestion ?
   *  - Après un import Excel (ou tout ajout en masse) de composants.
   *  - Après avoir ajouté/modifié des composants dont le champ `photo_url` a changé.
   *  - Lorsque la recherche par image ne retourne aucun résultat alors qu'un
   *    composant correspondant existe bien en stock (indice : index désynchronisé).
   *  - À la toute première mise en service de l'environnement, si l'index Chroma
   *    est vide.
   *
   * À NE PAS lancer :
   *  - Après une simple modif de quantité/emplacement (ces champs ne sont pas
   *    embeddés — relancer ne sert à rien).
   *  - En production pendant un pic d'utilisation : l'opération télécharge et
   *    embed toutes les images des nouveaux composants, c'est long et bloquant.
   *
   * Le bouton ouvre un dialog de confirmation avant tout déclenchement.
   */
  const [openIngest, setOpenIngest] = useState<boolean>(false);
  const [loadingIngest, setLoadingIngest] = useState<boolean>(false);

  const handleIngestion = async () => {
    try {
      setLoadingIngest(true);
      const res = await fetch("/api/ingestion", { method: "POST" });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${txt}`);
      }

      toast.success("Ingestion terminée — index vectoriel à jour");
      setOpenIngest(false);
    } catch (err: any) {
      console.error("Erreur ingestion :", err);
      toast.error(err?.message ?? "Impossible de lancer l'ingestion");
    } finally {
      setLoadingIngest(false);
    }
  };

  const handleSearch = async () => {
    if (files.length === 0) return;
    const file = files[0];

    try {
      setLoadingSearch(true);
      setErrorSearch(null);
      setResults([]);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/search", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt}`);
      }

      const data = await res.json();
      // FastAPI renvoie results["metadatas"] → liste de dicts
      setResults(data as ResultMeta[]);
    } catch (err: any) {
      console.error("Erreur recherche image:", err);
      setErrorSearch(err.message ?? "Erreur lors de la recherche");
    } finally {
      setLoadingSearch(false);
    }
  };

    const [query, setQuery] = useState("");
    const [resultstext, setResultstext] = useState<Composant[]>([]);
    const [loading, setLoading] = useState(false);

    // 🔥 debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!query.trim()) {
                setResultstext([]);
                return;
            }

            handleSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearchText = async (value: string) => {
        try {
            setLoading(true);

            const data = await rechercheTexte(value);
            setResultstext(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

  return (
    <>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <Card className="w-full max-w-xl border-muted/60 shadow-sm">
                <CardContent className="space-y-4 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un composant..."
                    className="pl-9"
                    />
                </div>

                {loading && (
                    <div className="space-y-2">
                    <Skeleton className="h-14 w-full rounded-md" />
                    <Skeleton className="h-14 w-full rounded-md" />
                    <Skeleton className="h-14 w-full rounded-md" />
                    </div>
                )}

                {!loading && (
                    <div className="space-y-2">
                    {resultstext.map((item) => (
                        <div
                        key={item.id_composant}
                        className="flex items-center justify-between rounded-md border bg-background p-3 transition-colors hover:bg-muted/50"
                        >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.nom}</p>
                            <p className="truncate text-xs text-muted-foreground">
                            {item.reference}
                            </p>
                        </div>

                        <Badge variant="secondary" className="ml-3 shrink-0">
                            {item.categorie}
                        </Badge>
                        </div>
                    ))}
                    </div>
                )}

                {query && !loading && results.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun résultat trouvé.</p>
                )}
                </CardContent>
            </Card>  

            <Separator/>

            <Card className="border-slate-200/70 shadow-lg shadow-slate-200/50">
                <CardHeader className="pb-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-3">
                                <UploadCloud className="h-8 w-8 text-indigo-600" />
                                Zone de dépôt
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Glisse-dépose tes fichiers ou clique pour parcourir
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setOpenIngest(true)}
                            disabled={loadingIngest}
                            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            <DatabaseZap className="h-4 w-4" />
                            Lancer l'ingestion
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                   {/* ZONE CENTRALE DRAG & DROP */}
                    <section
                    {...getRootProps()}
                    className={`
                        relative p-12 border-4 rounded-3xl text-center cursor-pointer
                        transition-all duration-300 group
                        ${isDragActive
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-2xl ring-4 ring-indigo-200/50"
                        : isDragReject
                        ? "border-red-500 bg-red-50/50 shadow-lg ring-4 ring-red-200/50"
                        : "border-dashed border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50"
                        }
                    `}
                    >
                        <input {...getInputProps()} className="absolute inset-0 opacity-0" />
                        
                        {/* Animation drag active */}
                        {isDragActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl animate-pulse" />
                        )}

                        {/* Icône principale */}
                        <div className="relative z-10 space-y-4 mb-6">
                            <div className={`w-24 h-24 mx-auto rounded-2xl p-6 flex items-center justify-center transition-all ${
                            isDragActive 
                                ? "bg-indigo-500 shadow-2xl shadow-indigo-500/25" 
                                : "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-indigo-100"
                            }`}>
                                <UploadCloud 
                                    className={`h-12 w-12 transition-all ${
                                    isDragActive 
                                        ? "text-white drop-shadow-lg" 
                                        : "text-slate-400 group-hover:text-indigo-500"
                                    }`} 
                                />
                            </div>

                            {/* Messages */}
                            <div className="space-y-2">
                                {isDragActive ? (
                                    <>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            Parfait !
                                        </p>
                                        <p className="text-xl font-semibold text-slate-700">
                                            Dépose tes fichiers
                                        </p>
                                    </>
                                    ) : isDragReject ? (
                                        <>
                                            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                                            <p className="text-xl font-semibold text-red-600">
                                                Fichiers refusés
                                            </p>
                                            <p className="text-sm text-red-500">
                                                Formats non supportés ou trop volumineux
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-slate-900">
                                                Glisse-dépose
                                            </p>
                                            <p className="text-lg text-slate-600">
                                                ou clique pour parcourir
                                            </p>
                                        </>
                                )}
                            </div>

                            {/* Infos techniques */}
                            <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-500 bg-slate-100/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                <span>Images: JPG, PNG, WebP</span>
                                <span>•</span>
                                <span>PDF supporté</span>
                                <span>•</span>
                                <span>Max 10Mo/fichier</span>
                            </div>
                        </div>    
                    </section> 
                    {/* LISTE FICHIERS */}
                    {files.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                            {files.length}/10 fichiers
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                            {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1)} Mo
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="text-sm"
                        >
                            Tout effacer
                        </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {files.map((file, index) => (
                                <div
                                key={index}
                                className="group relative p-3 bg-gradient-to-br from-white/70 to-slate-50 rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden h-28 flex flex-col"
                                >
                                {/* Icône fichier */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    {file.type.startsWith("image/") ? (
                                        <Image className="h-4 w-4 text-indigo-600" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-slate-600" />
                                    )}
                                    </div>
                                    <span className="text-xs font-medium text-slate-900 truncate flex-1">
                                    {file.name}
                                    </span>
                                </div>

                                {/* Taille */}
                                <p className="text-xs text-slate-500">
                                    {(file.size / 1024).toFixed(1)} Ko
                                </p>

                                {/* Bouton supprimer */}
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-white/90 hover:bg-white transition-all shadow-lg"
                                >
                                    <X className="h-3 w-3 text-slate-500" />
                                </button>

                                
                                </div>
                            ))}

                        {/* BOUTON RECHERCHE */}
                        <div className="flex justify-end">
                            <Button
                            onClick={handleSearch}
                            disabled={files.length === 0 || loadingSearch}
                            className="flex items-center gap-2"
                            >
                                {loadingSearch ? (
                                    <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Recherche en cours...
                                    </>
                                ) : (
                                    <>
                                    <Search className="h-4 w-4" />
                                    Rechercher à partir de cette image
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* ERREUR RECHERCHE */}
                        {errorSearch && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                            {errorSearch}
                            </div>
                        )}

                        {/* RÉSULTATS RECHERCHE */}
                        {results.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Search className="h-4 w-4 text-indigo-600" />
                                Résultats similaires
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {results.map((r, idx) => (
                                <Card key={idx} className="border-slate-200">
                                    <CardContent className="p-4 space-y-1">
                                        <p className="font-medium">{r.nom}</p>
                                        <p className="text-sm text-black">{r.categorie}</p>
                                        <p className="text-xs text-black">
                                            Emplacement : {r.emplacement}
                                        </p>
                                    </CardContent>
                                </Card>
                                ))}
                            </div>
                             </div>        
                            
                        )}
                        </div>
                    </div>
                    )}
                </CardContent>                      
            </Card>


            </div>
        </div>

        {/* Dialog de confirmation avant le lancement de l'ingestion */}
        <Dialog open={openIngest} onOpenChange={(o) => !loadingIngest && setOpenIngest(o)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DatabaseZap className="h-5 w-5 text-indigo-600" />
                        Lancer l'ingestion ?
                    </DialogTitle>
                    <DialogDescription className="space-y-2 pt-2">
                        <span className="block">
                            Cette opération réindexe tous les composants ayant une
                            <span className="font-medium"> photo_url</span> dans la base
                            vectorielle (Chroma) utilisée par la recherche par image.
                        </span>
                        <span className="block text-amber-700">
                            ⚠ Le processus télécharge et embed chaque image — cela peut
                            prendre plusieurs minutes et bloque le backend pendant ce temps.
                        </span>
                        <span className="block">
                            Confirme-tu le lancement ?
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => setOpenIngest(false)}
                        disabled={loadingIngest}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleIngestion}
                        disabled={loadingIngest}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loadingIngest ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Ingestion en cours...
                            </>
                        ) : (
                            <>
                                <DatabaseZap className="mr-2 h-4 w-4" />
                                Confirmer et lancer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}