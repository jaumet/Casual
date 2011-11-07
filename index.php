<?php 
// Welcome to Casual visualization v2

//include('lib/conf.php');
include('lib/functions.php');
// per a configurar:
$default_lang = "en";
$default_query = "lalalala lalallala";
$casual_url = "http://nualart.com/casual/index.php";

session_start();
// Use $HTTP_SESSION_VARS with PHP 4.0.6 or less
if (!isset($_SESSION['count'])) {
	// Setting defaults
  $_SESSION['count'] = 0;
  $_SESSIONn['lang'] = $default_lang;
  //$_SESSION['query'] = $default_query;
} else {
  $_SESSION['count']++;
  if (!$_SESSION['imgkeywords'] != $_GET['imgkeywords'] || $_SESSION['lang'] != $_GET['lang'])  {
  	$_SESSION = $_GET;	  	
  }
}
if (!$_GET['imgkeywords']=='') {

	// Cleaning SPACES in the main query
	//$query = str_replace(" ", "+", strtolower($_GET['imgkeywords']));
	$query = str_replace(" ", "+", $_GET['imgkeywords']);

	// Set user agent in order to not get 503 forbidden with file_get_contents() PHP function
	ini_set( 'user_agent', 'casual visualization (nualart.cat/casual)' );

	// Scraping wikipedia WhatsLinkHere pages
	$url ='http://'.$_GET['lang'].'.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&target='.$query.'&namespace=0&lang='.$_GET['lang'].'&limit='.$_GET['number'];
	$urldef = '';

	$backlinks = file_get_contents($url);

	// Scarping 1: catting the piece we want
	$pattern = 'id="mw-whatlinkshere-list"';
	//$pattern = '/\<ul\ id\=\"mw\-whatlinkshere\-list\"\>/';
	$backlinks =  explode($pattern, $backlinks);
	//$pattern = 'View (previous 50';
	$pattern = 'View (previous';
	$backlinks =  explode($pattern, $backlinks[1]);
	// Scraping 2: cleaning
	$pattern = '/\<span.*links.*span\>/i';
	$backlinks = preg_replace($pattern, '', $backlinks[0]);
	// Scraping 3: adapting wpdia URL to casual URL
	$pattern = '/href\=\"\/wiki\//i';
	$replacement = 'href="'.$casual_url.'?number='.$_GET['number'].'&lang='.$_GET['lang'].'&imgkeywords=';
	$backlinks = preg_replace($pattern, $replacement, $backlinks);
}

/////////////////////////
// HTML start here     
/////////////////////////

echo html('head', '');
echo "\n<body>\n";
echo html('casualform', '');
if (!$_GET['imgkeywords']=='') {
	echo html('canvas', $backlinks);
	// Debug
//	$url2 = 'http://'.$_GET['lang'].'.wikipedia.org/wiki/'.$_GET['imgkeywords'];
//	echo '<hr /><div>a la wikipedia: <a href="'.$url2.'" target="_nova">'.$url2.'</a></div><hr />';
	//echo "links: <pre>".$backlinks."</pre>";
//	echo '<br />wiki api link: <a href="'.$url.'">'.$url.'</a>';
} else {
	echo html('help', '');
}
// Closing HTML
echo html('footer', '');
?>
