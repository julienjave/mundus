![Mundus Logo](docs/assets/Mundus_logo_long.png)

**Mundus** is a modern, interactive **world dashboard** for exploring global demographics, geography, and real-time weather. It bridges **multiple global sources** into a single, elegant interface, allowing users to **explore the world through data**.

[Live Demo](https://julienjave.github.io/mundus/)

![Mundus Demo](docs/assets/mundus-demo.gif)


*Note: Because RESTCountries API changed and now is asking for an API key, I had to create after initial development and deployment a serverless proxy to hide that API key, and made some adjustments to have Mundus communicate with this proxy instead of directly with RESTCountries API as it was doing initially.
You can find the repository for the proxy [here](https://github.com/julienjave/mundus-proxy).*


## 1. Features

- **Real-time Insights:** Aggregates data from multiple sources - RESTCountries, The World Factbook, World Bank Open Data and Open-Meteo.
- **Real-time Weather & AQI:** Live data fetching for capital cities.
- **Smart Search:** Autocomplete suggestions with optimized local GeoJSON lookup.
- **Dynamic Data Visualization**: Real-time Chart.js integration for ethnic and religious demographics.
- **Interactive Leaflet Map**: Custom-processed GeoJSON for fast country highlighting and capital markers without sacrificing accuracy.
- **Dynamic Theming:** Custom CSS variables for a seamless color theme and dark/light mode experience across UI, charts, and map tiles.


## 2. Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla Javascript (ES6+).
- **Libraries:** [Leaflet.js](https://leafletjs.com/), [Chart.js](https://www.chartjs.org/).
- **Data:** GeoJSON, Open APIs ([RESTCountries](https://restcountries.com), [The World Factbook](https://github.com/factbook/factbook.json), [World Bank Open Data](https://api.worldbank.org), [Open-Meteo](https://api.open-meteo.com)).


## 3. Getting Started

### a. Installation
1. Clone the repository:<br>
`git clone <url>`
2. Navigate to the project folder
3. Open `index.html` in your browser (or use Live Server in VS Code).

### b. Development
This project uses **SASS (SCSS)** for styling. The browser reads the compiled `css/style.css` file, but all style changes should be made within the `scss/` directory.

1. **Prerequisite:** Ensure you have SASS installed:<br>
```bash
npm install -g sass
```
2. **Watch for changes:** To automatically compile your SCSS into CSS while working, run the following command in the project root:<br>
```bash
sass --watch scss/main.scss:css/style.css
```
*<u>Note</u>: Do not edit the files in the `css/` folder directly, as they will be overwritten by the SASS compiler.*

### c. Data Pipelines & Automation Tools
The project includes custom backend utility scripts to automate data fetching and geographic optimization. To run these tools, you must have **Node.js** installed.

1. **GeoJSON Optimizer** (`geojson-optimizer.js`)<br>
This script processes raw country boundaries, limits coordinate precision to optimize payload size by ~40%, and fixes the **Antimeridian wrap-around issue** for complex geometries (like the USA and Russia).
- To run (once you are in the `tools/` folder):
```bash
node geojson-optimizer.js
```

2. **Country List Generator** (`list-all-countries.js`)<br>
This script queries the RESTCountries API to generate a clean, standardized JSON index of country metadata used to populate the suggestions box and the countries list popup. There is an option to only get the sovereign countries.
- To run (once you are in the `tools/` folder):
```bash
node list-all-countries.js
```


## 4. Project Structure

- `/data`: Optimized GeoJSON and local mapping objects.
- `/images`: Images, logos and icons used in the app.
- `/scss`: Modular stylesheets for themes and layouts.
- `/css`: Compiled stylesheets (Auto-generated).
- `/js`: Organized by functionality (map.js, charts.js, forecast.js, interface.js...).
- `/tools`: Includes a custom '*GeoJSON Optimizer*' script used to reduce coordinate precision and strip unnecessary metadata, and a custom '*List All Countries*' script to create as a javascript object a list of all the (optionally sovereign) countries from RestCountries.


## 5. Technical Highlights

### a. Optimized GeoJSON & Mapping Pipeline
To ensure high-performance mapping without external dependencies, I developed a custom data pipeline:

- **Payload Optimization:** I developed a ***Node.js CLI utility*** to automate coordinate precision reduction and metadata stripping, transforming raw GIS data into a production-ready web format and shrinking the footprint from 3MB to 862KB. This allows for high-fidelity rendering of complex island archipelagos while remaining well under the 1MB performance threshold, ensuring a sub-second initial load time.

- **Cross-Standard Translation:** Built a bridging system to map ISO-3166 (RESTCountries) to GEC/FIPS codes (CIA Factbook). This involved reconciling two different regional classification systems to dynamically generate the correct file paths for demographic data.

### b. The Antimeridian Problem (180° Meridian)
- **Challenge:** Standard GeoJSON data for countries like Russia, Fiji, and the USA (Aleutian Islands) often "breaks" or teleports across the map in Leaflet.js because they span the International Date Line.

- **Solution:**
    1. **Geometric Stitching:** I engineered a custom Node.js post-processing script (`tools/geojson-optimizer.js`) that identifies "antimeridian" coordinates and mathematically shifts them into an "Extended East" coordinate space ($+180^\circ$ to $+190^\circ$). This prevents the "teleportation" effect and ensures continuous polygon rendering.

    2. **Marker Synchronization:** To prevent markers (like capital cities) from appearing on a different "world tile" than the highlight, I implemented a coordinate-shifting helper. This ensures that point-data for these specific countries is dynamically projected onto the same coordinate plane as the modified GeoJSON.

- **Impact:** The dashboard provides a seamless, high-fidelity experience for even the most geographically complex nations on Earth.

### c. Robust Data Validation & Normalization
Real-world data is rarely consistent. I implemented a defensive logic layer to handle edge cases across multiple APIs:

- **Multi-Capital Logic:** Developed handlers for countries with multiple administrative capitals (e.g., South Africa, Palestine) to ensure the map markers and weather data remained accurate.

- **Search Query Normalization:** Built a redirection engine to handle sub-national queries (e.g., mapping searches for 'Scotland' or 'Wales' to 'United Kingdom') to align user intent with API requirements.

- **Schema Resilience:** Created a "Fail-Safe" display mode that detects missing or corrupted data patterns - specifically common in nested Factbook structures - and provides graceful "No data available" fallbacks instead of application crashes.

### d. Unstructured Data Normalization
Developed a fallback mechanism for the CIA World Factbook API to handle narrative-style demographic data (e.g. DR Congo, France), ensuring the UI remains stable even when data deviates from standard CSV-like patterns.

### e. State-Preserved Dynamic Theming
Implemented a "Zero-Reload" theme engine using CSS Custom Properties. The system synchronizes the UI color palette, Leaflet map tiles, and Chart.js global defaults in real-time, persisting user preferences via `localStorage` across sessions.


## 6. Lessons Learned

### a. Advanced Asynchronous Patterns
This project moved me beyond basic API calls to managing complex data flows:

- **Concurrency:** Mastered `Promise.all()` to fetch data from four disparate sources simultaneously, significantly reducing the perceived load time for the user.

- **Defensive Programming:** Implemented "Defensive Fetching" helpers to verify `Content-Type` headers and used optional chaining (`?.`) to safely navigate deeply nested API responses.

### b. Library Integration & Life-Cycles
- **Third-Party Interoperability:** Gained deep experience integrating ***Leaflet.js*** and ***Chart.js***, learning how to manually trigger re-renders and update internal library states without refreshing the DOM.

- **JavaScript Execution Context:** Solved critical initialization bugs by mastering the ***Temporal Dead Zone (TDZ)*** and hoisting behaviors, leading to a more structured and predictable code architecture.

### c. Modular CSS Architecture
Initially, the project used a single monolithic CSS file. As the dashboard grew in complexity, I migrated the styling to **SASS (SCSS)**. This allowed me to:
    * Implement a **Modular Pattern**, separating map-specific logic from data visualization styles for better maintainability.
    * Leverage **SASS Partials** and the `@use` rule to optimize the development workflow.
    * Combine **CSS Native Variables** for theme management with **SASS Nesting** for more readable and hierarchical code.

### d. Full-Spectrum Technical Design
Beyond the code, I utilized ***Affinity Designer*** and ***Inkscape*** to create custom SVG and PNG assets and branding for the "Mundus" identity. This taught me the importance of the "Asset Pipeline", ensuring that icons and logos are optimized for the web before they ever reach the codebase.


## 7. Future Improvements
### Interactive Regional Discovery Maps
While users can currently search via text input, autocomplete suggestions, or a global sovereign country list, I plan to introduce an alternative **visual search mode**.
- Users will be able to toggle to a specific regional map view (e.g., Africa, Europe, Americas).

- Hovering over a country will highlight its borders, and clicking the country polygon will automatically launch the dashboard search for that nation.

- *Technical approach:* This will involve managing dynamic SVG overlays or lightweight geo-isolated Leaflet sub-layers to keep performance smooth without loading the entire world geometry at once.


## 8. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---
Built with ☕ and 💻 by Julien Javelaud