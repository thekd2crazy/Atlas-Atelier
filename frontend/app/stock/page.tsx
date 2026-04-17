'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, ClipboardList, Cpu, CpuIcon, Filter, MapPin, Package, Plus, Search, User } from "lucide-react"  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHeader, TableRow, TableBody, TableHead } from "@/components/ui/table";
import { UUID } from "crypto";
import { FaChartSimple } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { getAllComponents } from "../api/stock/id/route";

type component = {
    id : Int16Array
    nom : string
    categorie : string
    reference : string 
    emplacement : string 
    quantite : string
    prix : string
    photo_url : string 
}

type ComposantCreate = {
  nom: string;
  reference: string;
  categorie: string;
  prix: number;
  emplacement: string;
  quantite: number;
  photo_url: string;
};

export default async function StockPage () {
    const [components, setComponents] = useState<component[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const Components = await getAllComponents();

    // Formulaire de création de client
    const [newComponent, setNewComponent] = useState({
        categorie: "",
        reference: "",
        emplacement: "",
        quantite: "",
        description: "",  
    })

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Composants</h1>
                    <p className="text-muted-foreground mt-1">
                    Gérez stock de Composants
                    </p>
                </div>
                <Button >
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
                        <div className="text-2xl font-bold">{Object.keys(CAT_CONFIG).length}</div>
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
                                    placeholder="Rechercher par nom, email, entreprise..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filtrer par statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Tous les catégories</SelectItem>
                                    <SelectItem value="alimentaire">Alimentaire</SelectItem>
                                    <SelectItem value="electronique">Electronique</SelectItem>
                                    <SelectItem value="mecanique">Mécanique</SelectItem>
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
                                    Components.map((component) => {
                                            return (
                                            <TableRow
                                                key={String(component.id)}
                                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <div className="font-medium">{component.nom}</div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm">
                                                    <Box className="h-3 w-3 text-muted-foreground" />
                                                    {component.reference}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm">
                                                    <Box className="h-3 w-3 text-muted-foreground" />
                                                    {component.categorie}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {component.emplacement ? (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        {component.emplacement}
                                                    </div>
                                                    ) : (
                                                    "-"
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {component.quantite !== undefined ? (
                                                    <span>{component.quantite}</span>
                                                    ) : (
                                                    "-"
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {component.prix !== undefined ? (
                                                    <span>{component.prix} €</span>
                                                    ) : (
                                                    "-"
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {component.photo_url ? (
                                                    <img
                                                        src={component.photo_url}
                                                        alt={component.nom}
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


            </div>
        </div>
    );
}