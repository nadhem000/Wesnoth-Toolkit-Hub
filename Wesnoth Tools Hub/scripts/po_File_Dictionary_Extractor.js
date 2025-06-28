document.addEventListener('DOMContentLoaded', () => {
    const processBtn = document.getElementById('dictionary-manager-processBtn');
    const fileInput = document.getElementById('dictionary-manager-fileInput');
    const poContentTextarea = document.getElementById('dictionary-manager-poContent');
    const statusDiv = document.getElementById('dictionary-manager-status');
	const loadBtn = document.getElementById('dictionary-manager-loadBtn');
	const saveDictBtn = document.getElementById('dictionary-manager-saveDictBtn');
	const downloadBtn = document.getElementById('dictionary-manager-downloadBtn');
	const clearDictBtn = document.getElementById('dictionary-manager-clearDictBtn');
	const uploadDictBtn = document.getElementById('dictionary-manager-uploadDictBtn');
	const tabBtns = document.querySelectorAll('.dictionary-manager-tab-btn');
	const tabContents = document.querySelectorAll('.dictionary-manager-tab-content');
	const applyDictBtn = document.getElementById('dictionary-manager-applyDictBtn');
	if (applyDictBtn) {
		applyDictBtn.addEventListener('click', applyDictionary);
	}
const downloadModifiedBtn = document.getElementById('dictionary-manager-downloadModifiedBtn');
if (downloadModifiedBtn) {
    downloadModifiedBtn.addEventListener('click', downloadModifiedPo);
    downloadModifiedBtn.disabled = false;
}
	
	// Global variable to track current dictionary
	let currentDictionary = null;
	// global variable to store original content
let originalPoContent = '';
	
	tabBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			const tabId = btn.dataset.tab;
			
			// Remove active class from all buttons and contents
			tabBtns.forEach(b => b.classList.remove('active'));
			tabContents.forEach(c => c.classList.remove('active'));
			
			// Add active class to clicked button and corresponding content
			btn.classList.add('active');
			document.getElementById(tabId).classList.add('active');
		});
	});
	// Function to load dictionary for selected language
	function loadDictionary() {
		const language = document.getElementById('dictionary-manager-language').value;
		const dictKey = `dictionary-${language}`;
		const storedDict = localStorage.getItem(dictKey);
		
		if (storedDict) {
			try {
				currentDictionary = JSON.parse(storedDict);
				renderDictionary(currentDictionary);
				statusDiv.textContent = `Loaded dictionary for ${language} with ${Object.keys(currentDictionary.entries).length} entries`;
				} catch (e) {
				statusDiv.textContent = `Error loading dictionary: Invalid format`;
				console.error('Dictionary parse error:', e);
			}
			} else {
			statusDiv.textContent = `No dictionary found for ${language}`;
			document.getElementById('dictionary-manager-dictionaryOutput').innerHTML = 
            `<p>No dictionary exists for ${language}. Create one by processing .po files.</p>`;
		}
	}
    async function getPoContent() {
        if (poContentTextarea.value.trim() !== '') {
            return poContentTextarea.value;
		}
		
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(new Error('File reading error'));
                reader.readAsText(file);
			});
		}
		
        return null;
	}
	
    function extractHeader(content) {
        const lines = content.split(/\r?\n/);
        let headerEnd = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '') {
                headerEnd = i;
                break;
			}
		}
        
        return {
            header: lines.slice(0, headerEnd + 1).join('\n'),
            message: `Header extracted (${headerEnd + 1} lines)`
		};
	}
	
    function extractLanguageLine(header) {
        const regex = /Language:\s*([^\n]+)/i;
        const match = header.match(regex);
        if (match && match[1]) {
            console.log(`Extracted language line: ${match[0]}`);
            return match[1].trim();
		}
        console.log('No language line found in header');
        return null;
	}
	
	function cleanLanguageCode(languageLine) {
		// Remove newlines first
		let cleaned = languageLine.replace(/\n/g, '');
		
		// Find the position of the backslash
		const backslashIndex = cleaned.indexOf('\\');
		
		// If backslash is found, remove it and everything after it
		if (backslashIndex !== -1) {
			cleaned = cleaned.substring(0, backslashIndex);
		}
		
		// Remove any quotes and trim whitespace
		cleaned = cleaned.replace(/['"]/g, '').trim();
		console.log(`Cleaned language code: ${cleaned}`);
		return cleaned;
	}
	function parsePoEntries(content) {
		const entries = [];
		const blocks = content.split(/\n\n/);
		
		for (const block of blocks) {
			if (!block.trim()) continue;
			
			// Skip blocks with continuation lines (multi-line entries)
			if (block.includes('\n"') || block.includes('\n#~ "')) {
				continue;
			}
			
			const msgidMatch = block.match(/(?:#~ *)?msgid\s+"(.*?[^\\])"/);
			if (!msgidMatch) continue;
			
			const msgstrMatch = block.match(/(?:#~ *)?msgstr\s+"(.*?[^\\])"/);
			const msgid = msgidMatch[1].replace(/\\"/g, '"').trim();
			const msgstr = msgstrMatch ? msgstrMatch[1].replace(/\\"/g, '"').trim() : "";
			
			// Skip empty/invalid msgid values
			if (!msgid || 
				msgid === "\\n" || 
				msgid === "\\t" || 
				msgid === "\\r" || 
				msgid === '""' || 
				msgid === '') {
				continue;
			}
			
			entries.push({ msgid, msgstr });
		}
		
		return entries;
	}
	
	function createDictionaryContainer(languagePo) {
		const wordCount = document.getElementById('dictionary-manager-wordCount').value;
		const dictionary = {
			metadata: {
				language: languagePo,
				wordCount: wordCount,
				created: new Date().toISOString(),
				modified: new Date().toISOString(),
				version: "1.0",
				source: "po-file-extractor"
			},
			entries: {}
		};
		localStorage.setItem(`dictionary-${languagePo}`, JSON.stringify(dictionary));
		return dictionary;
	}
	
	function processDictionaryMatches(dictionary, entries) {
		const matches = [];
		
		for (const entry of entries) {
			if (dictionary.entries[entry.msgid] !== undefined) {
				matches.push({
					msgid: entry.msgid,
					existing: dictionary.entries[entry.msgid],
					new: entry.msgstr
				});
			}
		}
		
		return matches;
	}
	
	function renderDictionary(dictionary) {
		const outputDiv = document.getElementById('dictionary-manager-dictionaryOutput');
		const entries = dictionary.entries;
		const entryCount = Object.keys(entries).length;
		
		let html = `
        <div class="dictionary-manager-summary">
		Dictionary: ${dictionary.metadata.language} | 
		Entries: ${entryCount} | 
		Created: ${new Date(dictionary.metadata.created).toLocaleDateString()} |
		Modified: ${new Date(dictionary.metadata.modified).toLocaleDateString()}
        </div>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
		<thead>
		<tr style="border-bottom:2px solid #3498db;">
		<th style="padding:8px;text-align:left;width:30%;">Key</th>
		<th style="padding:8px;text-align:left;width:50%;">Value</th>
		<th style="padding:8px;text-align:left;width:20%;">Actions</th>
		</tr>
		</thead>
		<tbody>
		`;
		
		for (const [key, value] of Object.entries(entries)) {
			html += `
            <tr data-key="${encodeURIComponent(key)}" style="border-bottom:1px solid #eee;">
			<td style="padding:8px;vertical-align:top;"><strong>${key}</strong></td>
			<td style="padding:8px;vertical-align:top;">
			<div class="dictionary-manager-entry-value">${value}</div>
			</td>
			<td style="padding:8px;">
			<div class="dictionary-manager-entry-actions">
			<button class="dictionary-manager-entry-btn dictionary-manager-entry-edit">Edit</button>
			<button class="dictionary-manager-entry-btn dictionary-manager-entry-delete">Delete</button>
			</div>
			</td>
            </tr>
			`;
		}
		
		html += `</tbody></table>`;
		outputDiv.innerHTML = html;
		
		// Add event listeners for edit buttons
		outputDiv.querySelectorAll('.dictionary-manager-entry-edit').forEach(btn => {
			btn.addEventListener('click', function() {
				const row = this.closest('tr');
				const key = decodeURIComponent(row.dataset.key);
				const valueCell = row.querySelector('.dictionary-manager-entry-value');
				const originalValue = currentDictionary.entries[key];
				
				valueCell.innerHTML = `
                <textarea class="dictionary-manager-edit-input">${originalValue}</textarea>
                <div class="dictionary-manager-entry-actions" style="margin-top:8px;">
				<button class="dictionary-manager-entry-btn dictionary-manager-entry-save">Save</button>
				<button class="dictionary-manager-entry-btn dictionary-manager-entry-cancel">Cancel</button>
                </div>
				`;
				
				// Focus and select text for editing
				const textarea = valueCell.querySelector('textarea');
				textarea.focus();
				textarea.select();
				
				// Save handler
				valueCell.querySelector('.dictionary-manager-entry-save').addEventListener('click', function() {
					const newValue = textarea.value.trim();
					if (newValue === '') {
						statusDiv.textContent = 'Error: Value cannot be empty';
						return;
					}
					
					currentDictionary.entries[key] = newValue;
					saveCurrentDictionary();
					renderDictionary(currentDictionary);
					statusDiv.textContent = `Updated entry: ${key.substring(0, 30)}${key.length > 30 ? '...' : ''}`;
				});
				
				// Cancel handler
				valueCell.querySelector('.dictionary-manager-entry-cancel').addEventListener('click', function() {
					renderDictionary(currentDictionary);
				});
			});
		});
		
		// Add event listeners for delete buttons
		outputDiv.querySelectorAll('.dictionary-manager-entry-delete').forEach(btn => {
			btn.addEventListener('click', function() {
				const row = this.closest('tr');
				const key = decodeURIComponent(row.dataset.key);
				
				if (confirm(`Delete entry for "${key.substring(0, 30)}${key.length > 30 ? '...' : ''}"?`)) {
					delete currentDictionary.entries[key];
					saveCurrentDictionary();
					renderDictionary(currentDictionary);
					statusDiv.textContent = `Deleted entry: ${key.substring(0, 30)}${key.length > 30 ? '...' : ''}`;
				}
			});
		});
	}
	// Save current dictionary to localStorage
	function saveCurrentDictionary() {
		if (currentDictionary) {
			currentDictionary.metadata.modified = new Date().toISOString();
			const dictKey = `dictionary-${currentDictionary.metadata.language}`;
			localStorage.setItem(dictKey, JSON.stringify(currentDictionary));
		}
	}
	
	// Download current dictionary
	function downloadCurrentDictionary() {
		if (!currentDictionary) {
			statusDiv.textContent = 'No dictionary loaded to download';
			return;
		}
		
		// Update metadata before download
		currentDictionary.metadata.downloaded = new Date().toISOString();
		
		const data = JSON.stringify(currentDictionary, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `dictionary-${currentDictionary.metadata.language}-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 100);
	}
	
	// Clear current dictionary
	function clearCurrentDictionary() {
		if (!currentDictionary) {
			statusDiv.textContent = 'No dictionary loaded to clear';
			return;
		}
		
		const entryCount = Object.keys(currentDictionary.entries).length;
		if (!entryCount) {
			statusDiv.textContent = 'Dictionary is already empty';
			return;
		}
		
		if (confirm(`Clear all ${entryCount} entries in the ${currentDictionary.metadata.language} dictionary?`)) {
			currentDictionary.entries = {};
			saveCurrentDictionary();
			renderDictionary(currentDictionary);
			statusDiv.textContent = 'Dictionary cleared';
		}
	}
	
	// Upload dictionary and merge with current
	function uploadDictionary() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		
		input.onchange = e => {
			const file = e.target.files[0];
			if (!file) return;
			
			const reader = new FileReader();
			
			reader.onload = function(e) {
				try {
					const newDict = JSON.parse(e.target.result);
					
					// Validate dictionary structure
					if (!newDict.metadata || !newDict.metadata.language || !newDict.entries) {
						throw new Error('Invalid dictionary format');
					}
					
					const outputDiv = document.getElementById('dictionary-manager-dictionaryOutput');
					
					if (!currentDictionary) {
						// Create new dictionary if none exists
						currentDictionary = newDict;
						saveCurrentDictionary();
						renderDictionary(currentDictionary);
						statusDiv.textContent = `Uploaded dictionary for ${newDict.metadata.language} with ${Object.keys(newDict.entries).length} entries`;
						return;
					}
					
					// Handle language mismatch
					if (currentDictionary.metadata.language !== newDict.metadata.language) {
						if (!confirm(`Current dictionary is for ${currentDictionary.metadata.language}, but uploaded file is for ${newDict.metadata.language}. Load as new dictionary?`)) {
							return;
						}
						currentDictionary = newDict;
						saveCurrentDictionary();
						renderDictionary(currentDictionary);
						statusDiv.textContent = `Loaded dictionary for ${newDict.metadata.language}`;
						return;
					}
					
					// Show merge preview
					let addedCount = 0;
					let updatedCount = 0;
					const conflicts = [];
					
					for (const [key, value] of Object.entries(newDict.entries)) {
						if (!currentDictionary.entries[key]) {
							addedCount++;
							} else if (currentDictionary.entries[key] !== value) {
							updatedCount++;
							conflicts.push({key, oldValue: currentDictionary.entries[key], newValue: value});
						}
					}
					
					const conflictInfo = conflicts.length ? 
                    `<div class="dictionary-manager-merge-info">
					<strong>Note:</strong> ${conflicts.length} entries have different values in the uploaded dictionary
                    </div>` : '';
					
					outputDiv.innerHTML = `
                    <div class="dictionary-manager-summary">
					Merge Preview: ${addedCount} new entries, ${updatedCount} updates
                    </div>
                    ${conflictInfo}
                    <div class="dictionary-manager-button-group" style="margin-top:15px;">
					<button id="confirm-merge" class="dictionary-manager-btn dictionary-manager-btn-primary">Confirm Merge</button>
					<button id="cancel-merge" class="dictionary-manager-btn dictionary-manager-btn-light">Cancel</button>
                    </div>
					`;
					
					document.getElementById('confirm-merge').addEventListener('click', () => {
						// Perform actual merge
						for (const [key, value] of Object.entries(newDict.entries)) {
							currentDictionary.entries[key] = value;
						}
						
						saveCurrentDictionary();
						renderDictionary(currentDictionary);
						statusDiv.textContent = `Merged dictionary: Added ${addedCount} entries, updated ${updatedCount}`;
					});
					
					document.getElementById('cancel-merge').addEventListener('click', () => {
						renderDictionary(currentDictionary);
						statusDiv.textContent = 'Merge canceled';
					});
					
					} catch (error) {
					statusDiv.textContent = 'Error: Invalid dictionary file';
					console.error('Dictionary upload error:', error);
				}
			};
			
			reader.onerror = () => {
				statusDiv.textContent = 'Error reading file';
			};
			
			reader.readAsText(file);
		};
		
		input.click();
	}
	
	// Update the renderMatches function to include manual correction
	function renderMatches(matches, dictionary, entries) {
		const outputDiv = document.getElementById('dictionary-manager-dictionaryOutput');
		outputDiv.innerHTML = '';
		
		const matchesContainer = document.createElement('div');
		matchesContainer.className = 'dictionary-manager-matches';
		matchesContainer.innerHTML = `
        <h3>Dictionary Conflicts Found</h3>
        <p>${matches.length} entries conflict with existing dictionary values</p>
        <div class="dictionary-manager-matches-container"></div>
		`;
		
		const container = matchesContainer.querySelector('.dictionary-manager-matches-container');
		
		for (const match of matches) {
			const matchDiv = document.createElement('div');
			matchDiv.className = 'dictionary-manager-match';
			matchDiv.innerHTML = `
            <div class="dictionary-manager-match-header">
			<strong>${match.msgid}</strong>
            </div>
            <div class="dictionary-manager-match-options">
			<div class="dictionary-manager-match-option">
			<label>
			<input type="radio" name="${match.msgid}" value="existing" checked>
			Use existing: 
			</label>
			<div class="dictionary-manager-match-value">${match.existing}</div>
			</div>
			<div class="dictionary-manager-match-option">
			<label>
			<input type="radio" name="${match.msgid}" value="new">
			Use new: 
			</label>
			<div class="dictionary-manager-match-value">${match.new}</div>
			</div>
			<div class="dictionary-manager-match-option">
			<label>
			<input type="radio" name="${match.msgid}" value="custom">
			Custom value:
			</label>
			<textarea class="dictionary-manager-custom-value" 
			rows="2" 
			placeholder="Enter custom translation..."
			data-msgid="${match.msgid}"></textarea>
			</div>
            </div>
			`;
			container.appendChild(matchDiv);
		}
		
		// Add event listeners to enable/disable textareas
		container.querySelectorAll('input[type="radio"]').forEach(radio => {
			radio.addEventListener('change', function() {
				const textarea = this.closest('.dictionary-manager-match-option')
				.querySelector('.dictionary-manager-custom-value');
				if (this.value === 'custom') {
					textarea.disabled = false;
					textarea.focus();
					} else {
					textarea.disabled = true;
				}
			});
		});
		
		const confirmBtn = document.createElement('button');
		confirmBtn.textContent = 'Confirm Selections';
		confirmBtn.id = 'dictionary-manager-confirmBtn';
		confirmBtn.className = 'dictionary-manager-btn dictionary-manager-btn-primary';
		
		confirmBtn.addEventListener('click', () => {
			container.querySelectorAll('.dictionary-manager-match').forEach(match => {
				const msgid = match.querySelector('strong').textContent;
				const selectedOption = match.querySelector('input[type="radio"]:checked').value;
				
				if (selectedOption === 'existing') {
					// Keep existing value
					} else if (selectedOption === 'new') {
					dictionary.entries[msgid] = matches.find(m => m.msgid === msgid).new;
					} else if (selectedOption === 'custom') {
					const customValue = match.querySelector('.dictionary-manager-custom-value').value;
					if (customValue.trim()) {
						dictionary.entries[msgid] = customValue;
					}
				}
			});
			
			const addedCount = filterAndAddEntries(dictionary, entries);
			localStorage.setItem(`dictionary-${dictionary.metadata.language}`, JSON.stringify(dictionary));
			renderDictionary(dictionary);
			statusDiv.textContent = `Resolved ${matches.length} conflicts and added ${addedCount} new entries`;
			matchesContainer.remove();
		});
		
		matchesContainer.appendChild(confirmBtn);
		outputDiv.appendChild(matchesContainer);
	}
	// Function to count words in a string
	function countWords(str) {
		return str.trim().split(/\s+/).filter(word => word.length > 0).length;
	}
	
	// Function to filter and add entries to dictionary
	function filterAndAddEntries(dictionary, entries) {
		const wordCountSetting = document.getElementById('dictionary-manager-wordCount').value;
		let addedCount = 0;
		
		entries.forEach(entry => {
			if (!entry.msgid) return;
			
			const wordCount = countWords(entry.msgid);
			const isSingleWord = wordCount === 1;
			const isTwoWords = wordCount === 2;
			
			let shouldAdd = false;
			
			if (wordCountSetting === "1" && isSingleWord) {
				shouldAdd = true;
				} else if (wordCountSetting === "2" && isTwoWords) {
				shouldAdd = true;
				} else if (wordCountSetting === "both" && (isSingleWord || isTwoWords)) {
				shouldAdd = true;
			}
			
			if (shouldAdd && !dictionary.entries[entry.msgid]) {
				dictionary.entries[entry.msgid] = entry.msgstr;
				addedCount++;
			}
		});
		
		return addedCount;
	}
	// Function to handle new entry creation
	function addNewEntry() {
		if (!currentDictionary) {
			statusDiv.textContent = 'Please load a dictionary first';
			return;
		}
		
		const outputDiv = document.getElementById('dictionary-manager-dictionaryOutput');
		
		// Create new entry form
		const newEntryForm = document.createElement('div');
		newEntryForm.className = 'dictionary-manager-new-entry-form';
		newEntryForm.innerHTML = `
		<div class="dictionary-manager-summary">Add New Dictionary Entry</div>
		<div class="dictionary-manager-new-entry-fields">
		<div class="dictionary-manager-input-box">
        <label class="dictionary-manager-label">Key:</label>
        <input type="text" id="dictionary-manager-newEntryKey" class="dictionary-manager-input">
		</div>
		<div class="dictionary-manager-input-box">
        <label class="dictionary-manager-label">Value:</label>
        <textarea id="dictionary-manager-newEntryValue" class="dictionary-manager-textarea" rows="3"></textarea>
		</div>
		<div class="dictionary-manager-button-group">
        <button id="dictionary-manager-saveNewEntry" class="dictionary-manager-btn dictionary-manager-btn-primary">Save</button>
        <button id="dictionary-manager-cancelNewEntry" class="dictionary-manager-btn dictionary-manager-btn-light">Cancel</button>
		</div>
		</div>
		`;
		
		outputDiv.prepend(newEntryForm);
		
		// Focus on key input
		document.getElementById('dictionary-manager-newEntryKey').focus();
		
		// Add event listeners
		document.getElementById('dictionary-manager-saveNewEntry').addEventListener('click', saveNewEntry);
		document.getElementById('dictionary-manager-cancelNewEntry').addEventListener('click', () => {
			newEntryForm.remove();
		});
	}
	
	function saveNewEntry() {
		const keyInput = document.getElementById('dictionary-manager-newEntryKey');
		const valueInput = document.getElementById('dictionary-manager-newEntryValue');
		const key = keyInput.value.trim();
		const value = valueInput.value.trim();
		
		if (!key) {
			statusDiv.textContent = 'Error: Key cannot be empty';
			keyInput.focus();
			return;
		}
		
		if (!value) {
			statusDiv.textContent = 'Error: Value cannot be empty';
			valueInput.focus();
			return;
		}
		
		if (currentDictionary.entries[key]) {
			if (!confirm(`An entry for "${key}" already exists. Overwrite it?`)) {
				return;
			}
		}
		
		currentDictionary.entries[key] = value;
		saveCurrentDictionary();
		renderDictionary(currentDictionary);
		statusDiv.textContent = `Added new entry: ${key.substring(0, 30)}${key.length > 30 ? '...' : ''}`;
	}
	
	// Function to filter dictionary entries
	function filterDictionary() {
		if (!currentDictionary) return;
		
		const searchInput = document.getElementById('dictionary-manager-searchInput').value.toLowerCase();
		const filterValue = document.getElementById('dictionary-manager-filterSelect').value;
		
		const rows = document.querySelectorAll('#dictionary-manager-dictionaryOutput tr[data-key]');
		
		rows.forEach(row => {
			const key = decodeURIComponent(row.dataset.key).toLowerCase();
			let shouldShow = true;
			
			// Apply search filter
			if (searchInput && !key.includes(searchInput)) {
				shouldShow = false;
			}
			
			// Apply alphabetical filter
			if (shouldShow && filterValue !== 'all') {
				const firstChar = key.charAt(0).toLowerCase();
				
				switch(filterValue) {
					case 'a-c': shouldShow = firstChar >= 'a' && firstChar <= 'c'; break;
					case 'd-f': shouldShow = firstChar >= 'd' && firstChar <= 'f'; break;
					case 'g-i': shouldShow = firstChar >= 'g' && firstChar <= 'i'; break;
					case 'j-l': shouldShow = firstChar >= 'j' && firstChar <= 'l'; break;
					case 'm-o': shouldShow = firstChar >= 'm' && firstChar <= 'o'; break;
					case 'p-r': shouldShow = firstChar >= 'p' && firstChar <= 'r'; break;
					case 's-u': shouldShow = firstChar >= 's' && firstChar <= 'u'; break;
					case 'v-z': shouldShow = firstChar >= 'v' && firstChar <= 'z'; break;
				}
			}
			
			if (shouldShow) {
				row.classList.remove('dictionary-manager-entry-hidden');
				} else {
				row.classList.add('dictionary-manager-entry-hidden');
			}
		});
		
		// Update status with visible count
		const visibleCount = document.querySelectorAll('#dictionary-manager-dictionaryOutput tr[data-key]:not(.dictionary-manager-entry-hidden)').length;
		const totalCount = Object.keys(currentDictionary.entries).length;
		document.querySelector('.dictionary-manager-summary').textContent = 
		`Dictionary: ${currentDictionary.metadata.language} | Showing ${visibleCount} of ${totalCount} entries`;
	}
	processBtn.addEventListener('click', async () => {
		statusDiv.textContent = 'Processing...';
		
		try {
			const content = await getPoContent();
			if (!content) {
				statusDiv.textContent = 'Error: No .po content found';
				return;
			}
			
			const { header } = extractHeader(content);
			const languageLine = extractLanguageLine(header);
			
			if (!languageLine) {
				statusDiv.textContent = 'Error: No language found in PO header';
				return;
			}
			
			const languagePo = cleanLanguageCode(languageLine);
			const selectedLanguage = document.getElementById('dictionary-manager-language').value;
			
			if (languagePo !== selectedLanguage) {
				const warning = `Warning: PO language (${languagePo}) doesn't match selected language (${selectedLanguage})`;
				console.warn(warning);
				statusDiv.textContent = warning;
				return;
			}
			
			console.log(`Language validation passed: ${languagePo} === ${selectedLanguage}`);
			statusDiv.textContent = 'Language validation passed. Checking dictionary...';
			
			// Step 3: Check for existing dictionary container
			const dictionaryKey = `dictionary-${languagePo}`;
			let dictionary = JSON.parse(localStorage.getItem(dictionaryKey));
			
			if (dictionary) {
				console.log(`Found existing dictionary for ${languagePo}`);
				statusDiv.textContent = `Loaded existing dictionary for ${languagePo}`;
				} else {
				console.log(`Creating new dictionary for ${languagePo}`);
				dictionary = createDictionaryContainer(languagePo);
				statusDiv.textContent = `Created new dictionary for ${languagePo}`;
			}
			
			// Render the dictionary
			renderDictionary(dictionary);
			console.log('Dictionary displayed in output area');
			currentDictionary = dictionary;
			
			
            const entries = parsePoEntries(content);
            
            // STEP 4: Handle dictionary matches
            const matches = processDictionaryMatches(dictionary, entries);
            if (matches.length > 0) {
                renderMatches(matches, dictionary, entries);  // Modified function
                statusDiv.textContent = `Found ${matches.length} dictionary matches - review below`;
                return;  // Pause process until user confirms
			}
            
            // STEP 5: Proceed if no matches found
            const addedCount = filterAndAddEntries(dictionary, entries);
            localStorage.setItem(`dictionary-${languagePo}`, JSON.stringify(dictionary));
            renderDictionary(dictionary);
            statusDiv.textContent = `Added ${addedCount} new entries`;
			} catch (error) {
            statusDiv.textContent = `Error: ${error.message}`;
		}
	});
    loadBtn.addEventListener('click', loadDictionary);
    saveDictBtn.addEventListener('click', () => {
        if (currentDictionary) {
            saveCurrentDictionary();
			} else {
            statusDiv.textContent = 'No dictionary loaded to save';
		}
	});
    downloadBtn.addEventListener('click', downloadCurrentDictionary);
    clearDictBtn.addEventListener('click', clearCurrentDictionary);
    uploadDictBtn.addEventListener('click', uploadDictionary);
	document.getElementById('dictionary-manager-newEntryBtn').addEventListener('click', addNewEntry);
	document.getElementById('dictionary-manager-searchInput').addEventListener('input', filterDictionary);
	document.getElementById('dictionary-manager-filterSelect').addEventListener('change', filterDictionary);
    // Enable dictionary buttons
    downloadBtn.disabled = false;
	function escapePoString(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function replaceMsgstrInBlock(block, newMsgstr) {
    const escapedMsgstr = escapePoString(newMsgstr);
    if (block.includes('msgstr "')) {
        return block.replace(/msgstr\s+"([^"]*)"/, `msgstr "${escapedMsgstr}"`);
    }
    if (block.includes('#~ msgstr "')) {
        return block.replace(/#~ msgstr\s+"([^"]*)"/, `#~ msgstr "${escapedMsgstr}"`);
    }
    return block;
}

async function applyDictionary() {
    statusDiv.textContent = 'Applying dictionary...';
    
    try {
        const content = await getPoContent();
        if (!content) {
            statusDiv.textContent = 'Error: No .po content found';
            return;
        }
        
        // Store original content before any changes
        originalPoContent = content;
        const language = document.getElementById('dictionary-manager-language').value;
        const dictKey = `dictionary-${language}`;
        const storedDict = localStorage.getItem(dictKey);
        const containerExists = storedDict !== null;
        
        console.log(`Dictionary container exists: ${containerExists}`);
        
        // Clear previous suggestions
        const suggestionsOutput = document.getElementById('dictionary-manager-suggestionsOutput');
        suggestionsOutput.innerHTML = '';
        
        // Split content into blocks
        const blocks = content.split(/\n\n/);
        let modifiedBlocks = [...blocks];
        let matches = [];
        
        if (containerExists) {
            const dictionary = JSON.parse(storedDict);
            const applyMode = document.getElementById('dictionary-manager-applyMode').value;
            
            // Process each block
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const { msgid, msgstr } = parsePoBlock(block);
                
                if (msgid && dictionary.entries[msgid]) {
                    const dictValue = dictionary.entries[msgid];
                    matches.push({
                        index: i,
                        msgid: msgid,
                        original: msgstr || '',
                        dictionary: dictValue
                    });
                    
                    // Auto-apply mode: replace immediately
                    if (applyMode === 'auto') {
                        modifiedBlocks[i] = replaceMsgstrInBlock(block, dictValue);
                    }
                }
            }
            
            console.log(`Found ${matches.length} dictionary matches`);
            
            if (matches.length > 0) {
                // Suggest mode: show comparison with selection options
                if (applyMode === 'suggest') {
                    // Build suggestions table
                    let tableHTML = `
                    <table class="dictionary-manager-suggestions-table">
                        <thead>
                            <tr>
                                <th>Key (msgid)</th>
                                <th>Original Translation</th>
                                <th>Dictionary Value</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                    `;
                    
                    matches.forEach(match => {
                        tableHTML += `
                            <tr>
                                <td>${match.msgid}</td>
                                <td>${match.original}</td>
                                <td>${match.dictionary}</td>
                                <td>
                                    <label>
                                        <input type="radio" name="action-${match.index}" value="original" checked>
                                        Keep Original
                                    </label>
                                    <label>
                                        <input type="radio" name="action-${match.index}" value="dictionary">
                                        Use Dictionary
                                    </label>
                                </td>
                            </tr>
                        `;
                    });
                    
                    tableHTML += `</tbody></table>
                    <div class="dictionary-manager-button-group" style="margin-top:15px;">
                        <button id="confirm-changes" class="dictionary-manager-btn dictionary-manager-btn-primary">Confirm Changes</button>
                    </div>`;
                    
                    suggestionsOutput.innerHTML = tableHTML;
                    
                    // Add event listener for confirm button
                    document.getElementById('confirm-changes').addEventListener('click', () => {
                        // Apply selected changes
                        matches.forEach(match => {
                            const selectedAction = document.querySelector(`input[name="action-${match.index}"]:checked`).value;
                            if (selectedAction === 'dictionary') {
                                modifiedBlocks[match.index] = replaceMsgstrInBlock(
                                    blocks[match.index], 
                                    match.dictionary
                                );
                            }
                        });
                        
                        // Update output
                        const outputDiv = document.getElementById('dictionary-manager-applicationOutput');
                        outputDiv.textContent = modifiedBlocks.join('\n\n');
                        
                        statusDiv.textContent = `Applied ${matches.length} changes to .po file`;
                    });
                } else { // auto mode
                    suggestionsOutput.innerHTML = `
                        <div class="dictionary-manager-summary">
                            ${matches.length} dictionary matches found and applied
                        </div>
                    `;
                }
            } else {
                suggestionsOutput.innerHTML = `
                    <div class="dictionary-manager-summary">
                        No dictionary matches found in .po file
                    </div>
                `;
            }
        }
        
        // Update output
        const outputDiv = document.getElementById('dictionary-manager-applicationOutput');
        outputDiv.textContent = modifiedBlocks.join('\n\n');
        
        statusDiv.textContent = `Applied dictionary to .po file (Container exists: ${containerExists})`;
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
    }
}

function parsePoBlock(block) {
    let msgid = null;
    let msgstr = null;
    
    // Try to match msgid
    const msgidMatch = block.match(/(?:#~ *)?msgid\s+"(.*?[^\\])"/);
    if (msgidMatch) {
        msgid = msgidMatch[1].replace(/\\"/g, '"').trim();
    }
    
    // Try to match msgstr
    const msgstrMatch = block.match(/(?:#~ *)?msgstr\s+"(.*?[^\\])"/);
    if (msgstrMatch) {
        msgstr = msgstrMatch[1].replace(/\\"/g, '"').trim();
    }
    
    return { msgid, msgstr };
}

async function downloadModifiedPo() {
    const outputDiv = document.getElementById('dictionary-manager-applicationOutput');
    const modifiedContent = outputDiv.textContent;
    
    if (!modifiedContent) {
        statusDiv.textContent = 'Error: No modified content to download';
        return;
    }
    
    // Compare line counts using stored original content
    const originalLines = originalPoContent ? originalPoContent.split('\n').length : 0;
    const modifiedLines = modifiedContent.split('\n').length;
    
    console.log(`Line count comparison - Original: ${originalLines}, Modified: ${modifiedLines}`);
    statusDiv.textContent = `Line count: Original ${originalLines}, Modified ${modifiedLines} (difference: ${Math.abs(originalLines - modifiedLines)})`;
    
    // Determine file name
    let fileName = 'modified_dictionary.po';
    if (fileInput.files.length > 0) {
        const originalName = fileInput.files[0].name;
        fileName = originalName.replace('.po', '_modified.po');
    }
    
    // Create and trigger download
    const blob = new Blob([modifiedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
	
});