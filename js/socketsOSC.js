// socketsOSC.js 
// 
// sort of an Osc parser for Web Audio Playground
//
// the Osc messages are just text strings by the time they get to here
//
// the sockets part is a web-sockets thing that recieves the text Osc messages from a 
// ruby server - which understands real OSC from devices and such
//
// first we need to set up a table to do range translation for the various 
// modules, so that the OSC number ranges coming in are all 0.0-1.0 - this allows for 
// generic configurations that work with various types of modules
//

// map x->y given ranges: xmin, xmax, ymin, ymax
// y = ((x - xmin) * (ymax - ymin) / (xmax - xmin)) + ymin
//
function linearMap(x, xMin, xMax, yMin, yMax ) {
	
	return ((x - xMin) * (yMax - yMin) / (xMax - xMin)) + yMin;
	
}

// slider, menu, toggle range object 
function ControlDescription() {
	
	this.name = "";
	this.controlType = "";
	this.min = 0;
	this.max = 0;
	this.default = 0;
	this.unitDescription = "";		// like hz, inches, miles, etc.,
	
	for (var n in arguments[0]) { this[n] = arguments[0][n]; }
	
}
// module description object
function ModuleDescription() {
	
	this.moduleType = "";
	
	// 
	this.slider = [];
	this.toggle = [];
	this.menu = [];
	this.checkbox = [];
	
	this.inputs = 0;
	this.outputs = 0;
	
	this.constructor = null;
	
	for (var n in arguments[0]) { this[n] = arguments[0][n]; }
}

moduleDescriptionList = [];	// place where all the module types are defined

function setupModuleDescriptionList() {
		
	// descibe the modules
	
	moduleDescriptionList[0] = new ModuleDescription({
		"moduleType" : "oscillator",
		"slider" : [new ControlDescription({
			"name" : "frequency",
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 8000.0,
			"default" : 440.0,
			"unitDescription" : "hz"
			}),
			new ControlDescription({
			"name" : "detune", 	
			"controlType" : "slider",
			"min" : -1200.0,
			"max" : 1200.0,
			"default" : 0.0,
			"unitDescription" : "cents"
			}),
			],
		"toggle" : [new ControlDescription({
			"name" : "play", 	
			"controlType" : "toggle",
			"min" : 0,
			"max" : 1,
			"default" : 0,
			"unitDescription" : ""
			})],
		"menu" : [new ControlDescription({
			"name" : "wave", 	
			"controlType" : "menu",
			"min" : 0,
			"max" : 4,
			"default" : 0,
			"unitDescription" : ""
			})],
		"checkbox" : [],
		"constructor" : createOscillator
	});

	moduleDescriptionList[1] = new ModuleDescription({
		"moduleType" : "gain",
		"slider" : [new ControlDescription({
			"name" : "gain",
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 10.0,
			"default" : 1.0,
			"unitDescription" : ""
			})
			],
		"toggle" : [],
		"menu" : [],
		"checkbox" : [],
		"constructor" : createGain
	});


}

// var ip = '69.49.153.74';
// var ip = '192.168.1.104';
var ip = 'localhost';
var port = '1234';


// attempt a local socket connection
function connectOSC() {
	
		try {
		var socket = new WebSocket("ws://" + ip + ":" + port); 


			console.log('<p class="event">Socket Status: '+socket.readyState);  

	        socket.onopen = function(){  
	             console.log('<p class="event">Socket Status: '+socket.readyState+' (open)');  
	        }  

	        socket.onmessage = function(msg){  
	            console.log('<p class="message">Received: '+msg.data);
				parseOSCMessage(msg.data);
	        }  

	        socket.onclose = function(){  
	             console.debug('<p class="event">Socket Status: '+socket.readyState+' (Closed)');  
	        }             

	    } catch(exception){  
	         console.log('<p>Error'+exception);  
	    }

	 // socket.send("hsdfhjkjshd");	
	
}


// var token, cmd;

function parseOSCMessage(msg) {

	var token;
	var cmd;
	var mod;
	var a, b, c, d, e, f, g, h; // element refs
	var modNdx;	// module index
	
	if((msg == null) || (msg == "")) {
		return;
	}
	
	token = msg.split(" ");	// split into tokens: command + data, data...
	
	cmd = token[0].split("/");  // split out command: mod + ndx + controlType + ndx 
	
	// the first token is blank in cmd
	
	// for this test, there's only one command: "mod" (for module)
	// if it works, we'll set up a table and a state parser
	
	if(cmd[1] != "mod") {
		return;
	}
	
	// now get module index in DOM
	
	if( isNaN(cmd[2]) ) {
		return;
	}
	
	modNdx = parseInt(cmd[2]);
	a = document.getElementById("modules");
	b = a.children;
	
	if( modNdx > (b.length - 1) ) {
		return;
	}
	
	// now get moduleType and index to moduleDescriptionList
	
	var moduleType = b[modNdx].getAttribute("audionodetype");
	var i;
	var modDescNdx = -1;
	for (i = 0; i < moduleDescriptionList.length; i++ ) {
		if(moduleDescriptionList[i].moduleType == moduleType) {
			modDescNdx = i;
			break;
		}
	}
	
	if(modDescNdx < 0) {
		console.log("OSC error: no module description for: " + moduleType);
		return;
	}
	
	// now set params:
	// there's a js way to do this, but I'll think of it later

	var controlVal;
	var controlNdx;
	var dataVal;
	var md;		// pointer to module description list entry
	
	md = moduleDescriptionList[modDescNdx];
	
	// get data value and control index - probably should do more checking on these tokens
	dataVal = parseFloat(token[1]);
	controlNdx = parseInt(cmd[4]);
	
	if(cmd[3] == "slider") {
		// translate range from 0->1 to actual
		controlVal = linearMap( token[1], 0.0, 1.0, md.slider[controlNdx].min, md.slider[controlNdx].max );
		console.log("slider control value will be: " + controlVal );
		// now set the value 
		c = b[modNdx];		// ref to module element in DOM
		// sliderValues
		h = c.getElementsByClassName("content");
		if(h.length) {
			d = h[0].getElementsByTagName("input");	// range sliders
			if((d) && controlNdx < d.length) {		// should put out error message 
				d[controlNdx].value = controlVal;	// set value 
				d[controlNdx].oninput({target:d[controlNdx]});	// spoof event, passing self (element) as target
			}
		}
	}
	
	/*	
	 	var f = 1000.0 * parseFloat(s[1]);
		var i = Math.round(f);
		console.log("freqChange:" + i);
		sample.changeFrequency(i);
		}
*/


}













































