// tools/list-all-countries.js

// Import the File System module
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = path.join(__dirname, '../data/list-countries.js');

async function getListOfCountries(outputPath, sovereign=false) {
    try {
        console.log('>>> Fetching country list from RESTCountries...')
        const response = await fetch(`https://restcountries.com/v4/all?fields=name,region,independent`)
        const listCountries = await response.json()

        const countriesByRegions = {}

        for (let i=0; i<listCountries.length; i++) {
            if (!countriesByRegions[listCountries[i].region]) {
                if (sovereign) {
                    if (listCountries[i].region != 'Antarctic') {
                        countriesByRegions[listCountries[i].region] = []
                    }
                } else {
                    countriesByRegions[listCountries[i].region] = []
                }
            }

            if (sovereign) {
                if (listCountries[i].independent) {
                    countriesByRegions[listCountries[i].region].push(listCountries[i].name.common)
                }
            } else {
                countriesByRegions[listCountries[i].region].push(listCountries[i].name.common)
            }
        }

        // Sort the countries
        for (const [key, value] of Object.entries(countriesByRegions)) {
            value.sort((a, b) => a.localeCompare(b))
        }

        // Produce an object with sorted keys (Regions)
        const countriesByRegionsSorted = Object.keys(countriesByRegions).sort().reduce(
            (obj, key) => {
                obj[key] = countriesByRegions[key]
                return obj
            }, 
            {}
        )

        // Create the content of the js file
        const fileContent = `const listOfCountries = ${JSON.stringify(countriesByRegionsSorted, null, 4)}`

        // Write the file directly into the data folder
        fs.writeFileSync(outputPath, fileContent)

        console.log(`✅ Success! Generated JS file at: ${outputPath}`)
    } catch (error) {
        console.error('❌ Failed to generate country list:', error.message)
    }
}

getListOfCountries(OUTPUT_FILE, true)