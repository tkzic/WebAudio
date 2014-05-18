Web Audio Playground - fork: load/save patches and OSC control
5/17/2014

up to date docs: http://zerokidz.com/ideas/?p=6193

==========
Features:

- Load and Save patches to/from local web storage

- copy/paste patches to/from clipboard using window.prompt box (just use cmd-c or cmd-v)

- Control all module parameters via OSC using web sockets and ruby server script (Max test patch included)

You can try the latest version at http://zerokidz.com/wap
(for best results use Chrome browser Mac OS - although many features of the API are supported
in other browsers and platforms)

demo video: http://www.youtube.com/watch?v=xzrvkpc3TZU

Patches are saved in JSON text format

Documentation is in the mail...

---

How does it work?

If you look at the code, you'll notice its practically identical to the original branch. 

Patches are loaded by firing DOM events - which create the modules, move them to a
location, connect the nodes, and set parameters - not necessarily in the sequence they were
originally created by humans, but in a slightly more economical (robotic) manner.

---

issues: 

- iOS6: The input range sliders don't work in this version or the main version of Web
Audio Playground. After some poking around I found that the sliders get disabled in the pointerevents.js 
code - which consolidates touch/mouse events.

- There are a few quirks when multiple patch cords come out of the same outlet. 
Until this gets resolved - there may be instances where it looks like stuff isn't connected, or 
there are zombie patch cords which don't get cleared.

- When you change your window size, open the console, scroll, or any number of other things - the 
SVG drawing functions can get confused about where they're supposed to be - but the underlying audio
connections are remarkably solid. 

- Live-input: if your browser/computer supports live-input, you'll get a system prompt asking you
to accept it, every single time you create a live-input module or load a patch which has one.



I think that's it for now. Please send me your cool patches.

Acknowledgement: This program was created by Chris Wilson.

---
March 19, 2013
Tom Zicarell
tkzic@megalink.net
http://tomzicarell.com

---

original readme.md from Chris Wilson:

---

This is the source code for the
[Web Audio Playground](http://webaudioplayground.appspot.com/)
application.

## Installation ##

To install the application locally,
[download a copy of the Python App Engine SDK](https://developers.google.com/appengine/downloads)
for your operating system, install it, point it at a check-out of this
repo and view the application on a local port using the latest version of
Google Chrome.

Alternately, you can simply host the directory structure on a local web server, and load index.html.  
(The app cannot be run from file:// as XMLHTTPRequest doesn't work.)