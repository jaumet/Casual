document.addEventListener('DOMContentLoaded', function() {
    // Function to perform a new search, exposed globally
    window.performNewSearch = function(newKeyword, lang, num) {
        // Populate the form fields
        document.getElementById('keywordInput').value = newKeyword;
        document.getElementById('languageSelect').value = lang;
        document.getElementById('numberSelect').value = num;

        // Programmatically submit the form by dispatching a submit event
        // This will trigger the 'submit' event listener attached to casualForm
        const form = document.getElementById('casualForm');
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
    };

    // Main function to handle API request and TagCanvas update
    function executeSearch(keyword, language, number) {
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
                        if (pages[pageId] && pages[pageId].linkshere) { // Ensure pageId and linkshere exist
                            pages[pageId].linkshere.forEach(link => {
                                const linkedPageTitle = link.title.replace(/'/g, "\\'"); // Escape single quotes for JS string
                                links.push(`<a href="#" onclick="performNewSearch('${linkedPageTitle}', '${language}', '${number}'); return false;">${link.title}</a>`);
                            });
                        }
                    }
                }

                const myCanvas = document.getElementById('myCanvas');
                if (links.length > 0) {
                    console.log('Formatted links for TagCanvas:', links);
                    
                    // Clear previous tags from canvas
                    while (myCanvas.firstChild) {
                        myCanvas.removeChild(myCanvas.firstChild);
                    }
                    
                    links.forEach(linkHtml => {
                        // Create a temporary div to parse the HTML string, then append the <a> tag
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = linkHtml; 
                        if (tempDiv.firstChild) { // Ensure there is a child to append
                           myCanvas.appendChild(tempDiv.firstChild);
                        }
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

    // Add an event listener to the form
    document.getElementById('casualForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Get user input from form fields
        const keyword = document.getElementById('keywordInput').value;
        const language = document.getElementById('languageSelect').value;
        const number = document.getElementById('numberSelect').value;
        
        executeSearch(keyword, language, number);
    });

    // Check for URL parameters on page load to allow direct linking to searches
    const urlParams = new URLSearchParams(window.location.search);
    const keywordParam = urlParams.get('imgkeywords');
    const langParam = urlParams.get('lang');
    const numberParam = urlParams.get('number');

    if (keywordParam) {
        document.getElementById('keywordInput').value = keywordParam;
        if (langParam) {
            document.getElementById('languageSelect').value = langParam;
        }
        if (numberParam) {
            document.getElementById('numberSelect').value = numberParam;
        }
        // Use the language and number from params, or fallback to form defaults if params are not set
        const currentLanguage = langParam || document.getElementById('languageSelect').value;
        const currentNumber = numberParam || document.getElementById('numberSelect').value;
        executeSearch(keywordParam, currentLanguage, currentNumber);
    }
});
