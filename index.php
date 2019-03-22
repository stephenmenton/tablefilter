<?php
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta http-equiv="content-type" content="text/html; charset=iso-8859-1" />
  <title>table filter plugin demo page</title>
  <link rel="stylesheet" href="css/default.css" type="text/css" media="print, projection, screen" />
  <link rel="stylesheet" href='css/tablesorterBlue.css' type='text/css' media='print, projection, screen' />
  <link rel="stylesheet" href='css/jquery.tablefilter.css' type='text/css' media='print, projection, screen' />
  <link rel='stylesheet' href='css/jquery.tooltip.css' type='text/css' media='projection, screen' />

  <script src="../js/jquery/jquery.1-3-1.min.js" type="text/javascript"></script>
  <script src="../js/jquery/jquery.tablesorter.min.js" type="text/javascript"></script>
  <script src="../js/jquery/jquery.tooltip.js" type='text/javascript'></script>
  <script src="js/jquery.tablefilter.js" type="text/javascript"></script>
  <script type="text/javascript">
//<![CDATA[
$("document").ready(function(){
  $("#table1").tablesorter({
    widgets: [ 'zebra' ]
    });
  $("#table1").tablefilter({
    headers: {
      1: { caseSensitive: true },
      3: { filter: 'numeric' },
      4: { filter: 'regex' },
      5: { filter: 'regex', caseSensitive: true }
      },
    widgets: [ 'zebra' ]
    });
  $("#table2").tablefilter({
    headers: {
      2: { filter: false },
      3: { filter: 'select' },
      4: { filter: 'select', caseSensitive: true },
      5: { filter: 'select', options: [ 'open', 'closed' ] }
      },
    widgets: [ 'zebra' ],
    eraser: true
    });
  });

//]]>
  </script>
</head>
<!--[if lt IE 7 ]>
<body class="ie ie6"><![endif]-->
<!--[if IE 7 ]>
<body class="ie ie7"><![endif]-->
<!--[if IE 8 ]>
 <body class="ie ie8"><![endif]-->
<!--[if !IE]>
--><body><!--<![endif]-->
<p>this is a private demo page of a plugin still in development. please do not take any code or redistribute any content from this page.</p>
<p>filter type is automatically determined from content of all cells. it can be explicitly defined as well for mixed data. users can create their own filters and add them little effort. users can also create their own widgets. virtually everything can be modified with some basic css tweaks. the eraser can be enabled or disabled. single click clears that field, dblclick clears all fields in that table.</p>
<p>also, i need a name for the plugin since there's a "tablefilter" plugin in existence already (it didn't meet my requirements). sorting capability is provided by <a href="http://www.tablesorter.com/">tablesorter</a> by Christian Bach.</p>

<table id="table1" class="tablesorter">
  <thead>
    <tr>
      <th style="width:70px;">text</th>
      <th style="width:70px;">text<br />(case sensitive)</th>
      <th style="width:70px;">numbers</th>
      <th style="width:70px;">mixed<br />(numbers)</th>
      <th style="width:70px;">regex</th>
      <th style="width:70px;">regex<br />(case sensitive)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>some words</td>
      <td>some WORDS</td>
      <td>12,381</td>
      <td>10</td>
      <td>bacon</td>
      <td>Bacon</td>
    </tr>
    <tr>
      <td>words</td>
      <td>words</td>
      <td>-400</td>
      <td>9001</td>
      <td>accuracy</td>
      <td>Accuracy</td>
    </tr>
    <tr>
      <td>wordy</td>
      <td>Wordy</td>
      <td>98.6</td>
      <td>ham</td>
      <td>Brave</td>
      <td>Brave</td>
    </tr>
    <tr>
      <td>text</td>
      <td>TEXT</td>
      <td>-400</td>
      <td>212</td>
      <td>Tabaco</td>
      <td>Tabaco</td>
    </tr>
    <tr>
      <td>two words</td>
      <td>Two words</td>
      <td>400</td>
      <td>36</td>
      <td>tamaco</td>
      <td>TAMACO</td>
    </tr>
    <tr>
      <td>small words</td>
      <td>small words</td>
      <td>-5,021</td>
      <td>38.2</td>
      <td>accent</td>
      <td>Accent</td>
    </tr>
    <tr>
      <td>blah</td>
      <td>bLAh</td>
      <td>-11</td>
      <td>36.1</td>
      <td>century</td>
      <td>Century</td>
    </tr>
    <tr>
      <td>more text</td>
      <td>MORE text</td>
      <td>500</td>
      <td>37</td>
      <td>turn</td>
      <td>Turn</td>
    </tr>
    <tr>
      <td>blah blah</td>
      <td>blah blah</td>
      <td>500.9</td>
      <td>40</td>
      <td>tron</td>
      <td>TRON</td>
    </tr>
    <tr>
      <td>yup, text</td>
      <td>Yup, Text</td>
      <td>-4</td>
      <td>w3rd</td>
      <td>Macy's</td>
      <td>Macy's</td>
    </tr>
  </tbody>
</table>
<br />
<table id="table2" class="tablesorter">
  <thead>
    <tr>
      <th style="width:70px;">currency</th>
      <th style="width:70px;">dates</th>
      <th style="width:70px;">disabled</th>
      <th style="width:70px;">select<br />(implicit)</th>
      <th style="width:70px;">select<br />(implicit)<br />(case sensitive)</th>
      <th style="width:70px;">select<br />(explicit)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>$6.20</td>
      <td>2/26/98</td>
      <td>meh</td>
      <td>yes</td>
      <td>yes</td>
      <td>open</td>
    </tr>
    <tr>
      <td>$10,380</td>
      <td>12/08/2008</td>
      <td>meh</td>
      <td>NO</td>
      <td>NO</td>
      <td>open</td>
    </tr>
    <tr>
      <td>&euro;200.80</td>
      <td>12/11</td>
      <td>still meh</td>
      <td>yes</td>
      <td>yes</td>
      <td>in progress</td>
    </tr>
    <tr>
      <td>$-250.00</td>
      <td>4/13/1975</td>
      <td>...</td>
      <td>no</td>
      <td>no</td>
      <td>closed</td>
    </tr>
    <tr>
      <td>&yen;800000</td>
      <td>9/18/1983</td>
      <td>meh</td>
      <td>Maybe</td>
      <td>Maybe</td>
      <td>open</td>
    </tr>
    <tr>
      <td>$10,200</td>
      <td>12/11/09</td>
      <td>meh</td>
      <td>no</td>
      <td>no</td>
      <td>closed</td>
    </tr>
    <tr>
      <td>&yen;200</td>
      <td>12/11/2009</td>
      <td>bleh</td>
      <td>yes</td>
      <td>yes</td>
      <td>cancelled</td>
    </tr>
    <tr>
      <td>&yen;800</td>
      <td>11/9/05</td>
      <td>ignored</td>
      <td>maybe</td>
      <td>maybe</td>
      <td>closed</td>
    </tr>
    <tr>
      <td>&euro;800</td>
      <td>07/04/1979</td>
      <td>...</td>
      <td>yes</td>
      <td>yes</td>
      <td>open</td>
    </tr>
    <tr>
      <td>&euro;16.20</td>
      <td>11/28/1956</td>
      <td>meh</td>
      <td>no</td>
      <td>no</td>
      <td>cancelled</td>
    </tr>
  </tbody>
</table>
</body>
</table>
</body>
</table>
