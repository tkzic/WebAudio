// tz.js
// my experiments with webaudio playground



var AUDIO_OUTPUT = -1;	// represents system default audio output device

var testPatch;	// global test patch object for testing patches 

var hasLocalStorage = false;	// flag gets set when localStorage is initialized
var store;						// local storage for patches


// object for patch storage
function Patch () {
	
	this.name = "thing";
	this.description = "does something";
	this.moduleList = [];	// module objects and connections that make up this patch
							// stored in same order as in DOM
							
	// use any passed in args to set args like this:
	// var o = new myObject({moduleType:'oscillator',y:20});
	
	for (var n in arguments[0]) { this[n] = arguments[0][n]; }
	
}


// object to define a Module (like oscillator) its location and connections
// and paramers too
function Module() {

	this.moduleType = "oscillator";	// module type  
	this.x = 0;	// module coordinates
	this.y = 0;		
	this.output = []; //  output connections, use element index
	
	// parameters
	
	this.sliderValues = []; // slider values 
	this.footerMenu = 0;	// index value of first item
	this.footerCheckbox = 0; // unchecked 
	
	// use any passed in args to set args like this:
	// var o = new myObject({moduleType:'oscillator',y:20});
	
	for (var n in arguments[0]) { this[n] = arguments[0][n]; }	
	
}



// setting params
/*

These are the hideous chains of events you need to set the params in the modules. The good
news is that I think they are consistent enough that this will work with everything.

Bad news: this is horrible programming and it will break as soon as the UI is redefined

Ok I set these programmatically and nothing happened to the sounds...
So you got to spoof the event after you set the value

here are some examples

// set value of first slider in first module to 4000

a = document.getElementById("modules"); // modules
b = a.children;		// array of modules
c = b[0];			// first one
d = c.getElementsByTagName("input");	// range sliders
d[0].value = 4000;	// set value of first one to 4000
d[0].oninput({target:d[0]});	// spoof the event, argggggg, passing self (element) as target

// in first module, set value of menu in footer to item at index 2

a = document.getElementById("modules"); // modules
b = a.children;		// array of modules
c = b[0];			// first one
e = c.getElementsByTagName("select"); // menus
e[0].selectedIndex = 2;
e[0].onchange({target:e[0]});	// spoof the event, argggggg, passing self (element) as target

// in third module, check the checkbox in the footer

a = document.getElementById("modules"); // modules
b = a.children;		// array of modules
c = b[2];			// third one
g = c.getElementsByTagName("input");	// checkbox
g[0].checked = true;
g[0].onchange({target:g[0]});	// spoof the event, argggggg, passing self (element) as target


*/


// table which links module types to their constructors

var moduleBuilders = [
{"type": "audiobuffersource", "func" : createAudioBufferSourceFromMenu},
{"type": "oscillator", "func" : createOscillator },
{"type": "live input", "func" : createLiveInput },
{"type": "biquadfilter", "func" : createBiquadFilter },
{"type": "delay", "func" : createDelay },
{"type": "dynamicscompressor", "func" : createDynamicsCompressor },
{"type": "gain", "func" : createGain },
{"type": "convolver", "func" : createConvolver },
{"type": "analyser", "func" : createAnalyser }
// {"type": "oscillator2", "func" : createOscillator2 }

];


// manually define a patch for testing
//
// name: tester
// description: silly test patch
//
// moduleList[] :
//
// 0 : oscillator 50,150 : 1, 2
// 1: gain 300,150: AUDIO_OUTPUT
// 2: delay 296,273: 3
// 3: gain 548,271: AUDIO_OUTPUT
// 
//

function setupTestPatch() {
	
	testPatch = new Patch();
	
	testPatch.name = "delay-thing";
	testPatch.description = "silly test patch";
	
	// define all the modules
	
	testPatch.moduleList[0] = new Module({
		"moduleType" : "oscillator",
		"x" : 50,
		"y" : 150,
		"output" : [1,2],
		"sliderValues" : [740, 0],
		"footerMenu" : 1,
		"footerCheckbox" : 0
	});
	
	testPatch.moduleList[1] = new Module({
		"moduleType" : "gain",
		"x" : 300,
		"y" : 150,
		"output" : [AUDIO_OUTPUT],
		"sliderValues" : [0.5],
		"footerMenu" : 0,
		"footerCheckbox" : 0
	});
	
	testPatch.moduleList[2] = new Module({
		"moduleType" : "delay",
		"x" : 296,
		"y" : 273,
		"output" : [3],
		"sliderValues" : [4.74],
		"footerMenu" : 0,
		"footerCheckbox" : 0
	});
	
	testPatch.moduleList[3] = new Module({
		"moduleType" : "gain",
		"x" : 548,
		"y" : 271,
		"output" : [AUDIO_OUTPUT],
		"sliderValues" : [0.4],
		"footerMenu" : 0,
		"footerCheckbox" : 0
	});
			
}




function initLocalStorage() {
	
	if("localStorage" in window && window["localStorage"] !== null){
		store = window.localStorage;
		}
		
	return true;
}


// save patch in local storage
// with key
function putPatch(key, p) {
	
	var s;
	
	s = JSON.stringify(p);
	store.setItem(key, s);
		
}

// get patch from local storage
// with key
function getPatch(key ) {
	
	var s;
	var o;	// new object
	
	s = store.getItem(key);
	return JSON.parse(s);
	
			
}

// copy current screen into patch object p
// assumes that p has been instantiated
function copyScreenToPatch(p) {
	
	var i, j, n;
	var r;
	var s; // destination string
	var a, b, c, d, e, f, g, h; // DOM element refs
	var k; // index into "modules" in the DOM of the module that matches module id
	
	if(p == undefined) return null;
	
	p.name = "screen";
	p.description = "web audio playground patch";
	
	// clear current module, list just in case
	p.moduleList.length = 0;
	
	
	// loop through the modules in the DOM and create module objects 
	// for the patch's moduleList
		
	a = document.getElementById("modules");
	b = a.children;
	
	// no modules on screen
	if(b.length == 0) return null;
	
	for( i = 0; i < b.length; i++ ) {
		
		p.moduleList[i] = new Module();
		
		p.moduleList[i].moduleType = b[i].getAttribute("audionodetype");
		r = b[i].getBoundingClientRect();
		p.moduleList[i].x = r.left;
		p.moduleList[i].y = r.top;
		
		// now get the output connections for this module
		//
		// note, you can't use the module[n] from id= because the id numbers are asssigned
		// serially and they just keep incrementing as long as the program is running
		//
		// so you need to use the index position of the module in the dom
		//
		
		if(b[i].outputConnections) {
			for (j = 0; j < b[i].outputConnections.length ; j++ ) {
				s = b[i].outputConnections[j].destination.id;  // module[n] id, eg "module6" or "output"	
				if(s == "output") {
					p.moduleList[i].output[j] = AUDIO_OUTPUT;	// special case for speaker output
				}
				else {			
					// find the index in "modules" of this module-id
					k = findIndexOfModuleId(s);
					p.moduleList[i].output[j] = k; //  index of module
				}
			}
		}
	
		c = b[i];	// this module element
		
		// copy in parameters - starting with SliderValues
	
		h = c.getElementsByClassName("content");
		if(h.length) {
			d = h[0].getElementsByTagName("input");	// range sliders
			for( j = 0; j < d.length ; j++) {			// loop through slider elements
				p.moduleList[i].sliderValues[j] = d[j].value;	// get current value
			}
		}
		
		// next get footer
		
		f = c.getElementsByTagName("footer");	// footer
		if(f.length) {
			e = f[0].getElementsByTagName("select"); // menus
			if(e.length) {
				p.moduleList[i].footerMenu = e[0].selectedIndex;
			}
		
			// footerCheckbox
		
			g = f[0].getElementsByTagName("input");	// checkbox
			if(g.length) {
				p.moduleList[i].footerCheckbox = g[0].checked;
			}
		}
		
	}
	
	return p;	
	
}

// return index into "modules" in the DOM of the module that matches this module id
function findIndexOfModuleId(id) {
	
	var i = 0;
	var a, b; // DOM element refs
	
	a = document.getElementById("modules");
	b = a.children;
	
	// this is not great programming but I'm assuming the id gets found every time because
	// its coming from a pointer reference in the dom
	for(i = 0; i < b.length; i++ ) {
		if(id == b[i].id) {
			break;
		}
	}	
	return i;
}


// copy patch object p onto the screen
// assumes that p has been instantiated
// this clears any existing modules on the screen
function copyPatchToScreen(p) {
	
	var a, b, c, d, e, f, g, h; // DOM element refs
	
	var i;	// moduleList index
	var n;	// module constructor index
	var j;	// output connection index
	
	if(p == undefined) return;
		
	// clear screen
	deleteAllModules();
	
	// Note, we could do these three steps: create, move, connect - in one loop but
	// there are timing issues if you do it too fast...
	
	// 1. make all the modules in the patch's moduleList
	for(i = 0; i < p.moduleList.length ; i++) {
		n = getModuleConstructorIndex(p.moduleList[i].moduleType); // lookup constructor in table
		if(n > 0) {							// if found then
			moduleBuilders[n].func();		// put module onto the screen
		}						
	}
	
	
	setTimeout(function() {
		
		// 2. move modules to their spots 
		for(i = 0; i < p.moduleList.length ; i++) {		
			moveModule(i, p.moduleList[i].x, p.moduleList[i].y );		
		}

		// 3. connect all module outputs to their destinations
		for(i = 0; i < p.moduleList.length ; i++) {
			for(j = 0; j < p.moduleList[i].output.length; j++ ) {
				connectModuleOutput(i, p.moduleList[i].output[j]);
			}				
		}
		
		
		// 4. set the parameters  - this should be encapsulated once its working
		a = document.getElementById("modules");
		b = a.children;
		
		for(i = 0; i < p.moduleList.length ; i++) {
			c = b[i];
			// sliderValues
			h = c.getElementsByClassName("content");
			if(h.length) {
				d = h[0].getElementsByTagName("input");	// range sliders
				for(j = 0; j < p.moduleList[i].sliderValues.length; j++ ) {
					if((d) && j < d.length) {
						d[j].value = p.moduleList[i].sliderValues[j];	// set value 
						d[j].oninput({target:d[j]});	// spoof the event, passing self (element) as target
					}
				}
			}
			f = c.getElementsByTagName("footer");
			
			if(f.length) {						// if there is a footer
				e = f[0].getElementsByTagName("select"); // footermenu
				if(e.length) {
					e[0].selectedIndex = p.moduleList[i].footerMenu;	// set menu index 
					// e[0].onchange({target:e[0]});	// spoof the event, passing self (element) as target						}					
				}
			
				g = f[0].getElementsByTagName("input");	// checkbox				
				if(g.length) {
					g[0].checked = p.moduleList[i].footerCheckbox;	// set checkbox value 
					g[0].onchange({target:g[0]});	// spoof the event, passing self (element) as target						}					
				}	
			}				
		}
							
		
	}, 50); 

		
}		

// find constuctor for a given module type
// eg., given oscillator the contstuctor is createOscillator()
function getModuleConstructorIndex(s) {
	
	var ret = -1;
	var i;
	
	for (i = 0; i < moduleBuilders.length ; i++ ) {
		if(s == moduleBuilders[i].type) {
			ret = i;
			break;
		}
	}
	
	return ret;
}

// ok - make test patch - that is, read it from the patch object and put it on the screen

// doing it in steps
// firs step is to create modules
function makePatch1(p) {
	
	var i;
	var n;
	
	// make the modules and drag them to their spots 
	for(i = 0; i < p.moduleList.length ; i++) {
		n = getModuleConstructorIndex(p.moduleList[i].moduleType);
		console.log("n:" + n);
		if(n > 0) {
			moduleBuilders[n].func();
		}
		//moveModule(i, p.moduleList[i].x, p.moduleList[i].y );
		
				
	}
	
}

// move the modules to where they belong on the screen
function makePatch2(p) {
	
	var i;
	var n;
	
	// make the modules and drag them to their spots 
	for(i = 0; i < p.moduleList.length ; i++) {
		
		moveModule(i, p.moduleList[i].x, p.moduleList[i].y );
		
				
	}
	
}
// connect the modules
function makePatch3(p) {
	
	var i;
	var n;
	var j;

	// make the connections
	for(i = 0; i < p.moduleList.length ; i++) {
		for(j = 0; j < p.moduleList[i].output.length; j++ ) {
			connectModuleOutput(i, p.moduleList[i].output[j]);
		}				
	}
	
}


// put it all together
function makeTestPatch() {
	
	// setupPatch();
	
	makePatch1(testPatch);
	makePatch2(testPatch);
	makePatch3(testPatch);
	
}




// first attempt will be to just copy an existing source node type (oscillator) and see if it will
// show up in menus and actually work
// 
function createOscillator2() {
	var osc = createNewModule( "oscillator2", false, true );
	addModuleSlider( osc, "frequency", 440, 0, 8000, 1, "Hz", onUpdateOscillatorFrequency );
	addModuleSlider( osc, "detune", 0, -1200, 1200, 1, "cents", onUpdateDetune );

	var play = document.createElement("img");
	play.src = "img/ico-play.gif";
	play.style.marginTop = "10px";
	play.alt = "play";
	play.onclick = onPlayOscillator;
	osc.appendChild( play );
	
	osc = osc.parentNode;
	osc.className += " has-footer";

	// Add footer element
	var footer = document.createElement("footer");
	var sel = document.createElement("select");
	sel.className = "osc-type";
	var opt = document.createElement("option");
	opt.appendChild( document.createTextNode("sine"));
	sel.appendChild( opt );
	opt = document.createElement("option");
	opt.appendChild( document.createTextNode("square"));
	sel.appendChild( opt );
	opt = document.createElement("option");
	opt.appendChild( document.createTextNode("sawtooth"));
	sel.appendChild( opt );
	opt = document.createElement("option");
	opt.appendChild( document.createTextNode("triangle"));
	sel.appendChild( opt );
	opt = document.createElement("option");
	opt.appendChild( document.createTextNode("wavetable"));
	sel.onchange = switchOscillatorTypes;
	sel.appendChild( opt );
	footer.appendChild( sel );
	osc.appendChild( footer );
	
	// Cache default values on node element
	osc.oscillatorFrequency = 440;
	osc.oscillatorDetune = 0;
	osc.oscillatorType = 0;			// SINE

	if (this.event)
		this.event.preventDefault();
}

// wrapper to make a new event for mouse/pointer event simulation
function makeEvent(eventType) {

  var e = null;

  if (typeof( document.createEvent ) == "function") {
	e = document.createEvent("HTMLEvents");
	e.initEvent(eventType, true, true );
  } else if (document.createEventObject) {
    e = document.createEventObject();
    e.eventType = eventType;
  }

  return e;

}

// wrapper for dispatch/fire event
function callEvent (element, e ) {
	
  if (document.createEvent) {
    element.dispatchEvent(e);
  } else if (element.fireEvent) {
    element.fireEvent("on" + e.eventType, e);
  }

  return e;

}


//
// simulate oscillator patch (basic)
//
// note: only call this with a blank canvas
// this is just a test to try the concept
//
function simPatch1() {
	
	// make an oscillator
	createOscillator();
	
	// pointer down on output
	var a = document.getElementById("modules");
	var b = a.children[0].outputs;
	var evt1 = document.createEvent("HTMLEvents");
	evt1.initEvent("pointerdown", true, true );
	b.dispatchEvent(evt1);

	// pointer move to destination (speaker) 
	var c = document.getElementById("output");
	var d = c.getElementsByClassName("node-input");
	var evt2 = document.createEvent("HTMLEvents");
	evt2.initEvent("pointermove", true, true );
	evt2.clientX = 1070;
	evt2.clientY = 205;
	evt2.toElement = d[0];
	d[0].dispatchEvent(evt2);

	// pointer up at destination (speaker)
	var evt3 = document.createEvent("HTMLEvents");
	evt3.initEvent("pointerup", true, true );
	evt3.toElement = d[0];
	d[0].dispatchEvent(evt3);
		
}

function simPatch2() {
	
	// make an oscillator
	createOscillator();
	
	// pointer down on output-node
	var a = document.getElementById("modules");
	var b = a.children[0].outputs;
	
	var r1 = b.getBoundingClientRect();
	var x1 = r1.left + (r1.width/2);
	var y1 = r1.top + (r1.height/2);
	
	var evt1 = makeEvent("pointerdown");
	evt1.clientX = x1;
	evt1.clientY = y1;
		
	callEvent( b, evt1);

	// pointer move to destination node (speaker) 
	var c = document.getElementById("output");
	var d = c.getElementsByClassName("node-input");

	var r2 = d[0].getBoundingClientRect();	
	var x2 = r2.left + (r2.width/2);
	var y2 = r2.top + (r2.height/2);

	var evt2 = makeEvent("pointermove");

	evt2.clientX = x2;
	evt2.clientY = y2;
	evt2.toElement = d[0];
	
	callEvent( d[0], evt2);


	// pointer up at destination (speaker)
	var evt3 = makeEvent("pointerup");
	evt3.toElement = d[0];
	callEvent( d[0], evt3);
	
}



// this gets called with a delay after module is created 
function simConnect1() {
		
	// for some reason... the patch cord doesn't originate properly when you create the oscillator
	// here. it needs a delay 
	
	// pointer down on output-node
	var a = document.getElementById("modules");
	var b = a.children[0].outputs;
	
/*	var r1 = b.getBoundingClientRect();
	var x1 = r1.left + (r1.width/2);
	var y1 = r1.top + (r1.height/2);
*/	
	var evt1 = makeEvent("pointerdown");

/*
	evt1.clientX = x1;
	evt1.clientY = y1;
*/		
	callEvent( b, evt1);

	// pointer move to destination node (speaker) 
	var c = document.getElementById("output");
	var d = c.getElementsByClassName("node-input");

	var r2 = d[0].getBoundingClientRect();	
	var x2 = r2.left + (r2.width/2);
	var y2 = r2.top + (r2.height/2);

	var evt2 = makeEvent("pointermove");

	evt2.clientX = x2;
	evt2.clientY = y2;
	evt2.toElement = d[0];
	
	callEvent( d[0], evt2);


	// pointer up at destination (speaker)
	var evt3 = makeEvent("pointerup");
	evt3.toElement = d[0];
	callEvent( d[0], evt3);
	
}
// needed for following functions
function Create2DArray(rows) {
  var arr = [];

  for (var i=0;i<rows;i++) {
     arr[i] = [];
  }

  return arr;
}

// reconnect all outputs for live input module
// needs to be done after user ok's system media device query
//
// Note there's a bunch of unecessaryt sorcery going on here, but as long as we have to deal
// with these crazy system interrrupts I don't see any way around it 
function reconnectLiveInput() {
	
	var i, j, k;	// counters
	var s;	// string pointer
	
	var connections = Create2DArray(100); // temp place to store output connections before we delete them
	
	var a = document.getElementById("modules");
	var b = a.children;
	
	for (i = 0; i < b.length; i++ ) {
		if(b[i].getAttribute("audionodetype") == "live input") {
			// first find existing output connections and save them
			if(b[i].outputConnections) {
				for (j = 0; j < b[i].outputConnections.length ; j++ ) {
					s = b[i].outputConnections[j].destination.id;  // module[n] id, eg "module6" or "output"	
					if(s == "output") {
						connections[i][j] = AUDIO_OUTPUT;  // special case for speaker output
					}
					else {			
						// find the index in "modules" of this module-id
						k = findIndexOfModuleId(s);
						connections[i][j] = k; //  index of module
					}
				}
			}				
			
		}
	}	

// now delete the connections - it has to be done like this because when you disconnect
// it happens in reverse order at the node level

	for (i = 0; i < b.length; i++ ) {
		if(b[i].getAttribute("audionodetype") == "live input") {
			// look for output connections
			if(b[i].outputConnections) {
				disconnectModuleOutputs(i); // first delete exsiting connections
			}
		}
	}

// now add back the connections

	for (i = 0; i < b.length; i++ ) {
		if(b[i].getAttribute("audionodetype") == "live input") {
			// 
			for(j = 0; j < connections[i].length; j++) {
				connectModuleOutput(i, connections[i][j]);
			}
		}	
	}		
			

	
}



// this disconnects all output lines (patch cords) from a module 
function disconnectModuleOutputs(sourceIndex) {
		
	// sourceIndex is index of module in dom id="modules"
	
	// this works by clicking on patch cords to delete them
	
	var evt;
	var c, len, i;

	var a = document.getElementById("modules");
	var b = a.children[sourceIndex]
		
	if(!b.outputs) return;
	
	len = b.outputConnections.length;  // get original length
	
	for (i = (len-1); i >= 0 ; i-- )  {	// have to run loop backwards or it crashes
										// see: deleteConnection() handler
		c = b.outputConnections[i].line;	
		evt = makeEvent("click");
		callEvent( c, evt );

	}
}


/////////////////////////////////////////////
// this is working version for patch connect
function connectModuleOutput(source, dest) {
		
	// source and dest are indexes of modules
	
	// pointer down event -  on output-node
	var a = document.getElementById("modules");
	var b = a.children[source].outputs;
	
/*	var r1 = b.getBoundingClientRect();
	var x1 = r1.left + (r1.width/2);
	var y1 = r1.top + (r1.height/2);
*/	
	var evt1 = makeEvent("pointerdown");

/*
	evt1.clientX = x1;
	evt1.clientY = y1;
*/		
	callEvent( b, evt1);

	// special case if destination == AUDIO_OUTPUT
	// then use speaker
	// pointer move event - to destination node 
	if(dest == AUDIO_OUTPUT) {
		var c = document.getElementById("output");
		var d = c.getElementsByClassName("node-input");
		var e = d[0];	
	}
	else {
		var c = document.getElementById("modules");
		var e = c.children[dest].inputs;			
	}
	
	var r2 = e.getBoundingClientRect();
	var x2 = r2.left + (r2.width/2);
	var y2 = r2.top + (r2.height/2);

	var evt2 = makeEvent("pointermove");

	evt2.clientX = x2;
	evt2.clientY = y2;
	evt2.toElement = e;
	
	callEvent( e, evt2);


	// pointer up event - at destination 
	var evt3 = makeEvent("pointerup");
	evt3.toElement = e;
	callEvent( e, evt3);
	
}



// ok, this patch works - there's a slight delay between creating the module and making the connections
function simPatch4() {
	
	// make an oscillator
	createOscillator();
	
	// make the connections
	setTimeout(simConnect1, 50);
	

}

// move module[i] to new x,y  
function moveModule(i, newX, newY) {
			
	// pointer down on module left part of header is safe for dragging
	var a = document.getElementById("modules");
	var b = a.children[i];
	
	var r1 = b.getBoundingClientRect();
	//var x1 = r1.left + (r1.width/2);
	//var y1 = r1.top + (r1.height/2);
	var x1 = r1.left;
	var y1 = r1.top;
	
	
	
	var evt1 = makeEvent("pointerdown");


	evt1.clientX = x1;
	evt1.clientY = y1;
		
	callEvent( b, evt1);

	// pointer move to new location 
	// var c = document.getElementById("output");
	// var d = c.getElementsByClassName("node-input");

	//var r2 = d[0].getBoundingClientRect();	
	//var x2 = r2.left + (r2.width/2);
	//var y2 = r2.top + (r2.height/2);

	var evt2 = makeEvent("pointermove");

	evt2.clientX = newX;
	evt2.clientY = newY;
	// evt2.toElement = d[0];
	
	callEvent( b, evt2);


	// pointer up at destination (speaker)
	var evt3 = makeEvent("pointerup");
	// evt3.toElement = d[0];
	callEvent( b, evt3);
	
}


// delete a given module number from the screen
function deleteModuleByIndex(n) {
		
	var a;
	var moduleElement;
	
	a = document.getElementById("modules");
	moduleElement = a.children[n];

	// First disconnect the audio
	disconnectNode( moduleElement );
	// Then delete the visual element
	moduleElement.parentNode.removeChild( moduleElement );
}

// clear the screen 
function deleteAllModules() {
	
	var len;
	var a;
	var moduleElements;
	
	a = document.getElementById("modules");
	moduleElements = a.children;	
	len = moduleElements.length;

	while(len) {
		deleteModuleByIndex(0);
		a = document.getElementById("modules");
		moduleElements = a.children;	
		len = moduleElements.length;
	}
	
}

function savePatchAs() {
	
	var el, s;
	var a, b;
	var p; 	// new patch
	
	el = document.getElementById("patchNameText");
	s = el.value;
	var p;
	
	if(s == "") {
		console.log("error: blank patch name field");
		return false;
	}
	
	s = s.toLowerCase();
	console.log("patch name will be: " + s);
	
	// check for blank screen
	
	var a = document.getElementById("modules");
	var b = a.children;
	if (b.length == 0) {
		console.log("error: no patch to save");
		return false;
	}
	
	
	// make a patch object
	p = new Patch();
	copyScreenToPatch(p);
	p.name = s;
	putPatch(s, p);		// store it
	
	// see if this patch is in list of saved patches
	
	var found = false;
	for( var i = 0; i < storedPatches.length; i++ ) {
		if(s == storedPatches[i]) {
			found = true;
		}
	}
	
	if(!found)	// add this patch name to list of stored patches and save the list
		{
		storedPatches.push(s);
		var ss = JSON.stringify(storedPatches);
		store.setItem('storedPatches', ss);
		}
	
	// update the load menu
	
	refreshPatchMenu();
		
	return false;
}

var storedPatches = [];

// called by main init function
function patcher_init() {
	
	var ps;	// string for list of stored patches
	var p;	// patch pointer
	var s;	// general string var
	var i;	// counter
	
	/*
	// tz click handlers for crazy anchor menus
	setClickHandler( "cosc2", createOscillator2 );
	setClickHandler( "pepsi", loadPatch );
	setClickHandler( "coke", loadPatch );
	setClickHandler( "dew", loadPatch );
	setClickHandler( "doctorp", loadPatch );
	setClickHandler( "7up", loadPatch );
	setClickHandler( "crush", loadPatch );
	*/

	initLocalStorage();
	
	// get list of patches from the store
	
	ps = store.getItem('storedPatches');
	if(ps == null) {
		setupTestPatch();
		testPatch.name = "delay-thing";
		storedPatches.push(testPatch.name);
		s = JSON.stringify(storedPatches);
		store.setItem('storedPatches', s);
		putPatch(testPatch.name, testPatch );
	}
	else {		
		storedPatches = JSON.parse(ps);
	}
	
	// here's where we add the storedPatches to the menu
	console.log("stored patches: " + storedPatches);

	refreshPatchMenu();
	

}

// refresh dom menu of patches to load based on contents of storedPatches []
// gets called on program load or after saving a patch
function refreshPatchMenu() {
	
	var s; // general string pointer
	
	// remove existing menu items from dom
	
	var menu; // load patches menu element in dom
	
	menu = document.getElementById("patches");
	while (menu.firstChild) {
	    menu.removeChild(menu.firstChild);
	}

	// create new menu items based on list of stored patches
	
	var li, a; // html tag elements
	
	for(var i = 0; i < storedPatches.length; i++ ) {
		s = storedPatches[i];		// name of patch
		li = document.createElement("li");
		a = document.createElement("a");
		a.href = "#";
		a.id = s;
		a.innerHTML = s;
		li.appendChild(a);
		menu.appendChild(li);
		setClickHandler(s, loadPatch);
	}	
	
}

function loadPatch(e) {
	
	var ps;
	var s;
	var p;
	
	s = e.target.id;
	
	console.log("will try to load patch called: " + s);
	
	// try to load the patch
	
	ps = store.getItem(s);
	if(ps == null) {
		console.log("no patch named:" + s);
	}
	else {
		p = JSON.parse(ps);
		copyPatchToScreen(p);		
	}
	
	
	if (this.event)
		this.event.preventDefault();
	
}
// copy current patch to the clipboard
function copyScreenToClipboard() {
	
	
	var s;
	var p;
	
	p = new Patch();
	p = copyScreenToPatch(p);
	if(p == null) return;
	
	s = JSON.stringify(p);
	
	copyToClipboard(s);
	
}

// paste clipboard to current patch on screen
function pasteClipboardToScreen() {
	
	var s;
	var p;
	
	s = PasteFromClipboard ();
	if (s == null) return;
	
	p = JSON.parse(s);
	copyPatchToScreen(p);

	
}

function copyToClipboard (text) {
  window.prompt ("Copy to clipboard: Cmd/Ctl+C, Enter", text);
}

function PasteFromClipboard () {
	
  	var s;
  	s = prompt ("Paste from clipboard: Cmd/Ctl+V, Enter", "");
	return s;

}


