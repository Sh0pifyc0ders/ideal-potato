import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Landmarks } from "@/lib/angleCalculation";
import {
  calculateSNAAngle,
  classifySNAAngle,
  getClassificationColor,
  getClassificationLabel,
} from "@/lib/angleCalculation";

interface ResultDisplayProps {
  angle: number;
  landmarks: Landmarks;
  imageUrl: string;
  onSave?: () => void;
}

export default function ResultDisplay({
  angle,
  landmarks,
  imageUrl,
  onSave,
}: ResultDisplayProps) {
  const resultRef = useRef<HTMLDivElement>(null);
  const classification = classifySNAAngle(angle);
  const color = getClassificationColor(classification);
  const label = getClassificationLabel(classification);

  const getClassificationDescription = () => {
    switch (classification) {
      case "retrognath":
        return "Die Mandibel ist relativ zur Maxilla nach hinten positioniert. Dies deutet auf eine Rückwärtsposition des Unterkiefers hin.";
      case "normal":
        return "Das Verhältnis zwischen Maxilla und Mandibel liegt im normalen Bereich. Die skelettale Beziehung ist ausgewogen.";
      case "prognath":
        return "Die Mandibel ist relativ zur Maxilla nach vorne positioniert. Dies deutet auf eine Vorwärtsposition des Unterkiefers hin.";
    }
  };

  const exportAsImage = async () => {
    if (!resultRef.current) return;

    try {
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `SNA-Analyse-${new Date().toISOString().split("T")[0]}.png`;
      link.click();
    } catch (error) {
      console.error("Fehler beim Export:", error);
    }
  };

  const exportAsPDF = async () => {
    if (!resultRef.current) return;

    try {
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      // Add metadata
      pdf.setFontSize(10);
      pdf.text(
        `Datum: ${new Date().toLocaleDateString("de-DE")}`,
        10,
        10 + imgHeight + 10
      );

      pdf.save(`SNA-Analyse-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Fehler beim PDF-Export:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card ref={resultRef} className="p-8 bg-gradient-to-br from-background to-muted">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b border-border pb-6">
            <h2 className="text-2xl font-bold mb-2">SNA-Winkel Analyse</h2>
            <p className="text-sm text-muted-foreground">
              Kephalometrische Messung vom {new Date().toLocaleDateString("de-DE")}
            </p>
          </div>

          {/* Main Result */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Gemessener Winkel
              </p>
              <div
                className="text-6xl font-bold"
                style={{ color }}
              >
                {angle.toFixed(1)}°
              </div>
            </div>

            <div
              className="inline-block px-6 py-3 rounded-lg font-semibold"
              style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `2px solid ${color}`,
              }}
            >
              {label}
            </div>
          </div>

          {/* Classification Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Medizinische Einordnung</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getClassificationDescription()}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div className="text-center p-2 rounded bg-red-50 dark:bg-red-950">
                <div className="text-xs font-medium text-red-700 dark:text-red-300">
                  Retrognath
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">&lt; 80°</div>
              </div>
              <div className="text-center p-2 rounded bg-green-50 dark:bg-green-950">
                <div className="text-xs font-medium text-green-700 dark:text-green-300">
                  Normal
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  80-84°
                </div>
              </div>
              <div className="text-center p-2 rounded bg-amber-50 dark:bg-amber-950">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Prognath
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">&gt; 84°</div>
              </div>
            </div>
          </div>

          {/* Landmarks Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Gemessene Landmarken</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-medium">S (Sella):</span>
                <div className="text-muted-foreground">
                  ({Math.round(landmarks.S.x)}, {Math.round(landmarks.S.y)})
                </div>
              </div>
              <div>
                <span className="font-medium">N (Nasion):</span>
                <div className="text-muted-foreground">
                  ({Math.round(landmarks.N.x)}, {Math.round(landmarks.N.y)})
                </div>
              </div>
              <div>
                <span className="font-medium">A (Subspinale):</span>
                <div className="text-muted-foreground">
                  ({Math.round(landmarks.A.x)}, {Math.round(landmarks.A.y)})
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
            <p>
              Diese Messung ist eine Hilfe für klinische Entscheidungen und
              ersetzt nicht die professionelle medizinische Beurteilung.
            </p>
          </div>
        </div>
      </Card>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={exportAsImage}
          variant="outline"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Als Bild exportieren
        </Button>
        <Button
          onClick={exportAsPDF}
          variant="outline"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Als PDF exportieren
        </Button>
        {onSave && (
          <Button
            onClick={onSave}
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        )}
      </div>
    </div>
  );
}
