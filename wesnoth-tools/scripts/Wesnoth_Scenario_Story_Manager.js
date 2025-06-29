
// DOM Elements
const inputOptions = document.querySelectorAll('.input-option');
const inputContents = document.querySelectorAll('.input-content');
const fileInput = document.getElementById('file-input');
const processBtn = document.getElementById('process-btn');
const resetBtn = document.getElementById('reset-btn');
const pasteInput = document.getElementById('paste-input');
const pasteProcessBtn = document.getElementById('paste-process-btn');
const pasteResetBtn = document.getElementById('paste-reset-btn');
const outputSection = document.getElementById('output-section');
const outputContent = document.getElementById('output-content');
const backBtn = document.getElementById('back-btn');
const notification = document.getElementById('notification');

// Current state
let currentInputMethod = 'upload';
let extractedData = [];

// Event Listeners
inputOptions.forEach(option => {
	option.addEventListener('click', () => {
		const target = option.dataset.target;
		
		// Update active option
		inputOptions.forEach(opt => opt.classList.remove('active'));
		option.classList.add('active');
		
		// Update active content
		inputContents.forEach(content => content.classList.remove('active'));
		document.getElementById(`${target}-content`).classList.add('active');
		
		currentInputMethod = target;
	});
});

processBtn.addEventListener('click', processFiles);
resetBtn.addEventListener('click', resetInput);
pasteProcessBtn.addEventListener('click', processPastedContent);
pasteResetBtn.addEventListener('click', () => {
	pasteInput.value = '';
});
backBtn.addEventListener('click', () => {
	outputSection.classList.remove('active');
});

// Functions
function showNotification(message, isError = false) {
	notification.textContent = message;
	notification.className = 'notification';
	
	if (isError) {
		notification.classList.add('error');
	}
	
	notification.classList.add('show');
	
	setTimeout(() => {
		notification.classList.remove('show');
	}, 3000);
}

function resetInput() {
	fileInput.value = '';
}

function processFiles() {
	const files = fileInput.files;
	
	if (files.length === 0) {
		showNotification('Please select at least one file', true);
		return;
	}
	
	extractedData = [];
	const promises = [];
	
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const promise = new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target.result;
				const scenarioData = parseScenario(content, file.name);
				extractedData.push(scenarioData);
				resolve();
			};
			reader.readAsText(file);
		});
		promises.push(promise);
	}
	
	Promise.all(promises).then(() => {
		displayResults();
		outputSection.classList.add('active');
		showNotification(`Successfully extracted ${files.length} scenario(s)`);
	});
}

function processPastedContent() {
	const content = pasteInput.value.trim();
	
	if (content === '') {
		showNotification('Please paste some content first', true);
		return;
	}
	
	extractedData = [parseScenario(content, 'Pasted Scenario')];
	displayResults();
	outputSection.classList.add('active');
	showNotification('Content extracted successfully');
}


function parseScenario(content, fileName) {
	const scenario = {
		fileName: fileName,
		id: '',
		name: '',
		nextScenario: '',
		storyParts: [],
		events: []  // Changed to array to handle multiple events with same name
	};
	
	// Helper function to extract values
	const extractValue = (regex, str) => {
		const match = regex.exec(str);
		if (!match) return '';
		const value = match[1] || match[2] || match[3] || '';
		return value.split('#')[0].trim();
	};
	
	// Extract scenario metadata
	scenario.id = extractValue(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]+[^\s#]*))/, content);
	scenario.name = extractValue(/name\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]+[^\s#]*))/, content);
	scenario.nextScenario = extractValue(/next_scenario\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]+[^\s#]*))/, content);
	
	// Extract story parts 
	const storyRegex = /\[story\][\s\S]*?\[\/story\]/g;
	const storyMatch = storyRegex.exec(content);
	if (storyMatch) {
		const storyContent = storyMatch[0];
		const partRegex = /\[part\][\s\S]*?story\s*=\s*_?\s*"([^"]*)"[\s\S]*?\[\/part\]/g;
		let partMatch;
		while ((partMatch = partRegex.exec(storyContent)) !== null) {
			scenario.storyParts.push(partMatch[1]);
		}
	}
	
	// Extract events and messages
	const eventRegex = /\[event\][\s\S]*?\[\/event\]/g;
	let eventMatch;
	
	while ((eventMatch = eventRegex.exec(content)) !== null) {
		const eventContent = eventMatch[0];
		const eventName = extractValue(/name\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]+.*?))(?=[\s#]|\r|\n|$)/, eventContent) || 'unnamed';
		
		// Extract filters
		const filterTypes = ['filter', 'filter_second', 'filter_side', 'filter_location'];
		const allFilters = [];
		
		for (const filterType of filterTypes) {
			const filterRegex = new RegExp(`\\[${filterType}\\]([\\s\\S]*?)\\[\\/${filterType}\\]`, 'gi');
			let filterMatch;
			while ((filterMatch = filterRegex.exec(eventContent)) !== null) {
				let filterContent = filterMatch[1];
				// Remove comments but preserve structure
				filterContent = filterContent.replace(/#.*$/gm, '');
				// Remove extra whitespace and format
				filterContent = filterContent
				.split('\n')
				.map(line => line.trim())
				.filter(line => line)
				.join('\n');
				
				allFilters.push(`${filterType}:\n${filterContent}`);
			}
		}
		
		const filterSummary = allFilters.length > 0 ? 
		allFilters.join('\n\n') : 
		'no filter';
		
		// NEW: Check if event contains any messages
		const hasMessages = /\[message\]/.test(eventContent);
		if (!hasMessages) continue;  // Skip events without messages
		
		// Parse messages with conditions
		function parseEventContent(content) {
			const result = [];
			const tagPattern = /\[(\/?)(\w+)\]/g;
			let match;
			let lastIndex = 0;
			
			while ((match = tagPattern.exec(content)) !== null) {
				const fullTag = match[0];
				const isClosing = match[1] === '/';
				const tagName = match[2].toLowerCase();
				
				// Handle condition tags
				if (['if', 'then', 'else', 'elseif'].includes(tagName) && !isClosing) {
					// Find closing tag
					const closingTag = `[/${tagName}]`;
					const endIndex = content.indexOf(closingTag, match.index);
					
					if (endIndex !== -1) {
						const innerContent = content.substring(match.index + fullTag.length, endIndex);
						const children = parseEventContent(innerContent);
						
						// Extract only the condition content without outer tags
						const conditionContent = innerContent;
						
						result.push({
							type: 'condition',
							tag: tagName,
							content: conditionContent,
							children: children
						});
						
						// Skip to end of condition block
						tagPattern.lastIndex = endIndex + closingTag.length;
						lastIndex = tagPattern.lastIndex;
					}
				}
				// Handle messages
				else if (tagName === 'message' && !isClosing) {
					const endIndex = content.indexOf('[/message]', match.index);
					if (endIndex !== -1) {
						const messageContent = content.substring(match.index, endIndex + 10);
						const speaker = extractValue(/speaker\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]+.*?))(?=[\s#]|\r|\n|$)/i, messageContent) || 'narrator';
						const messageTextMatch = /message\s*=\s*_?\s*"([^"]*)"/.exec(messageContent);
						
						if (messageTextMatch) {
							result.push({
								type: 'message',
								speaker: speaker,
								text: messageTextMatch[1]
							});
						}
						
						// Skip to end of message
						tagPattern.lastIndex = endIndex + 10;
						lastIndex = tagPattern.lastIndex;
					}
				}
				// Handle other content between tags
				else if (match.index > lastIndex) {
					const textContent = content.substring(lastIndex, match.index).trim();
					if (textContent) {
						result.push({
							type: 'text',
							content: textContent
						});
					}
					lastIndex = match.index;
				}
			}
			
			return result;
		}
		
		const messages = parseEventContent(eventContent);
		
		// Push event to array (instead of object) to handle multiple with same name
		scenario.events.push({
			name: eventName,
			filters: filterSummary,
			messages: messages
		});
	}
	
	return scenario;
}

function displayResults() {
	outputContent.innerHTML = '';
	
	if (extractedData.length === 0) {
		outputContent.innerHTML = `
		<div class="empty-state">
		<div>📭</div>
		<h3>No scenarios to display</h3>
		<p>Try uploading or pasting some scenario files</p>
		</div>
		`;
		return;
	}
	
	extractedData.forEach(scenario => {
		const scenarioElement = document.createElement('div');
		scenarioElement.className = 'scenario-card';
		
		// Prepare events HTML
		let eventsHTML = '';
		
		// Loop through events array instead of object
		scenario.events.forEach((event, index) => {
			const { name, filters, messages } = event;
			
			// Recursive function to render condition hierarchy
			function renderMessages(messages) {
				let html = '';
				messages.forEach(entry => {
					if (entry.type === 'message') {
						html += `
						<div class="dialogue-entry">
						<div class="speaker">${entry.speaker}</div>
						<div class="message">${entry.text}</div>
						</div>
						`;
					}
					else if (entry.type === 'condition') {
						const childrenHTML = renderMessages(entry.children);
						
						// Format condition content without outer tags
						const conditionContent = entry.content
						.replace(/^[\n\s]+|[\n\s]+$/g, '') // Trim whitespace
						.split('\n')
						.map(line => line.trim())
						.filter(line => line)
						.join('\n');
						
						html += `
						<div class="condition-group">
						<div class="condition-header">${entry.tag.toUpperCase()}</div>
						<div class="condition-content"><pre>${conditionContent}</pre></div>
						<div class="message-container">
						${childrenHTML}
						</div>
						</div>
						`;
					}
				});
				return html;
			}
			
			const eventEntriesHTML = renderMessages(messages);
			
			if (eventEntriesHTML) {
				eventsHTML += `
				<div class="event-group">
				<h3 class="event-title">${name} <span class="event-count">#${index+1}</span></h3>
				<div class="event-filter"><pre>${filters}</pre></div>
				<div class="message-container">
				${eventEntriesHTML}
				</div>
				</div>
				`;
			}
		});
		
		// Build scenario content
		scenarioElement.innerHTML = `
		<div class="scenario-header">
		<div>
		<h2 class="scenario-title">${scenario.name || 'Unnamed Scenario'}</h2>
		<div class="scenario-id">ID: ${scenario.id || 'N/A'}</div>
		</div>
		<div>
		<div>File: ${scenario.fileName}</div>
		${scenario.nextScenario ? `<div>Next Scenario: ${scenario.nextScenario}</div>` : ''}
		<div>Events: ${scenario.events.length}</div>
		</div>
		</div>
		
		<div class="scenario-content">
		${scenario.storyParts.length > 0 ? `
		<div class="story-section">
		<h3 class="section-title">📖 Story</h3>
		${scenario.storyParts.map(part => `
			<div class="story-part">
			<p class="story-text">${part}</p>
			</div>
		`).join('')}
		</div>
		` : ''}
		
		${eventsHTML ? `
		<div class="dialogue-section">
		<h3 class="section-title">💬 Dialogue Events</h3>
		${eventsHTML}
		</div>
		` : `
		<div class="empty-state">
		<div>🔇</div>
		<p>No dialogue events found in this scenario</p>
		</div>
		`}
		</div>
		`;
		
		outputContent.appendChild(scenarioElement);
	});
}

// Initialize with sample data for demonstration
window.onload = function() {
	// For demo purposes, we'll simulate having a scenario
	const sampleContent = `[scenario]
    id="RV_P01_S01"
    name="CotDQ-01-The Attack"
    next_scenario=RV_P01_S02
    [story]
	[part]
	story= _ "Long have we been shackled by those who deem themselves superior. Among my kin, the Faltharim, only the Muniriki extend a hand of equality."
	[/part]
	[part]
	story= _ "For ages, I have longed for true freedom; a time when my power would match that of my mother, Melbrina of Gertan."
	[/part]
    [/story]
    [event]
	name=start
	[message]
	speaker=Alanya
	message= _ "Jetrin, please! I wish to fight alongside you and your warriors! There must be a way I can help!"
	[/message]
	[message]
	speaker=Jetrin
	message= _ "Alanya, your heart is fierce, but this battle is not for you. Stay behind. Your magic should not be wasted on the fray."
	[/message]
    [/event]
    [event]
	name=moveto
	first_time_only=yes
	[filter]
	side=1
	x=21
	y=24
	[/filter]
	[set_variable]
	name=got_Myrrendi
	value=1
	[/set_variable]
	[remove_item]
	x=$x1
	y=$y1
	[/remove_item]
	{VARIABLE_OP ingredients add 1}
	[message]
	speaker=narrator
	image=portraits/other/wt_books.png
	message= _ "Myrrendi, the silky blooms that flourish beneath the shallow river waters, radiant as moonlight. Its essence mingles with the currents, bestowing calm upon those racked by pain."
	[/message]
	[message]
	speaker=narrator
	image=portraits/other/wt_books.png
	message= _ "Ingrediences: $ingredients| out of 05 ingredients."
	[/message]
	[if]
	[variable]
	name=ingredients
	numerical_equals=5
	[/variable]
	[then]
	[message]
	speaker=narrator
	image=portraits/other/wt_books.png
	message= _ "You need to move to the fire to make the potion!"
	[/message]
	[/then]
	[/if]
    [/event]
	[/scenario]`;
	
	const sampleScenario = parseScenario(sampleContent, 'Sample Scenario');
	extractedData = [sampleScenario];
};