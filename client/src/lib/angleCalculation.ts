/**
 * Utility functions for SNA angle calculation and landmark processing
 * All calculations use vector mathematics for precise angle measurement
 */

export interface Point {
  x: number;
  y: number;
}

export interface Landmarks {
  S: Point; // Sella
  N: Point; // Nasion
  A: Point; // Subspinale
}

export type Classification = "retrognath" | "normal" | "prognath";

/**
 * Calculate the angle between three points (vertex at the middle point)
 * Uses vector mathematics: angle = arccos((v1 · v2) / (|v1| * |v2|))
 */
export function calculateAngleBetweenPoints(
  point1: Point,
  vertex: Point,
  point2: Point
): number {
  // Create vectors from vertex to the other two points
  const v1 = { x: point1.x - vertex.x, y: point1.y - vertex.y };
  const v2 = { x: point2.x - vertex.x, y: point2.y - vertex.y };

  // Calculate dot product
  const dotProduct = v1.x * v2.x + v1.y * v2.y;

  // Calculate magnitudes
  const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  // Calculate cosine and then angle in radians
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  // Clamp to [-1, 1] to avoid NaN from floating point errors
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
  const angleRadians = Math.acos(clampedCosAngle);

  // Convert to degrees
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return Math.round(angleDegrees * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate the SNA angle from landmarks
 * SNA angle is the angle at vertex N (Nasion) between lines SN and NA
 */
export function calculateSNAAngle(landmarks: Landmarks): number {
  return calculateAngleBetweenPoints(landmarks.S, landmarks.N, landmarks.A);
}

/**
 * Classify the SNA angle based on clinical standards
 * - Retrognath (< 80°): Mandible is positioned backward relative to maxilla
 * - Normal (80-84°): Normal skeletal relationship
 * - Prognath (> 84°): Mandible is positioned forward relative to maxilla
 */
export function classifySNAAngle(angle: number): Classification {
  if (angle < 80) {
    return "retrognath";
  } else if (angle <= 84) {
    return "normal";
  } else {
    return "prognath";
  }
}

/**
 * Get human-readable classification label
 */
export function getClassificationLabel(classification: Classification): string {
  const labels: Record<Classification, string> = {
    retrognath: "Retrognath (< 80°)",
    normal: "Normal (80-84°)",
    prognath: "Prognath (> 84°)",
  };
  return labels[classification];
}

/**
 * Get color for classification for visual feedback
 */
export function getClassificationColor(classification: Classification): string {
  const colors: Record<Classification, string> = {
    retrognath: "#ef4444", // Red
    normal: "#22c55e", // Green
    prognath: "#f59e0b", // Amber
  };
  return colors[classification];
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is close to another point (within threshold)
 */
export function isPointNear(p1: Point, p2: Point, threshold: number = 10): boolean {
  return calculateDistance(p1, p2) <= threshold;
}

/**
 * Validate landmarks - ensure all three points are defined and not identical
 */
export function validateLandmarks(landmarks: Landmarks): boolean {
  const points = [landmarks.S, landmarks.N, landmarks.A];

  // Check if all points are defined
  for (const point of points) {
    if (!point || typeof point.x !== "number" || typeof point.y !== "number") {
      return false;
    }
  }

  // Check if points are not identical
  if (
    calculateDistance(landmarks.S, landmarks.N) < 1 ||
    calculateDistance(landmarks.N, landmarks.A) < 1 ||
    calculateDistance(landmarks.S, landmarks.A) < 1
  ) {
    return false;
  }

  return true;
}

/**
 * Serialize landmarks to JSON string
 */
export function serializeLandmarks(landmarks: Landmarks): string {
  return JSON.stringify(landmarks);
}

/**
 * Deserialize landmarks from JSON string
 */
export function deserializeLandmarks(json: string): Landmarks | null {
  try {
    const data = JSON.parse(json);
    if (
      data.S &&
      data.N &&
      data.A &&
      typeof data.S.x === "number" &&
      typeof data.S.y === "number" &&
      typeof data.N.x === "number" &&
      typeof data.N.y === "number" &&
      typeof data.A.x === "number" &&
      typeof data.A.y === "number"
    ) {
      return data as Landmarks;
    }
  } catch (e) {
    console.error("Failed to deserialize landmarks:", e);
  }
  return null;
}
