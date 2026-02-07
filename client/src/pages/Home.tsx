import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, History, AlertCircle, Info, CheckCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import ImageUpload from "@/components/ImageUpload";
import CanvasEditor from "@/components/CanvasEditor";
import ResultDisplay from "@/components/ResultDisplay";
import MeasurementHistory from "@/components/MeasurementHistory";
import type { Landmarks } from "@/lib/angleCalculation";
import {
  calculateSNAAngle,
  classifySNAAngle,
  validateLandmarks,
} from "@/lib/angleCalculation";
import { initializeFaceDetector, detectLandmarks } from "@/lib/faceMesh";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmarks | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [showResult, setShowResult] = useState(false);
  const [autoDetectStatus, setAutoDetectStatus] = useState<{
    type: "success" | "warning" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const measurementsMutation = trpc.measurements.create.useMutation();
  const isSaving = measurementsMutation.isPending;

  const handleImageSelected = async (file: File, url: string) => {
    setImageFile(file);
    setImageUrl(url);
    setLandmarks(null);
    setShowResult(false);
    setAutoDetectStatus({ type: null, message: "" });
    setActiveTab("editor");

    // Try to auto-detect landmarks
    await autoDetectLandmarks(url);
  };

  const autoDetectLandmarks = async (url: string) => {
    setIsDetecting(true);
    setAutoDetectStatus({ type: null, message: "" });

    try {
      // Initialize Face Mesh
      const isAvailable = await initializeFaceDetector();

      if (!isAvailable) {
        setAutoDetectStatus({
          type: "warning",
          message:
            "Automatische Erkennung nicht verfügbar. Bitte passen Sie die Landmarken manuell an.",
        });
        setIsDetecting(false);
        return;
      }

      // Load image
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = async () => {
        try {
          // Detect landmarks
          const detected = await detectLandmarks(img);

          if (detected && validateLandmarks(detected)) {
            setLandmarks(detected);
            setAutoDetectStatus({
              type: "success",
              message: "Landmarken erfolgreich erkannt! Sie können diese bei Bedarf anpassen.",
            });
          } else {
            setAutoDetectStatus({
              type: "warning",
              message:
                "Keine Landmarken erkannt. Bitte passen Sie die Punkte manuell an.",
            });
          }
        } catch (error) {
          console.error("Fehler bei der Landmarken-Erkennung:", error);
          setAutoDetectStatus({
            type: "error",
            message: "Fehler bei der automatischen Erkennung. Bitte passen Sie die Punkte manuell an.",
          });
        } finally {
          setIsDetecting(false);
        }
      };

      img.onerror = () => {
        console.error("Fehler beim Laden des Bildes");
        setAutoDetectStatus({
          type: "error",
          message: "Fehler beim Laden des Bildes",
        });
        setIsDetecting(false);
      };

      img.src = url;
    } catch (error) {
      console.error("Fehler bei der Initialisierung:", error);
      setAutoDetectStatus({
        type: "error",
        message: "Fehler bei der Initialisierung der Landmarken-Erkennung",
      });
      setIsDetecting(false);
    }
  };

  const handleSaveMeasurement = async () => {
    if (!landmarks || !validateLandmarks(landmarks)) return;

    const angle = calculateSNAAngle(landmarks);
    const classification = classifySNAAngle(angle);

    try {
      await measurementsMutation.mutateAsync({
        snaAngle: Math.round(angle),
        classification,
        imageMetadata: JSON.stringify({
          fileName: imageFile?.name,
          fileSize: imageFile?.size,
          uploadedAt: new Date().toISOString(),
        }),
      });

      alert("Messung erfolgreich gespeichert!");
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      alert("Fehler beim Speichern der Messung");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">SNA Angle Analyzer</h1>
            <p className="text-muted-foreground">
              Kephalometrische Analyse von Profilbildern
            </p>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="text-lg">📸</div>
              <div>
                <p className="font-medium text-foreground">Automatische Erkennung</p>
                <p>KI-gestützte Landmarken-Detektion mit MediaPipe</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-lg">✏️</div>
              <div>
                <p className="font-medium text-foreground">Manuelle Anpassung</p>
                <p>Präzise Korrektur der Messpunkte</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-lg">📊</div>
              <div>
                <p className="font-medium text-foreground">Medizinische Einordnung</p>
                <p>Klassifizierung nach klinischen Standards</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-lg">🔒</div>
              <div>
                <p className="font-medium text-foreground">Datenschutz</p>
                <p>Lokale Verarbeitung, keine Server-Uploads</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            size="lg"
            className="w-full"
          >
            Mit Manus anmelden
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Melden Sie sich an, um Ihre Messungen zu speichern und auf die Messhistorie zuzugreifen.
          </p>
        </Card>
      </div>
    );
  }

  const angle =
    landmarks && validateLandmarks(landmarks) ? calculateSNAAngle(landmarks) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SNA Angle Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              Kephalometrische Analyse
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="editor" disabled={!imageUrl}>
              Editor
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Verlauf
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Seitenprofil-Bild hochladen
              </h2>
              <ImageUpload onImageSelected={handleImageSelected} />
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                💡 Tipps für beste Ergebnisse
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Verwenden Sie ein klares, gut beleuchtetes Seitenprofil-Foto</li>
                <li>• Stellen Sie sicher, dass das Gesicht von der Seite sichtbar ist</li>
                <li>• Achten Sie auf gute Bildqualität (mind. 800x600 Pixel)</li>
                <li>• Vermeiden Sie Schatten oder Überbelichtung</li>
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6">
            {imageUrl && (
              <>
                {autoDetectStatus.type && (
                  <Card
                    className={`p-4 border-2 ${
                      autoDetectStatus.type === "success"
                        ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                        : autoDetectStatus.type === "warning"
                          ? "border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800"
                          : "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
                    }`}
                  >
                    <div className="flex gap-3">
                      {autoDetectStatus.type === "success" ? (
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            autoDetectStatus.type === "success"
                              ? "text-green-600 dark:text-green-400"
                              : autoDetectStatus.type === "warning"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        />
                      ) : autoDetectStatus.type === "warning" ? (
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4
                          className={`font-semibold ${
                            autoDetectStatus.type === "success"
                              ? "text-green-900 dark:text-green-100"
                              : autoDetectStatus.type === "warning"
                                ? "text-amber-900 dark:text-amber-100"
                                : "text-red-900 dark:text-red-100"
                          }`}
                        >
                          {autoDetectStatus.type === "success"
                            ? "Automatische Erkennung erfolgreich"
                            : autoDetectStatus.type === "warning"
                              ? "Hinweis"
                              : "Fehler"}
                        </h4>
                        <p
                          className={`text-sm mt-1 ${
                            autoDetectStatus.type === "success"
                              ? "text-green-800 dark:text-green-200"
                              : autoDetectStatus.type === "warning"
                                ? "text-amber-800 dark:text-amber-200"
                                : "text-red-800 dark:text-red-200"
                          }`}
                        >
                          {autoDetectStatus.message}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Landmarken-Editor</h2>
                    {isDetecting && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Erkenne Landmarken...
                      </div>
                    )}
                  </div>

                  <CanvasEditor
                    imageUrl={imageUrl}
                    initialLandmarks={landmarks || undefined}
                    onLandmarksChange={setLandmarks}
                  />
                </Card>

                {angle !== null && !showResult && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowResult(true)}
                      size="lg"
                      className="flex-1"
                    >
                      Ergebnis anzeigen
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history">
            <MeasurementHistory />
          </TabsContent>
        </Tabs>

        {showResult && angle !== null && landmarks && (
          <div className="mt-8">
            <ResultDisplay
              angle={angle}
              landmarks={landmarks}
              imageUrl={imageUrl || ""}
              onSave={handleSaveMeasurement}
            />
            {isSaving && (
              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Speichern...
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
