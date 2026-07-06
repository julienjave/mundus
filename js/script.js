// --- SCRIPT.JS ---------------------------------------------------------------------------
/**
 * Main logic
 * APIs
 * General data processing and validation
 */


//==========================================================================================
// - VARIABLES -
//==========================================================================================
// -- Loader --
const loader = document.getElementById('loader')
// -- Popup --
const welcomePopup = document.getElementById('popup-welcome')

// -- Input --
const searchBox = document.getElementById('search-box')
const welcomeSearchBox = document.getElementById('welcome-search-box')
// -- Flag & Names --
const flagCountry = document.getElementById('country-flag')
const countryName = document.getElementById('country-name')
const countryNameOfficial = document.getElementById('info-official-name')
// -- Geography --
const commonName = document.getElementById('info-name')
const subRegion = document.getElementById('info-subregion')
const continent = document.getElementById('info-continent')
const area = document.getElementById('info-area')
const capitalCity = document.getElementById('info-capital')
// -- Demographics --
const population = document.getElementById('info-population')
const density = document.getElementById('info-density')
const demonym = document.getElementById('info-demonym')
// -- Languages --
const languagesOfficial = document.getElementById('info-languages')
// -- Ethnicity & Religion Charts --
const ethnicityChart = document.getElementById('ethnicity-chart') // Canvas Element
const religionChart = document.getElementById('religion-chart') // Canvas Element
// Store the charts globally so we can destroy and build new ones each search
let ethnicityChartInstance = null
let religionChartInstance = null
// -- Economy --
const currency = document.getElementById('info-currency')
const symbol = document.getElementById('info-symbol')
const gdp = document.getElementById('info-gdp')
// -- Politics --
const govType = document.getElementById('info-gov-type')
const govLeader = document.getElementById('info-gov-leader')
const govSovereignty = document.getElementById('info-gov-isSovereign')
const govSovereignState = document.getElementById('info-gov-sovereign-state')

// -- Error Popup --
const errorPopup = document.getElementById('error-popup')
const errorContent = document.getElementById('error-message-content')


// --- EventListeners -----------------------------------------------------------------------
document.addEventListener('keypress', (event) => {
    if (event.key === "Enter") {
        if (welcomePopup.style.display != "none") {
            requestCountryInfo(welcomeSearchBox.value)
            welcomePopup.style.display = "none"
        } else {
            requestCountryInfo(searchBox.value)
            clearInputBox()
            closeSuggestionBox()
        }
        
    }
})


//==========================================================================================
// - FUNCTIONS -
//==========================================================================================
// --- Main --------------------------------------------------------------------------------
async function requestCountryInfo(countryRequested) {
    // Show loader
    loader.style.display = 'flex'

    try {
        // Validate input
        const country = validateCountry(countryRequested)

        // 1. Get the basics from RESTCountry API
        const response = await fetch(`https://mundus-proxy.onrender.com/country/${country}`)
        
        if(response.ok) {
            const countries = await response.json()

            const countriesArray = countries.data.objects

            // let correctCountry = countries[0]
            let correctCountry = countriesArray[0]

            for (let i=0; i<countriesArray.length; i++) {
                if (countriesArray[i].names.common.toLowerCase() === country.toLowerCase()) {
                    correctCountry = countriesArray[i]
                }
            }

            const countryCodeIso2 = correctCountry.codes.alpha_2
            const countryCodeIso3 = correctCountry.codes.alpha_3
            const pathToFactBook = getFactBookFilePath(correctCountry)
            const capitalName = correctCountry.capitals[0].name
            const capLat = correctCountry.capitals[0].coordinates.lat
            const capLng = correctCountry.capitals[0].coordinates.lng

            // 2. Get the missing fields from other APIs
            const [gdpData, extraData, weatherData, airQData] = await Promise.all([
                safeFetchJson(`https://api.worldbank.org/v2/country/${countryCodeIso3}/indicator/NY.GDP.PCAP.CD?format=json`), 
                safeFetchJson(`https://raw.githubusercontent.com/factbook/factbook.json/master/${pathToFactBook}`), 
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${capLat}&longitude=${capLng}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,weather_code&timezone=auto&past_days=0&forecast_days=7`).then(r => r.json()), 
                fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${capLat}&longitude=${capLng}&current=us_aqi,pm2_5,pm10&timezone=auto&past_days=0&forecast_days=1`).then(r => r.json())
            ])


            let gdpPerCapita = `- No data available -`
            
            // This safely checks every level of the nested array/object using Optional Chaining (?.)
            const valueGDP = gdpData?.[1]?.[0]?.value ?? gdpData?.[1]?.[1]?.value
            
            if (valueGDP !== undefined && valueGDP !== null) {
                gdpPerCapita = `US$ ${valueGDP.toLocaleString()}`;
            }

            const ethnicityData = extraData ? processData(extraData, 'Ethnic groups') : null
            const religionData = extraData ? processData(extraData, 'Religions') : null

            populateCountryInfo(correctCountry, gdpPerCapita)

            ethnicityChartInstance = createChart(ethnicityChartInstance, ethnicityChart, ethnicityData, 'ethnicity')
            religionChartInstance = createChart(religionChartInstance, religionChart, religionData, 'religion')

            highlightCountry(countryCodeIso3)
            addCapitalMarker(capLat, capLng, capitalName, countryCodeIso3)
            populateForecast(capitalName, weatherData, airQData.current.us_aqi)
        } else if (response.status === 404) {
            // Display Error Popup
            errorContent.innerText = `404 - It seems the server couldn't find any match to your request. Maybe try again with a different spelling?`
            errorPopup.style.display = "flex"
        } else {
            console.error("Mundus Search Error:", response.status)
        }
        
    } catch (error) {
        console.error("Mundus Search Error:", error)
        // Display Error Popup
        errorContent.innerText = `'${error}'`
        errorPopup.style.display = "flex"
    } finally {
        // Hide loader
        loader.style.display = 'none'
    }
    
}

function validateCountry(country) {
    const unitedKingdom = ['england', 'scotland', 'wales', 'northern ireland']
    if (unitedKingdom.includes(country.toLowerCase())) {
        return 'united kingdom'
    } else {
        return country
    }
}

function validateCapital(capitals, cca3) {
    if (capitals.length === 1) {
        return `its capital is <strong>${capitals[0].name}</strong>`
    }
    if (cca3 === 'ZAF') { // South Africa
        return `its capitals are <strong>${capitals[0].name}</strong> <em>(Administrative)</em>, <strong>${capitals[1].name}</strong> <em>(Legislative)</em>, and <strong>${capitals[2].name}</strong> <em>(Judicial)</em>`
    }
    if (cca3 === 'PSE') { // Palestine
        return `its capitals are <strong>${capitals[0].name}</strong> <em>(Administrative)</em>, <strong>${capitals[1].name}</strong> <em>(Proclaimed)</em>`
    }
}

async function safeFetchJson(url) {
    // Safeguard the fetch to the APIs and make sure the response is in JSON format otherwise return null
    try {
        const response = await fetch(url);
        
        // Check if the response was successful (status 200-299)
        if (!response.ok) {
            console.warn(`Mundus Warning: Fetch failed for ${url} with status ${response.status}`);
            return null;
        }

        // Ideal Path: Server correctly identifies it as JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } 

        // Resilient Fallback: If "text/plain", read it as text and try to parse it
        const rawText = await response.text();
        try {
            return JSON.parse(rawText);
        } catch (jsonError) {
            console.warn(`Mundus Warning: Failed to parse plain text as JSON from ${url}`);
            return null;
        }

    } catch (error) {
        console.error(`Mundus Fetch Error for ${url}:`, error);
        return null;
    }
}

// --- General Information --------------------------------------------------------------------------------------
function populateCountryInfo(country, gdpPerCapita) {
    // -- Flag & Names --
    flagCountry.src = country.flag.url_svg
    flagCountry.alt = country.flag.description
    countryName.innerText = country.names.common.toUpperCase()
    countryNameOfficial.innerText = country.names.official
    // -- Geography --
    commonName.innerText = country.names.common
    subRegion.innerText = country.subregion
    continent.innerText = country.continents[0]
    area.innerText = `${country.area.kilometers.toLocaleString()} km²`
    capitalCity.innerHTML = validateCapital(country.capitals, country.codes.alpha_3)
    // -- Demographics --
    population.innerText = country.population.toLocaleString()
    if (country.population && country.area.kilometers && country.area.kilometers > 0) {
        const popDensity = country.population / country.area.kilometers
        density.innerText = `${popDensity.toFixed(1).toLocaleString()} people/km²`
    } else {
        density.innerText = `- No data available -`
    }
    demonym.innerText = country.demonyms.eng.m
    // -- Languages --
    languagesOfficial.innerText = getLanguages(country.languages)
    // -- Ethnicity & Religion Charts --
    // ethnicityChart = 
    // religionChart = 
    // -- Economy --
    currency.innerText = country.currencies[0].name
    symbol.innerText = country.currencies[0].symbol
    gdp.innerText = gdpPerCapita
    // -- Politics --
    govType.innerText = country.government_type
    // govLeader.innerText = 
    govSovereignty.innerText = country.classification.sovereign ? `Yes` : `No`
    govSovereignState.style.display = "none"
    if (!country.classification.sovereign) {
        govSovereignState.innerText = `(${convertToName(country.parent.alpha_3)})`
        govSovereignState.style.display = "flex"
    }
}

function getLanguages(languages) {
    const officialLanguages = []

    languages.forEach(lang => {
        officialLanguages.push(lang.name)
    })

    return officialLanguages.join(', ')
}


// ============================================================================
// - List of Countries -
// ============================================================================
const showListBtn = document.getElementById('list-country-btn')
const listPopup = document.getElementById('list-countries')
const listContent = document.getElementById('list-content')
const closePopupBtn = document.getElementById('close-list-btn')

showListBtn.addEventListener('click', () => {
    listPopup.style.display = "flex"
})

closePopupBtn.addEventListener('click', () => {
    listPopup.style.display = "none"
})

function populateListPopup() {
    const regions = Object.keys(listOfCountries)

    for (let i=0; i<regions.length; i++) {
        // Create the Region
        let newDiv = document.createElement("div")
        newDiv.classList.add('list-region-name')
        newDiv.innerText = regions[i].toUpperCase()
        listContent.appendChild(newDiv)

        // Add the list of countries
        let countriesByRegion = listOfCountries[regions[i]]
        countriesByRegion.forEach(country => {
            let newCountry = document.createElement("div")
            newCountry.classList.add('list-country-name')
            newCountry.innerText = country
            newCountry.addEventListener('click', () => {
                requestCountryInfo(country)
                clearInputBox()
                listPopup.style.display = "none"
            })
            listContent.appendChild(newCountry)
        })
    }

}

populateListPopup()

