This is a comprehensive technical breakdown of your **UrbanPlan AI** project, structured specifically for an engineering presentation. You can use these sections as your slide headings and speaking points.

---

### 1. Architectural Overview
*   **Frontend Stack**: React (Next.js), TypeScript, Tailwind CSS, Lucide Icons.
*   **State Management**: Zustand (for a high-performance, reactive centralized store).
*   **Visualization**: Custom HTML5 Canvas (for topography) and an SVG/CSS-based interactive grid.
*   **Core Logic**: A modular library system (`lib/`) that separates pure planning mathematics from spatial algorithms.

---

### 2. The Initialization Engine (Spatial Scaling)
**Files**: `src/lib/planningMath.ts`, `src/components/MapProcessor.tsx`

**How it works**:
*   **Topography Extraction**: When a user uploads a boundary image, the system uses a **Flood-Fill algorithm** on a hidden canvas to identify "developable" pixels versus "empty" pixels.
*   **Dynamic Resolution Estimation**: 
    *   The system takes the target **Land Area (Hectares)** and the desired **Block Size (Meters)**.
    *   It calculates the total grid cells ($N \times N$) required to fit that area using the formula:

$$ \text{Cells} = \frac{\text{Total Area (sqm)}}{\text{Block Size (sqm)} \times \text{Fill Ratio}} $$

*   **Auto-Zoning**: Upon initialization, the system calculates the **Ideal Population** based on the URDPFI-standard density limit (capped at **250 pph**).

---

### 3. Social Infrastructure Planning (URDPFI Standards)
**Files**: `src/lib/planningMath.ts`

Your system isn't just picking numbers; it follows the **URDPFI (Urban & Regional Development Plans Formulation & Implementation) 2014 Guidelines** for population-to-amenity ratios.

| Amenity | Standard Ratio | Technical Logic |
| :--- | :--- | :--- |
| **School** | 1 per 7,500 people | Ensures senior secondary coverage for the population. |
| **Hospital** | 1 per 50,000 people | Aligned with Community Health Center (CHC) norms. |
| **Park** | 1 per 10,000 people | Targets the mandate of **10–12 sqm per person** of green cover. |
| **Bus Station** | 1 per 15,000 people | Derived from 15-minute city walkability standards (800m catchment). |

---

### 4. The Placement Engine (Heuristic Optimization)
**Files**: `src/lib/algorithms.ts` (`placeAmenities`)

This is the "AI" part of your project. Instead of random placement, it uses a **Constraint-Based Penalty Heuristic**.

**The Calculation**: For every amenity, the system scores every potential residential block ($i, j$) using a penalty function:

$$ \text{Score} = (P_{\text{dist}} \times 1.8) + (P_{\text{center}} \times 0.4) + P_{\text{spacing}} + P_{\text{global\_happiness}} $$

1.  **Distance Penalty ($P_{\text{dist}}$)**: Ensures amenities are spread out to cover the entire grid.
2.  **Centrality Penalty ($P_{\text{center}}$)**: Keeps amenities accessible but not congested.
3.  **Spacing Penalty ($P_{\text{spacing}}$)**: Hard-prevents clustering (e.g., you can't have two hospitals side-by-side).
4.  **Global Happiness**: Simulates the "accessibility score" for the *entire* grid if the amenity were placed there, choosing the spot that maximizes the total city score.

---

### 5. The Economics Engine (Accessibility Modeling)
**Files**: `src/lib/algorithms.ts` (`calculateEconomics`)

This explains why one block costs more than another. It uses a **Distance Decay Function**.

**The Logic**:
1.  **Catchment Mapping**: For every residential block, the system calculates the Euclidean distance to every amenity.
2.  **Score Weighting**: A block gets points if an amenity is within its "Service Radius" (e.g., 800m for a school). The closer it is, the higher the score.
3.  **Apportionment**:
    *   The user inputs a "Total City Land Value" (e.g., ₹500 Cr).
    *   The system sums all accessibility weights for the entire grid.
    *   A block's individual value is calculated as:

$$ \text{Block Value} = \text{Total Value} \times \left( \frac{\text{Block Weight}}{\sum \text{All Weights}} \right) $$

---

### 6. Municipal Analytics (The Impact Assessment)
**Files**: `src/lib/municipalAnalytics.ts`

This is where you demonstrate the project's engineering rigor using industry standards.

#### A. Traffic Load & LOS (IRC:86-1983 Standard)
*   **Volume ($V$)**: 1.4 trips/person/day $\times$ 12% peak hour factor.
*   **Capacity ($C$)**: Arterial (1,200), Collector (900), Local (500) PCU/Lane/Hr.
*   **V/C Ratio**: Determines the **Level of Service (LOS)**. 
    *   V/C < 0.4 = **LOS A/B** (Smooth)
    *   V/C > 1.0 = **LOS F** (Oversaturated)

#### B. Water & Sanitation (CPHEEO Standard)
*   **Water Demand**: 135 LPCD (Liters Per Capita Per Day).
*   **Wastewater**: 80% of supply (standard municipal engineering assumption).
*   **STP (Sewage Treatment Plant)**: Calculates the required MLD (Million Liters per Day) capacity needed to support the population.

---

### 7. Interactive Feature: Drag-and-Drop Repositioning
*   **Technical Implementation**: Uses a React-based drag-and-drop handler.
*   **Why it's important**: It allows **Scenario Planning**. When you move a school, the system instantly reruns the **Economics Engine** in the background, showing how land values "ripple" across the map in real-time.

---

### Presentation Strategy Tip:
If an examiner asks, *"Why did you use these specific numbers?"*, your answer should always be: 
> *"The system constants are derived from the **URDPFI 2014 Guidelines** and **IRC (Indian Roads Congress)** standards to ensure the simulation reflects real-world urban planning requirements in the Indian context."*

This shows that your project is not just a UI, but a compliant engineering tool. Good luck with your presentation!