"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import {
  Archive,
  Plus,
  CheckCircle2,
  Check,
  Clock,
  FolderOpen,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Edit3,
  DollarSign,
  FileText,
  CalendarPlus2,
} from "lucide-react"
import { NewProjet } from "@/types/type-projet";

interface Projet {
  id_projet: number
  nom: string
  budget_alloue: number
  budget_consomme: number
  description: string | null
  date: string
  statut: "actif" | "archive"
}

export default function ProjetsDashboard() {
  
    const [projets, setProjets] = useState<Projet[]>([
    {
      id_projet: 1,
      nom: "Projet PCB Alim 12V",
      budget_alloue: 2500,
      budget_consomme: 1800,
      description: "Conception d'une alimentation 12V pour système embarqué",
      date: "2026-04-15",
      statut: "actif",
    },
    {
      id_projet: 2,
      nom: "Système Capteurs IoT",
      budget_alloue: 3200,
      budget_consomme: 890,
      description: "Développement de capteurs connectés pour agriculture",
      date: "2026-05-01",
      statut: "actif",
    },
    {
      id_projet: 3,
      nom: "Contrôleur Moteur Brushless",
      budget_alloue: 4500,
      budget_consomme: 4100,
      description: "Contrôleur pour moteur brushless haute puissance",
      date: "2026-03-20",
      statut: "actif",
    },
  ])
  const [filtre, setFiltre] = useState<"tous" | "actif" | "archive">("tous")
  const [recherche, setRecherche] = useState("")
  const [dialogOuvert, setDialogOuvert] = useState(false)

  const [nouveauProjet, setNouveauProjet] = useState<NewProjet>({
    nom: "",
    budget_alloue: 0,
    description: null,
    date: new Date().toISOString().split("T")[0], // "YYYY-MM-DD"
  })

 
  const [vue, setVue] = useState<"grid" | "list">("grid")

// filtres 
  const projetsFiltres = projets.filter((p) => {
    const matchFiltre = filtre === "tous" || p.statut === filtre
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase())
    return matchFiltre && matchRecherche
  })

// Objets utiles
  const budgetUtilise = (projet: Projet) => {
    return Math.round((projet.budget_consomme / projet.budget_alloue) * 100)
  }

  const statutColor = (statut: string) => {
    return statut === "actif" 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : "bg-slate-50 text-slate-700 border-slate-200"
  }

  const budgetColor = (pourcentage: number) => {
    if (pourcentage <= 50) return "from-emerald-500 to-green-400"
    if (pourcentage <= 75) return "from-yellow-500 to-orange-400"
    return "from-red-500 to-orange-500"
  }

  
// Changement de status 
  const archiverProjet = (id: number) => {
    setProjets(projets.map((p) => p.id_projet === id ? { ...p, statut: "archive" as const } : p))
  }

// Nouveau projet : 
  const creerProjet = () => {
    const projet: Projet = {
      id_projet: projets.length + 1,
      nom: nouveauProjet.nom,
      budget_alloue: nouveauProjet.budget_alloue,
      budget_consomme: 0,
      description: nouveauProjet.description,
      date: nouveauProjet.date,
      statut: "actif",
    }
    setProjets([...projets, projet])
    setDialogOuvert(false)
    setNouveauProjet({ nom: "", budget_alloue: 0, description: "", date: new Date().toISOString().split("T")[0] })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <Card className="shadow-md">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="h-6 w-6 text-indigo-600" />
                Projets
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Suivi des budgets et BOM par projet
              </CardDescription>
            </div>
            <Button 
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setDialogOuvert(true)}
            >
              <Plus className="h-4 w-4" />
              Nouveau projet
            </Button>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un projet..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtre === "tous" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltre("tous")}
                className={filtre === "tous" ? "bg-indigo-600" : ""}
              >
                Tous
              </Button>
              <Button
                variant={filtre === "actif" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltre("actif")}
                className={filtre === "actif" ? "bg-emerald-600" : ""}
              >
                Actifs
              </Button>
              <Button
                variant={filtre === "archive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltre("archive")}
                className={filtre === "archive" ? "bg-slate-600" : ""}
              >
                Archivés
              </Button>
            </div>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={vue === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setVue("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={vue === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setVue("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{projets.length}</p>
              <p className="text-xs text-slate-500">Total projets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {projets.filter((p) => p.statut === "actif").length}
              </p>
              <p className="text-xs text-slate-500">Projets actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {projets.reduce((acc, p) => acc + p.budget_alloue, 0).toLocaleString()} €
              </p>
              <p className="text-xs text-slate-500">Budget total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Archive className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {projets.filter((p) => p.statut === "archive").length}
              </p>
              <p className="text-xs text-slate-500">Archivés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des projets */}
      {projetsFiltres.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">Aucun projet trouvé</p>
            <p className="text-slate-400 text-sm mt-1">Crée un nouveau projet pour commencer</p>
            <Button className="mt-4" onClick={() => setDialogOuvert(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={vue === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {projetsFiltres.map((projet) => (
            <Card
              key={projet.id_projet}
              className={`border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                vue === "list" ? "flex flex-col sm:flex-row sm:items-center sm:gap-6" : ""
              }`}
            >
              <CardHeader className={`space-y-2 pb-3 ${vue === "list" ? "sm:w-1/3 sm:py-4" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {projet.nom}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CalendarPlus2 className="h-3.5 w-3.5" />
                        <span>{new Date(projet.date).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {projet.description && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="truncate">{projet.description}</span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs shrink-0 ${statutColor(projet.statut)}`}
                  >
                    {projet.statut === "actif" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {projet.statut === "actif" ? "Actif" : "Archivé"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className={`space-y-4 pt-0 ${vue === "list" ? "sm:w-1/2 sm:py-4" : ""}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Budget utilisé
                    </span>
                    <span className="font-semibold text-slate-800">{budgetUtilise(projet)}%</span>
                  </div>
                  <Progress 
                    value={budgetUtilise(projet)} 
                    className="h-2.5"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">
                      {projet.budget_consomme.toLocaleString()} € / {projet.budget_alloue.toLocaleString()} €
                    </span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                      budgetUtilise(projet) <= 75 
                        ? "text-emerald-600 bg-emerald-50" 
                        : "text-red-600 bg-red-50"
                    }`}>
                      {budgetUtilise(projet) <= 75 ? (
                        <><Check className="h-3 w-3 inline mr-0.5" />OK</>
                      ) : (
                        "Attention"
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Créé le {new Date(projet.date).toLocaleDateString("fr-FR")}</span>
                </div>
              </CardContent>
              
              <CardFooter className={`gap-2 pt-0 ${vue === "list" ? "sm:w-1/3 sm:py-4 sm:justify-end" : ""}`}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors"
                >
                  <FolderOpen className="h-4 w-4 mr-1.5" />
                  Ouvrir
                </Button>
                {projet.statut === "actif" ? (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => archiverProjet(projet.id_projet)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-slate-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}




    </div>
    );
}