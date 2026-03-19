// src/lib/algorithms.ts
import { GridCell, CellType } from "@/store/usePlanStore";

// Helper: Manhattan Distance
const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

// 1. ZONING ALGORITHM (Constraint Satisfaction)
export function placeAmenities(
  gridSize: number,
  initialGrid: Record<string, GridCell>,
  amenitiesToPlace: Record<string, number>
): Record<string, GridCell> {
  const grid = { ...initialGrid };
  const activeCells = Object.values(grid).filter((c) => c.type !== "disabled");
  
  if (activeCells.length === 0) return grid;

  // Calculate Grid Center
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;

  // Sort active cells by distance to center
  const centerSortedCells = [...activeCells].sort(
    (a, b) => getDistance(a.x, a.y, centerX, centerY) - getDistance(b.x, b.y, centerX, centerY)
  );

  const placedPositions: { x: number; y: number; type: string }[] = [];

  // Placement Order: Commercial/Community (Center) -> Hospitals (Spread) -> Schools -> Parks
  const placementOrder = ["community_center", "supermarket", "hospital", "school", "bus_station", "park"];

  placementOrder.forEach((amenityType) => {
    let count = amenitiesToPlace[amenityType] || 0;
    
    while (count > 0) {
      // Determine required spacing based on amenity type
      let minDistance = 0;
      if (amenityType === "hospital") minDistance = 6;
      else if (amenityType === "school") minDistance = 4;
      else if (amenityType === "park") minDistance = 3;

      let placed = false;

      // Find a suitable cell
      for (const cell of centerSortedCells) {
        if (grid[`${cell.x},${cell.y}`].type !== "residential") continue; // Already occupied

        // Check constraint: Is it far enough from same-type amenities?
        const tooClose = placedPositions.some(
          (p) => p.type === amenityType && getDistance(p.x, p.y, cell.x, cell.y) < minDistance
        );

        if (!tooClose) {
          grid[`${cell.x},${cell.y}`] = { ...cell, type: "amenity", amenityType };
          placedPositions.push({ x: cell.x, y: cell.y, type: amenityType });
          placed = true;
          count--;
          break;
        }
      }

      // Fallback if constraints are too strict (reduce distance and try again)
      if (!placed) {
        if (minDistance > 1) {
          minDistance--; // Relax constraint
        } else {
          break; // Grid is completely full or impossible to place
        }
      }
    }
  });

  return grid;
}

// 2. A* PATHFINDING ALGORITHM (Road Routing)
export function generateRoads(
  gridSize: number,
  grid: Record<string, GridCell>
): Record<string, GridCell> {
  const updatedGrid = { ...grid };
  const amenities = Object.values(updatedGrid).filter((c) => c.type === "amenity");
  
  if (amenities.length < 2) return updatedGrid;

  // Connect amenities to the center, or to each other
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);

  amenities.forEach((start) => {
    // Basic A* Implementation
    const openSet = new Set<string>([`${start.x},${start.y}`]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    gScore.set(`${start.x},${start.y}`, 0);

    const fScore = new Map<string, number>();
    fScore.set(`${start.x},${start.y}`, getDistance(start.x, start.y, centerX, centerY));

    while (openSet.size > 0) {
      // Find node in openSet with lowest fScore
      let currentKey = "";
      let lowestF = Infinity;
      for (const key of openSet) {
        const score = fScore.get(key) || Infinity;
        if (score < lowestF) {
          lowestF = score;
          currentKey = key;
        }
      }

      const [cx, cy] = currentKey.split(",").map(Number);

      // Reached center or near center
      if (getDistance(cx, cy, centerX, centerY) <= 1) {
        // Reconstruct path
        let curr = currentKey;
        while (cameFrom.has(curr)) {
          curr = cameFrom.get(curr)!;
          const [px, py] = curr.split(",").map(Number);
          const cell = updatedGrid[`${px},${py}`];
          // Don't overwrite amenities with roads
          if (cell && cell.type === "residential") {
            updatedGrid[`${px},${py}`] = { ...cell, type: "road" };
          }
        }
        break;
      }

      openSet.delete(currentKey);

      // Check neighbors
      const neighbors = [
        [cx, cy - 1], [cx, cy + 1], [cx - 1, cy], [cx + 1, cy]
      ];

      for (const [nx, ny] of neighbors) {
        const nKey = `${nx},${ny}`;
        const neighborCell = updatedGrid[nKey];

        // Bounds and obstacle check
        if (!neighborCell || neighborCell.type === "disabled") continue;

        const tentativeGScore = (gScore.get(currentKey) || 0) + 1;
        const currentNeighborGScore = gScore.get(nKey) || Infinity;

        if (tentativeGScore < currentNeighborGScore) {
          cameFrom.set(nKey, currentKey);
          gScore.set(nKey, tentativeGScore);
          fScore.set(nKey, tentativeGScore + getDistance(nx, ny, centerX, centerY));
          openSet.add(nKey);
        }
      }
    }
  });

  return updatedGrid;
}

// 3. PROPORTIONAL ECONOMICS MODEL
export function calculateEconomics(
  grid: Record<string, GridCell>,
  totalLandValue: number
): Record<string, GridCell> {
  const updatedGrid = { ...grid };
  const amenities = Object.values(updatedGrid).filter((c) => c.type === "amenity");
  
  let totalAccessibilityScore = 0;

  // First pass: Calculate Accessibility Scores
  Object.values(updatedGrid).forEach((cell) => {
    if (cell.type === "disabled") return;

    let score = 1; // Base score
    if (cell.type === "road") score += 2; // Roads are slightly more valuable
    if (cell.type === "amenity") score += 5; // Amenities themselves are high value

    // Add value based on proximity to amenities
    amenities.forEach((amenity) => {
      const dist = getDistance(cell.x, cell.y, amenity.x, amenity.y);
      if (dist > 0 && dist < 10) {
        // Inverse distance weighting
        score += (10 - dist) * 0.5; 
      }
    });

    updatedGrid[`${cell.x},${cell.y}`] = { ...cell, accessibilityScore: score };
    totalAccessibilityScore += score;
  });

  // Second pass: Distribute Total Land Value proportionally
  if (totalAccessibilityScore > 0) {
    Object.values(updatedGrid).forEach((cell) => {
      if (cell.type === "disabled") {
        updatedGrid[`${cell.x},${cell.y}`].landValue = 0;
      } else {
        const score = cell.accessibilityScore || 0;
        const cellValue = totalLandValue * (score / totalAccessibilityScore);
        updatedGrid[`${cell.x},${cell.y}`].landValue = Math.round(cellValue);
      }
    });
  }

  return updatedGrid;
}