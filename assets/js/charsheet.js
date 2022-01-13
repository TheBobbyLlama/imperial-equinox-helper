const listToken = "[IECharList]";
const storageToken = "[IEChar]";

var abilityData;

var pageFooter = document.querySelector("footer");

var character = {
	type: "",
	rank: "",
}

// Sets the info to be displayed in the footer, or hides it if there is no info.
function setFooter(header, info) {
	if ((header) && (info)) {
		pageFooter.querySelector("h3").innerHTML = header;
		pageFooter.querySelector("div").innerHTML = info;
		pageFooter.style.display = "block";
		document.body.style.marginBottom = (20 + pageFooter.clientHeight) + "px";
	} else {
		pageFooter.style.display = "none";
	}
}

// Lookup function for the master ability list.
function findAbilityByName(name) {
	for (var i = 0; i < abilityData.rankList.length; i++) {
		var testMe = abilityData[abilityData.rankList[i].tag]?.abilities.find(ability => ability.name === name);

		if (testMe) {
			return { rank: abilityData.rankList[i].tag, ability: testMe };
		}
	}
}

// Utility function to check if the current character has an ability selected.
function abilitySelected(rank, key) {
	var abilityList = character[rank] || [];

	return !!abilityList.find(item => item === key);
}

// Loops through all abilities on the character sheet for validation.
function validateAbilities() {
	var rankSections = document.querySelectorAll("#characterSheet .subsection");

	for (var r = 0; r < rankSections.length; r++) {
		let rankKey = rankSections[r].getAttribute("data-rank");
		let abilityList = rankSections[r].querySelectorAll("div[data-key]");
		let abilityCount = (character[rankKey] || []).length;
		let abilityMax = abilityData.rankList.find(rank => rank.tag === character.rank).limits[r];

		if (abilityMax > 0) {
			rankSections[r].querySelector("h2 > span").innerHTML = "(" + abilityCount + "/" + abilityMax + ")";
		} else {
			rankSections[r].querySelector("h2 > span").innerHTML = "";
		}

		for (var a = 0; a < abilityList.length; a++) {
			let curAbility = findAbilityByName(abilityList[a].querySelector("div").innerHTML)?.ability;
			if (curAbility) {
				if (((curAbility.requires) && (curAbility.requires.find(findMe => { var testMe = findAbilityByName(findMe); return !abilitySelected(testMe.rank, testMe.ability.key); })))
					|| ((curAbility.requiresAny) && (!curAbility.requiresAny.filter(findMe => { var testMe = findAbilityByName(findMe); return abilitySelected(testMe.rank, testMe.ability.key)}).length))) {
					if (abilityList[a].className.indexOf("invalid") < 0) {
						abilityList[a].className += " invalid";
					}

					if (character[rankKey]) {
						let tmpIdx = character[rankKey].indexOf(curAbility.key);

						// Oops!  We're in an invalid state!  Wipe out the current ability and start over.
						if (tmpIdx > -1) {
							character[rankKey].splice(tmpIdx, 1);
							abilityList[a].querySelector("input[type='checkbox']").checked = false;
							validateAbilities();
							return;
						}
					}
				} else if ((abilityMax > -1) && (abilityCount >= abilityMax) && (!abilityList[a].querySelector("input[type='checkbox']").checked)) {
					if (abilityList[a].className.indexOf("invalid") < 0) {
						abilityList[a].className += " invalid";
					}
				} else {
					if (abilityList[a].className.endsWith(" invalid")) {
						abilityList[a].className = abilityList[a].className.substring(0, abilityList[a].className.length - 8);
					}
				}
			}
		}
	}
}

// Fired when clicking an ability checkbox to select/deselect.
function toggleAbility(e) {
	var abilityKey = e.target.parentElement.getAttribute("data-key");
	var rankKey = e.target.parentElement.parentElement.getAttribute("data-rank");

	if ((!abilityKey) || (!rankKey)) {
		console.log("ERROR: Bad ability lookup!")
		return;
	}

	if (!character[rankKey]) {
		character[rankKey] = [];
	}

	var findMe = character[rankKey].indexOf(abilityKey);

	if (findMe > -1) {
		character[rankKey].splice(findMe, 1);
	}

	if (e.target.checked) {
		character[rankKey].push(abilityKey);
		character[rankKey].sort();
	}

	validateAbilities();
	setActionable(true);
}

// Fired when type and rank are selected, generates the appropriate skill lists.
function generateAbilityLists() {
	document.querySelectorAll("#characterSheet > .subsection").forEach(element => element.remove());

	if ((character.type) && (character.rank)) {
		var tmpElement;
		var tmpChild;
		var rankTarget = abilityData.rankList.findIndex(rank => rank.tag === character.rank);
		var charSheet = document.querySelector("#characterSheet");

		for (var i = 0; i <= rankTarget; i++) {
			var curRankAbilities = abilityData[abilityData.rankList[i].tag]?.abilities;

			if (curRankAbilities?.length) {
				var addCount = 0;
				var curHolder = document.createElement("div");
				curHolder.className = "subsection";
				curHolder.setAttribute("data-rank", abilityData.rankList[i].tag);

				tmpElement = document.createElement("h2");
				tmpElement.innerHTML = abilityData.rankList[i][character.type] + " Abilities <span></span>";
				curHolder.appendChild(tmpElement);

				var curBlock = document.createElement("div");
				curBlock.setAttribute("data-rank", abilityData.rankList[i].tag);

				curRankAbilities.forEach(ability => {
					// Force Users cannot have non-Force abilities until they make Apprentice.
					if (((!ability.restricted) || (ability.restricted === character.type))
					&& ((character.type !== "fu") || (ability.restricted === "fu") || (rankTarget > 0))) {
						tmpElement = document.createElement("div");
						tmpElement.setAttribute("data-key", ability.key);

						if (ability.restricted) {
							tmpElement.className = "restrict" + ability.restricted.toUpperCase();
						}

						tmpChild = document.createElement("input");
						tmpChild.setAttribute("type", "checkbox");
						tmpChild.addEventListener("change", toggleAbility);

						if (character[abilityData.rankList[i].tag]?.find(item => item === ability.key)) {
							tmpChild.checked = true;
						}
						tmpElement.appendChild(tmpChild);

						tmpChild = document.createElement("div");
						tmpChild.innerHTML = ability.name;
						tmpElement.appendChild(tmpChild);

						tmpElement.addEventListener("click", (e) => { setFooter(ability.name, ability.description); e.stopPropagation(); });
						curBlock.appendChild(tmpElement);
						addCount++;
					}
				});

				if (addCount) {
					curHolder.appendChild(curBlock);
					charSheet.appendChild(curHolder);
				} else {
					curBlock.remove();
					curHolder.remove();
				}
			}
		}
	}

	validateAbilities();
}

// Used to enable/disable the button controls for saving, sharing, etc.
function setActionable(modified) {
	if (modified) {
		delete character.saved;
	}

	// Save button
	if ((character.name) && (character.type) && (character.rank) && (!character.saved)) {
		document.querySelector("#charControls button:first-child").disabled = false;
	} else {
		document.querySelector("#charControls button:first-child").disabled = true;
	}

	// Share button
	if ((character.name) && (character.type) && (character.rank)) {
		document.querySelector("#charControls button:last-child").disabled = false;
	} else {
		document.querySelector("#charControls button:last-child").disabled = true;
	}
}

// Wipes out the character's selected abilities.
function clearSelectedAbilities() {
	abilityData.rankList.forEach(rank => delete character[rank.tag]);
}

function setCharName(val) {
	if (val) {
		character.name = val;
	} else {
		delete character.name;
	}

	setActionable(true);
}

function setCharType(val) {
	character.type = val;
	clearSelectedAbilities();
	generateAbilityLists();

	setActionable(true);
}

function setCharRank(val) {
	var curRank = abilityData.rankList.find(rank => rank.tag === val);
	character.rank = val;
	clearSelectedAbilities();
	generateAbilityLists();
	document.querySelector("#rollInfo").innerHTML = curRank.hp + " HP, d" + curRank.die + "+" + curRank.bonus;

	setActionable(true);
}

// Adds elements to the page for the user in edit mode.
function initializePageEditable() {
	var tmpElement;
	var tmpChild;

	tmpElement = document.createElement("input");
	tmpElement.setAttribute("type", "text");
	tmpElement.setAttribute("maxlength", "32");
	tmpElement.setAttribute("placeholder", "Character Name");

	if (character.name) {
		tmpElement.value = character.name;
	}

	tmpElement.addEventListener("change", e => { setCharName(e.target.value); });
	document.querySelector("#charName").appendChild(tmpElement);

	tmpElement = document.createElement("select");
	tmpChild = document.createElement("option");
	tmpChild.value = "fu";
	tmpChild.innerHTML = "Force User";
	tmpElement.appendChild(tmpChild);
	tmpChild = document.createElement("option");
	tmpChild.value = "nfu";
	tmpChild.innerHTML = "Non-Force User";
	tmpElement.appendChild(tmpChild);
	tmpElement.value = character.type;
	tmpElement.addEventListener("change", e => { setCharType(e.target.value); });
	document.querySelector("#charType").appendChild(tmpElement);

	tmpElement = document.createElement("select");
	abilityData.rankList.forEach(element => {
		tmpChild = document.createElement("option");
		tmpChild.value = element.tag;
		tmpChild.innerHTML = element.fu + "/" + element.nfu;
		tmpElement.appendChild(tmpChild);
	});
	tmpElement.value = character.rank;
	tmpElement.addEventListener("change", e => { setCharRank(e.target.value); });
	document.querySelector("#charRank").appendChild(tmpElement);

	if (character.rank) {
		var curRank = abilityData.rankList.find(rank => rank.tag === character.rank);
		document.querySelector("#rollInfo").innerHTML = curRank.hp + " HP, d" + curRank.die + "+" + curRank.bonus;
	}

	tmpElement = document.querySelector("#charControls");

	tmpChild = document.createElement("button");
	tmpChild.type = "button";
	tmpChild.innerHTML = "Save";
	//tmpChild.disabled = true;
	tmpChild.addEventListener("click", saveCharacterBuild);
	tmpElement.appendChild(tmpChild);

	tmpChild = document.createElement("button");
	tmpChild.type = "button";
	tmpChild.innerHTML = "Share";
	//tmpChild.disabled = true;
	tmpChild.addEventListener("click", shareCharacterBuild);
	tmpElement.appendChild(tmpChild);

	generateAbilityLists();
	setActionable();
}

// Adds elements to the page for the user in view mode.
function initializePageStatic() {
	var tmpElement;
	var curRank = abilityData.rankList.find(rank => rank.tag === character.rank);

	tmpElement = document.createElement("h2");
	tmpElement.innerHTML = character.name;
	document.querySelector("#charName").appendChild(tmpElement);

	document.querySelector("#charType").remove();

	tmpElement = document.querySelector("#charRank");
	tmpElement.innerHTML = curRank[character.type];

	document.querySelector("#rollInfo").innerHTML = curRank.hp + " HP, d" + curRank.die + "+" + curRank.bonus;

	// FILL ABILITY LISTS
	var tmpElement;
	var tmpChild;
	var rankTarget = abilityData.rankList.findIndex(rank => rank.tag === character.rank);
	var charSheet = document.querySelector("#characterSheet");

	for (var i = 0; i <= rankTarget; i++) {
		var validRankAbilities = abilityData[abilityData.rankList[i].tag]?.abilities.filter(ability => character[abilityData.rankList[i].tag].indexOf(ability.key) > -1);
		
		if (validRankAbilities?.length) {
			var curHolder = document.createElement("div");
			curHolder.className = "subsection";
			curHolder.setAttribute("data-rank", abilityData.rankList[i].tag);

			tmpElement = document.createElement("h2");
			tmpElement.innerHTML = abilityData.rankList[i][character.type] + " Abilities";
			curHolder.appendChild(tmpElement);

			var curBlock = document.createElement("div");
			curBlock.setAttribute("data-rank", abilityData.rankList[i].tag);

			validRankAbilities.forEach(ability => {
				tmpElement = document.createElement("div");
				tmpElement.setAttribute("data-key", ability.key);

				if (ability.restricted) {
					tmpElement.className = "restrict" + ability.restricted.toUpperCase();
				}

				tmpChild = document.createElement("div");
				tmpChild.innerHTML = ability.name;
				tmpElement.appendChild(tmpChild);

				tmpElement.addEventListener("click", (e) => { setFooter(ability.name, ability.description); e.stopPropagation(); });
				curBlock.appendChild(tmpElement);
			});

			curHolder.appendChild(curBlock);
			charSheet.appendChild(curHolder);
		}
	}
}

// Spits out character sheet info in a base64 string.
function serializeBuildData() {
	var data = [];
	var tmpDatum;

	var rankTarget = abilityData.rankList.findIndex(rank => rank.tag === character.rank);

	tmpDatum = rankTarget << 1;
	
	if (character.type === "nfu") {
		tmpDatum++;
	}

	data.push(tmpDatum);

	for (let i = 0; i <= rankTarget; i++) {
		var curList = character[abilityData.rankList[i].tag] || [];

		data.push(curList.length);

		for (let x = 0; x < curList.length; x++) {
			// Compact ability keys
			let tmpVals = [];
			tmpVals[0] = curList[x].charCodeAt(0) - 65;
			tmpVals[1] = curList[x].charCodeAt(1) - 65;

			data.push(((tmpVals[0] << 2 )+ (tmpVals[1] >> 4)) & 255);
			data.push(((tmpVals[1] << 4 )+ Number(curList[x][2])) & 255);
		}
	}

	return btoa(String.fromCharCode.apply(null, data));
}

// Decodes build info from an exported string.
function deserializeBuildData(dataBlock) {
	var tmpCnt;
	var data = new Uint8Array(atob(dataBlock).split("").map(function(c) { return c.charCodeAt(0); }));
	var curPos = 0;

	character = {};
	character.type = (data[curPos] & 1) ? "nfu" : "fu";
	character.rank = abilityData.rankList[data[curPos] >> 1].tag;

	var rankTarget = abilityData.rankList.findIndex(rank => rank.tag === character.rank);

	for (let i = 0; i <= rankTarget; i++) {
		character[abilityData.rankList[i].tag] = [];

		tmpCnt = data[++curPos];

		while (tmpCnt-- > 0) {
			// Extract ability keys.
			let byteData = [];
			let tmpStr = "";
			byteData[0] = data[++curPos];
			byteData[1] = data[++curPos];

			tmpStr += String.fromCharCode(65 + (byteData[0] >> 2));
			tmpStr += String.fromCharCode(65 + (((byteData[0] << 4) + (byteData[1] >> 4)) & 31));
			tmpStr += (byteData[1] & 3);

			character[abilityData.rankList[i].tag].push(tmpStr);
		}
	}
}

// Saves character to local storage.
function saveCharacterBuild(e) {
	e.stopPropagation();
	var charList = JSON.parse(localStorage.getItem(listToken) || "[]");
	var buildData = serializeBuildData();

	if (charList.indexOf(character.name) < 0) {
		charList.push(character.name);
		charList.sort();
		localStorage.setItem(listToken, JSON.stringify(charList));
	}

	localStorage.setItem(storageToken + character.name, buildData);

	character.saved = true;
	setFooter("Saved!", character.name + " was saved successfully.");
	setActionable(false);
}

// Shows a popup with a link to the character sheet.
function shareCharacterBuild() {
	var buildData = serializeBuildData();
	var buildLink = window.location.origin + window.location.pathname + "?n=" + encodeURIComponent(character.name) + "&data=" + buildData;

	document.querySelector("#modalBG").className = "show";
	document.querySelector("#linkModal").className = "show";
	document.querySelector("#linkText").value = buildLink;
}

function showErrorModal(message) {
	document.querySelector("#modalBG").className = "show";
	document.querySelector("#errorModal").className = "show";
	document.querySelector("#errorModal p").innerHTML = message;
}

function hideModal() {
	document.querySelectorAll("#modalBG, #modalBG > section").forEach(element => element.className = "");
}

function validateAbilityData() {
	for (var i = 0; i < abilityData.rankList.length; i++) {
		var curList = abilityData[abilityData.rankList[i].tag]?.abilities;

		if (curList) {
			for (var x = 0; x < curList.length; x++) {
				var testMe = curList.filter(item => item.key === curList[x].key);

				if (testMe.length > 1) {
					alert("Data error: Duplicate key in " + abilityData.rankList[i].tag.toUpperCase() + " abilities: " + curList[x].key);
					return false;
				}
			}
		}
	}
	return true;
}

// STARTUP PHASE - Pull in our data JSON, then try to populate the page.
fetch("./assets/data/abilities.json").then(response => {
	if (response.ok) {
		response.json().then(data => {
			abilityData = data;

			if (validateAbilityData()) {
				var params = new URLSearchParams(window.location.search);

				if (params.has("data")) {
					deserializeBuildData(params.get("data"));
					character.name = params.get("n");

					initializePageStatic();
				} else {
					if (params.has("n")) {
						var tmpName = params.get("n");
						var charData = localStorage.getItem(storageToken + tmpName);

						if (charData) {
							deserializeBuildData(charData);
							character.name = tmpName;
							character.saved = true;
						}
						else {
							showErrorModal("Character '" + tmpName + "' has not been saved on this machine!");
							return;
						}
					}

					initializePageEditable();
				}
			}
		});
	}
	else {
		showErrorModal("An error has occurred loading ability data:<br /><br />" + response.statusText);
	}
});

document.body.addEventListener("click", () => { setFooter("", ""); });
pageFooter.addEventListener("click", e => { e.stopPropagation(); });
document.querySelector("#btnDismissError").addEventListener("click", hideModal);
document.querySelector("#btnCopyLink").addEventListener("click", e => { navigator.clipboard.writeText(document.querySelector("#linkText").value); });
document.querySelector("#btnDismissLink").addEventListener("click", hideModal);
