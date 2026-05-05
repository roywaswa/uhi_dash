# Urban Heat Island (UHI) Dashboard

## Overview

The Urban Heat Island Dashboard is a geospatial analysis platform for quantifying and visualizing the Urban Heat Island (UHI) effect in major cities worldwide. The system integrates multispectral satellite data from the Landsat 8 and 9 Earth observation missions with administrative boundary data to provide city-level thermal and vegetation analysis with spatial resolution of 100 meters.

## Scientific Background

### Urban Heat Island Effect

The Urban Heat Island (UHI) effect is a well-documented phenomenon in urban meteorology wherein urban areas experience significantly higher air and surface temperatures compared to surrounding rural areas (Oke, 1973; Voogt & Oke, 2003). The UHI effect arises from multiple factors:

- **Reduced vegetation cover**: Replacement of vegetation with impervious surfaces reduces evapotranspiration and latent heat flux
- **Thermal properties of urban materials**: Concrete, asphalt, and roofing materials have higher thermal conductivity and lower albedo than natural surfaces
- **Anthropogenic heat**: Waste heat from vehicles, air conditioning, and industrial processes
- **Modified urban geometry**: Building configurations alter wind patterns and reduce radiative cooling

### Land Surface Temperature (LST) Retrieval

The dashboard quantifies the spatial distribution of Land Surface Temperature (LST) using thermal infrared data from the Landsat missions. LST is retrieved from the Thermal Infrared Sensor (TIRS) bands following the standard radiometric correction workflow:

**Algorithm**:
1. **Radiometric rescaling**: Convert Digital Number (DN) values to at-sensor spectral radiance
   - $L_\lambda = M_L \times Q_{cal} + A_L$
   
   where $L_\lambda$ is spectral radiance, $M_L$ and $A_L$ are radiometric rescaling coefficients from metadata, and $Q_{cal}$ is the quantized and calibrated standard product DN.

2. **Brightness temperature calculation**: Convert spectral radiance to brightness temperature
   - $T_B = \frac{K_2}{\ln(\frac{K_1}{L_\lambda} + 1)}$
   
   where $T_B$ is brightness temperature in Kelvin, and $K_1$, $K_2$ are calibration constants specific to each thermal band.

3. **Normalized Difference Vegetation Index (NDVI) calculation**: Used to estimate land surface emissivity
   - $NDVI = \frac{NIR - RED}{NIR + RED}$
   
   where NIR and RED are the normalized reflectance values from bands 5 and 4 respectively.

4. **Land Surface Emissivity (LSE) determination**: Empirically derived from NDVI
   - $\varepsilon = a + b \times \ln(NDVI)$
   
   where constants a and b depend on surface properties (typically a ≈ 0.004, b ≈ 0.986).

5. **Land Surface Temperature derivation**: Convert brightness temperature to kinetic temperature
   - $LST = \frac{T_B}{\lambda} \times \frac{1}{\rho} \times \ln(\varepsilon)$
   
   where $\lambda$ is the wavelength of emitted radiation (11.0 μm for Landsat 8 band 10), and $\rho = 1.4388 \times 10^{-2}$ m·K.

**Data Source**: Landsat Collection 2 Level 2 (L2) products provide atmospherically corrected surface temperature, significantly reducing errors from atmospheric absorption and scattering compared to earlier processing levels.

### Vegetation Indexing

The Normalized Difference Vegetation Index (NDVI) serves as a proxy for vegetation density and canopy biomass:

- **NDVI range**: -0.1 to 0.7 (unitless)
- **Interpretation**: 
  - NDVI < 0: Water bodies or cloud
  - NDVI 0-0.2: Sparse/stressed vegetation, urban/barren land
  - NDVI 0.2-0.5: Moderate vegetation cover
  - NDVI > 0.5: Dense healthy vegetation

**Physical basis**: The differential reflectance between red (0.6-0.7 μm) and near-infrared (0.77-0.90 μm) wavelengths exploits the strong chlorophyll absorption in the red spectrum and high reflectance in the NIR region of healthy vegetation.

### Vulnerability Index

The dashboard derives a 5-tier vulnerability classification by integrating LST and NDVI:

$$V = 0.6 \times LST_{norm} + 0.4 \times (1 - NDVI_{norm})$$

where subscript $norm$ indicates min-max normalization within the city boundary. This formulation recognizes that vulnerability to heat stress increases with surface temperature and decreases with vegetation coverage. The weighting reflects recent literature emphasizing the stronger contribution of surface temperature in the UHI effect (Chakraborty & Lee, 2019).

## System Architecture

### Data Pipeline

```
Google Earth Engine
    ↓
Landsat 8/9 Collection 2 L2
(Atmospherically corrected)
    ↓
Geometric filtering (study area bounds)
Temporal filtering (June-September 2023)
Cloud filtering (< 15% cloud cover)
    ↓
Radiometric processing (LST & NDVI calculation)
    ↓
City boundary clipping (FAO/GAUL)
    ↓
Map tile generation & statistics computation
    ↓
REST API (JSON endpoints)
    ↓
Web-based visualization (MapLibre GL)
```

### Technology Stack

- **Backend**: FastAPI (Python) with Google Earth Engine API integration
- **Frontend**: Next.js 16 with React 19, MapLibre GL 5
- **Database**: PostgreSQL 16 with PostGIS extension
- **Container**: Docker & Docker Compose
- **Geospatial data**: FAO/GAUL_SIMPLIFIED_500m/2015 administrative boundaries

## Study Areas

The dashboard currently analyzes three major cities across different climatic regions and development contexts:

### Nairobi, Kenya
- **Coordinates**: 36.82°E, 1.29°S
- **Population**: ~4 million (metropolitan area)
- **Climate**: Tropical highland, mean annual temperature ~17°C
- **Characteristics**: Rapidly urbanizing East African metropolis with significant informal settlements

### Phoenix, Arizona, USA
- **Coordinates**: -112.07°W, 33.45°N
- **Population**: ~1.6 million (metropolitan area)
- **Climate**: Hot desert (Köppen: BWh), mean annual temperature ~20°C
- **Characteristics**: Arid-region megacity with extensive sprawl and low-density development

### Delhi, India
- **Coordinates**: 77.10°E, 28.70°N
- **Population**: ~30 million (metropolitan area)
- **Climate**: Subtropical, monsoonal; mean annual temperature ~25°C
- **Characteristics**: Densely populated South Asian megacity with high pollution levels

## Data Specifications

### Satellite Imagery

| Characteristic | Specification |
|---|---|
| **Satellites** | Landsat 8 (launched 2013) and Landsat 9 (launched 2021) |
| **Temporal coverage** | June 1 - September 1, 2023 (northern hemisphere summer) |
| **Cloud cover threshold** | < 15% (quality control) |
| **Spatial resolution** | 30m panchromatic, 100m thermal (resampled to 100m) |
| **Processing level** | Collection 2 Level 2 (surface temperature & reflectance) |
| **Thermal bands** | Band 10 (10.60-11.19 μm), Band 11 (11.50-12.51 μm) |
| **Optical bands** | Band 4 (RED: 0.64-0.67 μm), Band 5 (NIR: 0.85-0.88 μm) |

### Administrative Boundaries

- **Source**: FAO/GAUL_SIMPLIFIED_500m/2015 (Food and Agriculture Organization Geospatial Unit)
- **Level**: Administrative Division Level 2 (districts/provinces)
- **Simplification**: 500m Ramer-Douglas-Peucker simplification
- **Projection**: WGS84 (EPSG:4326)

## Key Features

### 1. Multi-Layer Visualization
- **Land Surface Temperature (LST)**: Temperature classification from 20-55°C with 11-color diverging palette
- **NDVI**: Vegetation index from -0.1 to 0.7 with 6-color sequential palette
- **Vulnerability Index**: 5-tier urban heat stress classification with perceptual color scheme

### 2. Time Series Analysis (2019-2025)
- **Temporal range**: Summer data (June-September) from 2019 to 2025
- **Interactive slider**: Aesthetic time slider for year selection with visual feedback
- **Dynamic data**: All visualizations and statistics update to reflect selected year
- **Trend analysis**: Compare UHI patterns across different years

### 3. Precise ROI Clipping
- **City boundaries**: Loaded from shapefile geometries (GADM dataset)
- **Exact analysis area**: Satellite data clipped to actual city boundaries instead of bounding boxes
- **Improved accuracy**: Statistics and visualizations reflect only the urban area of interest

### 4. Theme Support (Light/Dark Mode)
- **Toggle button**: Theme switcher in header (☀/◐ icons)
- **Dark mode** (default): Optimized for nighttime viewing and reduced eye strain
- **Light mode**: High-contrast, paper-like appearance for printing and daylight viewing
- **Persistent preference**: Theme choice saved in browser LocalStorage
- **Smooth transitions**: CSS variables enable instant theme switching with animations

### 5. Mobile Responsiveness
- **Responsive layout**: Stack sidebar on mobile devices (<768px width)
- **Adaptive typography**: Font sizes scale appropriately for smaller screens
- **Touch-friendly controls**: Buttons and interactive elements sized for mobile input
- **Flexible grid**: Statistics and charts reflow for mobile viewports
- **Full functionality**: All features accessible on smartphones and tablets

### 6. Statistical Analysis
For each city and analysis date, the dashboard computes:
- **Temperature statistics**: Mean, minimum, maximum, standard deviation (°C)
- **Vegetation metrics**: Mean NDVI, vegetation coverage percentage
- **Vulnerability distribution**: Percentage of urban area in each vulnerability tier
- **High-risk area assessment**: Proportion of city exceeding tier 4-5 vulnerability thresholds

### 7. Spatial Extent
- **Study boundaries**: City shapefile geometries (actual city boundaries)
- **Grid resolution**: 100m × 100m pixels (0.01 km²)
- **Analysis method**: Zonal statistics within clipped city geometry

### 8. Quality Control
- **Cloud filtering**: Landsat Quality Assessment Band (QA_PIXEL) applied to exclude cloudy observations
- **Atmospheric correction**: Surface reflectance and brightness temperature pre-computed by USGS
- **Data validation**: NULL checks on all retrieved geospatial statistics

## API Endpoints

### /health
Health check endpoint returning service status.

```bash
GET /health
```

### /cities
List available study cities with metadata.

```bash
GET /cities
Response: {
  "Nairobi": {
    "center": [36.82, -1.29],
    "zoom": 11,
    "country": "Kenya"
  },
  ...
}
```

### /tiles/{city}
Retrieve Web Mercator tiles for visualization layers.

```bash
GET /tiles/{city}?year=2023
Response: {
  "lst": "https://...",
  "ndvi": "https://...",
  "vulnerability": "https://..."
}
```

**Query Parameters**:
- `year` (optional, int): Year for analysis (2019-2025, default: 2023)

### /stats/{city}
Retrieve zonal statistics for city area.

```bash
GET /stats/{city}?year=2023
Response: {
  "meanLst": 32.45,
  "maxLst": 45.23,
  "minLst": 18.92,
  "stdLst": 5.12,
  "meanNdvi": 0.42,
  "tierPct": {
    "1": 15.2,  /* Low vulnerability */
    "2": 25.3,
    "3": 28.1,
    "4": 20.1,
    "5": 11.3   /* High vulnerability */
  },
  "highRiskPct": 31.4
}
```

**Query Parameters**:
- `year` (optional, int): Year for analysis (2019-2025, default: 2023)

### /scatter/{city}
Retrieve LST-NDVI scatter plot data for city.

```bash
GET /scatter/{city}?year=2023
Response: [
  {"ndvi": 0.245, "lst": 34.21},
  {"ndvi": 0.412, "lst": 28.15},
  ...
]
```

**Query Parameters**:
- `year` (optional, int): Year for analysis (2019-2025, default: 2023)

### System Requirements

**Development**:
- Docker & Docker Compose (v2.0+)
- 4GB RAM, 10GB disk space

**Production (EC2)**:
- t3.medium or larger instance (2 vCPU, 4GB RAM minimum)
- 20GB EBS volume (gp3 recommended)
- Security group: ports 3001/tcp (frontend), 8001/tcp (API)
- Google Earth Engine credentials for Landsat data access

### Features & Browser Support

- **Modern UI**: Responsive design works on desktop (1024px+), tablet (768px+), and mobile (320px+)
- **Theme support**: Automatic dark/light mode detection with manual toggle
- **Cross-browser**: Tested on Chrome, Firefox, Safari, and Edge
- **Touch-friendly**: Mobile controls optimized for smartphones and tablets

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd uhi_dash

# Configure environment
cp .env.example .env
# Edit .env with Google Earth Engine credentials

# Place GEE service account key
mkdir -p secrets
# Copy your GEE key.json to ./secrets/

# Build and run
docker-compose up --build

# Access
# Frontend: http://localhost:3001
# API Docs: http://localhost:3001/docs
```

## Usage

### Selecting a City
Click city buttons in the header (Nairobi, Phoenix, Delhi) to switch between study areas. The map and statistics automatically update.

### Viewing Different Years
Use the interactive time slider in the sidebar to select years 2019-2025. The slider shows:
- Draggable handle with visual feedback
- Year tick marks and labels
- Current year display with context
- Smooth data loading as you move through time

### Switching Themes
Click the theme toggle button (☀/◐) in the top-right to switch between dark mode and light mode. Your preference is saved automatically.

### Analyzing Layers
Select visualization layer using the Layer toggle:
- **LST**: Surface temperature in °C (20-55°C range)
- **NDVI**: Vegetation index (-0.1 to 0.7)
- **Vulnerability**: 5-tier heat stress classification

### Viewing Statistics
The right sidebar displays:
- **Current year stats**: Temperature, NDVI, risk metrics
- **Vulnerability distribution**: Bar chart showing % area in each tier
- **LST-NDVI relationship**: Scatter plot with trend line

### Mobile Usage
On phones and tablets:
- Sidebar stacks below the map for easier scrolling
- Touch-friendly buttons and controls
- Responsive charts that adapt to screen width
- Full functionality maintained on all screen sizes

## Limitations & Caveats

1. **Temporal coverage**: Analysis for years 2019-2025; limited to June-September window for Landsat Tier 1 data availability

2. **Cloud cover bias**: Northern hemisphere summer subject to convective cloud development, potentially biasing results toward clear-sky observations

3. **Spatial resolution**: 100m pixels may aggregate heterogeneous urban land use; sub-100m variations not resolved

4. **LST uncertainty**: Standard LST retrieval error ~1-2 K due to emissivity assumptions and atmospheric corrections (Hulley et al., 2016)

5. **Administrative boundaries**: GADM city boundaries may not align perfectly with meteorologically-defined urban areas

6. **Landsat revisit time**: 16-day orbital cycle with Landsat 8/9 combined coverage; temporal resolution limited to available cloud-free observations

7. **NDVI saturation**: NDVI exhibits saturation at high biomass levels, reducing discriminative power in densely vegetated areas


## Future Enhancements

- [ ] Multi-temporal analysis (1985-present) for UHI trend detection
- [ ] Sentinel-2 integration (10m spatial resolution)
- [ ] Day/night LST separation (currently daytime-only)
- [ ] Time series anomaly detection
- [ ] Machine learning classification of urban land use types
- [ ] Coupled temperature-humidity index (UTCI) calculation
- [ ] Integration with health outcome data for epidemiological analysis

## References

- Chakraborty, T., & Lee, X. (2019). A simplified urban-extent algorithm to quantify surface urban heat islands using Landsat. *Remote Sensing of Environment*, 224, 100-108.
- Hulley, G. C., Hook, S. J., Schneider, P., & Paynter, I. (2016). Variability of emissivity and spectral reflectance of basalt and implications for Landsat temperature retrieval. *Remote Sensing of Environment*, 177, 163-174.
- Oke, T. R. (1973). City size and the urban heat island. *Atmospheric Environment*, 7(8), 769-779.
- Voogt, J. A., & Oke, T. R. (2003). Thermal remote sensing of urban climates. *Remote Sensing of Environment*, 86(3), 370-384.
- Weng, Q., Lu, D., & Schubring, J. (2004). Estimation of land surface temperature-vegetation abundance relationship for urban heat island studies. *Remote Sensing of Environment*, 89(4), 467-483.

## License

[Specify appropriate license]

## Citation

If you use this dashboard in scientific research, please cite:

```bibtex
@software{uhi_dashboard_2026,
  author = {[Author Name]},
  title = {Urban Heat Island Dashboard: Satellite-based thermal monitoring of major cities},
  year = {2026},
  url = {[Repository URL]}
}
```

## Contact & Support

For technical issues, questions, or contributions, please refer to [contact information or issue tracker].

---

**Last Updated**: May 4, 2026  
**Data Coverage**: June-September 2023  
**Satellite Missions**: Landsat 8 & 9 Collection 2 L2  
**Geospatial Resolution**: 100m × 100m
