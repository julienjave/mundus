// --- INTERFACE ----------------------------------------------------------------------
/**
 * Holds the interface logic and elements
 * - Back to top button
 * - Settings Section (Color Palette, Light/Dark Mode)
 * - About Section
 * - Helper functions (Clear input box, Close Popup)
 * - Suggestion Box
 */


// ====================================================================================
// - Back to Top Button -
// ====================================================================================
const btn = document.getElementById('backToTop')

// Show button after scrolling down 300px
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        btn.classList.add('visible')
    } else {
        btn.classList.remove('visible')
    }
})

// Scroll smoothly back to top on click
btn.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: 'smooth'})
})


// ====================================================================================
// - SETTINGS SECTION -
// ====================================================================================

const settingsBtn = document.getElementById('settings-btn')
const dropdown = document.getElementById('dropdown')
const options = document.querySelectorAll('.theme-option')

// On page load, restore the saved theme
// localStorage persists data across page reloads.
// We fall back to 'default' if nothing is saved yet.
let savedTheme = localStorage.getItem('site-theme') || 'default'
applyTheme(savedTheme, true)

/* - Toggle the dropdown open / closed */

// Clicking the Settings button opens or closes the dropdown
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    dropdownAbout.classList.remove('open')
    dropdown.classList.toggle('open')
    settingsBtn.classList.add('open')
    aboutBtn.classList.remove('open')
})

// Clicking anywhere else on the page closes the dropdown
document.addEventListener('click', () => {
    dropdown.classList.remove('open')
    settingsBtn.classList.remove('open')
})

// Clicking inside the dropdown itself should NOT close it
dropdown.addEventListener('click', (e) => {
    e.stopPropagation()
})

// --- COLOR PALETTE ---------------------------------------------------------
// ===========================================================================
// -- Hover preview + click to save -- 

// Loop over every theme option and attach events.
options.forEach((option) => {
    const theme = option.dataset.theme // read the data-theme="..." attribute

    // --- Preview on hover ---

    // mouseenter fires when the cursor enters the element
    option.addEventListener('mouseenter', () => {
        applyTheme(theme, false) // false = don't update the checkmark yet
    })

    // mouseleave fires when the cursor leaves the element
    option.addEventListener('mouseleave', () => {
        applyTheme(savedTheme, false) // revert to whatever was last saved
    })

    // --- Save on click ---
    option.addEventListener('click', () => {
        savedTheme = theme
        localStorage.setItem('site-theme', theme) // persist to localStorage
        applyTheme(theme, true)
        dropdown.classList.remove('open')
        settingsBtn.classList.remove('open')
        // location.reload() // re-run the page so the saved theme loads cleanly
    })
})

// Helper function — applyTheme(theme, updateActive)
// -------------------------------------------------
// theme        : string, e.g. 'ocean'
// updateActive : boolean — whether to move the checkmark

function applyTheme (theme, updateActive) {
    // Swap the data-theme attribute on <html>.
    document.documentElement.setAttribute('data-theme', theme)

    // Optionally move the .active class (checkmark) to the chosen option
    if (updateActive) {
        options.forEach((opt) => {
            opt.classList.toggle('active', opt.dataset.theme === theme)
        })
    }
}


// --- Light/Dark Mode ---------------------------------------------------------
// =============================================================================
const modeToggle = document.getElementById('mode-toggle')

const savedMode = localStorage.getItem('site-mode') || 'light'
modeToggle.checked = savedMode === 'dark'
document.documentElement.setAttribute('data-mode', savedMode)

modeToggle.addEventListener('change', () => {
    const mode = modeToggle.checked ? 'dark' : 'light'
    document.documentElement.setAttribute('data-mode', mode)
    localStorage.setItem('site-mode', mode)
    // Update charts color
    updateChartTheme(ethnicityChartInstance)
    updateChartTheme(religionChartInstance)
    // Update map tile
    switchMapThemes(mapMain, mode)
})


// ==============================================================================
// - ABOUT SECTION -
// ==============================================================================
const aboutBtn = document.getElementById('about-btn')
const dropdownAbout = document.getElementById('dropdown-about')

// Clicking the About button opens or closes the dropdown
aboutBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    dropdown.classList.remove('open')
    dropdownAbout.classList.toggle('open')
    aboutBtn.classList.add('open')
    settingsBtn.classList.remove('open')
})

// Clicking anywhere else on the page closes the dropdown
document.addEventListener('click', () => {
    dropdownAbout.classList.remove('open')
    aboutBtn.classList.remove('open')
})

// Clicking inside the dropdown itself should NOT close it
dropdownAbout.addEventListener('click', (e) => {
    e.stopPropagation()
})



// ==============================================================================
// - INPUT BOX HELPERS -
// ==============================================================================
function clearInputBox() {
    searchBox.value = ''
}


// ==============================================================================
// - ERROR POPUP HELPERS -
// ==============================================================================
const errorCloseBtn = document.getElementById('close-error-btn')

errorCloseBtn.addEventListener('click', () => {
    errorContent.innerText = ''
    errorPopup.style.display = "none"
})


// ==============================================================================
// - SUGGESTION BOX -
// ==============================================================================
const suggestionBox = document.getElementById('suggestion-box')
const suggestionItems = document.getElementById('suggestion-items')


// --- EventListeners -----------------------------------------------------------
searchBox.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase()

    // Only show suggestions if the user has typed at least 1 character
    if (query.length > 0) {
        const filteredCountries = filterCountries(query)

        if (filteredCountries.length > 0) {
            populateSuggestions(filteredCountries)
            suggestionBox.style.display = "flex"
        } else {
            closeSuggestionBox() // Hide if no matches
        }
    } else {
        closeSuggestionBox() // Hide if input is empty
    }
})

searchBox.addEventListener('focus', (event) => {
    const query = event.target.value.trim().toLowerCase()

    if (query.length > 0) {
        suggestionBox.style.display = "flex"
    }
})

document.addEventListener('click', (event) => {
    // If the user clicked outside BOTH the input box and the suggestion container
    if (!searchBox.contains(event.target) && !suggestionBox.contains(event.target)) {
        closeSuggestionBox()
    }
})


// --- Functions -----------------------------------------------------------------
function filterCountries(string) {
    // Get the list of all countries from our listOfCountries object
    const allCountries = []
    for (let region in listOfCountries) {
        listOfCountries[region].forEach(country => {
            allCountries.push(country)
        })
    }

    // Filter the list to keep only the ones that include the query
    const filteredList = []
    for (let item of allCountries) {
        if (item.toLowerCase().includes(string)) {
            filteredList.push(item)
        }
    }

    return filteredList
}

function populateSuggestions(list) {
    // Clear the suggestion list
    suggestionItems.innerHTML = ''

    // Populate the list
    list.forEach(country => {
        // Create new suggestion item
        let newSuggestionItem = document.createElement("div")
        newSuggestionItem.innerText = country
        newSuggestionItem.classList.add('suggestion-item')
        // Add EventListener
        newSuggestionItem.addEventListener('click', () => {
            requestCountryInfo(country)
            clearInputBox()
            closeSuggestionBox()
        })
        suggestionItems.appendChild(newSuggestionItem)
    })
}

function closeSuggestionBox() {
    suggestionBox.style.display = "none"
}


