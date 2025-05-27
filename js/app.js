// Wait for the DOM to be fully loaded before executing the script
$(document).ready(function() {
    // Function to perform a new search
    // This function is defined in a scope accessible by the click handlers
    window.performNewSearch = function(newKeyword, lang, num) {
        // Populate the keyword input field
        $('#keywordInput').val(newKeyword);
        // Set the language and number of results (optional, if they could change)
        $('#languageSelect').val(lang);
        $('#numberSelect').val(num);

        // Programmatically submit the form
        // This will trigger the 'submit' event listener attached to #casualForm
        $('#casualForm').submit();
    };

    // Main function to handle API request and TagCanvas update
    function executeSearch(keyword, language, number) {
        // Construct the Wikipedia API URL
        const apiUrl = `https://${language}.wikipedia.org/w/api.php?action=query&format=json&prop=linkshere&titles=${keyword}&lhlimit=${number}&lhnamespace=0&origin=*`;

        // Fetch data from Wikipedia API
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
                        if (pages[pageId].linkshere) {
                            pages[pageId].linkshere.forEach(link => {
                                const linkedPageTitle = link.title.replace(/'/g, "\\'"); // Escape single quotes for JS string
                                // Update link to call performNewSearch
                                links.push(`<a href="#" onclick="performNewSearch('${linkedPageTitle}', '${language}', '${number}'); return false;">${link.title}</a>`);
                            });
                        }
                    }
                }

                if (links.length > 0) {
                    console.log('Formatted links for TagCanvas:', links);
                    const canvas = document.getElementById('myCanvas');
                    
                    // Clear previous tags from canvas
                    while (canvas.firstChild) {
                        canvas.removeChild(canvas.firstChild);
                    }
                    
                    links.forEach(linkHtml => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = linkHtml;
                        canvas.appendChild(tempDiv.firstChild);
                    });

                    try {
                        const options = {
                            textColour: 'white',
                            textHeight: 20,
                            decel: 0,
                            freezeActive: true,
                            depth: 0.99,
                            minSpeed: 0.01,
                            maxSpeed: 0.01,
                            minBrightness: 0.6,
                            zoom: 1.3,
                            outlineColour: "#FF9F00",
                            initial: [0.02,0.02],
                            shadow: 'white',
                            shadowBlur: 2
                        };
                        TagCanvas.Start('myCanvas', '', options);
                    } catch (e) {
                        console.error('Error restarting TagCanvas:', e);
                        $('#myCanvas').html('<p>Error initializing TagCanvas. Please ensure your browser supports HTML5 canvas.</p>');
                    }
                } else {
                    console.log('No links found for the keyword.');
                    $('#myCanvas').html('<p>No related terms found for your query. Please try a different keyword.</p>');
                }
            })
            .catch(error => {
                console.error('Error fetching or parsing data:', error);
                $('#myCanvas').html('<p>Sorry, there was an error fetching data. Please try again later.</p>');
            });
    }

    // Add an event listener to the form
    $('#casualForm').on('submit', function(event) {
        // Prevent the default form submission (if called directly, not an issue, but good practice)
        event.preventDefault();

        // Get user input
        const keyword = $('#keywordInput').val();
        const language = $('#languageSelect').val();
        const number = $('#numberSelect').val();
        
        // Execute the search
        executeSearch(keyword, language, number);
    });

    // Check for URL parameters on page load to allow direct linking to searches
    const urlParams = new URLSearchParams(window.location.search);
    const keywordParam = urlParams.get('imgkeywords');
    const langParam = urlParams.get('lang');
    const numberParam = urlParams.get('number');

    if (keywordParam) {
        $('#keywordInput').val(keywordParam);
        if (langParam) $('#languageSelect').val(langParam);
        if (numberParam) $('#numberSelect').val(numberParam);
        executeSearch(keywordParam, langParam || 'en', numberParam || '100');
    }
});
