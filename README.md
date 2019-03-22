# tablefilter
client-side HTML table filtering

version 1.10.7

requires jQuery 1.2.6+

aquaone@gmail.com, aquaone on Freenode

# licensing

copyright (c) 2009 Stephen Menton

Dual licensed under the MIT and GPL licenses:
- http://www.opensource.org/licenses/mit-license.php
- http://www.gnu.org/licenses/gpl.html

# acknowledgements

much code recycled from TableSorter (http://tablesorter.com)
Thank you to ChristianBach, nlogax, cohitre, and the rest of #jQuery

# description

tablefilter adds filtering capability to a static HTML table.

tablefilter will deterministically identify which filter to use for
each column in your table (assuming your data is well formatted).
You can also explicitly define which filter to use.

Some filter types will never be detected by default and must be
explicitly chosen. e.g.
- regex: filters based on regular expressions
- select: creates a <select> instead of an <input />
  
# usage

`$('table').tablefilter();`

creates a simple tablefilter interface

`$('table').tablefilter({ headers: { 3: { filter: false }}});`

allows filtering all columns except column 3

`$('table').tablefilter({ headers: { 1: { filter: 'numeric' }}});`

uses the numeric comparison filter for column 1

`$('table').tablefilter({ headers: { 1: { filter: 'regex', caseSensitive: true }}});`

uses case-senstive regex filter for column 1

`$('table').tablefilter({ headers: { 1: { filter: 'select' }}});`

uses a <select> of all unique values for column 1

`$('table').tablefilter({ headers: { 1: { filter: 'select', options: [ 'Open', 'Closed' ] }}});`

uses a <select> with 'Open' and 'Closed' for column 1
  
`$('table').tablefilter({ widgets: ['zebra'] });`

filters table with zebra striping

`$('table').tablefilter({ tooltips: false });`

filters table without tooltips

# parameters

trClass: the class assigned to the appended <tr>

timerWait: # of ms to wait before applying filters

widgetsZebra: property/array of classes used for zebra widget
