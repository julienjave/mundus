// tools/geojson-optimizer.js

// Import the File System module
const fs = require('fs')
const path = require('path')

// Configuration
const INPUT_FILE = path.join(__dirname, '../geoJson-original/map_units_50_simplified.json')
const OUTPUT_FILE = path.join(__dirname, '../data/world-clean.json')
const PRECISION = 5

// Global Variable
const ANTIMERIDIANS = ["RUS", "FJI", "NZL", "KIR", "USA"] // Countries crossing the 180th meridian

/**
 * Recursively rounds numbers to a specific decimal precision
 */
function processCoordinates(coord, decimals, shouldShift = false) {
    if (Array.isArray(coord)) {
        // If it's the innermost array [longitude, latitude]
        if (typeof coord[0] === 'number' && coord.length === 2) {
            let lon = coord[0]
            let lat = coord[1]

            // Only shift if it's a negative longitude and the country is flagged
            if (shouldShift && lon < 0) {
                lon += 360
            }

            return [
                Number(lon.toFixed(decimals)),
                Number(lat.toFixed(decimals))
            ]
        }
        
        // Otherwise, keep recursing deeper into the arrays
        return coord.map(c => processCoordinates(c, decimals, shouldShift))
    }
    return coord
}

/**
 * Main cleaning logic
 */
function cleanGeoJson(rawPath, outputPath) {
    console.log('>>> Starting GeoJSON optimization...')

    // Read the file from disk
    try {
        const rawData = fs.readFileSync(rawPath, 'utf8')
        const geoJson = JSON.parse(rawData)

        const cleanedFeatures = geoJson.features.map(feature => {
            const iso = feature.properties.ISO_A3 || feature.properties.iso_a3;
            const isAntimeridian = ANTIMERIDIANS.includes(iso);

            return {
                type: "Feature",
                properties: {
                    name: feature.properties.NAME || feature.properties.name,
                    iso_a3: iso
                },
                geometry: {
                    type: feature.geometry.type,
                    coordinates: processCoordinates(feature.geometry.coordinates, PRECISION, isAntimeridian)
                }
            };
        });

        const result = {
            type: "FeatureCollection",
            features: cleanedFeatures
        }

        // Write the minified JSON directly to the data folder
        fs.writeFileSync(outputPath, JSON.stringify(result))

        const originalSize = (fs.statSync(rawPath).size / 1024 / 1024).toFixed(2)
        const newSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)

        console.log(`✅ Success!`)
        console.log(`📉 Original Size: ${originalSize} MB`)
        console.log(`✨ Optimized Size: ${newSize} MB`)
        console.log(`📂 File saved to: ${outputPath}`)

    } catch (error) {
        console.error('❌ Error processing GeoJSON:', error.message)
    }
}

// Run the script
cleanGeoJson(INPUT_FILE, OUTPUT_FILE)
