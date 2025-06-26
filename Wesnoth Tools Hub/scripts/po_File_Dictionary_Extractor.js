// DOM elements with new prefix
const fileInput = document.getElementById('dictionary-manager-fileInput');
const poContent = document.getElementById('dictionary-manager-poContent');
const languageSelect = document.getElementById('dictionary-manager-language');
const wordCountSelect = document.getElementById('dictionary-manager-wordCount');
const processBtn = document.getElementById('dictionary-manager-processBtn');
const downloadBtn = document.getElementById('dictionary-manager-downloadBtn');
const uploadDictBtn = document.getElementById('dictionary-manager-uploadDictBtn');
const dictUploadInput = document.getElementById('dictionary-manager-dictUploadInput');
const dictionaryOutput = document.getElementById('dictionary-manager-dictionaryOutput');
const statusDiv = document.getElementById('dictionary-manager-status');
const saveDictBtn = document.getElementById('dictionary-manager-saveDictBtn');
const applyDictBtn = document.getElementById('dictionary-manager-applyDictBtn');
const clearDictBtn = document.getElementById('dictionary-manager-clearDictBtn');
const applyMode = document.getElementById('dictionary-manager-applyMode');
const applicationOutput = document.getElementById('dictionary-manager-applicationOutput');
const downloadModifiedBtn = document.getElementById('dictionary-manager-downloadModifiedBtn');

// State variables
let dictionary = {};
let currentLanguage = 'es'; // Default to Spanish
let modifiedContent = '';

// Event listeners
processBtn.addEventListener('click', processFiles);
downloadBtn.addEventListener('click', downloadDictionary);
uploadDictBtn.addEventListener('click', () => dictUploadInput.click());
dictUploadInput.addEventListener('change', handleDictionaryUpload);
languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
});
saveDictBtn.addEventListener('click', saveDictionaryToLocal);
applyDictBtn.addEventListener('click', applyDictionary);
clearDictBtn.addEventListener('click', clearDictionary);
downloadModifiedBtn.addEventListener('click', downloadModifiedPo);

function processFiles() {
    const files = fileInput.files;
    const content = poContent.value.trim();
    
    if (files.length === 0 && content === '') {
        showStatus('Please upload or paste .po file content', 'error');
        return;
    }
    
    dictionary = {}; // Reset dictionary
    
    // Process uploaded files
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.name.endsWith('.po')) {
                showStatus(`Skipping non-.po file: ${file.name}`, 'error');
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                parsePoContent(e.target.result, file.name);
                if (i === files.length - 1 && content === '') {
                    finishProcessing();
                }
            };
            reader.readAsText(file);
        }
    }
    
    // Process pasted content
    if (content !== '') {
        parsePoContent(content, 'pasted-content.po');
        finishProcessing();
    }
}

function parsePoContent(content, filename) {
    const lines = content.split('\n');
    let currentMsgid = '';
    let currentMsgidPlural = '';
    let currentMsgstr = '';
    let currentMsgstrPlural = {};
    let inMsgstr = false;
    let inMsgstrPlural = false;
    let pluralIndex = 0;
    
    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('msgid "')) {
            // New message starts
            if (currentMsgid && currentMsgstr) {
                addToDictionaryIfMatchesWordCount(currentMsgid, currentMsgstr);
            }
            
            // Reset state
            currentMsgid = extractQuotedContent(line);
            currentMsgstr = '';
            inMsgstr = false;
            inMsgstrPlural = false;
        }
        else if (line.startsWith('msgid_plural "')) {
            currentMsgidPlural = extractQuotedContent(line);
            currentMsgstrPlural = {};
            inMsgstrPlural = true;
        }
        else if (line.startsWith('msgstr "')) {
            inMsgstr = true;
            inMsgstrPlural = false;
            currentMsgstr = extractQuotedContent(line);
        }
        else if (line.startsWith('msgstr[')) {
            inMsgstr = false;
            inMsgstrPlural = true;
            const bracketIndex = line.indexOf(']');
            pluralIndex = parseInt(line.substring(7, bracketIndex));
            currentMsgstrPlural[pluralIndex] = extractQuotedContent(line);
        }
        else if ((inMsgstr || inMsgstrPlural) && line.startsWith('"') && line.endsWith('"')) {
            const content = extractQuotedContent(line);
            if (inMsgstr) {
                currentMsgstr += content;
            } else if (inMsgstrPlural) {
                currentMsgstrPlural[pluralIndex] += content;
            }
        }
    }
    
    // Add the last message if any
    if (currentMsgid && currentMsgstr) {
        addToDictionaryIfMatchesWordCount(currentMsgid, currentMsgstr);
    }
    
    // Add plural forms if any
    if (currentMsgidPlural && Object.keys(currentMsgstrPlural).length > 0) {
        for (const [index, translation] of Object.entries(currentMsgstrPlural)) {
            const pluralKey = `${currentMsgid} | ${currentMsgidPlural} [${index}]`;
            addToDictionaryIfMatchesWordCount(pluralKey, translation);
        }
    }
    
    showStatus(`Processed: ${filename}`, 'success');
}

function addToDictionaryIfMatchesWordCount(key, value) {
    if (!key || !value) return;
    
    // Clean up key and value (remove escaped characters)
    key = key.replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    value = value.replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    
    if (!key || !value) return;
    
    // Count words in the key (msgid)
    const words = key.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Check if this entry matches our word count criteria
    const wordCountOption = wordCountSelect.value;
    if (
        wordCountOption === 'both' || 
        (wordCountOption === '1' && wordCount === 1) ||
        (wordCountOption === '2' && wordCount === 2)
    ) {
        dictionary[key] = value;
    }
}

function extractQuotedContent(line) {
    const start = line.indexOf('"') + 1;
    const end = line.lastIndexOf('"');
    return line.substring(start, end);
}

function finishProcessing() {
    showStatus(`Processing complete. ${Object.keys(dictionary).length} entries extracted.`, 'success');
    displayDictionary();
    downloadBtn.disabled = false;
}

function displayDictionary() {
    if (Object.keys(dictionary).length === 0) {
        dictionaryOutput.innerHTML = '<p class="dictionary-manager-no-entries">No dictionary entries found matching the criteria.</p>';
        return;
    }
    
    // Sort dictionary alphabetically
    const sortedKeys = Object.keys(dictionary).sort((a, b) => a.localeCompare(b));
    
    let html = '';
    for (const key of sortedKeys) {
        const wordCount = key.split(/\s+/).filter(w => w.length > 0).length;
        html += `
        <div class="dictionary-manager-entry">
            <div class="dictionary-manager-msgid">${escapeHtml(key)} <span class="dictionary-manager-word-count">(${wordCount} word${wordCount !== 1 ? 's' : ''})</span></div>
            <div class="dictionary-manager-msgstr">${escapeHtml(dictionary[key])}</div>
        </div>
        `;
    }
    
    dictionaryOutput.innerHTML = html;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}

function downloadDictionary() {
    if (Object.keys(dictionary).length === 0) {
        showStatus('Dictionary is empty', 'error');
        return;
    }
    
    // Add metadata to the dictionary
    const dictWithMeta = {
        metadata: {
            language: currentLanguage,
            wordCount: wordCountSelect.value,
            created: new Date().toISOString(),
            version: "1.0",
            source: "po-file-extractor"
        },
        entries: dictionary
    };
    
    const dataStr = JSON.stringify(dictWithMeta, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `dictionary-${currentLanguage}-${wordCountSelect.value}-words-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showStatus(`Dictionary downloaded as ${exportFileName}`, 'success');
}

function handleDictionaryUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const uploadedDict = JSON.parse(e.target.result);
            
            // Check if it's a dictionary file with our expected structure
            if (uploadedDict.entries || uploadedDict.metadata) {
                if (uploadedDict.entries) {
                    dictionary = uploadedDict.entries;
                } else {
                    // Handle case where it's just a plain dictionary
                    dictionary = uploadedDict;
                }
                
                // Update settings from metadata if available
                if (uploadedDict.metadata) {
                    if (uploadedDict.metadata.language) {
                        currentLanguage = uploadedDict.metadata.language;
                        languageSelect.value = currentLanguage;
                    }
                    if (uploadedDict.metadata.wordCount) {
                        wordCountSelect.value = uploadedDict.metadata.wordCount;
                    }
                }
                
                showStatus('Dictionary uploaded successfully', 'success');
                displayDictionary();
                downloadBtn.disabled = false;
            } else {
                showStatus('The file does not contain valid dictionary entries', 'error');
            }
        } catch (err) {
            showStatus('Error parsing dictionary file', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function saveDictionaryToLocal() {
    const dictToSave = {
        entries: dictionary,
        language: currentLanguage,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('poDictionary', JSON.stringify(dictToSave));
    showStatus('Dictionary saved to localStorage', 'success');
}

function loadDictionaryFromLocal() {
    const savedDict = localStorage.getItem('poDictionary');
    if (savedDict) {
        try {
            const parsed = JSON.parse(savedDict);
            dictionary = parsed.entries || {};
            currentLanguage = parsed.language || currentLanguage;
            languageSelect.value = currentLanguage;
            showStatus('Dictionary loaded from localStorage', 'success');
            displayDictionary();
        } catch (e) {
            showStatus('Error loading dictionary', 'error');
        }
    }
}

function clearDictionary() {
    if (confirm('Clear current dictionary? All entries will be permanently removed.')) {
        dictionary = {};
        localStorage.removeItem('poDictionary');
        displayDictionary();
        showStatus('Dictionary cleared', 'success');
    }
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `dictionary-manager-status dictionary-manager-${type}`;
}

// Load dictionary on page load
document.addEventListener('DOMContentLoaded', loadDictionaryFromLocal);

// Enhanced dictionary application
function applyDictionary() {
    const files = fileInput.files;
    const content = poContent.value.trim();
    
    if (files.length === 0 && content === '') {
        showStatus('Please upload or paste .po file content', 'error');
        return;
    }
    
    if (Object.keys(dictionary).length === 0) {
        showStatus('Dictionary is empty', 'error');
        return;
    }
    
    const isAutoApply = applyMode.value === 'auto';
    let poContentToApply = content;
    
    if (files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            processPoApplication(e.target.result, isAutoApply);
        };
        reader.readAsText(files[0]);
    } else {
        processPoApplication(poContentToApply, isAutoApply);
    }
}

function processPoApplication(content, isAutoApply) {
    const lines = content.split('\n');
    let output = [];
    let currentMsgid = '';
    let currentMsgstr = '';
    let inMsgstr = false;
    let inPlural = false;
    let suggestions = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('msgid "')) {
            // Save previous entry
            if (currentMsgid && currentMsgstr) {
                const [processed, suggestion] = processDictionaryMatch(
                    currentMsgid, 
                    currentMsgstr, 
                    isAutoApply
                );
                output.push(processed);
                if (suggestion) suggestions.push(suggestion);
            }
            
            // Reset state
            currentMsgid = extractQuotedContent(line);
            currentMsgstr = '';
            inMsgstr = false;
            inPlural = false;
            output.push(lines[i]); // Keep the msgid line
        }
        else if (line.startsWith('msgid_plural "')) {
            inPlural = true;
            output.push(lines[i]);
            continue;
        }
        else if (line.startsWith('msgstr "') && !inPlural) {
            inMsgstr = true;
            currentMsgstr = extractQuotedContent(line);
            // We'll process this later
        }
        else if (line.startsWith('msgstr[')) {
            inMsgstr = true;
            inPlural = true;
            output.push(lines[i]);
            continue;
        }
        else if (inMsgstr && line.startsWith('"') && line.endsWith('"')) {
            currentMsgstr += extractQuotedContent(line);
        }
        else {
            // End of current entry or other line
            if (currentMsgid && currentMsgstr) {
                const [processed, suggestion] = processDictionaryMatch(
                    currentMsgid, 
                    currentMsgstr, 
                    isAutoApply
                );
                output.push(processed);
                if (suggestion) suggestions.push(suggestion);
                
                // Reset translation state
                currentMsgstr = '';
                inMsgstr = false;
            }
            output.push(lines[i]);
        }
    }
    
    // Handle last entry
    if (currentMsgid && currentMsgstr) {
        const [processed, suggestion] = processDictionaryMatch(
            currentMsgid, 
            currentMsgstr, 
            isAutoApply
        );
        output.push(processed);
        if (suggestion) suggestions.push(suggestion);
    }
    
    modifiedContent = output.join('\n');
    applicationOutput.innerHTML = isAutoApply 
        ? `<pre>${escapeHtml(modifiedContent)}</pre>` 
        : formatSuggestions(suggestions);
    
    downloadModifiedBtn.disabled = false;
    showStatus(isAutoApply 
        ? 'Dictionary applied automatically' 
        : `${suggestions.length} suggestions generated`, 'success');
}

function processDictionaryMatch(msgid, msgstr, isAutoApply) {
    const cleanMsgid = msgid.replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    
    // Check for plural forms
    const pluralMatch = cleanMsgid.match(/^(.*) \| (.*) \[(\d+)\]$/);
    let cleanKey = cleanMsgid;
    let pluralIndex = -1;
    
    if (pluralMatch) {
        cleanKey = pluralMatch[1];
        pluralIndex = parseInt(pluralMatch[3]);
    }
    
    if (dictionary[cleanKey]) {
        const suggested = pluralIndex >= 0 
            ? dictionary[cleanKey].split('|')[pluralIndex]?.trim() || ''
            : dictionary[cleanKey];
        
        if (isAutoApply) {
            // Auto-apply mode - replace translation
            return [formatPoLine('msgstr', suggested), null];
        } else {
            // Suggestion mode - show diff
            return [formatPoLine('msgstr', msgstr), { 
                msgid: cleanKey, 
                original: msgstr, 
                suggested 
            }];
        }
    }
    
    // No match - return original
    return [formatPoLine('msgstr', msgstr), null];
}

function formatPoLine(prefix, content) {
    // Format content for .po file (escape and split long lines)
    let escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
    
    // Simple line wrapping
    const maxLineLength = 80;
    let formatted = `${prefix} "${escaped.substring(0, maxLineLength)}"`;
    let pos = maxLineLength;
    
    while (pos < escaped.length) {
        const chunk = escaped.substring(pos, pos + maxLineLength);
        formatted += `\n"${chunk}"`;
        pos += maxLineLength;
    }
    
    return formatted;
}

function formatSuggestions(suggestions) {
    if (suggestions.length === 0) {
        return '<p class="dictionary-manager-no-suggestions">No suggestions found in dictionary</p>';
    }
    
    let html = '<div class="dictionary-manager-suggestions-container">';
    html += `<p class="dictionary-manager-suggestion-count">Found ${suggestions.length} suggestions:</p>`;
    
    suggestions.forEach(suggestion => {
        html += `
        <div class="dictionary-manager-suggestion">
            <div class="dictionary-manager-msgid">${escapeHtml(suggestion.msgid)}</div>
            <div class="dictionary-manager-original">Original: ${escapeHtml(suggestion.original)}</div>
            <div class="dictionary-manager-suggested">Suggested: ${escapeHtml(suggestion.suggested)}</div>
        </div>`;
    });
    
    html += '</div>';
    return html;
}

function downloadModifiedPo() {
    const blob = new Blob([modifiedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `modified-${new Date().toISOString().slice(0, 10)}.po`;
    link.click();
    
    URL.revokeObjectURL(url);
    showStatus('Modified .po file downloaded', 'success');
}