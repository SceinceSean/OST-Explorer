var tracks;  // tracks.json
var episodes;  // episodes.json

var ce = 0;  // Index of the current episode being analysed.
var ct = -1;  // ID of the current track being analysed.
var cti = -1;  // Index of the current usage of the track being analysed.

var mousex = 0;
var mousey = 0;

var embedsOn = false;

var mainMargin = 80;  // uhh...

var mousedown = false;

// Track colors
const tc = ['#B981C8', '#92C881', '#C88181', '#C8819D', '#A281C8', '#C88181', '#81C8A5', '#81C883', '#818DC8', '#C281C8', '#C88181', '#81C8B4', '#C88181', '#C781C8', '#C88181', '#9081C8', '#95C881', '#C88181', '#81C8B3', '#81C883']


document.addEventListener('mousemove', e => {
	mousex = e.clientX;
	mousey = e.clientY;
});

document.addEventListener('mousedown', e => {
	mousedown = true;
});

// This is the onLoad function.
function setup() {
	// Load the JSON data.
	loadJSON('data/tracks.json', function(response){tracks=JSON.parse(response);});
	loadJSON('data/episodes.json', function(response){episodes=JSON.parse(response);});

	createBar();
}

// Run the code that should run every frame every frame.
window.setInterval(function(){
  step();
}, 41);

function step() {
	var overAny = false;
	for (var i = 0; i < episodes[ce].tracks.length; i++) {
		episodes[ce].tracks[i]
		if (onElement(mousex, mousey, document.getElementById('track'+i))) {
			overAny = true;
			// Rollover text.
			var tnpc = document.getElementById('track-name-preview-container');
			if (tnpc.children.length == 0 || (tnpc.children.length > 0 && tnpc.firstChild.innerText != tracks[episodes[ce].tracks[i].trackid].title)) {
				if (tnpc.children.length > 0) {
					while (tnpc.children.length > 0) tnpc.removeChild(tnpc.firstChild);
				}
				var rt = document.createElement('p');
				var rtn = document.createTextNode(tracks[episodes[ce].tracks[i].trackid].title); // Rollover Text Text Node
				rt.appendChild(rtn);
				tnpc.appendChild(rt);
			}

			// Add embeds if needed.
			if (mousedown && cti!=i) {
				// Delete any old embeds.
				if (embedsOn) {
					document.getElementById('upper-embed').remove();
					document.getElementById('lower-embed').remove();
				}

				embedsOn = true;  // Doing this first so that if any of the code later on crashes then we won't get that same error every frame from it trying to do it over and over again.
				cti = i;
				ct = episodes[ce].tracks[i].trackid;

				// Create the embed and add attributes.
				var upperEmbed = createYTEmbedQuick(episodes[ce].videoid, constrainLow(episodes[ce].tracks[cti].start, 1));
				upperEmbed.setAttribute('style', 'position: absolute; top: 0px;')
				upperEmbed.setAttribute('id', 'upper-embed');
				document.getElementById('video-container-upper-inner').appendChild(upperEmbed);

				var lowerEmbed = null;
				switch (tracks[ct].embedtype) {
					case 'youtube':
						lowerEmbed = createYTEmbedQuick(tracks[ct].embed, 0);
						lowerEmbed.setAttribute('style', 'position: absolute; bottom: 0;');
						break;
					case 'soundcloud':
						lowerEmbed = createSCEmbedQuick(tracks[ct].embed);
						lowerEmbed.setAttribute('style', 'position: absolute;top: 50%;-ms-transform: translateY(-50%);transform: translateY(-50%);');
						break;
					case 'audio':
						lowerEmbed = createAudioTagQuick(tracks[ct].embed);
						lowerEmbed.setAttribute('style', 'position: absolute;top: 50%;-ms-transform: translateY(-50%);transform: translateY(-50%);left: 50%;-ms-transform: translateX(-50%);transform: translateX(-50%);');

				}

				if (lowerEmbed !== null) {
					lowerEmbed.setAttribute('id', 'lower-embed');
					document.getElementById('video-container-lower-inner').appendChild(lowerEmbed);  // If we didn't add anything to lowerEmbed, don't try to add it to the DOM.
				}

				// Additionally, we'll need to change the text that says the track name here too.
				document.getElementById('track-title').firstChild.remove();
				document.getElementById('track-title').appendChild(document.createTextNode(tracks[ct].title));
				document.getElementById('filename').firstChild.remove();
				document.getElementById('filename').appendChild(document.createTextNode(tracks[ct].filename));
			}
		}
	}
	if (!overAny) {
		// If we're not hovering over anything, we shouldn't show the hover text.
		var tnpc = document.getElementById('track-name-preview-container');
		while (tnpc.children.length > 0) tnpc.removeChild(tnpc.firstChild);
	}

	// The videos should move to the same X as the mouse.
	var upperVideo = document.getElementById('video-container-upper-inner');
	var lowerVideo = document.getElementById('video-container-lower-inner');
	upperVideo.setAttribute('style', `left: ${constrain((mousex-(upperVideo.getBoundingClientRect().width/2))-mainMargin, 0, window.innerWidth-(mainMargin*2)-upperVideo.getBoundingClientRect().width)}px;`);
	lowerVideo.setAttribute('style', `left: ${constrain((mousex-(lowerVideo.getBoundingClientRect().width/2))-mainMargin, 0, window.innerWidth-(mainMargin*2)-lowerVideo.getBoundingClientRect().width)}px;`);

	// mousedown should only be true on the frame when the mouse first is pressed.
	mousedown = false;
}

function onElement(ux, uy, element) {
	return onRect(ux, uy, element.getBoundingClientRect().x, element.getBoundingClientRect().y, element.getBoundingClientRect().width, element.getBoundingClientRect().height)
}

// Returns a boolean value for if ux and uy are on the rectangle at x and y with width w and height h. (the "u" in ux and uy just means user x position and user y position)
function onRect(ux, uy, x, y, w, h) {
	return ux>=x&&ux<=x+w&&uy>=y&&uy<=y+h;
}

// Constrains a value to a specified range.
function constrain(value, min, max) {
	return (value<min)?min:((value>max)?max:value)  // The parentheses are just there for readabillity.
}
// constrain(), but without a maximum
function constrainLow(value, min) {
	return (value<min)?min:value  // The parentheses are just there for readabillity.
}

function nextEp() {
	if (ce < episodes.length-1) ce++;
	createBar();
}

function prevEp() {
	if (ce > 0) ce--;
	createBar();
}

// Deletes the old bar and creates a new one.
function createBar() {
	var ep = document.getElementById('episode-bar');
	// Deletion
	while (ep.children.length > 0) ep.removeChild(ep.firstChild);
	// Creation
	for (var i = 0; i < episodes[ce].tracks.length; i++) {
		episodes[ce].tracks[i];
		var track = document.createElement('div');
		var duration = ((episodes[ce].tracks[i].end-episodes[ce].tracks[i].start)/episodes[ce].len)*100
		var startajusted = (episodes[ce].tracks[i].start/episodes[ce].len)*100
		track.setAttribute('style', `position:absolute;float:left;left:${startajusted}%;width:${duration}%;height:100%;background-color:${tc[episodes[ce].tracks[i].trackid%tc.length]};`);
		track.setAttribute('id', 'track'+i)
		ep.appendChild(track);
	}
}

// Creates and returns a YouTube embed.
function createYTEmbedQuick(id, start) {
	var embed = document.createElement('iframe');
	embed.setAttribute('width', '480');
	embed.setAttribute('height', '270');
	embed.setAttribute('src', `https://www.youtube.com/embed/${id}?start=${start}`);
	embed.setAttribute('frameborder', '0');
	embed.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope;');
	return embed;
}

// Creates and returns a SoundCloud embed.
function createSCEmbedQuick(id) {
	var embed = document.createElement('iframe');
	embed.setAttribute('width', '100%');
	embed.setAttribute('height', '186');
	embed.setAttribute('scrolling', 'no');
	embed.setAttribute('frameborder', 'no');
	embed.setAttribute('allow', 'autoplay');
	embed.setAttribute('src', `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${id}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=true`);
	return embed;

}


// Creates and returns an audio element.
function createAudioTagQuick(link) {
	var audio = document.createElement('audio');
	audio.setAttribute('controls', '');
	var source = document.createElement('source');
	source.setAttribute('src', link);
	source.setAttribute('type', 'audio/'+link.slice(-3));  // Could use a regex for this, but I don't feel like it. I might refactor it to use a regex some time.
	audio.appendChild(source);
	audio.appendChild(document.createTextNode('Your browser does not support the audio tag. Also, why are you using Internet Explorer?'));
	return audio;

}

// https://www.geekstrick.com/load-json-file-locally-using-pure-javascript
function loadJSON(filename, callback) {   
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', filename, false);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {
			// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
			callback(xobj.responseText);
		}
	};
	xobj.send(null);  
}