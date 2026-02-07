/**
 * MediaPipe Face Mesh integration for automatic cephalometric landmark detection
 * Detects S (Sella), N (Nasion), and A (Subspinale) from facial landmarks
 */

import type { Point, Landmarks } from "./angleCalculation";

let faceMeshInitialized = false;
let faceMeshAvailable = false;
let faceLandmarker: any = null;

/**
 * MediaPipe Face Mesh landmark indices for cephalometric points
 * Reference: https://github.com/google/mediapipe/blob/master/mediapipe/python/solutions/face_mesh_connections.py
 */
const FACE_MESH_LANDMARKS = {
  // Nasion (N): Glabella / nasal root area
  NASION: [168],
  // Upper lip / subspinale approximation (below nose)
  SUBSPINALE: [13, 2, 98],
  // Forehead reference for Sella approximation
  FOREHEAD: [10],
};

/**
 * Initialize MediaPipe Face Mesh
 * Returns true if successfully initialized, false otherwise
 */
export async function initializeFaceDetector(): Promise<boolean> {
  if (faceMeshInitialized) {
    return faceMeshAvailable;
  }

  try {
    // Dynamically import MediaPipe
    const mediapipe = await import("@mediapipe/tasks-vision");
    const FaceLandmarker = (mediapipe as any).FaceLandmarker;
    const FilesetResolver = (mediapipe as any).FilesetResolver;

    if (!FaceLandmarker || !FilesetResolver) {
      console.warn("MediaPipe FaceLandmarker not available");
      faceMeshInitialized = true;
      faceMeshAvailable = false;
      return false;
    }

    const localBaseUrl = new URL(
      `${import.meta.env.BASE_URL ?? "/"}mediapipe/`,
      window.location.origin
    ).toString();

    const createLandmarker = async (baseUrl: string) => {
      const visionFileset = await FilesetResolver.forVisionTasks(baseUrl);
      return FaceLandmarker.createFromOptions(visionFileset, {
        baseOptions: {
          modelAssetPath: `${baseUrl}face_landmarker.task`,
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    };

    try {
      faceLandmarker = await createLandmarker(localBaseUrl);
    } catch (error) {
      console.warn(
        "Failed to load local MediaPipe assets, falling back to CDN.",
        error
      );
      const cdnBaseUrl =
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm/";
      faceLandmarker = await createLandmarker(cdnBaseUrl);
    }

    faceMeshInitialized = true;
    faceMeshAvailable = true;
    console.log("MediaPipe FaceLandmarker initialized successfully");
    return true;
  } catch (error) {
    console.warn("Failed to initialize MediaPipe FaceLandmarker:", error);
    faceMeshInitialized = true;
    faceMeshAvailable = false;
    return false;
  }
}

/**
 * Calculate average point from multiple landmark indices
 */
function calculateAverageLandmark(
  landmarks: any[],
  indices: number[],
  imageWidth: number,
  imageHeight: number
): Point | null {
  const validPoints = indices
    .map((idx) => landmarks[idx])
    .filter((point) => point !== undefined);

  if (validPoints.length === 0) {
    return null;
  }

  const avgX = validPoints.reduce((sum, p) => sum + p.x, 0) / validPoints.length;
  const avgY = validPoints.reduce((sum, p) => sum + p.y, 0) / validPoints.length;

  return {
    x: avgX * imageWidth,
    y: avgY * imageHeight,
  };
}

/**
 * Detect facial landmarks using MediaPipe Face Mesh
 * Returns S, N, A landmarks or null if detection fails
 */
export async function detectLandmarks(
  imageElement: HTMLImageElement
): Promise<Landmarks | null> {
  if (!faceMeshAvailable || !faceLandmarker) {
    return null;
  }

  try {
    const width = imageElement.naturalWidth || imageElement.width;
    const height = imageElement.naturalHeight || imageElement.height;

    // Create canvas and draw image
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Failed to get canvas context");
      return null;
    }

    ctx.drawImage(imageElement, 0, 0);

    // Detect face landmarks
    const result = faceLandmarker.detect(canvas);

    if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
      console.warn("No face detected");
      return null;
    }

    const landmarks = result.faceLandmarks[0];

    if (!landmarks || landmarks.length === 0) {
      console.warn("No landmarks detected");
      return null;
    }

    // Calculate cephalometric points
    const nasion = calculateAverageLandmark(
      landmarks,
      FACE_MESH_LANDMARKS.NASION,
      width,
      height
    );

    const subspinale = calculateAverageLandmark(
      landmarks,
      FACE_MESH_LANDMARKS.SUBSPINALE,
      width,
      height
    );

    const forehead = calculateAverageLandmark(
      landmarks,
      FACE_MESH_LANDMARKS.FOREHEAD,
      width,
      height
    );

    // Estimate Sella using a vector from forehead to nasion to move slightly posterior/superior.
    const sella =
      nasion && forehead
        ? {
            x: nasion.x + (nasion.x - forehead.x) * 0.2,
            y: nasion.y + (nasion.y - forehead.y) * 0.6,
          }
        : null;

    if (!nasion || !subspinale || !sella) {
      console.warn("Could not calculate all landmarks");
      return null;
    }

    return {
      S: sella,
      N: nasion,
      A: subspinale,
    };
  } catch (error) {
    console.error("Error detecting landmarks:", error);
    return null;
  }
}

/**
 * Load an image from a file
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Nur JPEG und PNG Dateien sind erlaubt",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Datei ist zu groß (max. 10MB)",
    };
  }

  return { valid: true };
}
