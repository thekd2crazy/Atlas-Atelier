"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  Image,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function FileDropZone() {
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

  return (
    <Card className="w-full max-w-4xl mx-auto border-0 shadow-2xl">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}