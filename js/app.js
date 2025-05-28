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
    
    // --- Tooltip Element ---
    let pageSummaryTooltip = null;
    pageSummaryTooltip = document.createElement('div');
    pageSummaryTooltip.id = 'pageSummaryTooltip';
    pageSummaryTooltip.style.display = 'none'; // Initially hidden
    document.body.appendChild(pageSummaryTooltip); // Append to body for global positioning


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

    async function fetchWikipediaPageSummary(pageTitle, language) {
        const apiUrl = `https://${language}.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*&inprop=url&redirects=1`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok for summary: ${pageTitle}`);
            }
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0]; 

            if (pageId && pages[pageId] && !pages[pageId].missing) {
                const pageData = pages[pageId];
                const summary = pageData.extract || 'No summary available.';
                const url = pageData.fullurl || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(pageData.title)}`;
                return { summary: summary.substring(0, 250) + (summary.length > 250 ? '...' : ''), url: url, title: pageData.title };
            } else {
                return { summary: 'Page not found or no summary available.', url: '', title: pageTitle };
            }
        } catch (error) {
            console.error(`Error fetching Wikipedia page summary for "${pageTitle}":`, error);
            return { summary: 'Could not fetch summary.', url: '', title: pageTitle };
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
            if (keywordHistory.length > 0 && keyword.toLowerCase() !== keywordHistory[keywordHistory.length - 1].toLowerCase()) {
                currentHops++;
                hopCounterDisplay.textContent = currentHops;
            } else if (keywordHistory.length === 0 && currentHops === 0) {
                // Start of game, hops remain 0
            }

            if (keyword.toLowerCase() === targetPage.toLowerCase()) {
                alert(`Congratulations! You reached "${targetPage}" in ${currentHops} hops!`);
                wikipathInfoDiv.style.display = 'none'; 
                gameActive = false; 
            }
        }

        if (keyword && (keywordHistory.length === 0 || keywordHistory[keywordHistory.length - 1] !== keyword)) {
            keywordHistory.push(keyword);
        }
        updateKeywordPathDisplay();

        const apiUrl = `https://${language}.wikipedia.org/w/api.php?action=query&format=json&prop=linkshere&titles=${keyword}&lhlimit=${number}&lhnamespace=0&origin=*`;
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok: ' + response.statusText);
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
                    while (myCanvas.firstChild) myCanvas.removeChild(myCanvas.firstChild);
                    links.forEach(linkHtml => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = linkHtml;
                        if (tempDiv.firstChild) myCanvas.appendChild(tempDiv.firstChild);
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
                        myCanvas.innerHTML = '<p>Error initializing TagCanvas.</p>';
                    }
                } else {
                    console.log('No links found for the keyword.');
                    myCanvas.innerHTML = '<p>No related terms found for your query.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching or parsing data:', error);
                document.getElementById('myCanvas').innerHTML = '<p>Sorry, there was an error fetching data.</p>';
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

    if (keywordParam && !gameActive) {
        document.getElementById('keywordInput').value = keywordParam;
        if (langParam) document.getElementById('languageSelect').value = langParam;
        if (numberParam) document.getElementById('numberSelect').value = numberParam;
        const currentLanguage = langParam || document.getElementById('languageSelect').value;
        const currentNumber = numberParam || document.getElementById('numberSelect').value;
        executeSearch(keywordParam, currentLanguage, currentNumber);
    } else {
        updateKeywordPathDisplay();
    }

    const keywordInput = document.getElementById('keywordInput');
    const languageSelect = document.getElementById('languageSelect');
    let suggestionsDiv = document.createElement('div');
    suggestionsDiv.id = 'autocomplete-suggestions';
    keywordInput.parentNode.appendChild(suggestionsDiv); 
    keywordInput.parentNode.style.position = 'relative';

    const handleAutocompleteInput = debounce(function() {
        const keywordInputValue = keywordInput.value.trim();
        const currentLanguageVal = languageSelect.value;
        if (keywordInputValue === '') {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }
        const autocompleteApiUrl = `https://${currentLanguageVal}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(keywordInputValue)}&limit=7&namespace=0&format=json&origin=*`;
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

    async function fetchRandomWikipediaPage(lang) {
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
        const currentLanguageVal = languageSelect.value;
        const pageA = await fetchRandomWikipediaPage(currentLanguageVal);
        let pageB = await fetchRandomWikipediaPage(currentLanguageVal);
        while (pageB === pageA) pageB = await fetchRandomWikipediaPage(currentLanguageVal);

        if (!pageA || !pageB) {
            alert('Could not fetch random pages to start the game. Please try again.');
            return;
        }
        startPage = pageA;
        targetPage = pageB;
        currentHops = 0; 
        gameActive = true;

        // Clear previous tooltips/data
        startPageDisplay.removeAttribute('data-summary');
        startPageDisplay.removeAttribute('data-url');
        startPageDisplay.removeAttribute('data-title');
        targetPageDisplay.removeAttribute('data-summary');
        targetPageDisplay.removeAttribute('data-url');
        targetPageDisplay.removeAttribute('data-title');
        
        startPageDisplay.textContent = startPage; // Set initial text content
        targetPageDisplay.textContent = targetPage; // Set initial text content

        fetchWikipediaPageSummary(startPage, currentLanguageVal).then(data => {
            if(data && data.summary && data.url) {
                startPageDisplay.setAttribute('data-summary', data.summary);
                startPageDisplay.setAttribute('data-url', data.url);
                startPageDisplay.setAttribute('data-title', data.title);
                startPageDisplay.textContent = data.title; // Update with actual title if redirected
            } else {
                startPageDisplay.textContent = startPage; // Fallback
            }
        });
        fetchWikipediaPageSummary(targetPage, currentLanguageVal).then(data => {
            if(data && data.summary && data.url) {
                targetPageDisplay.setAttribute('data-summary', data.summary);
                targetPageDisplay.setAttribute('data-url', data.url);
                targetPageDisplay.setAttribute('data-title', data.title);
                targetPageDisplay.textContent = data.title;
            } else {
                targetPageDisplay.textContent = targetPage; // Fallback
            }
        });

        hopCounterDisplay.textContent = currentHops;
        wikipathInfoDiv.style.display = 'block'; 
        keywordHistory = [startPage]; 
        updateKeywordPathDisplay(); 
        keywordInput.value = startPage;
        document.getElementById('casualForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    if (startGameButton) startGameButton.addEventListener('click', startGame);

    // --- Tooltip Functions and Event Listeners ---
    function showTooltip(element) {
        const summary = element.getAttribute('data-summary');
        const url = element.getAttribute('data-url');
        const title = element.getAttribute('data-title') || element.textContent;

        if (!summary || !url) return; 

        pageSummaryTooltip.innerHTML = `
            <h4>${title}</h4>
            <p>${summary}</p>
            <a href="${url}" target="_blank">View on Wikipedia</a>
        `;
        const rect = element.getBoundingClientRect();
        pageSummaryTooltip.style.left = `${rect.left}px`;
        pageSummaryTooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        pageSummaryTooltip.style.display = 'block';
    }

    function hideTooltip() {
        pageSummaryTooltip.style.display = 'none';
    }

    const displayElements = [startPageDisplay, targetPageDisplay];
    displayElements.forEach(el => {
        if (el) { // Ensure element exists before adding listeners
            el.addEventListener('mouseover', function() { showTooltip(this); });
            el.addEventListener('mouseout', hideTooltip);
        }
    });
});
