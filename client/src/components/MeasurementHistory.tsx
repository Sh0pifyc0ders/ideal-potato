import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  getClassificationColor,
  getClassificationLabel,
} from "@/lib/angleCalculation";

export default function MeasurementHistory() {
  const { data: measurements, isLoading } = trpc.measurements.list.useQuery();
  const deleteMutation = trpc.measurements.delete.useMutation({
    onSuccess: () => {
      // Invalidate the list query to refresh
      trpc.useUtils().measurements.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </Card>
    );
  }

  if (!measurements || measurements.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Noch keine Messungen vorhanden
        </p>
        <p className="text-sm text-muted-foreground">
          Laden Sie ein Bild hoch und führen Sie eine Messung durch, um Ihre
          Ergebnisse hier zu speichern.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {measurements.map((measurement) => (
          <Card key={measurement.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {measurement.snaAngle}°
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${getClassificationColor(
                            measurement.classification
                          )}20`,
                          color: getClassificationColor(
                            measurement.classification
                          ),
                          border: `1px solid ${getClassificationColor(
                            measurement.classification
                          )}`,
                        }}
                      >
                        {getClassificationLabel(measurement.classification)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(measurement.createdAt).toLocaleDateString(
                        "de-DE",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      "Möchten Sie diese Messung wirklich löschen?"
                    )
                  ) {
                    deleteMutation.mutate({ id: measurement.id });
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {measurement.notes && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Notizen:</span> {measurement.notes}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
