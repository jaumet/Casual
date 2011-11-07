<?php

function html($piece, $extra) {

switch ($piece)
{
	case 'casualform':
		$output = <<<FORM
		<div id="panel" class="titol">
<div class="titol"><a href="index.php"><img src="./images/casual.png" height="25px" border="0px" align="top" alt="welcome to casual" /></a> Welcome back - This is absolutely Casual (100% new code - alpha version - <a href="https://github.com/jaumet/Casual" target="_githubcasual">github</a>)</div>
<form method="GET" action="" id="casualform" name="casualform">
	keyword: 
	<input type="text" name="imgkeywords" id="imgkeywords" size="10" maxlength="50" alt="write your query" align="left" value="
FORM;
	$output .= $_GET['imgkeywords'];
	$output .= <<<FORM1
	"/>
 
	<select name="lang" id="lang">
		<option value="en">English</option>
		<option value="ca">Catal&#224;</option>
		<option value="ar">Arab</option>
		<option value="id">Bahasa Ind</option>
		<option value="bn">Bangl&#228;</option>
		<option value="bs">Bosnian</option>
		<option value="bg">Bulgarian</option>
		<option value="cs">Czech</option>
		<option value="zh">Chinese</option>
		<option value="da">Danish</option>
		<option value="de">Deutsch</option>
		<option value="ee">Eesti</option>
		<option value="es">Espa&#241;ol</option>
		<option value="eo">Esperanto</option>
		<option value="fa">Farsi</option>
		<option value="fr">Fran&#231;ais</option>
		<option value="el">Greek</option>
		<option value="he">'Ivrit</option>
		<option value="it">Italiano</option>
		<option value="ja">Japanish</option>
		<option value="ko">Korean</option>
		<option value="nl">Nederlands</option>
		<option value="nn">Nynorsk</option>
		<option value="no">Bokm&#234;l</option>
		<option value="pl">Poski</option>
		<option value="pt">Portugu&#234;s</option>
		<option value="ru">Russian</option>
		<option value="sr">Servocroatian</option>
		<option value="sl">Sloven&#353;&#269;ina</option>
		<option value="fi">Suomi</option>
		<option value="sv">Svenska</option>
		<option value="te">Telugu</option>
		<option value="th">Thai</option>
		<option value="uk">Ukra&#239;ns'ka</option>
	</select>

<!--
	<select name="imgsrc" id="imgsrc" style="width: 100px">

		<option value="res">All images</option>
		<option value="flickr">flickr.com</option>
		<option value="imc">All Indymedias</option>
		<option value="imcbcn">Indymedia Barcelona</option>
		<option value="imcestrecho">Indymedia Estrecho</option>
		<option value="last.fm">last.fm</option>
		<option value="altermundo">Altermundo</option>
		<option value="euromovements">Euromovements.net</option> 
		<option value="straddle3">straddle3.net</option>
		<option value="riereta">riereta.net</option>
	</select>
-->
<!--
	Num img?
	<select name="imgnum" id="imgnum">
		<option value="1">1</option>
		<option value="5">5</option>
		<option value="10" selected="selected">10</option>
		<option value="20">20</option>
		<option value="30">30</option>
	</select>   
--> 
	how many?
	<select name="number" id="number">
		<option value="10">10</option>
		<option value="50">50</option>
		<option value="100" selected="selected">100</option>
		<option value="200">200</option>
		<option value="400">400</option>
	</select>   
	<input type="submit" value="casualize me">
	</form></div>
	
FORM1;
	break;
	
	case 'help':
		$output = '<div id="help">
		<h1>Welcome,<br /> this is <span style="color:red">Casual</span>, a non-hierarchical conceptual landscapes generator. Just search for a concept or common word and you\'ll get a unique cloud of concepts. Please, see the <a href="help.html">help</a> page to know all the features of Casual</h1>
	</div>';
		
	break;
	
	case 'head':
		$output = <<<HEAD
<html>
<head>
	<title>- Casual visualization and concept landscapes -</title>
	<meta name="keywords" content="casual visualization, concept landsacapes, multiviewsalization, tagcloud, contents concentrator" />
	<META NAME="ROBOTS" CONTENT="NOINDEX"> 
	<meta name="description" content="Under the name Casual I am including a set of web scripts that drive us to the idea of random realities, creating a unique media contents landscape on demand. With Casual you can visualize and browse indexed and semantic multi-media contents. Casual is a kind of black hole for the contents that you want to get." />
	<meta name="robots" content="all" />
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/casual	.css" />
	<!--[if lt IE 9]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
	<script src="js/tagcanvas.js" type="text/javascript"></script>
	<!--[if lt IE 9]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
	<script src="js/jquery-1.6.4.min.js" type="text/javascript"></script>
	<script src="js/jquery.tagcanvas.js" type="text/javascript"></script>
	<script type="text/javascript">
	// configuration options (see: http://www.goat1000.com/tagcanvas.php)
			var options = {
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
 
		window.onload = function() {
		  try {
		    TagCanvas.Start('myCanvas', '', options);
		    
		  } catch(e) {
		    // in Internet Explorer there is no canvas!
		    document.getElementById('myCanvas').style.display = 'none';
		  }
		};
	</script>
</head>

HEAD;

	break;

	case 'canvas':
		$output = <<<CANVAS
	<canvas width="1600" height="800" id="myCanvas">
	  <p>Anything in here will be replaced on browsers that support the canvas element</p>
	  <ul>
CANVAS;
		$output .= $extra."			
	  </ul>
	</canvas>";
		
	break;
	
	case 'footer':
		$ex = 'ar';
		$output = '<script>
					$("lang").change(function () {
				    var str = "";
				    $("lang[value=\''.$ex.'\'] option:selected");
					})
					.trigger(\'change\');
		</script>
	</body>
	</html>';
		
	break;	
		
	default:
		$output = "<h1> SOMETHING WENT WRONG</h1>";
	break;

}
return $output;
}
?>
