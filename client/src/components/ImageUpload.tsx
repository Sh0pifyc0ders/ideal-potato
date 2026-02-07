import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle } from "lucide-react";
import { validateImageFile } from "@/lib/faceMesh";

interface ImageUploadProps {
  onImageSelected: (file: File, imageUrl: string) => void;
}

export default function ImageUpload({ onImageSelected }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Ungültige Datei");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      onImageSelected(file, imageUrl);
    };
    reader.onerror = () => {
      setError("Fehler beim Lesen der Datei");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-lg mb-1">
              Seitenprofil-Foto hochladen
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ziehen Sie ein Bild hierher oder klicken Sie zum Auswählen
            </p>
            <p className="text-xs text-muted-foreground">
              Unterstützte Formate: JPEG, PNG (max. 10MB)
            </p>
          </div>

          <Button
            onClick={() => inputRef.current?.click()}
            className="mt-4"
          >
            Datei auswählen
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                Fehler beim Upload
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
