import os
from pathlib import Path

import ee
import geopandas as gpd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
app = FastAPI(title="UHI Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", os.getenv("FRONTEND_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)

_gee_initialised = False
_city_geometries = {}


def init_gee():
    global _gee_initialised
    if _gee_initialised:
        return
    key_file = os.getenv("GEE_KEY_FILE")
    sa_email = os.getenv("GEE_SERVICE_ACCOUNT")
    if key_file and sa_email and os.path.exists(key_file):
        credentials = ee.ServiceAccountCredentials(sa_email, key_file)
        ee.Initialize(credentials)
    else:
        ee.Initialize()
    _gee_initialised = True


def _load_city_geometries():
    """Load shapefile geometries for each city."""
    global _city_geometries
    if _city_geometries:
        return
    
    shapefile_dir = Path(__file__).parent / "data" / "gadm"
    city_names = {"Nairobi": "nairobi", "Phoenix": "phoenix", "Delhi": "delhi"}
    
    for city, shp_name in city_names.items():
        shp_path = shapefile_dir / f"{shp_name}.shp"
        if shp_path.exists():
            gdf = gpd.read_file(shp_path)
            # Convert to EE geometry
            geom_json = gdf.geometry[0].__geo_interface__
            _city_geometries[city] = ee.Geometry(geom_json)


def _get_city_geometry(city: str) -> ee.Geometry | None:
    """Get the EE geometry for a city from shapefiles."""
    _load_city_geometries()
    return _city_geometries.get(city)


CITIES = {
    "Nairobi": {"bounds": [36.65, -1.45, 37.05, -1.15], "center": [36.82, -1.29], "zoom": 11},
    "Phoenix": {"bounds": [-112.35, 33.28, -111.80, 33.65], "center": [-112.07, 33.45], "zoom": 11},
    "Delhi": {"bounds": [76.85, 28.50, 77.40, 28.95], "center": [77.10, 28.70], "zoom": 11},
}

LST_VIS = {
    "min": 20,
    "max": 55,
    "palette": [
        "#313695",
        "#4575b4",
        "#74add1",
        "#abd9e9",
        "#e0f3f8",
        "#ffffbf",
        "#fee090",
        "#fdae61",
        "#f46d43",
        "#d73027",
        "#a50026",
    ],
}
NDVI_VIS = {
    "min": -0.1,
    "max": 0.7,
    "palette": ["#d73027", "#f46d43", "#fee08b", "#d9ef8b", "#1a9850", "#006837"],
}
VULN_VIS = {
    "min": 1,
    "max": 5,
    "palette": ["#2166ac", "#74add1", "#fee090", "#f46d43", "#a50026"],
}


def _get_image(city_key: str, year: int = 2023) -> tuple:
    """Returns (mean_image, bounds_geometry) for a city at a specific year.
    
    Uses shapefile geometry for ROI if available, otherwise uses bounding box.
    """
    # Try to get geometry from shapefile, fallback to bounds
    roi_geometry = _get_city_geometry(city_key)
    if roi_geometry is None:
        bounds_coords = CITIES[city_key]["bounds"]
        roi_geometry = ee.Geometry.Rectangle(bounds_coords)

    # Define date range for the year (summer months: June-September)
    start_date = f"{year}-06-01"
    end_date = f"{year}-09-01"

    collection = (
        ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
        .merge(ee.ImageCollection("LANDSAT/LC08/C02/T1_L2"))
        .filterBounds(roi_geometry)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUD_COVER", 15))
    )

    def scale_image(img):
        lst = img.select("ST_B10").multiply(0.00341802).add(149.0).subtract(273.15).rename("LST_C")
        ndvi = (
            img.select(["SR_B4", "SR_B5"])
            .multiply(0.0000275)
            .add(-0.2)
            .normalizedDifference(["SR_B5", "SR_B4"])
            .rename("NDVI")
        )
        return img.addBands(lst).addBands(ndvi)

    mean_image = collection.map(scale_image).select(["LST_C", "NDVI"]).mean().clip(roi_geometry)
    return mean_image, roi_geometry


def _vulnerability_image(mean_image, bounds):
    """Compute normalised vulnerability index and 5-tier classification."""
    lst = mean_image.select("LST_C")
    ndvi = mean_image.select("NDVI")

    stats = mean_image.reduceRegion(reducer=ee.Reducer.minMax(), geometry=bounds, scale=200, bestEffort=True)

    lst_min = ee.Number(stats.get("LST_C_min"))
    lst_max = ee.Number(stats.get("LST_C_max"))
    ndvi_min = ee.Number(stats.get("NDVI_min"))
    ndvi_max = ee.Number(stats.get("NDVI_max"))

    lst_norm = lst.subtract(lst_min).divide(lst_max.subtract(lst_min))
    ndvi_norm = ndvi.subtract(ndvi_min).divide(ndvi_max.subtract(ndvi_min))
    ndvi_inv = ee.Image(1).subtract(ndvi_norm)

    vuln = lst_norm.multiply(0.6).add(ndvi_inv.multiply(0.4)).rename("VI")

    tiers = (
        vuln.where(vuln.lt(0.2), 1)
        .where(vuln.gte(0.2).And(vuln.lt(0.4)), 2)
        .where(vuln.gte(0.4).And(vuln.lt(0.6)), 3)
        .where(vuln.gte(0.6).And(vuln.lt(0.8)), 4)
        .where(vuln.gte(0.8), 5)
        .rename("VulnTier")
    )
    return vuln, tiers


@app.get("/cities")
def list_cities():
    init_gee()
    return {k: {"center": v["center"], "zoom": v["zoom"]} for k, v in CITIES.items()}


@app.get("/tiles/{city}")
def get_tiles(city: str, year: int = 2023):
    init_gee()
    if city not in CITIES:
        raise HTTPException(404, f"City '{city}' not found")
    if year < 2019 or year > 2025:
        raise HTTPException(400, "Year must be between 2019 and 2025")
    mean_image, bounds = _get_image(city, year)
    _, tiers = _vulnerability_image(mean_image, bounds)

    lst_map = mean_image.select("LST_C").getMapId(LST_VIS)
    ndvi_map = mean_image.select("NDVI").getMapId(NDVI_VIS)
    vuln_map = tiers.getMapId(VULN_VIS)

    return {
        "lst": lst_map["tile_fetcher"].url_format,
        "ndvi": ndvi_map["tile_fetcher"].url_format,
        "vulnerability": vuln_map["tile_fetcher"].url_format,
    }


@app.get("/stats/{city}")
def get_stats(city: str, year: int = 2023):
    init_gee()
    if city not in CITIES:
        raise HTTPException(404, f"City '{city}' not found")
    if year < 2019 or year > 2025:
        raise HTTPException(400, "Year must be between 2019 and 2025")
    mean_image, bounds = _get_image(city, year)
    _, tiers = _vulnerability_image(mean_image, bounds)

    stats = mean_image.reduceRegion(
        reducer=ee.Reducer.mean().combine(ee.Reducer.minMax(), sharedInputs=True).combine(
            ee.Reducer.stdDev(), sharedInputs=True
        ),
        geometry=bounds,
        scale=100,
        bestEffort=True,
    )
    tier_counts = tiers.reduceRegion(
        reducer=ee.Reducer.frequencyHistogram(),
        geometry=bounds,
        scale=100,
        bestEffort=True,
    ).get("VulnTier")
    payload = ee.Dictionary(stats).set("tier_counts", tier_counts).getInfo()

    tier_counts_info = payload.get("tier_counts", {})
    total = sum(tier_counts_info.values()) or 1
    tier_pct = {
        str(t): round(tier_counts_info.get(str(float(t)), 0) / total * 100, 1)
        for t in range(1, 6)
    }
    high_risk_pct = tier_pct.get("4", 0) + tier_pct.get("5", 0)

    return {
        "meanLst": round(payload.get("LST_C_mean", 0), 2),
        "maxLst": round(payload.get("LST_C_max", 0), 2),
        "minLst": round(payload.get("LST_C_min", 0), 2),
        "stdLst": round(payload.get("LST_C_stdDev", 0), 2),
        "meanNdvi": round(payload.get("NDVI_mean", 0), 3),
        "tierPct": tier_pct,
        "highRiskPct": round(high_risk_pct, 1),
    }


@app.get("/scatter/{city}")
def get_scatter(city: str, year: int = 2023):
    init_gee()
    if city not in CITIES:
        raise HTTPException(404, f"City '{city}' not found")
    if year < 2019 or year > 2025:
        raise HTTPException(400, "Year must be between 2019 and 2025")
    mean_image, bounds = _get_image(city, year)

    grid = bounds.coveringGrid(ee.Projection("EPSG:4326").atScale(2000))
    zonal = (
        mean_image.reduceRegions(collection=grid, reducer=ee.Reducer.mean(), scale=100, tileScale=4)
        .filter(ee.Filter.notNull(["LST_C", "NDVI"]))
        .limit(300)
    )
    features = zonal.getInfo()["features"]
    return [
        {"ndvi": round(f["properties"]["NDVI"], 3), "lst": round(f["properties"]["LST_C"], 2)}
        for f in features
    ]
