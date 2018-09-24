var DBG = 0;
console.log( "js start" );  
if (DBG) { alert( "js start" ); }

window.onerror = function(error) {
    alert(error);
};

///////////////////////////////////////////////////////////////////////////////
// Use the random number generator that is (hopefully) of crypographic
// quality.

function randByteInRange( min, max ) {
    // pick a smallish number between min and max, inclusive.
    // PRE: 0 <= min <= max < 255.
    var randValArray = new Uint8Array(1);
    var result = max+1;
    // to not bias the uniformity of the distribution, keep sampling
    // till we get one that's in range:
    while (result < min || result > max) {
	window.crypto.getRandomValues( randValArray );
	result = randValArray[0];
    }
    // console.log( result );
    return result;
}

function chooseElt( ary ) {
    // randomly choose one element from ary (an array or string)
    var i = randByteInRange( 0, ary.length-1 );
    return ary[i];
}

///////////////////////////////////////////////////////////////////////////////

var Nrows = 7;
var Ncols = 4;

var Nchars = 4;

function genBase32() {
    // generate a string of length Nchars composed of randomly
    // chosen characters from among 32 options.
    // base32 strings -- rfc4648 base32 is [A..Z2..7].  With 32 options, each 
    // pair of characters is 10 bits.
    var Charset = "abcdefghijklmnopqrstuvwxyz234567";    // lower case for typing!
    var chars = "";
    for (var i = 0; i < Nchars; ++i) {
	chars += chooseElt( Charset );
    }
    return chars;
}

function genBase32strings( nstrings ) {
    // Returns Nstrings of them
    var strings = [ ];
    for (var i = 0; i < nstrings; ++i) {
	strings.push( [ genBase32(), 20 ] );    // [string,bitcount]
    }
    return strings;
}

function genPrefixedBase32strings( nstrings ) {
    var UppercaseLetters = "ABCDEFGHJKLMNPQRSTUVWXY";
    var strings = [ ];
    for (var i = 0; i < nstrings; ++i) {
	var string = chooseElt(UppercaseLetters) + genBase32();
	strings.push( [ string, 24 ] );    // [string,bitcount].  actually 24.52
    }
    return strings;
}

function randomSep() {		      
    return chooseElt( "-.,:" );
}		      

///////////////////////////////////////////////////////////////////////////////


function getRoll() {
    var digits = '';
    for (var i = 0; i < 5; ++i) {    // 5 dice
	digits += randByteInRange(1,6).toString();
    }
    return digits;
}
function genDiceware( nwords ) {
    words = [];
    for (var roll = 0; roll < nwords; ++roll) {
	words.push( [ DicewareWordlist[ getRoll() ], 13 ] );    // [word,bitcount]. actually 12.92
    }
    return words;
}

///////////////////////////////////////////////////////////////////////////////

var itemsChosen = [ ];
var bitcountRollup = 0;
var randomlyChosenSep = randomSep();

function populateButtons() {
    var Nitems = Nrows * Ncols;    // note that this needs to be even
    var strings = genPrefixedBase32strings( Nitems / 2 );
    var words = genDiceware( Nitems / 2 );
    var items = strings.concat(words);
    for (var r = 0 ; r < Nrows; ++r) {
	for (var c = 0 ; c < Ncols; ++c) {
	    var buttonID = 'b' + r.toString() + c.toString();
	    var itemAndBitcount = items.pop();
	    document.getElementById( buttonID ).innerHTML = itemAndBitcount[0];
	    document.getElementById( buttonID ).bitcount = itemAndBitcount[1];
	} 
    }  
}

function indicatorForNumbits( nbits ) {
    var RedMark = '<span style="color:red;font-size:large;">&#10060;</span>'; 
    var GreenMark = '<span style="background-color:green;color:white;font-size:large;">&#10004;</span>';
    var NoMark = '<span style="font-size:large;">&nbsp;</span>';  
    if (nbits >= 90) {
	return GreenMark + GreenMark + GreenMark;
    } else if (nbits >= 80) {
	return GreenMark + GreenMark + RedMark;
    } else if (nbits >= 65) {
	return GreenMark + RedMark + RedMark;
    } else if (nbits == 0) {
	return NoMark + NoMark + NoMark;
    } else {
	return RedMark + RedMark + RedMark;
    }
}			    

function clearPasswordAndNumbits() {
    itemsChosen = [];
    bitcountRollup = 0;
    randomlyChosenSep = randomSep();
    document.getElementById('outputText').style.fontSize = "x-large";
    document.getElementById('outputText').value = "Make a Password";
    document.getElementById( "numBits" ).value = "0";
    document.getElementById( "indicators" ).innerHTML = indicatorForNumbits(0);
}

function getSep() {
    var seps = document.getElementById('sep');
    var chosenSep = seps.options[seps.selectedIndex].value;
    return ( (chosenSep != '*') ? chosenSep : randomlyChosenSep );    // '*' means no choice made
}

String.prototype.upcaseFirstLetter = function() {
    for (var i = 0; i <= this.length; ++i) {
	if ( this.charAt(i).match(/[a-z]/i) ) {
	    return this.slice(0,i) + this.charAt(i).toUpperCase() + this.slice(i+1);
	}
    }
    return this;  //if no letters at all		       
}

function bsel( buttonID ) {
    var newItem = document.getElementById(buttonID).innerHTML;
    if ( !itemsChosen.includes(newItem) ) {
	itemsChosen.push( newItem );
    }
    bitcountRollup += document.getElementById(buttonID).bitcount;
    //document.getElementById('outputText').value = itemsChosen.join( getSep() ).upcaseFirstLetter();
    document.getElementById('outputText').style.fontSize = "large";
    document.getElementById('outputText').value = itemsChosen.join( getSep() );
    document.getElementById( "numBits" ).value = bitcountRollup.toString();
    document.getElementById( "indicators" ).innerHTML = indicatorForNumbits(bitcountRollup);
}

function enableCopyToClipboard() {
    document.querySelector("#copyTo").onclick = function() {
	document.querySelector("#outputText").select();
	document.execCommand('copy');
    };
}

function precheck() {
    console.log( "begin precheck" );
    var randValArray = new Uint8Array(1);
    try {
	window.crypto.getRandomValues( randValArray );
    } catch(err) {
	alert( "no window.crypto.getRandomValues(): " + err.message );
    }
    if (!randValArray[0]) {
      window.crypto.getRandomValues( randValArray );  // is it consistent?
      if (!randValArray[0]) {			 
        alert( "window.crypto.getRandomValues() returned unexpected value: " + randValArray[0] );
      }
    }
    if (DBG) { alert( "precheck passed " + randValArray[0] ); }
    console.log( "precheck passed " + randValArray[0] );
}

function bodyLoaded() {
    //generateInTextBox();
    precheck();
    populateButtons();
    document.getElementById('outputText').value = "Make a Password";
    document.getElementById( "indicators" ).innerHTML = indicatorForNumbits(0);
    document.getElementById( "re90" ).innerHTML = indicatorForNumbits(90);
    document.getElementById( "re80" ).innerHTML = indicatorForNumbits(80);
    document.getElementById( "re65" ).innerHTML = indicatorForNumbits(65);
    document.getElementById( "re00" ).innerHTML = indicatorForNumbits(0);
    //enableCopyToClipboard();
    console.log( "bodyLoaded() DONE" );
}

function dbg() {
}


console.log( "js end" );
if (DBG) { alert( "js end" ); }

