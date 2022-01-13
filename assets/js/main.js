const noteStorageToken = "SWTOR[IE]Notes";
const sectionStorageToken = "SWTOR[IE]Sections";
const charListToken = "[IECharList]";
const characterToken = "[IEChar]";

var inputText = document.getElementById("inputText");
var outputText = document.getElementById("outputText");

var btnPanelBack = document.getElementById("btnPanelBack");
var btnPanelForward = document.getElementById("btnPanelForward");
var btnCopyOutput = document.getElementById("btnCopyOutput");

var outputTracker = document.getElementById("outputTracker");

var notesField = document.getElementById("notes");

var sectionStatus = localStorage.getItem(sectionStorageToken) || 0;

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

			if (textPrefix.match(/^\/(e|ops|p|ra|s|y) $/g)?.length) {
				inputMe = inputMe.substring(textPrefix.length).trim();
			} else {
				if (textPrefix.length > 4) {
					textPrefix = "/e ";
					inputMe = inputMe.substring(1).trim();
				} else {
					inputMe = inputMe.substring(textPrefix.length).trim();
					textPrefix = "/s ";
				}
			}
		}

		var start = 0;
		var end = start + 253 - textPrefix.length;

		// Loop to break apart input text...
		while (end < inputMe.length - 1) {
			// Find end of last word, or if we can't, bite off the whole chunk.
			while (inputMe[end] !== " ") {
				end--;

				if (end === start) {
					end = start + 251 - textPrefix.length;
					break;
				}
			}

			textChunks.push(inputMe.substring(start, end).trim());

			// Set up the next go in the loop.
			start = end;

			while ((start < inputMe.length - 1) && (inputMe[start] === " ")) {
				start++;
			}

			end = start + 251 - textPrefix.length;
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

function initializeSections() {
	var closeButtons = document.querySelectorAll(".closeButton button");

	closeButtons.forEach((element, index) => {
		element.addEventListener("click", () => { toggleSection(index); });

		if (sectionStatus & (1 << index)) {
			toggleSection(index, false);
		}
	});
}

function toggleSection(index, doUpdate = true) {
	var currentSection = document.querySelectorAll(".closeButton")[index].parentElement;
	var currentClasses = currentSection.className.split(" ");

	if (currentClasses.indexOf("closed") > -1) {
		currentSection.className = currentClasses.filter(element => element !== "closed").join(" ");
		currentSection.querySelector(".closeButton button").innerHTML = "-";

		sectionStatus &= ~(1 << index);
	} else {
		currentSection.className = currentClasses.join(" ") + " closed";
		currentSection.querySelector(".closeButton button").innerHTML = "+";

		sectionStatus |= (1 << index);
	}

	if (doUpdate) {
		localStorage.setItem(sectionStorageToken, sectionStatus);
	}
}

function showCharSelectModal() {
	var charList = JSON.parse(localStorage.getItem(charListToken) || "[]");
	var buttonHolder = document.querySelector("#charSelectOptions");

	document.querySelector("#modalBG").className = "show";
	document.querySelector("#selectModal").className = "show";

	buttonHolder.innerHTML = "";

	charList.forEach(character => {
		var tmpDiv = document.createElement("div");
		var tmpButton = document.createElement("button");
		tmpButton.type = "button";
		tmpButton.innerHTML = character;
		tmpButton.addEventListener("click", () => { window.open(window.location.href + "charsheet.html?n=" + encodeURI(character)); hideModal(); });
		tmpDiv.appendChild(tmpButton);

		tmpButton = document.createElement("button");
		tmpButton.type = "button";
		tmpButton.className = "buttonDelete";
		tmpButton.innerHTML = "X";
		tmpButton.addEventListener("click", () => { hideModal(); showDeleteModal(character); });
		tmpDiv.appendChild(tmpButton);

		buttonHolder.appendChild(tmpDiv);
	})
}

function showDeleteModal(name) {
	var modal = document.querySelector("#deleteModal");

	document.querySelector("#modalBG").className = "show";
	modal.className = "show";
	modal.setAttribute("data-name", name);
	modal.querySelector("h2").innerHTML = "Delete " + name + "?";
}

function deleteCharacter(e) {
	var charList = JSON.parse(localStorage.getItem(charListToken) || "[]");
	var charName = e.target.parentElement.parentElement.getAttribute("data-name");
	var listIndex = charList.indexOf(charName);

	if (listIndex > -1) {
		charList.splice(listIndex, 1);
		localStorage.setItem(charListToken, JSON.stringify(charList));
	}

	localStorage.removeItem(characterToken + charName);

	hideModal();
	showCharSelectModal();
}

function hideModal() {
	document.querySelectorAll("#modalBG, #modalBG > section").forEach(element => element.className = "");
}

inputText.addEventListener("change", processInput);

btnPanelBack.addEventListener("click", () => { setCurrentPanel(curPanel - 1); });
btnPanelForward.addEventListener("click", () => { setCurrentPanel(curPanel + 1); });
btnCopyOutput.addEventListener("click", () => { navigator.clipboard.writeText(outputText.value); });

notesField.value = localStorage.getItem(noteStorageToken);

notesField.addEventListener("change", () => { localStorage.setItem(noteStorageToken, notesField.value); });

document.querySelector("nav").addEventListener("click", showCharSelectModal);
document.querySelector("#blankChar").addEventListener("click", () => { window.open(window.location.href + "charsheet.html"); hideModal(); });
document.querySelector("#dismissSelect").addEventListener("click", hideModal);
document.querySelector("#deleteChar").addEventListener("click", deleteCharacter);
document.querySelector("#deleteCancel").addEventListener("click", () => { hideModal(); showCharSelectModal(); });

initializeSections();