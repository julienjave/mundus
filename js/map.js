// --- MAP.JS --------------------------------------------------------------------------------------
/**
 * Holds the map logic and pipeline
 * - Configuration variables
 * - State tracking variables
 * - Map functions (Initialization and themes)
 * - Instantiation
 * - Async and DOM functions (Highlight, Capital city markers)
 */

// === Configuration Variables ===

// Define the Tile URLs and attributions
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

// Marker Icon
const capitalIcon = L.divIcon({
    html: `<svg><use href="#icon-capital-pin"/></svg>`, 
    className: 'custom-div-icon', // Removes default background
    iconSize: [32, 32], 
    iconAnchor: [16, 30]
})


// === State Tracking Variables ===

let activeTileLayer // Keep track of the active tile layer globally
let highlightLayer = null
let capitalMarker = null
let labelCityMarker = null


// === Map Functions ===

// Initialize the map with the default theme (Light)
function initMap(lat, lon, id) {
    const map = L.map(id).setView([lat, lon], 4)

    // Create and store the initial tile layer
    activeTileLayer = L.tileLayer(LIGHT_TILES, {
        attribution: CARTO_ATTRIBUTION, 
        maxZoom: 20
    }).addTo(map)

    return map
}

function switchMapThemes(map, mode) {
    // Determine the new tile URL based on the theme
    const newTileUrl = mode === 'dark' ? DARK_TILES : LIGHT_TILES

    // Remove the current active layer from the map
    if (activeTileLayer) {
        map.removeLayer(activeTileLayer);
    }

    // Create the new layer and add it to the map
    activeTileLayer = L.tileLayer(newTileUrl, {
        attribution: CARTO_ATTRIBUTION,
        maxZoom: 20
    }).addTo(map)
}


// === Instantiation ===

const mapMain = initMap(49.2827, -123.1207, 'map')


// === Async & DOM Functions ===

async function highlightCountry(countryCode) {
    const response = await fetch('./data/world.json')
    const geoData = await response.json()

    // Remove the previous highlight if it exists
    if (highlightLayer) {
        mapMain.removeLayer(highlightLayer);
    }

    // Create a new layer filtered by the country name
    highlightLayer = L.geoJSON(geoData, {
        filter: (feature) => {
            const featCode = feature.properties.iso_a3
            return featCode === countryCode.toUpperCase()
        },
        style: {
            color: '#ff7800', // Border color
            weight: 3, // Border thickness
            fillColor: '#ff7800',
            fillOpacity: 0.3 // Transparent fill
        }
    }).addTo(mapMain)

    // Automatically zoom the map to fit the borders
    const bounds = highlightLayer.getBounds()
    mapMain.fitBounds(bounds)
}

function addCapitalMarker(lat, lng, cityName, iso) {
    let finalLng = lng

    // If the country is the USA, we shift the marker by 360 degrees
    // to match the 'tile' where our refined GeoJSON lives.
    if (iso === "USA" && lng < 0) {
        finalLng += 360
    }

    // 1. Remove the old marker if it exists
    if (capitalMarker) {
        mapMain.removeLayer(capitalMarker)
    }

    // 2. Create the new marker
    capitalMarker = L.marker([lat, finalLng], {icon: capitalIcon}).addTo(mapMain)

    // 3. Add a label marker to display the city name
    const labelCity = L.divIcon({
        html: `<div class="city-label-div">${cityName}</div>`, 
        className: 'city-label',
        iconSize: [0, 0], 
        iconAnchor: [-10, 40]
    })

    if (labelCityMarker) {
        mapMain.removeLayer(labelCityMarker)
    }

    labelCityMarker = L.marker([lat, finalLng], {icon: labelCity}).addTo(mapMain)
}

