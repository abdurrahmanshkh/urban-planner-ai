# UrbanPlan AI — Project Documentation

UrbanPlan AI is an advanced, automated municipal urban planning engine designed to assist in the conceptualization, zoning, and analysis of city layouts. It leverages spatial algorithms and established urban planning standards to generate optimized city grids, road networks, and infrastructure placements, alongside comprehensive economic and environmental analytics. 

This document outlines the core features, how the engine works, and the standards and algorithms that power it.

---

## 1. Core Features

### A. Topography & Boundary Extraction
- **Image Processing Engine**: Users can upload a sketch or image of a city boundary. The system uses a flood-fill and boundary-detection algorithm on an HTML5 Canvas to recognize the shape.
- **Dynamic Grid Sizing**: Based on the detected developable area and desired block size, the system calculates the ideal grid resolution dynamically.
- **Manual Grid Builder**: Users can explicitly define an N×N symmetric grid and block sizes for rigid layout planning.

### B. Intelligent Zoning & Infrastructure Setup
- **Automated Parameter Bounding**: When a project is initialized with a specific size, the engine automatically calculates the target population, required land area, and ideal number of amenities.
- **Dynamic Recalculation**: If users disable (remove) specific blocks in the interactive grid, the total developable land shrinks, which in turn automatically scales down the target population, land value, and amenity requirements in real time.

### C. Automated Layout Generation
- **A* Style Amenity Placement**: The system uses a multi-constraint optimization penalty algorithm to place amenities (schools, hospitals, parks) optimally across the grid.
- **Road Network Routing**: Generates a grid-based road network with varying lane configurations intelligently derived from local demand.
- **Proportional Economics Model**: Land values are distributed across individual residential blocks based on a composite "Desirability Weight" factoring in accessibility to amenities and roads.

### D. Municipal Analytics Dashboard
- **Traffic Level of Service (LOS)**: Calculates daily trips and peak-hour load across the generated road network to output a Volume-to-Capacity (V/C) ratio and LOS grade.
- **Environmental Impact & Water**: Computes required green cover per capita versus provided park space, alongside CPHEEO standards for daily water demand and wastewater generation.
- **Budget Forecast**: Estimates total Capital Expenditure (CapEx) and operational costs (OpEx) for the deployed infrastructure.

### E. Professional Reporting
- **PDF Export Engine**: Generates a multi-page, academic-grade executive summary of the simulated city, including a snapshot of the map, legend, metric highlights, and comprehensive infrastructure tables.

---

## 2. Standards Used

All calculations are strictly grounded in published Indian and international urban planning standards.

| Feature Area | Standard Used | Reference / Implementation |
|:---|:---|:---|
| **Social Infrastructure (Amenity Ratios)** | **URDPFI Guidelines (2014)** | School: 1 per 7,500 pop.<br>Hospital: 1 per 50,000 pop.<br>Park: 1 per 10,000 pop.<br>Supermarket: 1 per 10,000 pop.<br>Community Center: 1 per 25,000 pop. |
| **Healthcare Infrastructure** | **IPHS (Indian Public Health Standards)** | Aligned hospital sizing to Community/Intermediate hospital norms based on 50,000 population catchment areas. |
| **Walkability / Accessibility** | **15-Minute City Principles** | Uses constrained service radii:<br>- Park: 400m (5 min walk)<br>- School, Transit: 800m (10 min walk)<br>- Hospital: 1,500m (15 min reach) |
| **Green Cover** | **URDPFI Guidelines (2014)** | Target: 12 sqm of green/open space per person minimum. |
| **Road Network & Capacity** | **IRC:86-1983** | Arterial: 24m (4-Lane) @ 1,200 PCU/Lane/Hr.<br>Collector: 14m (2-Lane) @ 900 PCU/Lane/Hr.<br>Local: 7m (2-Lane) @ 500 PCU/Lane/Hr. |
| **Traffic Trip Generation** | **Indian CMP Data** | 1.4 Trips Per Person Per Day, with 12% occurring during the Peak Hour. |
| **Water & Sanitation** | **CPHEEO Manual** | Domestic demand: 135 LPCD (Liters Per Capita Per Day). Wastewater generation calculated at 80% of water supply. |
| **Density Parameters** | **URDPFI Guidelines (2014)** | Capped maximum residential density to 250 Persons Per Hectare (pph) for medium-to-high urban layouts. |
| **CapEx / OpEx Modeling** | **2024–2025 Industry Construction Averages** | Uses real-world infrastructure cost estimates (e.g., ~₹35Cr for a 50-bed community hospital, ~₹12Cr for a secondary school). |

---

## 3. How the Algorithms Work

### A. The Placer Algorithm (Constraint Satisfaction)
Found in `src/lib/algorithms.ts` (`placeAmenities` function).
The engine places amenities sequentially using a heuristic placement system. It searches for best residential cell coordinates to replace with an amenity based on a composite penalty score:
1.  **Target Distance (`targetDistance * 1.8`)**: Amenities are geometrically distributed around a central radius to ensure even dispersion. 
2.  **Centrality (`centrality * 0.4`)**: Slight pull toward the center of the grid for general accessibility.
3.  **Spacing Penalty (`spacingPenalty`)**: Heavily penalizes clustering two amenities of the same type too closely (min distance constraints) or clustering any amenity tightly.
4.  **Optimization Penalty (`optimizationPenalty`)**: It runs a simulation testing what the global grid accessibility score would be if the amenity were placed at a target cell, and chooses the orientation that maximizes total grid happiness.

### B. Road Classification Algorithm
Found in `src/lib/algorithms.ts` (`generateRoadNetwork`).
Roads are drawn between adjacent grid cells. For every resulting line (corridor), the system accumulates the "demand" of the adjacent cells.
-   Arterial status is triggered by immense residential demand (population density > 240) or high amenity agglomeration. 
-   Collector status is triggered by normal residential density.
-   Local status serves inactive or low-density block dividers. 

### C. Proportional Economics Model
Found in `src/lib/algorithms.ts` (`calculateEconomics`).
Land value is not static but dynamically driven by spatial proximity.
1.  **Accessibility Score Generator**: Every residential block calculates its distance to every amenity in the city. The scoring uses the "Distance Decay" model—blocks closer to the amenity get higher scores, dropping to 0 outside the 15-minute city radius (e.g., 800m for schools).
2.  **Weighting**: Different amenities have different desirability weights (e.g., Schools and Bus Stations contribute heavily to plot value; Community centers contribute less). 
3.  **Apportionment**: Each cell receives a final "Desirability Weight" factoring in road connectivity bonuses. The user's input "Total City Value" is then sliced up and distributed proportionally to blocks strictly matching their desirability weight fraction versus the total grid weight.

### D. Traffic V/C Ratio & Level of Service (LOS)
Found in `src/lib/municipalAnalytics.ts` (`calculateTrafficLoad`).
To determine congestion realistically:
1.  Sums total population and multiplies by 1.4 trips per day, taking 12% as the Peak Hour load.
2.  Assumes trips distribute evenly across available major "road corridors" generated.
3.  Determines the capacity of a corridor by its *weakest* bottleneck (the minimum capacity of its constituent segments).
4.  Divides the corridor trip load by the corridor bottle-neck capacity to find the Volume-to-Capacity (V/C) Ratio. 
5.  Maps the V/C Ratio to Highway Capacity Manual (HCM) grades: V/C < 0.4 = LOS A (Free Flow); 0.4 - 0.6 = LOS C (Stable); > 0.8 = LOS E (At Capacity).
