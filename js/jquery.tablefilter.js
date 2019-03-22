/*
** tablefilter - client side table filtering
** version 1.10.7
** requires jQuery 1.2.6+
**
** copyright (c) 2009 Stephen Menton
** aquaone@gmail.com, aquaone on Freenode
**
** Dual licensed under the MIT and GPL licenses:
** http://www.opensource.org/licenses/mit-license.php
** http://www.gnu.org/licenses/gpl.html
**
** much code recycled from TableSorter (http://tablesorter.com)
** Thank you to ChristianBach, nlogax, cohitre, and the rest of #jQuery
**
** tablefilter will deterministically identify which filter to use for
** each column in your table (assuming your data is well formatted).
** You can explicitly define which filter to use if you have mixed data
** but your results may not be quite what you intended.
**
** Some filter types will never be detected by default and must be
** explicitly chosen. e.g.
** regex: filters based on regular expressions
** select: creates a <select> instead of an <input />
*/

/*
** examples
**
** example: $('table').tablefilter();
** description: creates a simple tablefilter interface
**
** example: $('table').tablefilter({ headers: { 3: { filter: false }}});
** description: allows filtering all columns except column 3
**
** example: $('table').tablefilter({ headers: { 1: { filter: 'numeric' }}});
** description: uses the numeric comparison filter for column 1
**
** example: $('table').tablefilter({ headers: { 1: { filter: 'regex', caseSensitive: true }}});
** description: uses case-senstive regex filter for column 1
**
** example: $('table').tablefilter({ headers: { 1: { filter: 'select' }}});
** description: uses a <select> of all unique values for column 1
**
** example: $('table').tablefilter({ headers: { 1: { filter: 'select', options: [ 'Open', 'Closed' ] }}});
** description: uses a <select> with 'Open' and 'Closed' for column 1
**
** example: $('table').tablefilter({ widgets: ['zebra'] });
** description: filters table with zebra striping
**
** example: $('table').tablefilter({ tooltips: false });
** description: filters table without tooltips
**
** parameters
**
** parameter: trClass
** description: the class assigned to the appended <tr> 
**
** parameter: timerWait
** description: # of ms to wait before applying filters
**
** parameter: widgetsZebra
** description: property/array of classes used for zebra widget
*/

( function( $ ) {
  $.extend({
    tablefilter: new function(){

      var filters = [], widgets = [];
      // plugin defaults, overridden by properties passed to invocation
      this.defaults = {
        trClass: 'tablefilter',
        timerWait: 200,
        filters: {},
        widgets: [],
        widgetZebra: { css: [ "even", "odd" ] },
        eraser: false
        };

      this.construct = function( settings ) {
        return this.each( function(){
          // abort if table lacks thead or tbody
          if( ! this.tHead || ! this.tBodies ) return false;
          // abort if table lacks rows in thead or tbody
          if( ! this.tHead.rows.length || ! this.tBodies[0].rows.length ) return false;
          var $table, $headers, $trInput, cache, filterConfig, timer;
          // init to null
          this.filterConfig = {};
          this.filterConfig.headers = {};
          filterConfig = $.extend( this.filterConfig, $.tablefilter.defaults, settings );
          // tooltip plugin loaded?
          if(( filterConfig.tooltips === undefined ) && $.fn.tooltip ) filterConfig.tooltips = true;
          // optimization
          $table = $(this);
          // cache the tbody
          cache = buildCache( this );
          // create null filter set, determine filters
          buildFilters( this );
          // input row
          $trInput = $("<tr />").addClass( filterConfig.trClass ).appendTo( $("thead", $table ));
          // build headers
          buildHeaders( this, $trInput, cache );
          // activate tooltips
          if( $.fn.tooltip ) $trInput.find( "input" ).tooltip();
          // bind text entry
          $("input", $trInput).each( function(){
            $(this).keyup( function(){
              var input = this;
              var timerCallback = function(){
                filter( input, cache, $table[0] );
                };
              clearTimeout( timer );
              timer = setTimeout( timerCallback, filterConfig.timerWait );
              return false;
              });
            });
          // bind select
          $("select", $trInput).each( function(){
            $(this).change( function(){
              var select = this;
              filter( select, cache, $table[0] );
              });
            });
          if( filterConfig.eraser ) {
            // bind eraser clear (click)
            $("span.tablefilterEraser", $trInput).each( function(){
              $(this).click( function(){
                var $input = $(this).siblings( "input, select" );
                $input.val( "" );
                filter( $input.get(0), cache, $table[0] );
                });
              });
            // bind eraser all clear (dblclick)
            $("span.tablefilterEraser", $trInput).each( function(){
              $(this).dblclick( function(){
                $("input, select", $trInput).each( function() {
                  $input = $(this);
                  $input.val( "" );
                  filter( $input.get(0), cache, $table[0] );
                  });
                var $input = $(this).siblings( "input, select" );
                });
              });
            }
          // sortEnd is for tablesorter
          // filterEnd is for re-applying widgets
          // update is for re-building the cache (ajax)
          $table.bind( "sortEnd", function(){
            cache = buildCache( this );
            })
            .bind( "filterEnd", function(){
            applyWidgets( this );
            })
            .bind( "update", function(){
            cache = buildCache( this );
            });
          // and now...
          applyWidgets( this );
          });
        };

      /* 
      ** appends <th><input /></th> array to created <tr>
      */
      function buildHeaders( table, $trInput, cache ) {
        var tableHeaderRows = [];
        for( var i = 0; i < table.tHead.rows.length; i++ ) {
          tableHeaderRows[i] = 0;
        }
        $("thead tr:first th", table).each( function( index ) {
          var $thFirst = $(this), $th, headerOptions = checkHeaderOptions( table, index );
          var width = "auto";
          if( $thFirst.css( "width" )) width = $thFirst.css( "width" );
          var filter = headerOptions.filter, caseSensitive = headerOptions.caseSensitive;
          if( filter == false ) this.filterDisabled = true;
          if( ! this.filterDisabled ) {
            // is select?
            if( filter == 'select' ) {
              var uniqueValues = [ '' ];
              // explicit list?
              if( table.filterConfig.headers[index].options ) {
                // do not sort!
                uniqueValues = uniqueValues.concat( table.filterConfig.headers[index].options ).getUniqueValues( caseSensitive );
                }
              // implicitly get all values from cache
              else {
                uniqueValues = uniqueValues.concat( cache.normalized[index] ).getUniqueValues( caseSensitive ).sort();
                }
              // construct html to add
              // slower than a .join(...) but values reqd for IE
              var selectHtml = '<select>';
              var numOptions = uniqueValues.length;
              for( var i = 0; i < numOptions; i++ ) {
                selectHtml += '<option value="' + uniqueValues[i] + '">' + uniqueValues[i] + '</option>';
                }
              selectHtml += '</select>';
              
              // append <select> and <option>s
              $th = $(selectHtml)
                .data( "filter", filter )
                .data( "caseSensitive", caseSensitive )
                .wrap( "<th></th>" )
                .parent()
                .appendTo( $trInput );
              if( table.filterConfig.eraser ) {
                $('<span class="tablefilterEraser"> </span>')
                  .appendTo( $th );
                }
              }
            else {
              var title = '';
              var eraser = '';
              if( table.filterConfig.tooltips ) {
                title = ' title="' + getFilterById( filter ).title + '"';
                }
              $th = $('<input' + title + ' />')
                .css( "width", width )
                .data( "filter", filter )
                .data( "caseSensitive", caseSensitive )
                .wrap( '<th></th>' )
                .parent()
                .css( "width", width )
                .appendTo( $trInput );
              if( table.filterConfig.eraser ) {
                $('<span class="tablefilterEraser"> </span>')
                  .appendTo( $th );
                }
              }
            }
          else {
            $th = $('<th></th>').appendTo( $trInput );
            }
          $th[0].column = index;
          });
        };

      /*
      ** stores table contents in memory
      */
      function buildCache( table ) {
        var totalRows = ( table.tBodies[0] && table.tBodies[0].rows.length ) || 0,
        totalCells = ( table.tBodies[0].rows[0] && table.tBodies[0].rows[0].cells.length ) || 0,
        cache = { normalized: [] };
        // cache is inverted compared with tablesorter
        for( var i = 0; i < totalCells; ++i ) {
          var col = [];
          for( var j = 0; j < totalRows; ++j ) {
            col.push( getElementText( table.tBodies[0].rows[j].cells[i] ));
            }
          cache.normalized.push( col );
          col = null;
          }
        return cache;
        };

      /*
      ** returns innerHTML of first element
      */
      function getElementText( node ) {
        if( ! node ) return "";
        var t = "";
        if( node.childNodes[0] && node.childNodes[0].hasChildNodes()) {
          t = node.childNodes[0].innerHTML;
          }
        else {
          t = node.innerHTML;
          }
        return t;
        };

      /*
      ** for tracking which index filters which row
      */
      function buildFilters( table ) {
        var totalRows = ( table.tBodies[0] && table.tBodies[0].rows.length ) || 0,
        totalCells = ( table.tBodies[0].rows[0] && table.tBodies[0].rows[0].cells.length ) || 0;
        for( var i = 0; i < totalRows; ++i ) {
          // populate filtered values to 0
          table.tBodies[0].rows[i].tablefilters = [];
          for( var j = 0; j < totalCells; ++j ) {
            table.tBodies[0].rows[i].tablefilters[j] = 0;
            }
          }
        for( var j = 0; j < totalCells; ++j ) {
          // determine filter
          if( ! table.filterConfig.headers[j] ) table.filterConfig.headers[j] = {};
          // catch false
          if(( table.filterConfig.headers[j].filter !== false ) && ( ! table.filterConfig.headers[j].filter )) {
            table.filterConfig.headers[j].filter = detectFilterForColumn( table, j );
            }
          }
        };

      /* 
      ** checks to see if filtering should be disabled
      */
      function checkHeaderOptions( table, i ) {
        var filter = ( table.filterConfig.headers[i] && ( table.filterConfig.headers[i].filter !== undefined ))
          ? table.filterConfig.headers[i].filter
          : 'text';
        var caseSensitive = ( table.filterConfig.headers[i] && ( table.filterConfig.headers[i].caseSensitive === true ))
          ? true
          : false;
        return { filter: filter, caseSensitive: caseSensitive };
        };

      /* 
      ** hides rows that don't match defined text
      */
      function filter( input, cache, table ) {
        var val = $.trim( input.value );
        $(input).removeClass( "invalidFilter" );
        // dont do anything if unchanged
        if( $.data( input, "prevValue" ) && ( val === $.data( input, "prevValue" ))) return false;
        // dont do anything if invalid for filter
        var filter = $.data( input, "filter" );
        if( ! getFilterById( filter ).valid( val ) && ( val != '' )) {
          $(input).addClass( "invalidFilter" );
          return false;
          }
        // trigger filter start
        $(table).trigger( "filterStart" );
        // get column index
        var index = input.parentNode.column;
        // case sensitive?
        var caseSensitive = $.data( input, "caseSensitive" );
        // store to avoid reevaluation
        var numRows = cache.normalized[0].length; 
        for( i = 0; i < numRows; i++ ) {
          // if null, show
          if( val == '' ) {
            table.tBodies[0].rows[i].tablefilters[index] = 0;
            if( sum( table.tBodies[0].rows[i].tablefilters ) == 0 ) {
              table.tBodies[0].rows[i].style.display = "";
              }
            continue;
            }
          // if filter returns -1, hide it
          else if(( ! getFilterById( filter ).is( cache.normalized[index][i] )) || ( getFilterById( filter ).filter( val, cache.normalized[index][i], caseSensitive ) == -1 )) {
            table.tBodies[0].rows[i].style.display = "none";
            table.tBodies[0].rows[i].tablefilters[index] = 1;
            continue;
            }
          // otherwise, show it
          else {
            table.tBodies[0].rows[i].tablefilters[index] = 0;
            if( sum( table.tBodies[0].rows[i].tablefilters ) == 0 ) {
              table.tBodies[0].rows[i].style.display = "";
              }
            }
          }
        // store value for next iteration
        $.data( input, "prevValue", val );
        // trigger filter end
        $(table).trigger( "filterEnd" );
        };

      /* 
      ** sums an object/array
      */
      function sum( o ) {
        for( var s = 0, i = 0; i < o.length; i++ ) {
          t = parseFloat( o[i] );
          if( ! isNaN( t )) s += t;
          }
        return s;
        };

      /*
      ** adds a new filter
      */
      this.addFilter = function( filter ) {
        var l = filters.length, a = true;
        for( var i = 0; i < l; i++ ) {
          // dont add the same filter twice
          if( filters[i].id.toLowerCase() == filter.id.toLowerCase()) {
            a = false;
            }
          }
        if( a ) filters.push( filter );
        };

      /*
      ** returns the appropriate filter
      ** cant use id as arg, conflicts with id property
      */
      function getFilterById( name ) {
        var l = filters.length;
        for( var i = 0; i < l; i++ ) {
          if( filters[i].id.toLowerCase() == name.toLowerCase()) return filters[i];
          }
        return false;
        };

      /*
      ** this is not as efficient as possible but i'm trying to avoid some of the issues i've had with tablesorter's detection
      */
      function detectFilterForColumn( table, index ) {
        var l = filters.length,
        totalRows = ( table.tBodies[0] && table.tBodies[0].rows.length ) || 0;
        // start at 3 to avoid autodetect of text, regex, and select
        for( var valid = 0, f = 3; f < l; f++ ) {
          for( var j = 0; j < totalRows; j++ ) {
            // this loop may be better written as breaking out when invalid data found
            valid += (
              filters[f].is(
                $.trim( getElementText( table.tBodies[0].rows[j].cells[index] )),
                table,
                table.tBodies[0].rows[j].cells[index]
                )
              ) ? 1 : 0;
            }
          // if everything matches, we are good
          if( valid == totalRows ) return filters[f].id;
          }
        // 0 is text filter
        return filters[0].id;
        };

      /* 
      ** adds a new widget
      */
      this.addWidget = function( widget ) {
        var l = widgets.length, a = true;
        for( var i = 0; i < l; i++ ) {
          // dont add the same widget twice
          if( widgets[i].id.toLowerCase() == widget.id.toLowerCase()) {
            a = false;
            }
          }
        if( a ) widgets.push( widget );
        };

      /* 
      ** applies all widgets to the table
      */
      function applyWidgets( table ) {
        var c = table.filterConfig.widgets,
        l = c.length;
        for( var i = 0; i < l; i++ ) {
          getWidgetById( c[i] ).format( table );
          }
        }

      /* 
      ** returns the function of an identified widget
      */
      function getWidgetById( name ) {
        var l = widgets.length;
        for( var i = 0; i < l; i++ ) {
          if( widgets[i].id.toLowerCase() == name.toLowerCase() ) return widgets[i];
          }
        }

      }
    });

  $.fn.extend({
    tablefilter: $.tablefilter.construct
    });

  // shorthand
  var tf = $.tablefilter;

  /*
  ** plain text filter (default)
  */
  tf.addFilter({
    id: "text",
    is: function( s ) {
      return true;
      },
    valid: function( iv ) {
      return true;
      },
    filter: function( iv, tdv, caseSensitive ) {
      return ( caseSensitive ) ? tdv.indexOf( iv ) : tdv.toLowerCase().indexOf( iv.toLowerCase());
      },
    title: "plain text filter:<br />string pattern matching"
    });

  /*
  ** regex filter
  */
  tf.addFilter({
    id: "regex",
    is: function( s ) {
      return true;
      },
    valid: function( iv ) {
      var regex = false;
      try {
        regex = new RegExp( iv );
        }
      catch( error ) {
        return false;
        }
      return true;
      },
    filter: function( iv, tdv, caseSensitive ) {
      regex = ( caseSensitive ) ? new RegExp( iv ) : new RegExp( iv, "i" );
      return ( regex && regex.test( tdv )) ? 1 : -1;
      },
    title: "regular expression filter:<br />regex pattern matching"
    });

  /*
  ** regex filter
  ** to-do: remove known exploits
  */
  tf.addFilter({
    id: "select",
    is: function( s ) {
      return true;
      },
    valid: function( sv ) {
      return true;
      },
    filter: function( sv, tdv, caseSensitive ) {
      if( caseSensitive ) {
        return ( sv == tdv ) ? 1 : -1;
        }
      else {
        return ( sv.toLowerCase() == tdv.toLowerCase() ) ? 1 : -1;
        }
      }
    });

  /*
  ** numeric comparison filter
  ** now supports commas... hideously...
  */
  tf.addFilter({
    id: "numeric",
    is: function( s ) {
      return /^-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d)$/.test( s );
      },
    valid: function( iv ) {
      // numerical comparison, number, numerical range, or null string
      return /^((?:[<>]=?|=)|-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d)\s*(-)|)\s*(-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d))$/.test( iv );
      },
    filter: function( iv, tdv, caseSensitive ) {
      // the replace strips whitespace already validated
      // [1] is number (if ranged), conditional, or null
      // [2] is hyphen (if ranged) or null
      // [3] is number or null
      m = iv
        .replace( /\s+/g, '' )
        .match( /^((?:[<>]=?|=)|-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d)(-)|)(-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d))$/ );
      // strip commas
      m[1] = m[1].replace( /\,/g, '' );
      iv   = iv.replace(   /\,/g, '' );
      // strip commas and parseFloat
      m[3] = parseFloat( m[3].replace( /\,/g, '' ));
      tdv  = parseFloat( tdv.replace(  /\,/g, '' ));

      // range
      if( m[2] == '-' ) return (( tdv >= parseFloat( m[1].slice( 0, -1 ))) && ( tdv <= m[3] )) ? 1 : -1;
      // equal to
      if( m[1] == '=' ) return ( tdv == m[3] ) ? 1 : -1;
      // conditional
      if( m[1] != '' ) return eval( '' + tdv + iv ) ? 1 : -1;
      // default to indexOf
      return ( '' + tdv ).indexOf( iv );
      },
    title: "numeric filter:<br />numeric pattern matching<br />conditional (<, <=, =, =>, >)<br />range (10-20)"
    });

  /*
  ** currency comparison filter
  ** same as number, only with currency symbols (dollar, pound, euro, yen)
  ** also supports restriction to specific currency type in comparisons
  */
  tf.addFilter({
    id: "currency",
    is: function( s ) {
      return /^(?:\$|\u00a3|\u00a5|\u20ac)-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d)$/.test( s );
      },
    valid: function( iv ) {
      // numerical comparison, number, numerical range, or null string
      return /^((?:[<>]=?|=)|(?:\$|\00a3|\u00a5|\u20ac)?-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d)\s*(-)|)\s*((?:\$|\u00a3|\u00a5|\u20ac)?-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d))$/.test( iv );
      },
    filter: function( iv, tdv, caseSensitive ) {
      // the replace strips whitespace already validated
      // [1] is number (if ranged), conditional, or null
      // [2] is currency symbol (optional)
      // [3] is hyphen (if ranged) or null
      // [4] is number or null
      // [5] is currency symbol (optional, if not ranged)
      m = iv
        .replace( /\s+/g, '' )
        .match( /^((?:[<>]=?|=)|(\$|\u00a3|\u00a5|\u20ac)?-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d)(-)|)((\$|\u00a3|\u00a5|\u20ac)?-?(?:\d{1,3}(?:\,\d\d\d)*(?:\.\d+)?|\d*(?:\.\d*)?\d))$/ );

      // strip currency symbols and commas from m[1], m[4], parseFloat m[4]
      m[1] = m[1].replace( /(?:\$|\u00a3|\u00a5|\u20ac)/, '' ).replace( /\,/g, '' );
      m[4] = parseFloat( m[4].replace( /(?:\$|\u00a3|\u00a5|\u20ac)/, '' ).replace( /\,/g, '' ));
      // strip commas from iv, tdv
      iv = iv.replace( /\,/g, '' );
      tdv = tdv.replace( /\,/g, '' );
      // remove currency symbols from tdv, parse as float, store in pFtdv
      pFtdv = parseFloat( tdv.replace( /(?:\$|\u00a3|\u00a5|\u20ac)/, '' ));

      // currency restricted?
      var currency = false, currencyRegex;
      if( m[2] ) {
        currency = m[2];
        }
      if( m[5] ) {
        // return 1 (same as no filter) if currency type mismatch
        if( currency && ( m[2] != m[5] )) return 1;
        currency = m[5];
        }
      if( currency ) {
        currencyRegex = new RegExp( "\\" + currency );
        // return -1 if incorrect currency type
        if( ! currencyRegex.test( tdv )) return -1;
        }

      // range
      if( m[3] == '-' ) return (( pFtdv >= parseFloat( m[1].slice( 0, -1 ))) && ( pFtdv <= m[4] )) ? 1 : -1;

      // conditional (avoiding eval because of exploits and failing interpretation of $)
      if( m[1] == '<'  ) return ( pFtdv < m[4]  ) ? 1 : -1;
      if( m[1] == '>'  ) return ( pFtdv > m[4]  ) ? 1 : -1;
      if( m[1] == '<=' ) return ( pFtdv <= m[4] ) ? 1 : -1;
      if( m[1] == '>=' ) return ( pFtdv >= m[4] ) ? 1 : -1;
      if( m[1] == '='  ) return ( pFtdv == m[4] ) ? 1 : -1;

      // default to indexOf
      return ( '' + tdv).indexOf( iv );
      },
    title: "currency filter:<br />numeric pattern matching<br />conditionals (<, <=, =, >=, >)<br />range (10-20)<br />specific currency (<$20, &euro;10-30)"
    });

  /*
  ** date comparison filter
  ** 2 digit years roll over at 50
  */
  tf.addFilter({
    id: "date",
    is: function( s ) {
      return /^(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])(\/\d\d(?:\d\d)?)?$/.test( s );
      },
    valid: function( iv ) {
      // numerical comparison, number, numerical range, or null string
      // [1] is date (if ranged), conditional, or null
      // [2] is hyphen (if ranged) or null
      // [3] is date
      matches = iv.match( /^((?:[<>]=?)|(?:(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])(?:\/\d\d(?:\d\d)?)?\s*(-))|)\s*((?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])(?:\/\d\d(?:\d\d)?)?)$/ );

      // return false on invalid pattern
      if( ! matches || ( matches[3] === undefined )) return false;

      // trim whitespace from matches
      matches[1] = matches[1].replace( /\s+/g, '' );
      matches[3] = matches[3].replace( /\s+/g, '' );

      // correct year, validate date
      var currentYear = new Date().getFullYear(),
      currentCentury = ( '' + currentYear ).slice( 0, -2 ),
      twoDigitYear3, twoDigitYear1;
      if( /^(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])$/.test( matches[3] )) matches[3] += "/" + currentYear;
      else {
        twoDigitYear3 = matches[3].slice( -2 );
        matches[3] = matches[3].replace( /\/\d\d$/, "/" + (( twoDigitYear3 < 50 ) ? currentCentury : ( currentCentury - 1 )) + twoDigitYear3 );
        }
      // return false on invalid day for month
      var parsedDate3 = matches[3].split( "/" );
      var month3 = parsedDate3[0] - 1;
      var day3 = parsedDate3[1];
      var year3 = parsedDate3[2];
      var cmpDate3 = new Date( matches[3] );
      // invalid/mismatched dates
      if(( month3 != cmpDate3.getMonth()) || ( day3 != cmpDate3.getDate()) || ( year3 != cmpDate3.getFullYear())) return false;

      // ranged?
      if( matches[2] ) {
        // strip dash
        matches[1] = matches[1].slice( 0, -1 );
         
        // correct year, validate date
        if( /^(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])$/.test( matches[1] )) matches[1] += "/" + currentYear;
        else {
          twoDigitYear1 = matches[1].slice( -2 );
          matches[1] = matches[1].replace( /\/\d\d$/, "/" + (( twoDigitYear1 < 50 ) ? currentCentury : ( currentCentury - 1 )) + twoDigitYear1 );
          }
        // return false on invalid day for month
        var parsedDate1 = matches[1].split( "/" );
        var month1 = parsedDate1[0] - 1;
        var day1 = parsedDate1[1];
        var year1 = parsedDate1[2];
        var cmpDate1 = new Date( matches[1] );
        // invalid/mismatched dates
        if(( month1 != cmpDate1.getMonth()) || ( day1 != cmpDate1.getDate()) || ( year1 != cmpDate1.getFullYear())) return false;

        // return false for ranged with matches[3] <= matches[1]
        if( cmpDate3 <= cmpDate1 ) return false;
        }

      return true;
      },
    filter: function( iv, tdv, caseSensitive ) {
      // tokenize input value for use
      matchesIv = iv.match( /^((?:[<>]=?)|(?:(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])(?:\/\d\d(?:\d\d)?)?\s*(-))|)\s*((?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])(?:\/\d\d(?:\d\d)?)?)$/ );

      // trim whitespace from matches
      matches[1] = matches[1].replace( /\s+/g, '' );
      matches[3] = matches[3].replace( /\s+/g, '' );

      // correct year, validate date for iv
      var currentYear = new Date().getFullYear(),
      currentCentury = ( '' + currentYear ).slice( 0, -2 ),
      twoDigitYearIv3, twoDigitYearIv1, twoDigitYearTdv;
      if( /^(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])$/.test( matchesIv[3] )) matchesIv[3] += "/" + currentYear;
      else {
        twoDigitYearIv3 = matchesIv[3].slice( -2 );
        matchesIv[3] = matchesIv[3].replace( /\/\d\d$/, "/" + (( twoDigitYearIv3 < 50 ) ? currentCentury : ( currentCentury - 1 )) + twoDigitYearIv3 );
        }
      var cmpDate3 = new Date( matchesIv[3] );

      // correct year, validate date for tdv
      if( /^(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])$/.test( tdv )) tdv += "/" + currentYear;
      else {
        twoDigitYearTdv = tdv.slice( -2 );
        tdv = tdv.replace( /\/\d\d$/, "/" + (( twoDigitYearTdv < 50 ) ? currentCentury : ( currentCentury - 1 )) + twoDigitYearTdv );
        }
      var tdvDate = new Date( tdv );

      // ranged?
      if( matchesIv[2] ) {
        // strip dash
        matchesIv[1] = matchesIv[1].slice( 0, -1 );
         
        // correct year, validate date
        if( /^(?:0?[1-9]|1[012])\/(?:0?[1-9]|[12]\d|3[01])$/.test( matchesIv[1] )) matchesIv[1] += "/" + currentYear;
        else {
          twoDigitYearIv1 = matchesIv[1].slice( -2 );
          matchesIv[1] = matchesIv[1].replace( /\/\d\d$/, "/" + (( twoDigitYearIv1 < 50 ) ? currentCentury : ( currentCentury - 1 )) + twoDigitYearIv1 );
          }
        var cmpDate1 = new Date( matchesIv[1] );

        // within range?
        return (( cmpDate1 <= tdvDate ) && ( tdvDate <= cmpDate3 )) ? 1 : -1;
        }

      // equal to? (requires string conversion)
      if( matchesIv[1] == '' ) return ( +tdvDate == +cmpDate3 ) ? 1 : -1;

      // comparisons
      if( matchesIv[1] == '<=' ) return ( tdvDate <= cmpDate3 ) ? 1 : -1;
      if( matchesIv[1] == '<'  ) return ( tdvDate <  cmpDate3 ) ? 1 : -1;
      if( matchesIv[1] == '>=' ) return ( tdvDate >= cmpDate3 ) ? 1 : -1;
      if( matchesIv[1] == '>'  ) return ( tdvDate >  cmpDate3 ) ? 1 : -1;

      },
    title: "date filter:<br />date matching<br />specific dates (2/18, 11/16/1998)<br />conditionals (<=10/30/05)<br />date ranges (2/14-2/21)<br />(2 digit dates cutoff at 50)"
    });

  /* 
  /* 
  ** zebra striping widget
  */
  tf.addWidget({
    id: "zebra",
    format: function( table ){
      $("tr:visible", table.tBodies[0])
        .filter( ":even" )
        .removeClass( table.filterConfig.widgetZebra.css[1] )
        .addClass( table.filterConfig.widgetZebra.css[0] )
        .end()
        .filter( ":odd" )
        .removeClass( table.filterConfig.widgetZebra.css[0] )
        .addClass( table.filterConfig.widgetZebra.css[1] );
      }
    });

  })( jQuery );

Array.prototype.getUniqueValues = function( caseSensitive ){
  var hash = new Object();
  for( var i = 0; i < this.length; i++ ) {
    if( caseSensitive ) {
      hash[this[i]] = true;
      }
    else {
      hash[(this[i]).toLowerCase()] = true;
      }
    }
  var array = new Array();
  for( value in hash ) {
    array.push( value );
    }
  return array;
  };
