const listToken = "[IECharList]";
const storageToken = "[IEChar]";

var abilityData;

var pageFooter = document.querySelector("footer");

var character = {
	type: "",
	rank: "",
}

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
}

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
				var curHolder = document.createElement("div");
				curHolder.className = "subsection";
				curHolder.setAttribute("data-rank", abilityData.rankList[i].tag);

				tmpElement = document.createElement("h2");
				tmpElement.innerHTML = abilityData.rankList[i][character.type] + " Abilities";
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
					}
				});

				curHolder.appendChild(curBlock);
				charSheet.appendChild(curHolder);
			}
		}
	}
}

function setActionable(modified) {
	if (modified) {
		delete character.saved;
	}

	if ((character.name) && (character.type) && (character.rank) && (!character.saved)) {
		document.querySelectorAll("#charControls button").forEach(button => button.disabled = false);
	} else {
		document.querySelectorAll("#charControls button").forEach(button => button.disabled = true);
	}
}

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

	tmpElement = document.querySelector("#charControls");

	tmpChild = document.createElement("button");
	tmpChild.type = "button";
	tmpChild.innerHTML = "Save";
	tmpChild.disabled = true;
	tmpChild.addEventListener("click", saveCharacterBuild);
	tmpElement.appendChild(tmpChild);

	tmpChild = document.createElement("button");
	tmpChild.type = "button";
	tmpChild.innerHTML = "Share";
	tmpChild.disabled = true;
	tmpChild.addEventListener("click", shareCharacterBuild);
	tmpElement.appendChild(tmpChild);

	generateAbilityLists();
}

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

// Base64 conversion code from
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

function saveCharacterBuild() {
	var charList = JSON.parse(localStorage.getItem(listToken) || "[]");
	var buildData = serializeBuildData();

	charList.push(character.name);
	charList.sort();

	localStorage.setItem(storageToken + character.name, buildData);
	localStorage.setItem(listToken, JSON.stringify(charList));
}

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

fetch("./assets/data/abilities.json").then(response => {
	if (response.ok) {
		response.json().then(data => {
			abilityData = data;

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
					}
					else {
						showErrorModal("Character '" + tmpName + "' has not been saved on this machine!");
						return;
					}
				}

				initializePageEditable();
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
