<?php 
// Welcome to Casual visualization v2

//include('lib/conf.php');
include('lib/functions.php');
// per a configurar:
$default_lang = "en";
$default_query = "linux";
$casual_url = "./index.php";

session_start();
// Use $HTTP_SESSION_VARS with PHP 4.0.6 or less
if (!isset($_SESSION['count'])) {
	// Setting defaults
  $_SESSION['count'] = 0;
  $_SESSIONn['lang'] = $default_lang;
  //$_SESSION['query'] = $default_query;
} else {
  $_SESSION['count']++;
  // Ensure $_GET parameters are checked with isset or empty before use
  $get_imgkeywords = isset($_GET['imgkeywords']) ? $_GET['imgkeywords'] : '';
  $get_lang = isset($_GET['lang']) ? $_GET['lang'] : $default_lang;
  $session_imgkeywords = isset($_SESSION['imgkeywords']) ? $_SESSION['imgkeywords'] : '';
  $session_lang = isset($_SESSION['lang']) ? $_SESSION['lang'] : $default_lang;

  if ($session_imgkeywords != $get_imgkeywords || $session_lang != $get_lang)  {
    // Avoid directly assigning $_GET to $_SESSION for security; cherry-pick needed values.
    $_SESSION['imgkeywords'] = $get_imgkeywords;
    $_SESSION['lang'] = $get_lang;
    $_SESSION['number'] = isset($_GET['number']) ? $_GET['number'] : '100'; // Default '100'
  }
}

$api_error_message = null; // Initialize error message variable
$backlinksHtml = ''; // Initialize backlinks HTML

$current_query_get = isset($_GET['imgkeywords']) ? $_GET['imgkeywords'] : '';
$current_lang_get = isset($_GET['lang']) ? $_GET['lang'] : $default_lang;
$current_number_get = isset($_GET['number']) ? $_GET['number'] : '100';


if (!empty($current_query_get)) {
    $query = str_replace(" ", "+", $current_query_get);
    $lang_for_api = $current_lang_get;
    $number_for_api = $current_number_get;

    // Set user agent
    $userAgent = 'casual visualization (nualart.cat/casual)';

    // Construct MediaWiki API URL
    $apiUrl = 'https://'.$lang_for_api.'.wikipedia.org/w/api.php?' . http_build_query([
        'action' => 'query',
        'list' => 'backlinks',
        'bltitle' => $query,
        'bllimit' => $number_for_api,
        'blnamespace' => 0,
        'format' => 'json',
        // 'formatversion' => 2 // formatversion=2 gives simpler output, but error example uses non-2
    ]);

    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);

    // Execute cURL request
    $response = curl_exec($ch);
    
    if ($response === false) {
        $curl_error_msg = curl_error($ch);
        $api_error_message = "Error connecting to Wikipedia API: " . htmlspecialchars($curl_error_msg) . " (cURL Error Code: " . curl_errno($ch) . ")";
    } else {
        // Use false for $assoc for object access as per error example, but formatversion=2 (removed for now) is better with assoc true
        $decoded_response = json_decode($response); 
        
        if ($decoded_response === null && json_last_error() !== JSON_ERROR_NONE) {
            $api_error_message = "Error parsing Wikipedia API response. Please try again. JSON Error: " . htmlspecialchars(json_last_error_msg());
        } elseif (isset($decoded_response->error)) {
            $error_code = isset($decoded_response->error->code) ? htmlspecialchars($decoded_response->error->code) : 'N/A';
            $error_info = isset($decoded_response->error->info) ? htmlspecialchars($decoded_response->error->info) : 'No additional information.';
            $api_error_message = "Wikipedia API Error: (" . $error_code . ") " . $error_info;
        } elseif (empty($decoded_response->query->backlinks)) {
            $api_error_message = "No pages found linking to '" . htmlspecialchars($current_query_get) . "' on " . htmlspecialchars($lang_for_api) . " Wikipedia.";
        } else {
            $backlinks_items = [];
            foreach ($decoded_response->query->backlinks as $link) {
                // API formatversion=2 uses $link['title'], default format uses $link->title
                $page_title = isset($link->title) ? $link->title : (isset($link['title']) ? $link['title'] : 'Unknown Title');
                $page_title_encoded = urlencode($page_title);
                $casual_link = $casual_url . '?number=' . htmlspecialchars($number_for_api) . '&lang=' . htmlspecialchars($lang_for_api) . '&imgkeywords=' . $page_title_encoded;
                $backlinks_items[] = '<li><a href="' . $casual_link . '">' . htmlspecialchars($page_title) . '</a></li>';
            }
            $backlinksHtml = "<ul>\n" . implode("\n", $backlinks_items) . "\n</ul>";
        }
    }
    curl_close($ch);
}

/////////////////////////
// HTML start here     
/////////////////////////

echo generate_html_head();
echo "\n<body>\n";

// Set default values for form parameters for generate_casual_form
$query_form_val = !empty($current_query_get) ? $current_query_get : $default_query;
$lang_form_val = $current_lang_get; // Already defaults to $default_lang if not in GET
$number_form_val = $current_number_get; // Already defaults to '100' if not in GET

echo generate_casual_form($query_form_val, $lang_form_val, $number_form_val);

if ($api_error_message !== null) {
    echo '<div id="apierror" style="color: red; text-align: center; padding: 20px; border: 1px solid red; margin: 10px;">' . $api_error_message . '</div>';
} elseif (!empty($backlinksHtml)) {
    echo generate_canvas_section($backlinksHtml);
} elseif (empty($current_query_get)) { // Only show help if no query was attempted and no error from a previous attempt
    echo generate_help_section();
}
	// Debug
//	$url2 = 'http://'.$current_lang_get.'.wikipedia.org/wiki/'.urlencode($current_query_get);
//	echo '<hr /><div>a la wikipedia: <a href="'.$url2.'" target="_nova">'.$url2.'</a></div><hr />';
//	if(!empty($backlinksHtml)) echo "links: <pre>".$backlinksHtml."</pre>"; 
//	if(!empty($apiUrl)) echo '<br />MediaWiki API URL: <a href="'.$apiUrl.'">'.$apiUrl.'</a>';

// Closing HTML
echo generate_html_footer();
?>
