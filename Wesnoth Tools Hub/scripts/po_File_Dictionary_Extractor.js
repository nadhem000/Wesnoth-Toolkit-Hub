document.addEventListener('DOMContentLoaded', () => {
    const processBtn = document.getElementById('dictionary-manager-processBtn');
    const fileInput = document.getElementById('dictionary-manager-fileInput');
    const poContentTextarea = document.getElementById('dictionary-manager-poContent');
    const statusDiv = document.getElementById('dictionary-manager-status');
	
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
		outputDiv.innerHTML = '';
		
		const table = document.createElement('table');
		table.style.width = '100%';
		table.style.borderCollapse = 'collapse';
		table.style.marginTop = '10px';
		
		// Create header row
		const headerRow = document.createElement('tr');
		const keyHeader = document.createElement('th');
		keyHeader.textContent = 'Key';
		keyHeader.style.borderBottom = '2px solid #3498db';
		keyHeader.style.padding = '8px';
		keyHeader.style.textAlign = 'left';
		
		const valueHeader = document.createElement('th');
		valueHeader.textContent = 'Value';
		valueHeader.style.borderBottom = '2px solid #3498db';
		valueHeader.style.padding = '8px';
		valueHeader.style.textAlign = 'left';
		
		headerRow.appendChild(keyHeader);
		headerRow.appendChild(valueHeader);
		table.appendChild(headerRow);
		
		// Add entries
		const entries = dictionary.entries;
		for (const [key, value] of Object.entries(entries)) {
			const row = document.createElement('tr');
			row.style.borderBottom = '1px solid #eee';
			
			const keyCell = document.createElement('td');
			keyCell.textContent = key;
			keyCell.style.padding = '8px';
			
			const valueCell = document.createElement('td');
			valueCell.textContent = value;
			valueCell.style.padding = '8px';
			
			row.appendChild(keyCell);
			row.appendChild(valueCell);
			table.appendChild(row);
		}
		
		outputDiv.appendChild(table);
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
});	