const localStorageToken = "SWTOR[IE]Notes";

var inputText = document.getElementById("inputText");
var outputText = document.getElementById("outputText");

var btnPanelBack = document.getElementById("btnPanelBack");
var btnPanelForward = document.getElementById("btnPanelForward");
var btnCopyOutput = document.getElementById("btnCopyOutput");

var outputTracker = document.getElementById("outputTracker");

var notesField = document.getElementById("notes");

var textPrefix;
var textChunks;
var curPanel;

function setCurrentPanel(newPanel) {
	if ((newPanel < 0) || (newPanel >= textChunks.length)) {
		return;
	}

	curPanel = newPanel;

	if (curPanel > 0) {
		btnPanelBack.removeAttribute("disabled");
	} else {
		btnPanelBack.setAttribute("disabled", true);
	}

	if (curPanel < textChunks.length - 1) {
		btnPanelForward.removeAttribute("disabled");
	} else {
		btnPanelForward.setAttribute("disabled", true);
	}

	outputTracker.innerHTML = (curPanel + 1) + "/" + textChunks.length;

	var tmpOutput = textPrefix;

	if (curPanel > 0) {
		tmpOutput += "+ ";
	}

	tmpOutput += textChunks[curPanel];

	if (curPanel < textChunks.length - 1) {
		tmpOutput += " +";
	}

	outputText.value = tmpOutput;
}

function processInput(e) {
	if (e.target.value) {
		textPrefix = "/s ";
		var inputMe = e.target.value;
		textChunks = [];

		// Determine which slash prefix we should be using.
		if (inputMe.startsWith("/")) {
			textPrefix = inputMe.substring(0, inputMe.indexOf(" ") + 1);

			if (textPrefix.length !== 3) {
				textPrefix = "/e ";
				inputMe = inputMe.substring(1).trim();
			} else if ("epsy".indexOf(textPrefix[1]) < 0) {
				inputMe = inputMe.substring(3).trim();
				textPrefix = "/s ";
			} else {
				inputMe = inputMe.substring(textPrefix.length).trim();
			}
		}

		var start = 0;
		var end = start + 252;

		// Loop to break apart input text...
		while (end < inputMe.length - 1) {
			// Find end of last word, or if we can't, bite off the whole chunk.
			while (inputMe[end] !== " ") {
				end--;

				if (end === start) {
					end = start + 250;
					break;
				}
			}

			textChunks.push(inputMe.substring(start, end).trim());

			// Set up the next go in the loop.
			start = end;

			while ((start < inputMe.length - 1) && (inputMe[start] === " ")) {
				start++;
			}

			end = start + 250;
		}

		// Finally, grab the last piece.
		textChunks.push(inputMe.substring(start));

		setCurrentPanel(0);
		btnCopyOutput.removeAttribute("disabled");
	} else {
		btnPanelBack.setAttribute("disabled", true);
		btnPanelForward.setAttribute("disabled", true);
		btnCopyOutput.setAttribute("disabled", true);
		outputTracker.innerHTML = "0/0";
		outputText.value = "";
	}
}

inputText.addEventListener("change", processInput);

btnPanelBack.addEventListener("click", () => { setCurrentPanel(curPanel - 1); });
btnPanelForward.addEventListener("click", () => { setCurrentPanel(curPanel + 1); });
btnCopyOutput.addEventListener("click", () => { navigator.clipboard.writeText(outputText.value); });

notesField.value = localStorage.getItem(localStorageToken);

notesField.addEventListener("change", () => { localStorage.setItem(localStorageToken, notesField.value); });