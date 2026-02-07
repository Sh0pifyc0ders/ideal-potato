import { describe, it, expect } from "vitest";
import {
  calculateAngleBetweenPoints,
  calculateSNAAngle,
  classifySNAAngle,
  calculateDistance,
  isPointNear,
  validateLandmarks,
  serializeLandmarks,
  deserializeLandmarks,
} from "./angleCalculation";
import type { Landmarks, Point } from "./angleCalculation";

describe("Angle Calculation", () => {
  describe("calculateAngleBetweenPoints", () => {
    it("should calculate a right angle (90 degrees)", () => {
      const point1: Point = { x: 0, y: 10 };
      const vertex: Point = { x: 0, y: 0 };
      const point2: Point = { x: 10, y: 0 };

      const angle = calculateAngleBetweenPoints(point1, vertex, point2);
      expect(angle).toBeCloseTo(90, 1);
    });

    it("should calculate a straight angle (180 degrees)", () => {
      const point1: Point = { x: -10, y: 0 };
      const vertex: Point = { x: 0, y: 0 };
      const point2: Point = { x: 10, y: 0 };

      const angle = calculateAngleBetweenPoints(point1, vertex, point2);
      expect(angle).toBeCloseTo(180, 1);
    });

    it("should calculate a 60 degree angle", () => {
      const point1: Point = { x: 10, y: 0 };
      const vertex: Point = { x: 0, y: 0 };
      const point2: Point = { x: 5, y: 5 * Math.sqrt(3) };

      const angle = calculateAngleBetweenPoints(point1, vertex, point2);
      expect(angle).toBeCloseTo(60, 1);
    });

    it("should handle zero magnitude vectors", () => {
      const point1: Point = { x: 0, y: 0 };
      const vertex: Point = { x: 0, y: 0 };
      const point2: Point = { x: 10, y: 0 };

      const angle = calculateAngleBetweenPoints(point1, vertex, point2);
      expect(angle).toBe(0);
    });
  });

  describe("calculateSNAAngle", () => {
    it("should calculate SNA angle from landmarks", () => {
      const landmarks: Landmarks = {
        S: { x: 50, y: 50 },
        N: { x: 100, y: 100 },
        A: { x: 150, y: 100 },
      };

      const angle = calculateSNAAngle(landmarks);
      expect(angle).toBeGreaterThan(0);
      expect(angle).toBeLessThanOrEqual(180);
    });
  });

  describe("classifySNAAngle", () => {
    it("should classify angle < 80 as retrognath", () => {
      expect(classifySNAAngle(75)).toBe("retrognath");
      expect(classifySNAAngle(79.9)).toBe("retrognath");
    });

    it("should classify angle 80-84 as normal", () => {
      expect(classifySNAAngle(80)).toBe("normal");
      expect(classifySNAAngle(82)).toBe("normal");
      expect(classifySNAAngle(84)).toBe("normal");
    });

    it("should classify angle > 84 as prognath", () => {
      expect(classifySNAAngle(84.1)).toBe("prognath");
      expect(classifySNAAngle(90)).toBe("prognath");
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two points", () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3, y: 4 };

      const distance = calculateDistance(p1, p2);
      expect(distance).toBeCloseTo(5, 1);
    });

    it("should calculate zero distance for identical points", () => {
      const p1: Point = { x: 5, y: 5 };
      const p2: Point = { x: 5, y: 5 };

      const distance = calculateDistance(p1, p2);
      expect(distance).toBe(0);
    });
  });

  describe("isPointNear", () => {
    it("should return true for nearby points", () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 0 };

      expect(isPointNear(p1, p2, 10)).toBe(true);
    });

    it("should return false for distant points", () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 20, y: 0 };

      expect(isPointNear(p1, p2, 10)).toBe(false);
    });
  });

  describe("validateLandmarks", () => {
    it("should validate correct landmarks", () => {
      const landmarks: Landmarks = {
        S: { x: 50, y: 50 },
        N: { x: 100, y: 100 },
        A: { x: 150, y: 100 },
      };

      expect(validateLandmarks(landmarks)).toBe(true);
    });

    it("should reject landmarks with identical points", () => {
      const landmarks: Landmarks = {
        S: { x: 100, y: 100 },
        N: { x: 100, y: 100 },
        A: { x: 150, y: 100 },
      };

      expect(validateLandmarks(landmarks)).toBe(false);
    });

    it("should reject landmarks with missing coordinates", () => {
      const landmarks = {
        S: { x: 50 },
        N: { x: 100, y: 100 },
        A: { x: 150, y: 100 },
      } as any;

      expect(validateLandmarks(landmarks)).toBe(false);
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize landmarks", () => {
      const landmarks: Landmarks = {
        S: { x: 50, y: 50 },
        N: { x: 100, y: 100 },
        A: { x: 150, y: 100 },
      };

      const serialized = serializeLandmarks(landmarks);
      const deserialized = deserializeLandmarks(serialized);

      expect(deserialized).toEqual(landmarks);
    });

    it("should return null for invalid JSON", () => {
      const deserialized = deserializeLandmarks("invalid json");
      expect(deserialized).toBeNull();
    });

    it("should return null for invalid landmark structure", () => {
      const deserialized = deserializeLandmarks(
        JSON.stringify({ S: { x: 50 }, N: { x: 100 }, A: { x: 150 } })
      );
      expect(deserialized).toBeNull();
    });
  });
});
