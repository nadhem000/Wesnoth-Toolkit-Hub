document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sourceText = document.getElementById('sourceText');
    const translatedText = document.getElementById('translatedText');
    const targetLang = document.getElementById('targetLang');
    const extractBtn = document.getElementById('extractBtn');
    const applyBtn = document.getElementById('applyBtn');
    const downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
    const uploadTranslationsBtn = document.getElementById('uploadTranslationsBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const sourceStats = document.getElementById('sourceStats');
    const translationTableContainer = document.getElementById('translationTableContainer');
    const uploadInputBtn = document.getElementById('uploadInputBtn');
    const downloadOutputBtn = document.getElementById('downloadOutputBtn');
const fuzzyAllBtn = document.getElementById('fuzzyAllBtn');
const unfuzzyAllBtn = document.getElementById('unfuzzyAllBtn');

    /**
     * Sample PO file content for initial demonstration
     * @constant {string}
     */
    const samplePoContent = `# Sample PO File
# Sample PO File
msgid ""
msgstr ""
"Project-Id-Version: Sample Project\n"
"POT-Creation-Date: 2023-01-01\n"
"PO-Revision-Date: 2023-01-01\n"
"Last-Translator: You <you@example.com>\n"
"Language-Team: \n"
"Language: en\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=6; plural= n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && "
"n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5;\n"
"X-Generator: Poedit 3.0\n"

#: sample/file.c:123
msgid "Hello world"
msgstr ""

#: sample/file.c:124
msgid "%d apple"
msgid_plural "%d apples"
msgstr[0] ""
msgstr[1] ""
msgstr[2] ""
msgstr[3] ""
msgstr[4] ""
msgstr[5] ""

#~ msgid "Old message"
#~ msgstr "Old translation"
`;

    // Initialize textarea with sample PO content
    sourceText.value = samplePoContent;

    /**
     * Handles PO content extraction when extract button is clicked
     * @listens extractBtn#click
     */
    extractBtn.addEventListener('click', function() {
    const poContent = sourceText.value.trim();
    if (!poContent) {
        alert('Please paste PO file content first');
        return;
    }

fuzzyAllBtn.addEventListener('click', function() {
    if (!window.currentMessages) {
        alert('Please extract strings first');
        return;
    }
    window.currentMessages.forEach(msg => {
        if (!msg.isObsolete) msg.fuzzy = true;
    });
    refreshTranslationTable();
});

unfuzzyAllBtn.addEventListener('click', function() {
    if (!window.currentMessages) {
        alert('Please extract strings first');
        return;
    }
    window.currentMessages.forEach(msg => {
        msg.fuzzy = false;
    });
    refreshTranslationTable();
});
    showLoading(true);
    setTimeout(() => {
        try {
            // Capture the returned value
const pluralForm = logPluralForm(poContent);
const explanations = explainPluralFormComprehensively(pluralForm);
window.pluralFormsExplanations = explanations;
            
            const extractionResult = extractPoStrings(poContent);
            displayExtractedStrings(extractionResult);
            applyBtn.disabled = false;
            downloadOriginalBtn.disabled = false;
        } catch (error) {
            console.error('Extraction error:', error);
            alert('Error extracting strings: ' + error.message);
        } finally {
            showLoading(false);
        }
    }, 100);
});

    /**
     * Applies translations to generate new PO file
     * @listens applyBtn#click
     */
    applyBtn.addEventListener('click', function() {
        if (!window.currentMessages) {
            alert('Please extract strings first');
            return;
        }

        showLoading(true);
        setTimeout(() => {
            try {
                const translatedContent = generateTranslatedPo(window.currentMessages, window.currentMetadata);
                translatedText.value = translatedContent;
                downloadOutputBtn.disabled = false;
                
                // Calculate and display translation statistics
                const translatedCount = window.currentMessages.filter(m => m.msgstr && !m.isObsolete).length;
                const totalCount = window.currentMessages.filter(m => !m.isObsolete).length;
                translatedStats.innerHTML = `
                    <p>Translated: ${translatedCount}/${totalCount} (${Math.round(translatedCount/totalCount*100)}%)</p>
                    <p>Obsolete: ${window.currentMessages.filter(m => m.isObsolete).length}</p>
                `;
            } catch (error) {
                console.error('Generation error:', error);
                alert('Error generating translation: ' + error.message);
            } finally {
                showLoading(false);
            }
        }, 100);
    });

    /**
     * Handles PO file upload for source content
     * @listens uploadInputBtn#click
     */
    uploadInputBtn.addEventListener('click', function() {
        let fileInput = document.getElementById('fileInput');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'fileInput';
            fileInput.style.display = 'none';
            fileInput.accept = '.po';
            document.body.appendChild(fileInput);
        }

        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                sourceText.value = e.target.result;
            };
            reader.readAsText(file);
            
            // Reset file input
            fileInput.value = '';
        };
        
        fileInput.click();
    });

    /**
     * Downloads translated PO file with language code in filename
     * @listens downloadOutputBtn#click
     */
    downloadOutputBtn.addEventListener('click', function() {
        if (!translatedText.value) {
            alert('No translated content to download');
            return;
        }

        const langCode = targetLang.value;
        const blob = new Blob([translatedText.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${langCode}.po`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    /**
     * Exports original strings for translation
     * @listens downloadOriginalBtn#click
     */
    
const downloadOptions = {
  downloadAll: 'all',
  downloadUntranslated: 'untranslated',
  downloadTranslated: 'translated',
  downloadFuzzy: 'fuzzy',
  downloadObsolete: 'obsolete',
  downloadwithContext: 'withContext',
  downloadCSV: 'csv'
};

Object.entries(downloadOptions).forEach(([elementId, optionType]) => {
  document.getElementById(elementId).addEventListener('click', function(e) {
    e.preventDefault();
    exportOriginalStrings(optionType);
  });
});
function exportOriginalStrings(optionType) {
  if (!window.currentMessages) {
    alert('Please extract strings first');
    return;
  }

  let contentParts = [];
  let filteredMessages = window.currentMessages;
  
  // Apply filters based on option type
  switch(optionType) {
    case 'untranslated':
      filteredMessages = filteredMessages.filter(m => !m.msgstr && !m.isObsolete);
      break;
    case 'translated':
      filteredMessages = filteredMessages.filter(m => m.msgstr && !m.isObsolete);
      break;
    case 'fuzzy':
      filteredMessages = filteredMessages.filter(m => m.fuzzy);
      break;
    case 'obsolete':
      filteredMessages = filteredMessages.filter(m => m.isObsolete);
      break;
    case 'withContext':
      // No special filtering, handled in output
      break;
    case 'csv':
      // Handled separately
      break;
    // 'all' falls through to default
  }

  // CSV Format
  if (optionType === 'csv') {
    const headers = ['ID', 'Context', 'Original Text', 'Status', 'Fuzzy', 'Translation'];
    const rows = [headers.join(',')];
    
    filteredMessages.forEach(msg => {
      if (msg.msgid === '') return;
      
      const context = [...msg.references, ...msg.comments]
        .map(c => c.replace(/"/g, '""'))
        .join('; ');
      
      const row = [
        `"${msg.id}"`,
        `"${context}"`,
        `"${msg.msgid.replace(/"/g, '""')}"`,
        `"${msg.msgstr ? 'Translated' : msg.isObsolete ? 'Obsolete' : 'Untranslated'}"`,
        `"${msg.fuzzy ? 'Yes' : 'No'}"`,
        `"${(msg.msgstr || '').replace(/"/g, '""')}"`
      ];
      
      rows.push(row.join(','));
    });
    
    contentParts = rows;
  } 
  // With Context option - includes references and comments
  else if (optionType === 'withContext') {
    filteredMessages.forEach(msg => {
      if (msg.msgid === '') return;
      contentParts.push(`#${msg.id}`);
      
      // Include context (references and comments)
      msg.references.forEach(ref => contentParts.push(ref));
      msg.comments.forEach(comment => contentParts.push(comment));
      
      contentParts.push(msg.msgid);
      contentParts.push('\n\n==========\n\n');
    });
  }
  // All other options - simple format (no context)
  else {
    filteredMessages.forEach(msg => {
      if (msg.msgid === '') return;
      contentParts.push(`#${msg.id}`);
      contentParts.push(msg.msgid);
      contentParts.push('\n\n==========\n\n');
    });
  }

  // Remove trailing separator
  if (contentParts.length > 0) {
    contentParts = contentParts.slice(0, -1);
  }

  const content = contentParts.join('\n');
  const extension = optionType === 'csv' ? 'csv' : 'txt';
  const filename = optionType === 'withContext' ? 
    'original_strings_with_context' : 
    `original_strings_${optionType}`;

  const blob = new Blob([content], { type: optionType === 'csv' ? 
    'text/csv;charset=utf-8;' : 'text/plain' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

    /**
     * Processes uploaded translations and applies to current messages
     * @listens uploadTranslationsBtn#click
     */
    uploadTranslationsBtn.addEventListener('click', function() {
        if (!window.currentMessages) {
            alert('Please extract strings first');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.po';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            showLoading(true);
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const sections = content.split(/\s*==========\s*/);
                    const translations = {};
                    
                    // Parse translation sections
                    sections.forEach(section => {
                        const lines = section.split(/\r?\n/).filter(line => line.trim() !== '');
                        if (lines.length === 0) return;
                        
                        const idLine = lines[0];
                        if (!idLine.startsWith('#')) return;
                        
                        const id = idLine.substring(1).trim();
                        const translation = lines.slice(1).join('\n').trim();
                        
                        if (id && translation) {
                            translations[id] = translation;
                        }
                    });

                    // Apply translations to message objects
                    window.currentMessages.forEach(msg => {
                        if (translations[msg.id]) {
                            msg.msgstr = translations[msg.id];
                        }
                    });

                    // Refresh UI with updated translations
                    displayExtractedStrings({
                        messages: window.currentMessages,
                        metadata: window.currentMetadata
                    }, true);

                    alert('Translations uploaded successfully!');
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Error processing translations: ' + error.message);
                } finally {
                    showLoading(false);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });
});
/**
 * Removes contextual helper prefixes before the '^' character in translations
 * @param {string} translation - The translation string to process
 * @returns {string} Translation without helper prefixes
 */
function removeHelperPrefixes(translation) {
    return translation.replace(/^[^^]*\^/, '');
}
/**
 * Extracts and logs the plural form from the PO file header
 * @param {string} poContent - The full PO file content
 */
function logPluralForm(poContent) {
    const pluralFormMatch = poContent.match(/"Plural-Forms:\s*([\s\S]*?)\\n"/);
    if (pluralFormMatch && pluralFormMatch[1]) {
        const pluralForm = pluralFormMatch[1].replace(/\s*\n\s*"/g, '');
        console.log('Plural-Forms:', pluralForm);
        return pluralForm; // Return the value
    }
    console.log('No plural form found in PO file header');
    return null;
}
function explainPluralForm(pluralForm) {
    if (!pluralForm) {
        console.log('No plural form found in PO file header');
        return;
    }

    try {
        // Extract the expression after 'plural='
        const pluralExpr = pluralForm.split('plural=')[1].replace(/;$/, '');
        
        // Split into individual conditions
        const conditions = pluralExpr.split(/\s*:\s*/);
        
        // Process each condition
        const explanations = [];
        for (let i = 0; i < conditions.length; i++) {
            const [conditionPart, result] = conditions[i].split(/\s*\?\s*/);
            
            if (!conditionPart || result === undefined) {
                // Handle the final default case
                if (i === conditions.length - 1) {
                    explanations.push(`Otherwise: ${conditions[i]}`);
                }
                continue;
            }
            
            if (equalityMatch) {
                explanations[parseInt(result)] = `n=${equalityMatch[1]}`;
                continue;
            }
            
            // Change: Return only the range for modulo conditions
            if (modRangeMatch) {
                const start = parseInt(modRangeMatch[2]);
                const end = parseInt(modRangeMatch[3]);
                explanations[parseInt(result)] = `[${start},${end}]`;
                continue;
            }
            
            // Change: Return only the range for direct conditions
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1]);
                const end = parseInt(rangeMatch[2]);
                explanations[parseInt(result)] = `[${start},${end}]`;
                continue;
            }
            // Parse the condition
            const condition = conditionPart
                .replace(/\bn\b/g, 'n')
                .replace(/%/g, ' mod ')
                .replace(/&&/g, ' and ')
                .replace(/>=/g, '≥')
                .replace(/<=/g, '≤')
                .replace(/==/g, '=');
            
            explanations.push(`Form ${result}: ${condition}`);
        }
        
        console.log('Plural Forms Explanation:');
        console.log('-------------------------');
        explanations.forEach(explanation => console.log(explanation));
        
    } catch (error) {
        console.error('Error parsing plural form:', error);
        console.log('Raw plural form:', pluralForm);
    }
}
/**
 * Provides a comprehensive explanation of plural forms with example numbers
 * @param {string} pluralForm - The plural form string from the PO header
 */
function explainPluralFormComprehensively(pluralForm) {
    const explanations = [];
    if (!pluralForm) {
        console.log('No plural form found in PO file header');
        return explanations;
    }

    try {
        // Clean up plural form string
        pluralForm = pluralForm.replace(/"/g, '').replace(/\\n/g, '').trim();
        
        // Extract the expression after 'plural='
        const pluralExpr = pluralForm.split('plural=')[1].replace(/;$/, '');
        const conditions = pluralExpr.split(/\s*:\s*/);
        
        for (let i = 0; i < conditions.length; i++) {
            const [conditionPart, result] = conditions[i].split(/\s*\?\s*/);
            
            if (!conditionPart || result === undefined) {
                if (i === conditions.length - 1) {
                    explanations[parseInt(conditions[i])] = 'Otherwise';
                }
                continue;
            }
            
            // Handle simple equality conditions (n == number)
            const equalityMatch = conditionPart.match(/n\s*==\s*(\d+)/);
            if (equalityMatch) {
                explanations[parseInt(result)] = `n=${equalityMatch[1]}`;
                continue;
            }
            
            // Handle modulo range conditions (n%100>=3 && n%100<=10)
            const modRangeMatch = conditionPart.match(/n%(\d+)\s*>=\s*(\d+)\s*&&\s*n%\d+\s*<=\s*(\d+)/);
            if (modRangeMatch) {
                const start = parseInt(modRangeMatch[2]);
                const end = parseInt(modRangeMatch[3]);
                explanations[parseInt(result)] = `[${start},${end}]`;
                continue;
            }
            
            // Handle direct range conditions (n>=3 && n<=10)
            const rangeMatch = conditionPart.match(/n\s*>=\s*(\d+)\s*&&\s*n\s*<=\s*(\d+)/);
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1]);
                const end = parseInt(rangeMatch[2]);
                explanations[parseInt(result)] = `[${start},${end}]`;
                continue;
            }
            
            // Handle simple modulo conditions (n%10==1)
            const modEqualityMatch = conditionPart.match(/n%(\d+)\s*==\s*(\d+)/);
            if (modEqualityMatch) {
                const mod = parseInt(modEqualityMatch[1]);
                const value = parseInt(modEqualityMatch[2]);
                explanations[parseInt(result)] = `n%${mod}=${value}`;
                continue;
            }
            
            // Default case - return raw condition
            explanations[parseInt(result)] = conditionPart
                .replace(/\bn\b/g, 'n')
                .replace(/%/g, ' mod ')
                .replace(/&&/g, ' and ');
        }
        
    } catch (error) {
        console.error('Error parsing plural form:', error);
        console.log('Raw plural form:', pluralForm);
    }
    return explanations;
}

/**
 * Extracts PO file strings and metadata
 * @param {string} poContent - The content of the PO file
 * @returns {Object} Extraction result with messages, metadata and header block
 */
function extractPoStrings(poContent) {
    const lines = poContent.split('\n');
    let currentMsg = null;
    const messages = [];
    
    // Improved header detection logic
    let headerEndIndex = 0;
    let inHeader = true;
    let headerEndFound = false;
    
    // Identify header section boundaries
    for (; headerEndIndex < lines.length; headerEndIndex++) {
        const line = lines[headerEndIndex].trim();
        if (!line) {
            if (inHeader) {
                headerEndFound = true;
                break;
            }
            continue;
        }
        
        // Detect first non-header msgid entry
        if (line.startsWith('msgid ') && line !== 'msgid ""') {
            inHeader = false;
            headerEndFound = true;
            break;
        }
    }
    
    // Fallback if header boundary wasn't detected
    if (!headerEndFound) {
        headerEndIndex = lines.length;
    }
    
    // Extract header block
    const headerBlock = lines.slice(0, headerEndIndex).join('\n');
    window.currentHeaderBlock = headerBlock;

    let pendingComments = [];   // Accumulates translator comments
    let pendingReferences = []; // Accumulates reference locations
    let inPluralBlock = false;

    // Process each line after header
    for (let lineNumber = headerEndIndex; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];
        const trimmedLine = line.trim();

        if (!trimmedLine) continue; // Skip empty lines

        // Handle msgid declarations
        if (trimmedLine.startsWith('msgid ') || trimmedLine.startsWith('#~ msgid ')) {
            // Save previous message if exists
            if (currentMsg) {
                messages.push(currentMsg);
            }
            
            const isObsolete = trimmedLine.startsWith('#~');
            const startQuote = trimmedLine.indexOf('"');
            const endQuote = trimmedLine.lastIndexOf('"');
            let text = '';
            
            if (startQuote !== -1 && endQuote > startQuote) {
                text = trimmedLine.substring(startQuote + 1, endQuote);
            }
            
            currentMsg = {
                id: `msg-${messages.length + 1}`,
                isObsolete,
                fuzzy: false,
                msgid: text,
                msgstr: '',
                references: [...pendingReferences],
                comments: [...pendingComments],
                lineNumber: lineNumber + 1,
                complete: false,
                hasPlural: false
            };
            // Reset accumulators
            pendingComments = [];
            pendingReferences = [];
            inPluralBlock = false;
        }
        // Handle msgid_plural declarations
        else if (trimmedLine.startsWith('msgid_plural ') || trimmedLine.startsWith('#~ msgid_plural ')) {
            if (!currentMsg) continue;
            
            const isObsolete = trimmedLine.startsWith('#~');
            const startQuote = trimmedLine.indexOf('"');
            const endQuote = trimmedLine.lastIndexOf('"');
            let text = '';
            
            if (startQuote !== -1 && endQuote > startQuote) {
                text = trimmedLine.substring(startQuote + 1, endQuote);
            }
            
            currentMsg.hasPlural = true;
            currentMsg.msgid_plural = text;
            inPluralBlock = true;
        }
        // Handle msgstr declarations
        else if (trimmedLine.startsWith('msgstr ') || trimmedLine.startsWith('#~ msgstr ')) {
            if (!currentMsg) continue;
            
            if (inPluralBlock) {
                // This is msgstr[0] for plural forms
                const startQuote = trimmedLine.indexOf('"');
                const endQuote = trimmedLine.lastIndexOf('"');
                if (startQuote !== -1 && endQuote > startQuote) {
                    currentMsg.msgstr = [trimmedLine.substring(startQuote + 1, endQuote)];
                }
            } else {
                // Regular msgstr handling
                const startQuote = trimmedLine.indexOf('"');
                const endQuote = trimmedLine.lastIndexOf('"');
                if (startQuote !== -1 && endQuote > startQuote) {
                    currentMsg.msgstr = trimmedLine.substring(startQuote + 1, endQuote);
                }
            }
            currentMsg.complete = true;
        }
        // Handle msgstr[n] declarations for plural forms
        else if ((trimmedLine.startsWith('msgstr[') || trimmedLine.startsWith('#~ msgstr[')) && currentMsg?.hasPlural) {
            const startBracket = trimmedLine.indexOf('[');
            const endBracket = trimmedLine.indexOf(']');
            const index = parseInt(trimmedLine.substring(startBracket + 1, endBracket));
            
            const startQuote = trimmedLine.indexOf('"');
            const endQuote = trimmedLine.lastIndexOf('"');
            if (startQuote !== -1 && endQuote > startQuote) {
                const text = trimmedLine.substring(startQuote + 1, endQuote);
                if (!Array.isArray(currentMsg.msgstr)) {
                    currentMsg.msgstr = [];
                }
                currentMsg.msgstr[index] = text;
            }
        }
        // Handle multiline string continuations
else if (currentMsg && trimmedLine.endsWith('"') && 
        (trimmedLine.startsWith('"') || 
         (currentMsg.isObsolete && trimmedLine.startsWith('#~ "')))) {
    
    let content;
    if (trimmedLine.startsWith('"')) {
        content = trimmedLine.substring(1, trimmedLine.length - 1);
    } else {
        // FIX: Use substring(4) instead of substring(3) to remove '#~ "' completely
        content = trimmedLine.substring(4, trimmedLine.length - 1);
    }

    if (currentMsg.complete) {
        if (Array.isArray(currentMsg.msgstr)) {
            if (currentMsg.msgstr.length > 0) {
                currentMsg.msgstr[currentMsg.msgstr.length - 1] += content;
            }
        } else {
            currentMsg.msgstr += content;
        }
    } else {
        if (currentMsg.hasPlural && inPluralBlock) {
            currentMsg.msgid_plural += content;
        } else {
            currentMsg.msgid += content;
        }
    }
}
        // Capture reference locations
        else if (trimmedLine.startsWith('#:')) {
            pendingReferences.push(line);
        }
        // Capture translator comments
        else if (trimmedLine.startsWith('#.')) {
            pendingComments.push(line);
        }
        // Fuzzy Flag Detection
        else if (trimmedLine.startsWith('#, fuzzy') || trimmedLine.includes('fuzzy')) {
            currentMsg.fuzzy = true;
            pendingComments.push(line);
        }
        // Capture other comments (excluding obsolete markers)
        else if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('#~')) {
            pendingComments.push(line);
        }
    }

    // Add final message if exists
    if (currentMsg) {
        messages.push(currentMsg);
    }

    // Store messages and metadata globally
    window.currentMessages = messages;
    window.currentMetadata = extractMetadata(poContent);

    return {
        messages: messages,
        metadata: window.currentMetadata,
        headerBlock: headerBlock
    };
}

/**
 * Extracts metadata from PO file headers
 * @param {string} poContent - The full PO file content
 * @returns {Object} Key-value pairs of metadata
 */
function extractMetadata(poContent) {
    const metadata = {};
    const headerEnd = poContent.indexOf('msgid ""');
    if (headerEnd === -1) return metadata;

    const headerSection = poContent.substring(0, headerEnd);
    const headerLines = headerSection.split('\n');
    
    // Parse each metadata line
    for (const line of headerLines) {
        if (line.startsWith('"')) {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].replace(/"/g, '').trim();
                const value = parts.slice(1).join(':').replace(/\\n/g, '').replace(/"/g, '').trim();
                if (key && value) {
                    metadata[key] = value;
                }
            }
        }
    }
    
    return metadata;
}

/**
 * Generates translated PO file content from messages
 * @param {Array} messages - Message objects with translations
 * @param {Object} metadata - File metadata
 * @returns {string} Complete PO file content with translations
 */
function generateTranslatedPo(messages, metadata) {
    let header = window.currentHeaderBlock;
    const langCode = document.getElementById('targetLang').value;
    
    header = header.replace(
        /("Language: )\w+(\\n")/,
        `$1${langCode}$2`
    );

    let output = [];
    output.push(header);
    output.push('');

    messages.forEach(msg => {
        if (msg.msgid === '') return;

        /* msg.references.forEach(ref => output.push(ref));
        msg.comments.forEach(comment => output.push(comment)); */
        // Separate translator comments (#.) from other comments
        const translatorComments = msg.comments.filter(c => c.trim().startsWith('#.'));
        const otherComments = msg.comments.filter(c => !c.trim().startsWith('#.'));
        
        // Output comments in correct order: translator comments first, then references, then other comments
        translatorComments.forEach(comment => output.push(comment));
        msg.references.forEach(ref => output.push(ref));
        otherComments.forEach(comment => output.push(comment));

        if (msg.isObsolete) {
            output.push('#~ msgid "' + msg.msgid + '"');
            if (msg.hasPlural) {
                output.push('#~ msgid_plural "' + (msg.msgid_plural || '') + '"');
                if (Array.isArray(msg.msgstr)) {
                    msg.msgstr.forEach((str, index) => {
                        output.push('#~ msgstr[' + index + '] "' + (str || '') + '"');
                    });
                }
            } else {
                output.push('#~ msgstr "' + (msg.msgstr || '') + '"');
            }
        } else {
            output.push('msgid "' + msg.msgid + '"');
            if (msg.hasPlural) {
                output.push('msgid_plural "' + (msg.msgid_plural || '') + '"');
                if (Array.isArray(msg.msgstr)) {
                    msg.msgstr.forEach((str, index) => {
                        output.push('msgstr[' + index + '] "' + (str || '') + '"');
                    });
                }
            } else {
                output.push('msgstr "' + (msg.msgstr || '') + '"');
            }
        }
if (msg.fuzzy && !msg.isObsolete) {
    output.push('#, fuzzy');
}
        output.push('');
    });
    
    return output.join('\n');
}
/**
 * Displays extracted strings in a translation table
 * @param {Object} result - Extraction result object
 * @param {boolean} [forceRefresh=true] - Whether to force UI refresh
 */
function displayExtractedStrings(result, forceRefresh = true) {
    const { messages, metadata } = result;
    
    // Update statistics display
    sourceStats.innerHTML = `
        <p>Total strings: ${messages.length}</p>
        <p>Translated: ${messages.filter(m => m.msgstr).length}</p>
        <p>Obsolete: ${messages.filter(m => m.isObsolete).length}</p>
    `;
    
    // Construct table HTML structure
    let tableHTML = `
        <div class="translation-table-container">
            <table class="translation-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Context</th>
                        <th>Original Text</th>
                        <th>Plural Text</th>
                        <th>Translation</th>
                        <th>Plural Translations</th>
                        <th>Status</th>
                        <th>Fuzzy</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Process each message for table rows
    messages.forEach(msg => {
        if (msg.msgid === '') return;
        
        const status = msg.msgstr ? 'Translated' : msg.isObsolete ? 'Obsolete' : 'Untranslated';
        const statusClass = msg.msgstr ? 'translated' : msg.isObsolete ? 'obsolete' : 'untranslated';
        
        const contextLines = [];
        
        msg.references.forEach(ref => {
            let cleanRef = ref.replace(/^#:\s*/, '');
            contextLines.push(`<span class="reference">${escapeHtml(cleanRef)}</span>`);
        });
        
        msg.comments.forEach(comment => {
            let cleanComment = comment.replace(/^#\.?\s*/, '');
            if (comment.startsWith('#')) {
                contextLines.push(`<span class="comment">${escapeHtml(cleanComment)}</span>`);
            } else {
                contextLines.push(`<span class="other-comment">${escapeHtml(cleanComment)}</span>`);
            }
        });
        
        const contextHtml = contextLines.join('<br>') || 'No context';
        const rowClass = `${statusClass} ${msg.fuzzy ? 'fuzzy' : ''}`;
        
        // Handle plural forms
        let pluralTranslationsHtml = '';
        if (msg.hasPlural && Array.isArray(msg.msgstr)) {
            pluralTranslationsHtml = `<div class="plural-translations">`;
            msg.msgstr.forEach((translation, index) => {
                let explanation = window.pluralFormsExplanations?.[index] || `Form ${index}`;
                
                // Change: Remove the prefix text for ranges
                if (explanation.startsWith('[')) {
                    // Keep only the range part
                    explanation = explanation;
                } else if (explanation.includes('n=')) {
                    // Keep only the n=value part
                    explanation = explanation.split('n=')[1];
                }
                
                pluralTranslationsHtml += `
                    <div class="plural-form">
                        <div class="plural-header">
                            <span class="plural-index">[${index}]:</span>
                            <span class="plural-explanation">${escapeHtml(explanation)}</span>
                        </div>
                        <span class="plural-text" contenteditable="true">${escapeHtml(translation || '')}</span>
                    </div>
                `;
            });
            pluralTranslationsHtml += `</div>`;
        }
        
        tableHTML += `
            <tr data-id="${msg.id}" class="${rowClass}">
                <td>${msg.id}</td>
                <td class="context-cell">${contextHtml}</td>
                <td class="original-text">${escapeHtml(msg.msgid)}</td>
                <td class="original-plural">${msg.hasPlural ? escapeHtml(msg.msgid_plural) : ''}</td>
                <td class="translation-cell" contenteditable="true">${msg.hasPlural ? '' : escapeHtml(msg.msgstr)}</td>
                <td class="plural-translations-cell">${pluralTranslationsHtml}</td>
                <td class="status">${status}</td>
                <td class="fuzzy-status">${msg.fuzzy ? 'Yes' : 'No'}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    translationTableContainer.innerHTML = tableHTML;
    
    document.querySelectorAll('.translation-cell').forEach(cell => {
        cell.addEventListener('blur', function() {
            const row = this.closest('tr');
            const msgId = row.dataset.id;
            const newTranslation = this.textContent;
            
            const message = messages.find(m => m.id === msgId);
            if (message && !message.hasPlural) {
                message.msgstr = newTranslation;
                updateRowStatus(row, newTranslation);
            }
        });
    });
    
    document.querySelectorAll('.plural-text').forEach(cell => {
        cell.addEventListener('blur', function() {
            const row = this.closest('tr');
            const msgId = row.dataset.id;
            const pluralIndex = parseInt(this.closest('.plural-form').querySelector('.plural-index').textContent.match(/\d+/)[0]);
            const newTranslation = this.textContent;
            
            const message = messages.find(m => m.id === msgId);
            if (message && message.hasPlural && Array.isArray(message.msgstr)) {
                message.msgstr[pluralIndex] = newTranslation;
                updateRowStatus(row, newTranslation);
            }
        });
    });
}
    
/**
 * Updates row status based on translation content
 * @param {HTMLElement} row - Table row element
 * @param {string} translation - Current translation text
 */
function updateRowStatus(row, translation) {
    const statusCell = row.querySelector('.status');
    if (translation.trim()) {
        row.classList.add('translated');
        row.classList.remove('untranslated');
        statusCell.textContent = 'Translated';
    } else {
        row.classList.add('untranslated');
        row.classList.remove('translated');
        statusCell.textContent = 'Untranslated';
    }
}
    
/**
 * Escapes HTML special characters for safe display
 * @param {string} unsafe - Raw input string
 * @returns {string} HTML-safe string
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, '<br>');
}
    
/**
 * Controls visibility of loading indicator
 * @param {boolean} show - Whether to show the indicator
 */
function showLoading(show) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
}
function refreshTranslationTable() {
    if (!window.currentMessages) return;
    displayExtractedStrings({
        messages: window.currentMessages,
        metadata: window.currentMetadata
    }, true);
}