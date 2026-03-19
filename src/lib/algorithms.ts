import { GridCell } from "@/store/usePlanStore";
import { AMENITY_CONFIG, getServiceRadiusInCells } from "@/lib/planningMath";

// Helper: Manhattan Distance
const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

export type RoadClass = "local" | "collector" | "arterial";

export interface RoadSegment {
  id: string;
  fromKey: string;
  toKey: string;
  orientation: "horizontal" | "vertical";
  laneCount: number;
  widthMeters: number;
  roadClass: RoadClass;
}

const getAmenitySpacingRules = (amenityType: string) => {
  switch (amenityType) {
    case "hospital":
      return { minSameTypeDistance: 6, minAnyAmenityDistance: 3 };
    case "school":
      return { minSameTypeDistance: 5, minAnyAmenityDistance: 3 };
    case "park":
      return { minSameTypeDistance: 4, minAnyAmenityDistance: 2 };
    case "bus_station":
      return { minSameTypeDistance: 4, minAnyAmenityDistance: 2 };
    default:
      return { minSameTypeDistance: 3, minAnyAmenityDistance: 2 };
  }
};

const classifyRoad = (demandScore: number): { roadClass: RoadClass; laneCount: number; widthMeters: number } => {
  if (demandScore >= 5) {
    return { roadClass: "arterial", laneCount: 4, widthMeters: 20 };
  }
  if (demandScore >= 3.1) {
    return { roadClass: "collector", laneCount: 3, widthMeters: 14 };
  }
  return { roadClass: "local", laneCount: 2, widthMeters: 10 };
};

const getCellDemand = (cell?: GridCell): number => {
  if (!cell || cell.type === "disabled") return 0;
  if (cell.type === "amenity") {
    switch (cell.amenityType) {
      case "hospital":
      case "bus_station":
        return 3.1;
      case "school":
      case "supermarket":
      case "community_center":
        return 2.3;
      case "park":
        return 1.8;
      default:
        return 2;
    }
  }

  return 1.2; // residential baseline
};

// 1. ZONING ALGORITHM
export function placeAmenities(
  gridSize: number,
  initialGrid: Record<string, GridCell>,
  amenitiesToPlace: Record<string, number>
): Record<string, GridCell> {
  const grid = { ...initialGrid };
  const activeResidentialCells = Object.values(grid).filter((c) => c.type === "residential");
  if (activeResidentialCells.length === 0) return grid;

  const centerX = (gridSize - 1) / 2;
  const centerY = (gridSize - 1) / 2;

  const placedPositions: { x: number; y: number; type: string }[] = Object.values(grid)
    .filter((c) => c.type === "amenity")
    .map((c) => ({ x: c.x, y: c.y, type: c.amenityType || "" }));

  const availableCells = new Set(activeResidentialCells.map((c) => `${c.x},${c.y}`));
  const placementOrder = ["community_center", "supermarket", "hospital", "school", "bus_station", "park"];

  placementOrder.forEach((amenityType) => {
    const count = amenitiesToPlace[amenityType] || 0;
    const { minSameTypeDistance, minAnyAmenityDistance } = getAmenitySpacingRules(amenityType);
    const angleOffset = (amenityType.length * 23) % 360;

    for (let index = 0; index < count; index++) {
      const candidateKeys = Array.from(availableCells);
      if (candidateKeys.length === 0) break;

      const theta = ((index * (360 / Math.max(count, 1)) + angleOffset) * Math.PI) / 180;
      const radius = Math.max(2, Math.floor(gridSize * 0.26) + (index % 2));
      const targetX = centerX + Math.cos(theta) * radius;
      const targetY = centerY + Math.sin(theta) * radius;

      let bestKey = "";
      let bestScore = Number.POSITIVE_INFINITY;

      for (const key of candidateKeys) {
        const cell = grid[key];
        if (!cell || cell.type !== "residential") continue;

        const sameTypeDistances = placedPositions
          .filter((p) => p.type === amenityType)
          .map((p) => getDistance(p.x, p.y, cell.x, cell.y));
        const anyAmenityDistances = placedPositions.map((p) => getDistance(p.x, p.y, cell.x, cell.y));

        const nearestSameType = sameTypeDistances.length > 0 ? Math.min(...sameTypeDistances) : Infinity;
        const nearestAnyAmenity = anyAmenityDistances.length > 0 ? Math.min(...anyAmenityDistances) : Infinity;

        const spacingPenalty =
          (nearestSameType < minSameTypeDistance ? (minSameTypeDistance - nearestSameType) * 20 : 0) +
          (nearestAnyAmenity < minAnyAmenityDistance ? (minAnyAmenityDistance - nearestAnyAmenity) * 12 : 0);

        const centrality = getDistance(cell.x, cell.y, centerX, centerY);
        const targetDistance = getDistance(cell.x, cell.y, targetX, targetY);
        const score = targetDistance * 1.8 + centrality * 0.4 + spacingPenalty;

        if (score < bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }

      if (bestKey) {
        const selectedCell = grid[bestKey];
        grid[bestKey] = { ...selectedCell, type: "amenity", amenityType };
        availableCells.delete(bestKey);
        placedPositions.push({ x: selectedCell.x, y: selectedCell.y, type: amenityType });
      }
    }
  });

  return grid;
}

export function generateRoadNetwork(grid: Record<string, GridCell>): Record<string, RoadSegment> {
  const roadSegments: Record<string, RoadSegment> = {};

  Object.values(grid).forEach((cell) => {
    if (cell.type === "disabled") return;

    const rightKey = `${cell.x + 1},${cell.y}`;
    const downKey = `${cell.x},${cell.y + 1}`;
    const rightCell = grid[rightKey];
    const downCell = grid[downKey];

    if (rightCell && rightCell.type !== "disabled") {
      const demandScore = getCellDemand(cell) + getCellDemand(rightCell);
      const profile = classifyRoad(demandScore);
      const id = `v:${cell.x + 1}:${cell.y}`;
      roadSegments[id] = {
        id,
        fromKey: `${cell.x},${cell.y}`,
        toKey: rightKey,
        orientation: "vertical",
        laneCount: profile.laneCount,
        widthMeters: profile.widthMeters,
        roadClass: profile.roadClass,
      };
    }

    if (downCell && downCell.type !== "disabled") {
      const demandScore = getCellDemand(cell) + getCellDemand(downCell);
      const profile = classifyRoad(demandScore);
      const id = `h:${cell.x}:${cell.y + 1}`;
      roadSegments[id] = {
        id,
        fromKey: `${cell.x},${cell.y}`,
        toKey: downKey,
        orientation: "horizontal",
        laneCount: profile.laneCount,
        widthMeters: profile.widthMeters,
        roadClass: profile.roadClass,
      };
    }
  });

  return roadSegments;
}

export function calculateRoadAreaHectares(
  roadNetwork: Record<string, RoadSegment>,
  blockSizeMeters: number
): number {
  const totalRoadAreaSqm = Object.values(roadNetwork).reduce(
    (sum, road) => sum + road.widthMeters * blockSizeMeters,
    0
  );

  return totalRoadAreaSqm / 10_000;
}

// 3. PROPORTIONAL ECONOMICS MODEL
export function calculateEconomics(
  grid: Record<string, GridCell>,
  totalLandValue: number,
  blockSizeMeters: number,
  roadNetwork: Record<string, RoadSegment>
): Record<string, GridCell> {
  const updatedGrid = { ...grid };
  const cells = Object.values(updatedGrid);
  const activeCells = cells.filter((c) => c.type !== "disabled");
  const amenitiesByType: Record<string, GridCell[]> = {};

  cells.forEach((cell) => {
    if (cell.type === "amenity" && cell.amenityType) {
      if (!amenitiesByType[cell.amenityType]) amenitiesByType[cell.amenityType] = [];
      amenitiesByType[cell.amenityType].push(cell);
    }
  });

  const roadSegmentsByCell = new Map<string, RoadSegment[]>();
  Object.values(roadNetwork).forEach((road) => {
    const fromList = roadSegmentsByCell.get(road.fromKey) || [];
    fromList.push(road);
    roadSegmentsByCell.set(road.fromKey, fromList);

    const toList = roadSegmentsByCell.get(road.toKey) || [];
    toList.push(road);
    roadSegmentsByCell.set(road.toKey, toList);
  });

  const serviceRadiusMeters: Record<string, number> = {
    hospital: 1800,
    school: 1200,
    park: 800,
    supermarket: 700,
    bus_station: 1200,
    community_center: 1000,
  };

  const serviceWeight: Record<string, number> = {
    hospital: 2.2,
    school: 1.8,
    park: 1.6,
    supermarket: 1.4,
    bus_station: 1.3,
    community_center: 1.2,
  };

  const desirabilityWeightByCell = new Map<string, number>();
  let totalWeight = 0;

  activeCells.forEach((cell) => {
    let accessibility = 1;

    Object.keys(AMENITY_CONFIG).forEach((amenityType) => {
      const amenityCells = amenitiesByType[amenityType] || [];
      if (amenityCells.length === 0) return;

      const nearest = Math.min(...amenityCells.map((a) => getDistance(cell.x, cell.y, a.x, a.y)));
      const radius = getServiceRadiusInCells(serviceRadiusMeters[amenityType] ?? 700, blockSizeMeters);
      const weight = serviceWeight[amenityType] ?? 1;
      const contribution = Math.max(0, 1 - nearest / radius) * weight;
      accessibility += contribution;
    });

    const connectedRoads = roadSegmentsByCell.get(`${cell.x},${cell.y}`) || [];
    const avgRoadWidth =
      connectedRoads.length > 0
        ? connectedRoads.reduce((sum, road) => sum + road.widthMeters, 0) / connectedRoads.length
        : 0;
    const roadAccessBonus = connectedRoads.length * 0.12 + avgRoadWidth / 50;
    accessibility += roadAccessBonus;

    const normalizedAccessibility = Math.max(0, Math.min(10, accessibility));
    updatedGrid[`${cell.x},${cell.y}`] = { ...cell, accessibilityScore: Number(normalizedAccessibility.toFixed(2)) };

    const zoningMultiplier = cell.type === "amenity" ? 0.9 : 1;
    const desirabilityWeight = Math.pow(0.35 + normalizedAccessibility, 1.35) * zoningMultiplier;
    desirabilityWeightByCell.set(`${cell.x},${cell.y}`, desirabilityWeight);
    totalWeight += desirabilityWeight;
  });

  if (totalWeight > 0) {
    cells.forEach((cell) => {
      const key = `${cell.x},${cell.y}`;
      if (cell.type === "disabled") {
        updatedGrid[key].landValue = 0;
        return;
      }

      const weight = desirabilityWeightByCell.get(key) ?? 0;
      const cellValue = totalLandValue * (weight / totalWeight);
      updatedGrid[key].landValue = Math.round(cellValue);
    });
  }

  return updatedGrid;
}
