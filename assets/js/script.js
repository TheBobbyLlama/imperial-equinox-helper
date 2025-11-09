const noteStorageToken = "SWTOR[IE]Notes";
const sectionStorageToken = "SWTOR[IE]Sections";
const emoteStorageToken = "SWTOR[IE]Emotes";

const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

const btnPanelBack = document.getElementById("btnPanelBack");
const btnPanelForward = document.getElementById("btnPanelForward");
const btnCopyOutput = document.getElementById("btnCopyOutput");
const btnEmoteFree = document.getElementById("btnEmoteFree");
const btnEmoteSub = document.getElementById("btnEmoteSub");
const btnEmoteMarket = document.getElementById("btnEmoteMarket");
const btnEmoteUnlocked = document.getElementById("btnEmoteUnlocked");

const outputTracker = document.getElementById("outputTracker");

const notesField = document.getElementById("notes");
const emoteSection = document.getElementById("emoteDisplay");

let sectionStatus = localStorage.getItem(sectionStorageToken) || 0;
let emoteHidden = JSON.parse(localStorage.getItem(emoteStorageToken)) || [];

let textPrefix;
let textChunks;
let curPanel;

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

	let tmpOutput = textPrefix;

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
		let inputMe = e.target.value;
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

		let start = 0;
		let end = start + 253 - textPrefix.length;

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
	const closeButtons = document.querySelectorAll(".closeButton button");

	closeButtons.forEach((element, index) => {
		element.addEventListener("click", () => { toggleSection(index); });

		if (sectionStatus & (1 << index)) {
			toggleSection(index, false);
		}
	});
}

function toggleSection(index, doUpdate = true) {
	const currentSection = document.querySelectorAll(".closeButton")[index].parentElement;
	const currentClasses = currentSection.className.split(" ");

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

function setEmoteDisplay() {
	[ "Free", "Sub", "Market", "Unlocked" ].forEach(emoteType => {
		if (emoteHidden.indexOf(emoteType) > -1) {
			emoteSection.setAttribute("hide" + emoteType, emoteHidden.length);
		} else {
			emoteSection.removeAttribute("hide" + emoteType);
		}
	})
}

function toggleEmoteType(emoteType) {
	if (emoteHidden.indexOf(emoteType) > -1) {
		emoteHidden = emoteHidden.filter(emote => emote !== emoteType);
	} else {
		emoteHidden.push(emoteType);
	}

	setEmoteDisplay();

	localStorage.setItem(emoteStorageToken, JSON.stringify(emoteHidden));
}

inputText.addEventListener("change", processInput);

btnPanelBack.addEventListener("click", () => { setCurrentPanel(curPanel - 1); });
btnPanelForward.addEventListener("click", () => { setCurrentPanel(curPanel + 1); });
btnCopyOutput.addEventListener("click", () => { navigator.clipboard.writeText(outputText.value); });

notesField.value = localStorage.getItem(noteStorageToken);

notesField.addEventListener("change", () => { localStorage.setItem(noteStorageToken, notesField.value); });

btnEmoteFree.addEventListener("click", () => { toggleEmoteType("Free") });
btnEmoteSub.addEventListener("click", () => { toggleEmoteType("Sub") });
btnEmoteMarket.addEventListener("click", () => { toggleEmoteType("Market") });
btnEmoteUnlocked.addEventListener("click", () => { toggleEmoteType("Unlocked") });

initializeSections();
setEmoteDisplay();