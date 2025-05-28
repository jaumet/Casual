document.addEventListener('DOMContentLoaded', function() {
    let keywordHistory = []; // Initialize keyword history array

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
                            textColour: 'white', textHeight: 20, freezeActive: false, depth: 0.99,
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

    if (keywordParam) {
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
    const keywordInput = document.getElementById('keywordInput');
    const languageSelect = document.getElementById('languageSelect');
    let suggestionsDiv = document.createElement('div');
    suggestionsDiv.id = 'autocomplete-suggestions';
    // Append to the keyword input's parent div for better positioning context
    keywordInput.parentNode.appendChild(suggestionsDiv); 
    // Ensure parent has position: relative for absolute positioning of suggestionsDiv
    keywordInput.parentNode.style.position = 'relative';


    const handleAutocompleteInput = debounce(function() {
        const keywordInputValue = keywordInput.value.trim();
        const language = languageSelect.value;

        if (keywordInputValue === '') {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }

        const autocompleteApiUrl = `https://${language}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(keywordInputValue)}&limit=7&namespace=0&format=json&origin=*`;

        fetch(autocompleteApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok for autocomplete');
                }
                return response.json();
            })
            .then(data => {
                suggestionsDiv.innerHTML = ''; // Clear previous suggestions
                const suggestions = data[1]; // Array of suggestion strings

                if (suggestions && suggestions.length > 0) {
                    suggestions.forEach(suggestionText => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.textContent = suggestionText;
                        suggestionItem.addEventListener('click', function() {
                            keywordInput.value = suggestionText;
                            suggestionsDiv.innerHTML = '';
                            suggestionsDiv.style.display = 'none';
                            // Optionally, auto-submit the form
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

    // Hide suggestions on 'Escape' key press
    keywordInput.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
        }
    });

    // Hide suggestions on click outside
    document.addEventListener('click', function(event) {
        if (!keywordInput.contains(event.target) && !suggestionsDiv.contains(event.target)) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
        }
    });
});
