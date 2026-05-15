// --- CHARTS.JS --------------------------------------------------------------------------------------
/**
 * Holds the chart creation logic and pipeline
 * - Data processing
 * - Data validation
 * - Charts creation
 * - Real-time update
 */


// --- Charts Creation --------------------------------------------------------------------------------
function processData(data, key) {
    const rawText = data['People and Society'][key]["text"]
    
    // Pre-process: Remove parenthetical notes but keep the original for the fallback
    const cleanText = rawText.replace(/\s*\([^)]*\)/g, "")
    
    // Split and Match
    let labelsList = []
    let valuesList = []
    
    // We split by comma or semicolon as Factbook uses both for lists
    const segments = cleanText.split(/[,;]\s*/)

    segments.forEach(segment => {
        // Regex to handle cases where the percentage might not be at the very end
        const match = segment.match(/(.+?)\s*(\d+\.?\d*)\s*%/)

        if (match) {
            labelsList.push(match[1].trim())
            valuesList.push(parseFloat(match[2]))
        }
    })

    // Validation Logic
    // If we found fewer than 2 groups, we return the raw text to be displayed as a note instead of a chart.
    if (labelsList.length < 2) {
        return { 
            type: 'narrative', 
            labels: null,
            values: rawText 
        }
    }

    return { 
        type: 'chart', 
        labels: labelsList, 
        values: valuesList 
    }
}

function createChart(chartInstance, canvas, data, type) {
    // Determine the title for the chart
    let chartTitle = type === 'ethnicity' ? 'Ethnicity' : 'Religion'
    const noDataLabel = document.getElementById(`${type}-no-data`)

    // If a chart already exists we destroy it
    if (chartInstance !== null && typeof chartInstance.destroy === 'function') {
        console.log('Destroying the charts...')
        chartInstance.destroy()
    }

    // Reset visibility every time the function runs
    canvas.style.display = 'flex'
    noDataLabel.style.display = 'none'

    // Check if data is null, undefined, or an empty array/object
    if (data.type === 'narrative') {
        canvas.style.display = 'none' // Hide the canvas
        noDataLabel.style.display = 'flex' // Show the 'no data' text
        noDataLabel.innerHTML = `Complex Demographic Composition - See Details:<br><br><em>${data.values}</em>`

        // Return null so the variable is "cleared" for the next search
        return null
    } else if (!isChartDataValid(data)) {
        console.warn(`Mundus Warning: Invalid data format for ${chartTitle}`)
        canvas.style.display = 'none' // Hide the canvas
        noDataLabel.style.display = 'flex' // Show the 'no data' text
        noDataLabel.innerText = '- No data available -'

        // Return null so the variable is "cleared" for the next search
        return null
    } else {
        canvas.style.display = 'flex' // Show the canvas
        noDataLabel.style.display = 'none' // Hide the 'no data' text

        // Create the new chart
        return new Chart(canvas, {
            type: 'doughnut', 
            data: {
                labels: data.labels, 
                datasets: [{
                    label: 'in %', 
                    data: data.values, 
                    backgroundColor: generateColors(data.labels.length), 
                    borderWidth: 1
                }]
            }, 
            options: {
                plugins: {
                    legend: {
                        display: true, 
                        position: 'bottom',
                        align: 'start',
                        labels: {
                            color: '#000', 
                            boxWidth: 12, 
                            usePointStyle: true
                        }
                    }, 
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let value = context.parsed || context.raw

                                return `${value}%`
                            }
                        }
                    }
                },
                maintainAspectRatio: false
            }
        })
    }
}

function isChartDataValid(data) {
    // 1. Check if the object exists
    if (!data || !data.values || data.values.length === 0) return false;

    // 2. Check if the values are actual numbers (catches "N/A" or "NaN" typos)
    const allNumbersValid = data.values.every(val => 
        typeof val === 'number' && !isNaN(val)
    );

    // 3. Optional: Check if the sum is greater than 0
    const total = data.values.reduce((a, b) => a + b, 0);

    return allNumbersValid && total > 0;
}

function generateColors(count) {
    const colors = []
    for (let i = 0; i < count; i++) {
        // Distribute hues evenly around the color wheel
        const hue = (i * (360 / count)) % 360
        colors.push(`hsl(${hue}, 70%, 50%)`)
    }
    return colors;
}

// Helper to read the current CSS variable value
function getThemeTextColor() {
    return getComputedStyle(document.documentElement)
        .getPropertyValue('--text')
        .trim();
}

// Function to dynamically update a chart's theme
function updateChartTheme(chartInstance) {
    if (!chartInstance) return;

    const currentTextColor = getThemeTextColor();

    // Update the legend label colors
    chartInstance.options.plugins.legend.labels.color = currentTextColor;

    // Tell Chart.js to redraw the canvas with the new options
    chartInstance.update();
}


