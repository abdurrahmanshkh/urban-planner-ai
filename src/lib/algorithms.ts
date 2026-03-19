import { GridCell } from "@/store/usePlanStore";
import { AMENITY_CONFIG } from "@/lib/planningMath";

// Helper: Manhattan Distance
const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

const parseKey = (key: string): [number, number] => key.split(",").map(Number) as [number, number];

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

// 2. A* PATHFINDING ALGORITHM
export function generateRoads(
  _gridSize: number,
  grid: Record<string, GridCell>
): Record<string, GridCell> {
  const updatedGrid = { ...grid };
  const amenities = Object.values(updatedGrid).filter((c) => c.type === "amenity");
  if (amenities.length < 2) return updatedGrid;

  const aStarPath = (startKey: string, goalKey: string): string[] => {
    const [goalX, goalY] = parseKey(goalKey);
    const openSet = new Set<string>([startKey]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>([[startKey, 0]]);
    const fScore = new Map<string, number>([
      [startKey, getDistance(...parseKey(startKey), goalX, goalY)],
    ]);

    let iterations = 0;
    const MAX_ITERATIONS = 2000;

    while (openSet.size > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      let currentKey = "";
      let lowestF = Number.POSITIVE_INFINITY;

      for (const key of openSet) {
        const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
        if (score < lowestF) {
          lowestF = score;
          currentKey = key;
        }
      }

      if (!currentKey) break;
      if (currentKey === goalKey) {
        const path: string[] = [currentKey];
        let walk = currentKey;
        while (cameFrom.has(walk)) {
          walk = cameFrom.get(walk)!;
          path.unshift(walk);
        }
        return path;
      }

      openSet.delete(currentKey);
      const [cx, cy] = parseKey(currentKey);
      const neighbors = [[cx, cy - 1], [cx, cy + 1], [cx - 1, cy], [cx + 1, cy]];

      for (const [nx, ny] of neighbors) {
        const nKey = `${nx},${ny}`;
        const neighborCell = updatedGrid[nKey];
        if (!neighborCell || neighborCell.type === "disabled") continue;

        const existingRoadBonus = neighborCell.type === "road" ? -0.35 : 0;
        const tentativeGScore = (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) + 1 + existingRoadBonus;
        const currentNeighborGScore = gScore.get(nKey) ?? Number.POSITIVE_INFINITY;

        if (tentativeGScore < currentNeighborGScore) {
          cameFrom.set(nKey, currentKey);
          gScore.set(nKey, tentativeGScore);
          fScore.set(nKey, tentativeGScore + getDistance(nx, ny, goalX, goalY));
          openSet.add(nKey);
        }
      }
    }

    return [];
  };

  const connected = new Set<string>([`${amenities[0].x},${amenities[0].y}`]);
  const remaining = new Set<string>(amenities.slice(1).map((a) => `${a.x},${a.y}`));

  while (remaining.size > 0) {
    let bestFrom = "";
    let bestTo = "";
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const fromKey of connected) {
      const [fx, fy] = parseKey(fromKey);
      for (const toKey of remaining) {
        const [tx, ty] = parseKey(toKey);
        const dist = getDistance(fx, fy, tx, ty);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestFrom = fromKey;
          bestTo = toKey;
        }
      }
    }

    if (!bestFrom || !bestTo) break;
    const path = aStarPath(bestFrom, bestTo);
    path.forEach((key) => {
      const cell = updatedGrid[key];
      if (cell && cell.type === "residential") {
        updatedGrid[key] = { ...cell, type: "road" };
      }
    });

    connected.add(bestTo);
    remaining.delete(bestTo);
  }

  return updatedGrid;
}

// 3. PROPORTIONAL ECONOMICS MODEL
export function calculateEconomics(
  grid: Record<string, GridCell>,
  totalLandValue: number
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

  const serviceRadius: Record<string, number> = {
    hospital: 9,
    school: 8,
    park: 6,
    supermarket: 6,
    bus_station: 8,
    community_center: 7,
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
      const radius = serviceRadius[amenityType] ?? 6;
      const weight = serviceWeight[amenityType] ?? 1;
      const contribution = Math.max(0, 1 - nearest / radius) * weight;
      accessibility += contribution;
    });

    const adjacentRoadBonus = [
      `${cell.x},${cell.y - 1}`,
      `${cell.x},${cell.y + 1}`,
      `${cell.x - 1},${cell.y}`,
      `${cell.x + 1},${cell.y}`,
    ].some((neighborKey) => updatedGrid[neighborKey]?.type === "road")
      ? 0.4
      : 0;

    if (cell.type === "road") accessibility += 0.8;
    else accessibility += adjacentRoadBonus;

    const normalizedAccessibility = Math.max(0, Math.min(10, accessibility));
    updatedGrid[`${cell.x},${cell.y}`] = { ...cell, accessibilityScore: Number(normalizedAccessibility.toFixed(2)) };

    const zoningMultiplier = cell.type === "road" ? 0.55 : cell.type === "amenity" ? 0.85 : 1;
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
