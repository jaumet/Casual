document.addEventListener('DOMContentLoaded', function() {
    let keywordHistory = []; // Initialize keyword history array

    // --- Wikipath Game State Variables ---
    let gameActive = false;
    let startPage = '';
    let targetPage = '';
    let currentHops = 0;
    const startGameButton = document.getElementById('startGameButton');
    const wikipathInfoDiv = document.getElementById('wikipathInfo');
    const startPageDisplay = document.getElementById('startPageDisplay');
    const targetPageDisplay = document.getElementById('targetPageDisplay');
    const hopCounterDisplay = document.getElementById('hopCounterDisplay');
    // languageSelect and keywordInput are obtained later for autocomplete

    // Debounce function
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Function to update the keyword path display
    function updateKeywordPathDisplay() {
        const pathDisplay = document.getElementById('keywordPathDisplay');
        if (pathDisplay) {
            if (keywordHistory.length > 0) {
                pathDisplay.innerHTML = keywordHistory.join(' > ');
            } else {
                pathDisplay.innerHTML = ''; // Or a placeholder
            }
        }
    }

    // Function to perform a new search, exposed globally
    window.performNewSearch = function(newKeyword, lang, num) {
        document.getElementById('keywordInput').value = newKeyword;
        document.getElementById('languageSelect').value = lang;
        document.getElementById('numberSelect').value = num;
        const form = document.getElementById('casualForm');
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
    };

    // Main function to handle API request and TagCanvas update
    function executeSearch(keyword, language, number) {
        if (gameActive) {
            // Only increment hops if the new keyword is different from the last one in history
            // (which is the current page before this new search).
            // The startGame() function already sets currentHops = 0 and adds the startPage.
            // So, the first search for the startPage should not increment hops.
            // Every subsequent search that changes the keyword should.

            // The keywordHistory is updated *after* this check, further down,
            // so keywordHistory[keywordHistory.length-1] is the *previous* page.
            if (keywordHistory.length > 0 && keyword.toLowerCase() !== keywordHistory[keywordHistory.length - 1].toLowerCase()) {
                currentHops++;
                hopCounterDisplay.textContent = currentHops;
            } else if (keywordHistory.length === 0 && currentHops === 0) {
                // This case handles the very first load of the start page, ensuring hops remain 0.
                // If keywordHistory is empty and hops are 0, it means startGame just set it.
                // No hop increment needed here. hopCounterDisplay is already 0.
            }


            if (keyword.toLowerCase() === targetPage.toLowerCase()) {
                // Use a more prominent way to display the win message if possible,
                // for now, an alert is fine.
                alert(`Congratulations! You reached "${targetPage}" in ${currentHops} hops!`);
                wikipathInfoDiv.style.display = 'none'; // Hide game info
                gameActive = false; // End the game

                // Optional: Clear keyword history after game ends or leave it as a record
                // keywordHistory = []; 
                // updateKeywordPathDisplay();
            }
        }

        if (keyword && (keywordHistory.length === 0 || keywordHistory[keywordHistory.length - 1] !== keyword)) {
            keywordHistory.push(keyword);
        }
        updateKeywordPathDisplay();

        const apiUrl = `https://${language}.wikipedia.org/w/api.php?action=query&format=json&prop=linkshere&titles=${keyword}&lhlimit=${number}&lhnamespace=0&origin=*`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const pages = data.query.pages;
                const links = [];
                if (pages) {
                    for (const pageId in pages) {
                        if (pages[pageId] && pages[pageId].linkshere) {
                            pages[pageId].linkshere.forEach(link => {
                                const linkedPageTitle = link.title.replace(/'/g, "\\'");
                                links.push(`<a href="#" onclick="performNewSearch('${linkedPageTitle}', '${language}', '${number}'); return false;">${link.title}</a>`);
                            });
                        }
                    }
                }
                const myCanvas = document.getElementById('myCanvas');
                if (links.length > 0) {
                    console.log('Formatted links for TagCanvas:', links);
                    while (myCanvas.firstChild) {
                        myCanvas.removeChild(myCanvas.firstChild);
                    }
                    links.forEach(linkHtml => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = linkHtml;
                        if (tempDiv.firstChild) {
                            myCanvas.appendChild(tempDiv.firstChild);
                        }
                    });
                    try {
                        const options = {
                            textColour: 'white', textHeight: 20, freezeActive: true, depth: 0.99,
                            minSpeed: 0.01, maxSpeed: 0.03, minBrightness: 0.6, zoom: 1.3,
                            outlineColour: "#FF9F00", initial: [0.5, 0.2], shadow: 'white', shadowBlur: 2
                        };
                        TagCanvas.Start('myCanvas', '', options);
                    } catch (e) {
                        console.error('Error restarting TagCanvas:', e);
                        myCanvas.innerHTML = '<p>Error initializing TagCanvas. Please ensure your browser supports HTML5 canvas.</p>';
                    }
                } else {
                    console.log('No links found for the keyword.');
                    myCanvas.innerHTML = '<p>No related terms found for your query. Please try a different keyword.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching or parsing data:', error);
                document.getElementById('myCanvas').innerHTML = '<p>Sorry, there was an error fetching data. Please try again later.</p>';
            });
    }

    document.getElementById('casualForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const keyword = document.getElementById('keywordInput').value;
        const language = document.getElementById('languageSelect').value;
        const number = document.getElementById('numberSelect').value;
        executeSearch(keyword, language, number);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const keywordParam = urlParams.get('imgkeywords');
    const langParam = urlParams.get('lang');
    const numberParam = urlParams.get('number');

    if (keywordParam && !gameActive) { // Only run if not in a game, game will handle its own initial search
        document.getElementById('keywordInput').value = keywordParam;
        if (langParam) document.getElementById('languageSelect').value = langParam;
        if (numberParam) document.getElementById('numberSelect').value = numberParam;
        const currentLanguage = langParam || document.getElementById('languageSelect').value;
        const currentNumber = numberParam || document.getElementById('numberSelect').value;
        executeSearch(keywordParam, currentLanguage, currentNumber);
    } else {
        updateKeywordPathDisplay();
    }

    // --- Autocomplete Feature ---
    const keywordInput = document.getElementById('keywordInput'); // Already declared for URL params, ensure scope is fine
    const languageSelect = document.getElementById('languageSelect'); // Already declared for URL params, ensure scope is fine
    let suggestionsDiv = document.createElement('div');
    suggestionsDiv.id = 'autocomplete-suggestions';
    keywordInput.parentNode.appendChild(suggestionsDiv); 
    keywordInput.parentNode.style.position = 'relative';

    const handleAutocompleteInput = debounce(function() {
        const keywordInputValue = keywordInput.value.trim();
        const currentLanguage = languageSelect.value; // Use 'currentLanguage' to avoid conflict if languageSelect is also a global var

        if (keywordInputValue === '') {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }
        const autocompleteApiUrl = `https://${currentLanguage}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(keywordInputValue)}&limit=7&namespace=0&format=json&origin=*`;
        fetch(autocompleteApiUrl)
            .then(response => response.json())
            .then(data => {
                suggestionsDiv.innerHTML = ''; 
                const suggestions = data[1];
                if (suggestions && suggestions.length > 0) {
                    suggestions.forEach(suggestionText => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.textContent = suggestionText;
                        suggestionItem.addEventListener('click', function() {
                            keywordInput.value = suggestionText;
                            suggestionsDiv.innerHTML = '';
                            suggestionsDiv.style.display = 'none';
                            document.getElementById('casualForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                        });
                        suggestionsDiv.appendChild(suggestionItem);
                    });
                    suggestionsDiv.style.display = 'block';
                } else {
                    suggestionsDiv.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching autocomplete data:', error);
                suggestionsDiv.innerHTML = '';
                suggestionsDiv.style.display = 'none';
            });
    }, 300);
    keywordInput.addEventListener('input', handleAutocompleteInput);
    keywordInput.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
        }
    });
    document.addEventListener('click', function(event) {
        if (!keywordInput.contains(event.target) && !suggestionsDiv.contains(event.target)) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
        }
    });

    // --- Wikipath Game Logic ---
    async function fetchRandomWikipediaPage(lang) { // 'lang' instead of 'language' to avoid conflict with global languageSelect
        const apiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok for random page.');
            const data = await response.json();
            if (data.query.random && data.query.random.length > 0) {
                return data.query.random[0].title;
            }
            throw new Error('No random page found in API response.');
        } catch (error) {
            console.error('Error fetching random Wikipedia page:', error);
            return null; 
        }
    }

    async function startGame() {
        const currentLanguage = languageSelect.value; // Use current language selection
        const pageA = await fetchRandomWikipediaPage(currentLanguage);
        let pageB = await fetchRandomWikipediaPage(currentLanguage);

        while (pageB === pageA) {
            pageB = await fetchRandomWikipediaPage(currentLanguage);
        }

        if (!pageA || !pageB) {
            alert('Could not fetch random pages to start the game. Please try again.');
            return;
        }

        startPage = pageA;
        targetPage = pageB;
        currentHops = 0; 
        gameActive = true;

        startPageDisplay.textContent = startPage;
        targetPageDisplay.textContent = targetPage;
        hopCounterDisplay.textContent = currentHops;
        wikipathInfoDiv.style.display = 'block'; 

        keywordHistory = [startPage]; 
        updateKeywordPathDisplay(); 

        keywordInput.value = startPage;
        document.getElementById('casualForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    if (startGameButton) { // Ensure button exists before adding listener
        startGameButton.addEventListener('click', startGame);
    }
});
