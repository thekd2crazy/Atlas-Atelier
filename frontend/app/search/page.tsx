"use client";

import { useMemo, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Search,
  SlidersHorizontal,
  Layers3,
  PackageSearch,
  Sparkles,
  Loader2,
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
    setFiles((prev) => [...prev, ...acceptedFiles]);
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

  return (
    <>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <Card className="border-slate-200/70 shadow-lg shadow-slate-200/50">
                    <CardHeader className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            <span>Recherche textuelle intelligente</span>
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <CardTitle className="text-2xl md:text-3xl">
                            Rechercher un composant
                            </CardTitle>
                            <CardDescription className="mt-1 max-w-2xl">
                            Tape un nom, une référence, un emplacement ou un mot-clé pour retrouver rapidement un élément.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <PackageSearch className="h-4 w-4" />
                            <span>{filtered.length} résultat(s)</span>
                        </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher : résistance, STM32, A1-03..."
                                className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                            {categories.map((cat) => (
                                <Button
                                key={cat}
                                variant={category === cat ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCategory(cat)}
                                className="rounded-full"
                                >
                                {cat === "all" ? "Toutes catégories" : cat}
                                </Button>
                            ))}
                        </div>

                        <Separator />

                        <Tabs defaultValue="cards" className="space-y-4">
                            <TabsList className="grid w-fit grid-cols-2 rounded-full bg-slate-100 p-1">
                                <TabsTrigger value="cards" className="rounded-full px-4">
                                Cartes
                                </TabsTrigger>
                                <TabsTrigger value="detail" className="rounded-full px-4">
                                Détails
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="cards" className="mt-0">
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filtered.map((item) => (
                                    <Card
                                    key={item.id}
                                    className="group border-slate-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                                    >
                                    <CardHeader className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-lg">{item.nom}</CardTitle>
                                            <CardDescription>{item.reference}</CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="rounded-full">
                                            {item.categorie}
                                        </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-slate-500">Emplacement</p>
                                            <p className="font-medium">{item.emplacement}</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-slate-500">Quantité</p>
                                            <p className="font-medium">{item.quantite}</p>
                                        </div>
                                        </div>

                                        <p className="text-sm leading-6 text-slate-600">
                                        {item.description}
                                        </p>
                                    </CardContent>
                                    </Card>
                                ))}
                                </div>

                                {filtered.length === 0 && (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                                    <Layers3 className="mb-3 h-10 w-10 text-slate-400" />
                                    <p className="text-base font-medium">Aucun résultat trouvé</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Essaie un autre mot-clé ou enlève un filtre.
                                    </p>
                                    </CardContent>
                                </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="detail" className="mt-0">
                                <Card className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                    {filtered.map((item) => (
                                        <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50"
                                        >
                                        <div>
                                            <p className="font-medium">{item.nom}</p>
                                            <p className="text-sm text-slate-500">
                                            {item.reference} • {item.emplacement}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{item.quantite} pcs</Badge>
                                        </div>
                                    ))}
                                    </div>
                                </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        


                    </CardContent>
                    

            </Card>

            <Separator/>

            <Card className="border-slate-200/70 shadow-lg shadow-slate-200/50">
                <CardHeader className="pb-6">
                    <CardTitle className="text-2xl flex items-center gap-3">
                        <UploadCloud className="h-8 w-8 text-indigo-600" />
                        Zone de dépôt
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Glisse-dépose tes fichiers ou clique pour parcourir
                    </CardDescription>
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
                            onClick={() => setFiles([])}
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
                            </div>
                        ))}

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
                                    <p className="text-sm text-slate-500">{r.categorie}</p>
                                    <p className="text-xs text-slate-500">
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
    </>
  );
}