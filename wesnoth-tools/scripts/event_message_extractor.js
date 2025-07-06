
document.addEventListener('DOMContentLoaded', function() {
	// Elements
	const fileInput = document.getElementById('fileInput');
	const dropZone = document.getElementById('dropZone');
	const browseBtn = document.getElementById('browseBtn');
	const pasteArea = document.getElementById('pasteArea');
	const processPasteBtn = document.getElementById('processPasteBtn');
	const resultsSection = document.getElementById('resultsSection');
	const emptyState = document.getElementById('emptyState');
	const fileName = document.getElementById('fileName');
	const fileCount = document.getElementById('fileCount');
	const totalEvents = document.getElementById('totalEvents');
	const totalMessages = document.getElementById('totalMessages');
	const eventsContainer = document.getElementById('eventsContainer');
	const messagesContainer = document.getElementById('messagesContainer');
	const clearResultsBtn = document.getElementById('clearResultsBtn');
	const eventsViewBtn = document.getElementById('eventsViewBtn');
	const messagesViewBtn = document.getElementById('messagesViewBtn');
	const statsPanel = document.getElementById('statsPanel');
	const statsToggleBtn = document.getElementById('statsToggleBtn');
	const statFiles = document.getElementById('statFiles');
	const statEvents = document.getElementById('statEvents');
	const statMessages = document.getElementById('statMessages');
	const statAvgEvents = document.getElementById('statAvgEvents');
	const fileStatsList = document.getElementById('fileStatsList');
	const groupFilesBtn = document.getElementById('groupFilesBtn');
	const combineFilesBtn = document.getElementById('combineFilesBtn');
    const downloadEditedBtn = document.getElementById('downloadEditedBtn');
	const saveSection = document.getElementById('saveSection');
	const saveChangesBtn = document.getElementById('saveChangesBtn');
	const discardChangesBtn = document.getElementById('discardChangesBtn');
	
	// Current data
	let allFilesData = [];
	let viewMode = 'events'; // 'events' or 'messages'
	let groupMode = 'grouped'; // 'grouped' or 'combined'
	let statsVisible = false;
    // Store original file content
    let originalFiles = {};
    
	// Track changes
	let hasUnsavedChanges = false;
	let editedEvents = {};
	let editedMessages = {};
	
	// Event Listeners
	browseBtn.addEventListener('click', () => fileInput.click());
	fileInput.addEventListener('change', handleFileUpload);
	dropZone.addEventListener('dragover', handleDragOver);
	dropZone.addEventListener('drop', handleDrop);
	processPasteBtn.addEventListener('click', processPastedContent);
	clearResultsBtn.addEventListener('click', clearResults);
	eventsViewBtn.addEventListener('click', () => switchView('events'));
	messagesViewBtn.addEventListener('click', () => switchView('messages'));
	statsToggleBtn.addEventListener('click', toggleStats);
	groupFilesBtn.addEventListener('click', () => switchGroupMode('grouped'));
	combineFilesBtn.addEventListener('click', () => switchGroupMode('combined'));
    downloadEditedBtn.addEventListener('click', downloadEditedFiles);
	saveChangesBtn.addEventListener('click', saveChanges);
	discardChangesBtn.addEventListener('click', discardChanges);
	
	// Function to handle drag over event
	function handleDragOver(e) {
		e.preventDefault();
		e.stopPropagation();
		dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.3)';
	}
	
	// Function to handle drop event
	function handleDrop(e) {
		e.preventDefault();
		e.stopPropagation();
		dropZone.style.backgroundColor = '';
		
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			processFiles(files);
		}
	}
	
	// Function to handle file upload via input
	function handleFileUpload(e) {
		const files = e.target.files;
		if (files.length > 0) {
			processFiles(files);
		}
	}
	
	// Function to process pasted content
	function processPastedContent() {
		const content = pasteArea.value.trim();
		if (content) {
			// Create a pseudo-file object for pasted content
			const pseudoFile = {
				name: "Pasted Content",
				content: content
			};
			processPseudoFiles([pseudoFile]);
			} else {
			alert("Please paste some .cfg content first!");
		}
	}
	
	// Function to process uploaded files
	function processFiles(files) {
		const processPromises = [];
		const newFilesData = [];
		
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (file.name.endsWith('.cfg')) {
				const promise = new Promise((resolve) => {
					const reader = new FileReader();
					reader.onload = function(e) {
						const content = e.target.result;
						originalFiles[file.name] = content; // Store original content
						const events = extractEvents(content);
						const messages = extractMessages(content, events);
						
						newFilesData.push({
							fileName: file.name,
							events: events,
							messages: messages
						});
						resolve();
					};
					reader.readAsText(file);
				});
				processPromises.push(promise);
			}
		}
		
		Promise.all(processPromises).then(() => {
			if (newFilesData.length > 0) {
				// Add new files to global data
				allFilesData = allFilesData.concat(newFilesData);
				
				// Update UI
				updateFileInfo();
				updateStats();
				renderContent();
				
				resultsSection.style.display = 'block';
				emptyState.style.display = 'none';
			}
		});
	}
	
	// Function to process pseudo files (for pasted content)
	function processPseudoFiles(files) {
        files.forEach(file => {
            originalFiles[file.name] = file.content; // Store original content
			const newFilesData = [];
			
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const content = file.content;
				const events = extractEvents(content);
				const messages = extractMessages(content, events);
				
				newFilesData.push({
					fileName: file.name,
					events: events,
					messages: messages
				});
			}
			
			if (newFilesData.length > 0) {
				// Add new files to global data
				allFilesData = allFilesData.concat(newFilesData);
				
				// Update UI
				updateFileInfo();
				updateStats();
				renderContent();
				
				resultsSection.style.display = 'block';
				emptyState.style.display = 'none';
			}
		});
	}
	
	// Function to extract events from content
	function extractEvents(content) {
		const events = [];
		const eventRegex = /\[event\b[^\]]*\]([\s\S]*?)\[\/event\]/gi;
		let match;
		let eventIndex = 0;
		
		while ((match = eventRegex.exec(content)) !== null) {
			const eventBlock = match[0];
			const start = match.index;
			const end = start + eventBlock.length;
			
			// Improved event name extraction
			const nameMatch = eventBlock.match(
				/name\s*=\s*"((?:\\"|[^"])*)"|name\s*=\s*'((?:\\'|[^'])*)'|name\s*=\s*([^\s#\[]+)/i
			);
			let eventName = "unnamed";
			if (nameMatch) {
				eventName = (nameMatch[1] || nameMatch[2] || nameMatch[3] || "").trim();
			}
			
			// Handle multi-line names
			if (eventName.includes('\n')) {
				eventName = eventName.split('\n')[0].trim();
			}
			
			// Extract filter content
			let filterContent = "";
			const filterMatch = eventBlock.match(/\[filter\]([\s\S]*?)\[\/filter\]/i);
			if (filterMatch && filterMatch[1]) {
				filterContent = filterMatch[1].replace(/\s+/g, " ").trim();
			}
			
			events.push({
				id: `event-${eventIndex++}`,
				name: eventName,
				filter: filterContent,
				block: eventBlock,
				start: start,
				end: end
			});
		}
		return events;
	}
    // Make events editable
    function makeEventsEditable() {
        document.querySelectorAll('.event-code').forEach(pre => {
            const textarea = document.createElement('textarea');
            textarea.className = 'event-editable';
            textarea.dataset.id = pre.dataset.id;
            textarea.value = editedEvents[pre.dataset.id] || pre.textContent;
            pre.replaceWith(textarea);
		});
	}
    
    // Make messages editable
    function makeMessagesEditable() {
        document.querySelectorAll('.message-text').forEach(div => {
            const textarea = document.createElement('textarea');
            textarea.className = 'message-editable';
            textarea.dataset.id = div.dataset.id;
            textarea.value = editedMessages[div.dataset.id] || div.textContent;
            div.replaceWith(textarea);
		});
	}
	
	// Function to extract messages from content
	function extractMessages(content, events) {
		const messages = [];
		
		// Extract message blocks using regex
		const messageRegex = /\[message\b[^\]]*\]([\s\S]*?)\[\/message\]/gi;
		let match;
		
		while ((match = messageRegex.exec(content)) !== null) {
			const messageBlock = match[0];
			const messageStart = match.index;
			const messageEnd = messageStart + messageBlock.length;
			
			// Extract speaker
			const speakerMatch = messageBlock.match(/speaker\s*=\s*"([^"]*)"|speaker\s*=\s*'([^']*)'|speaker\s*=\s*(\S+)/i);
			let speaker = "narrator";
			if (speakerMatch) {
				if (speakerMatch[1] !== undefined) {
					speaker = speakerMatch[1];
					} else if (speakerMatch[2] !== undefined) {
					speaker = speakerMatch[2];
					} else if (speakerMatch[3] !== undefined) {
					speaker = speakerMatch[3];
				}
			}
			
			// Extract message text
			const messageMatch = messageBlock.match(/message\s*=\s*_?\s*"([^"]*)"|message\s*=\s*_?\s*'([^']*)'|message\s*=\s*_?\s*(\S+)/i);
			let messageText = "";
			if (messageMatch) {
				if (messageMatch[1] !== undefined) {
					messageText = messageMatch[1];
					} else if (messageMatch[2] !== undefined) {
					messageText = messageMatch[2];
					} else if (messageMatch[3] !== undefined) {
					messageText = messageMatch[3];
				}
			}
			
			// Clean up message text
			messageText = messageText.trim().replace(/^_ /, '');
			
			// Find event context and filter
			let eventContext = "No event context";
			let eventName = "unnamed";
			let eventFilter = "";
			
			// Find the event that contains this message
			for (const event of events) {
				if (messageStart >= event.start && messageEnd <= event.end) {
					eventContext = event.name;
					eventName = event.name;
					eventFilter = event.filter;
					break;
				}
			}
			
			messages.push({
				event: eventContext,
				eventName: eventName,
				eventFilter: eventFilter,
				speaker,
				message: messageText
			});
		}
		
		return messages;
	}
	
	// Function to render content based on current view and group mode
	function renderContent() {
		eventsContainer.innerHTML = '';
		messagesContainer.innerHTML = '';
		
		if (viewMode === 'events') {
			if (groupMode === 'grouped') {
				renderEventsGrouped();
				} else {
				renderEventsCombined();
			}
			} else {
			if (groupMode === 'grouped') {
				renderMessagesGrouped();
				} else {
				renderMessagesCombined();
			}
		}
        setTimeout(() => {
            if (viewMode === 'events') makeEventsEditable();
            else makeMessagesEditable();
		}, 100);
	}
	
	// Function to render events grouped by file
	function renderEventsGrouped() {
		eventsContainer.innerHTML = '';
		
		if (allFilesData.length === 0) {
			eventsContainer.innerHTML = `
            <div class="empty-state">
			<i class="fas fa-exclamation-circle"></i>
			<h3>No Events Found</h3>
			<p>The files don't contain any events</p>
            </div>
			`;
			return;
		}
		
		allFilesData.forEach(fileData => {
			if (fileData.events.length === 0) return;
			
			const fileGroup = document.createElement('div');
			fileGroup.className = 'file-group';
			
			const header = document.createElement('div');
			header.className = 'file-header';
			header.innerHTML = `
            <div class="file-title">
			<i class="fas fa-file-code"></i> ${fileData.fileName}
            </div>
            <div class="event-count">
			${fileData.events.length} event(s)
            </div>
			`;
			
			const content = document.createElement('div');
			content.className = 'events-container-inner';
			content.style.display = 'grid';
			content.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
			content.style.gap = '20px';
			content.style.padding = '15px';
			
			// Group events by name AND filter
			const groupedEvents = {};
			fileData.events.forEach(event => {
				const groupKey = `${event.name}|${event.filter}`;
				if (!groupedEvents[groupKey]) {
					groupedEvents[groupKey] = [];
				}
				groupedEvents[groupKey].push(event);
			});
			
			// Render grouped events
			for (const [groupKey, eventGroup] of Object.entries(groupedEvents)) {
				// Split groupKey back into name and filter
				const [eventName, eventFilter] = groupKey.split('|');
				
				const eventCard = document.createElement('div');
				eventCard.className = 'event-card';
				
				const cardHeader = document.createElement('div');
				cardHeader.className = 'event-header';
				
				// Display filter if exists
				let filterIndicator = "";
				if (eventFilter) {
					filterIndicator = `<div class="event-filter">Filter: ${eventFilter}</div>`;
				}
				
				cardHeader.innerHTML = `
                <div>
				<span class="event-name">${eventName || 'Unnamed Event'}</span>
				${filterIndicator}
                </div>
                <span class="event-count">${eventGroup.length} event(s)</span>
				`;
				
				const cardContent = document.createElement('div');
				cardContent.className = 'event-content';
				
				eventGroup.forEach((event, index) => {
					const blockDiv = document.createElement('div');
					blockDiv.className = 'event-block';
					
					const blockHeader = document.createElement('div');
					blockHeader.className = 'event-subheader';
					blockHeader.textContent = `Event #${index + 1}`;
					
					const code = document.createElement('pre');
					code.className = 'event-code';
					code.textContent = event.block;
					// Add dataset ID here
					code.dataset.id = event.id;
					
					blockDiv.appendChild(blockHeader);
					blockDiv.appendChild(code);
					cardContent.appendChild(blockDiv);
				});
				
				eventCard.appendChild(cardHeader);
				eventCard.appendChild(cardContent);
				content.appendChild(eventCard);
			}
			
			fileGroup.appendChild(header);
			fileGroup.appendChild(content);
			eventsContainer.appendChild(fileGroup);
		});
	}
	
	// Function to render messages grouped by file
	function renderMessagesGrouped() {
		messagesContainer.innerHTML = '';
		
		if (allFilesData.length === 0) {
			messagesContainer.innerHTML = `
            <div class="empty-state">
			<i class="fas fa-exclamation-circle"></i>
			<h3>No Messages Found</h3>
			<p>The files don't contain any messages</p>
            </div>
			`;
			return;
		}
		
		allFilesData.forEach(fileData => {
			if (fileData.messages.length === 0) return;
			
			const fileGroup = document.createElement('div');
			fileGroup.className = 'file-group';
			
			const header = document.createElement('div');
			header.className = 'file-header';
			header.innerHTML = `
            <div class="file-title">
			<i class="fas fa-file-code"></i> ${fileData.fileName}
            </div>
            <div class="event-count">
			${fileData.messages.length} message(s)
            </div>
			`;
			
			const content = document.createElement('div');
			content.className = 'messages-container-inner';
			content.style.display = 'grid';
			content.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
			content.style.gap = '20px';
			content.style.padding = '15px';
			
			// Group messages by event name AND filter
			const groupedMessages = {};
			fileData.messages.forEach(msg => {
				const groupKey = `${msg.eventName}|${msg.eventFilter}`;
				if (!groupedMessages[groupKey]) {
					groupedMessages[groupKey] = [];
				}
				groupedMessages[groupKey].push(msg);
			});
			
			// Render grouped messages
			for (const [groupKey, messageGroup] of Object.entries(groupedMessages)) {
				// Split groupKey back into name and filter
				const [eventName, eventFilter] = groupKey.split('|');
				
				const messageCard = document.createElement('div');
				messageCard.className = 'message-card';
				
				const cardHeader = document.createElement('div');
				cardHeader.className = 'message-header';
				
				// Display filter if exists
				let filterIndicator = "";
				if (eventFilter) {
					filterIndicator = `<div class="event-filter">Filter: ${eventFilter}</div>`;
				}
				
				cardHeader.innerHTML = `
                <div>
				<span class="event-name">${eventName || 'Unnamed Event'}</span>
				${filterIndicator}
                </div>
                <span class="event-count">${messageGroup.length} message(s)</span>
				`;
				
				const cardContent = document.createElement('div');
				cardContent.className = 'message-content';
				
				messageGroup.forEach(msg => {
					const messageItem = document.createElement('div');
					messageItem.className = 'message-item';
					
					const speaker = document.createElement('div');
					speaker.className = 'message-speaker';
					speaker.innerHTML = `<i class="fas fa-user"></i> ${msg.speaker || 'narrator'}`;
					
					const text = document.createElement('div');
					text.className = 'message-text';
					text.textContent = msg.message;
					// Add dataset ID here
					const msgId = `${msg.event}-${msg.speaker}-${msg.message}`;
					text.dataset.id = msgId;
					
					messageItem.appendChild(speaker);
					messageItem.appendChild(text);
					cardContent.appendChild(messageItem);
				});
				
				messageCard.appendChild(cardHeader);
				messageCard.appendChild(cardContent);
				content.appendChild(messageCard);
			}
			
			fileGroup.appendChild(header);
			fileGroup.appendChild(content);
			messagesContainer.appendChild(fileGroup);
		});
	}
	
	// Function to render events combined
	function renderEventsCombined() {
		eventsContainer.innerHTML = '';
		
		// Combine all events
		const allEvents = [];
		allFilesData.forEach(file => {
			allEvents.push(...file.events);
		});
		
		if (allEvents.length === 0) {
			eventsContainer.innerHTML = `
			<div class="empty-state">
			<i class="fas fa-exclamation-circle"></i>
			<h3>No Events Found</h3>
			<p>The files don't contain any events</p>
			</div>
			`;
			return;
		}
		
		// Group events by name AND filter
		const groupedEvents = {};
		allEvents.forEach(event => {
			const groupKey = `${event.name}|${event.filter}`;
			if (!groupedEvents[groupKey]) {
				groupedEvents[groupKey] = [];
			}
			groupedEvents[groupKey].push(event);
		});
		
		// Render grouped events
		for (const [groupKey, eventGroup] of Object.entries(groupedEvents)) {
			// Split groupKey back into name and filter
			const [eventName, eventFilter] = groupKey.split('|');
			
			const eventCard = document.createElement('div');
			eventCard.className = 'event-card';
			
			const cardHeader = document.createElement('div');
			cardHeader.className = 'event-header';
			
			// Display filter if exists
			let filterIndicator = "";
			if (eventFilter) {
				filterIndicator = `<div class="event-filter">Filter: ${eventFilter}</div>`;
			}
			
			cardHeader.innerHTML = `
			<div>
			<span class="event-name">${eventName || 'Unnamed Event'}</span>
			${filterIndicator}
			</div>
			<span class="event-count">${eventGroup.length} event(s)</span>
			`;
			
			const cardContent = document.createElement('div');
			cardContent.className = 'event-content';
			
			eventGroup.forEach((event, index) => {
				const blockDiv = document.createElement('div');
				blockDiv.className = 'event-block';
				
				const blockHeader = document.createElement('div');
				blockHeader.className = 'event-subheader';
				blockHeader.textContent = `Event #${index + 1}`;
				
				const code = document.createElement('pre');
				code.className = 'event-code';
				code.textContent = event.block;
				
				blockDiv.appendChild(blockHeader);
				blockDiv.appendChild(code);
				cardContent.appendChild(blockDiv);
			});
			
			eventCard.appendChild(cardHeader);
			eventCard.appendChild(cardContent);
			eventsContainer.appendChild(eventCard);
		}
	}
	
	// Function to render messages combined
	function renderMessagesCombined() {
		messagesContainer.innerHTML = '';
		
		// Combine all messages
		const allMessages = [];
		allFilesData.forEach(file => {
			allMessages.push(...file.messages);
		});
		
		if (allMessages.length === 0) {
			messagesContainer.innerHTML = `
			<div class="empty-state">
			<i class="fas fa-exclamation-circle"></i>
			<h3>No Messages Found</h3>
			<p>The files don't contain any messages</p>
			</div>
			`;
			return;
		}
		
		// Group messages by event name AND filter
		const groupedMessages = {};
		allMessages.forEach(msg => {
			const groupKey = `${msg.eventName}|${msg.eventFilter}`;
			if (!groupedMessages[groupKey]) {
				groupedMessages[groupKey] = [];
			}
			groupedMessages[groupKey].push(msg);
		});
		
		// Render grouped messages
		for (const [groupKey, messageGroup] of Object.entries(groupedMessages)) {
			// Split groupKey back into name and filter
			const [eventName, eventFilter] = groupKey.split('|');
			
			const messageCard = document.createElement('div');
			messageCard.className = 'message-card';
			
			const cardHeader = document.createElement('div');
			cardHeader.className = 'message-header';
			
			// Display filter if exists
			let filterIndicator = "";
			if (eventFilter) {
				filterIndicator = `<div class="event-filter">Filter: ${eventFilter}</div>`;
			}
			
			cardHeader.innerHTML = `
			<div>
			<span class="event-name">${eventName || 'Unnamed Event'}</span>
			${filterIndicator}
			</div>
			<span class="event-count">${messageGroup.length} message(s)</span>
			`;
			
			const cardContent = document.createElement('div');
			cardContent.className = 'message-content';
			
			messageGroup.forEach(msg => {
				const messageItem = document.createElement('div');
				messageItem.className = 'message-item';
				
				const speaker = document.createElement('div');
				speaker.className = 'message-speaker';
				speaker.innerHTML = `<i class="fas fa-user"></i> ${msg.speaker || 'narrator'}`;
				
				const text = document.createElement('div');
				text.className = 'message-text';
				text.textContent = msg.message;
				
				messageItem.appendChild(speaker);
				messageItem.appendChild(text);
				cardContent.appendChild(messageItem);
			});
			
			messageCard.appendChild(cardHeader);
			messageCard.appendChild(cardContent);
			messagesContainer.appendChild(messageCard);
		}
	}
	
	// Function to switch between views
	function switchView(view) {
		viewMode = view;
		
		if (view === 'events') {
			eventsViewBtn.classList.add('active');
			messagesViewBtn.classList.remove('active');
			eventsContainer.style.display = 'block';
			messagesContainer.style.display = 'none';
			} else {
			messagesViewBtn.classList.add('active');
			eventsViewBtn.classList.remove('active');
			eventsContainer.style.display = 'none';
			messagesContainer.style.display = 'block';
		}
		
		renderContent();
	}
	
	// Function to switch group mode
	function switchGroupMode(mode) {
		groupMode = mode;
		
		if (mode === 'grouped') {
			groupFilesBtn.classList.add('active');
			combineFilesBtn.classList.remove('active');
			} else {
			combineFilesBtn.classList.add('active');
			groupFilesBtn.classList.remove('active');
		}
		
		renderContent();
	}
	
    // Download edited files
    function downloadEditedFiles() {
        const zip = new JSZip();
        
        // Process each file
        allFilesData.forEach(fileData => {
            let content = originalFiles[fileData.fileName];
            
            // Apply event edits
            fileData.events.forEach(event => {
                if (editedEvents[event.id]) {
                    content = content.replace(event.block, editedEvents[event.id]);
				}
			});
            
            // Apply message edits
            fileData.messages.forEach(msg => {
                const msgId = `${msg.event}-${msg.speaker}-${msg.message}`;
                if (editedMessages[msgId]) {
                    const oldMsg = `message=${msg.message}`;
                    const newMsg = `message=${editedMessages[msgId]}`;
                    content = content.replace(oldMsg, newMsg);
				}
			});
            
            zip.file(fileData.fileName, content);
		});
        
        // Generate and download zip
        zip.generateAsync({type:"blob"}).then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = "edited_scenarios.zip";
            link.click();
		});
	}
	// Modified download function
	downloadEditedBtn.addEventListener('click', function() {
		if (hasUnsavedChanges) {
			saveSection.style.display = 'block';
			} else {
			downloadFiles();
		}
	});
	
	function saveChanges() {
		// Save is implicit in the editedEvents/editedMessages objects
		hasUnsavedChanges = false;
		saveSection.style.display = 'none';
		downloadFiles();
	}
	
	function discardChanges() {
		editedEvents = {};
		editedMessages = {};
		hasUnsavedChanges = false;
		saveSection.style.display = 'none';
		renderContent(); // Re-render to show original content
	}
	// Improved file download function
	function downloadFiles() {
		allFilesData.forEach(fileData => {
			let content = originalFiles[fileData.fileName];
			
			// Apply event edits
			fileData.events.forEach(event => {
				if (editedEvents[event.id]) {
					content = content.replace(event.block, editedEvents[event.id]);
				}
			});
			
			// Apply message edits
			fileData.messages.forEach(msg => {
				const msgId = `${msg.event}-${msg.speaker}-${msg.message}`;
				if (editedMessages[msgId]) {
					const oldMsg = `message=${msg.message}`;
					const newMsg = `message=${editedMessages[msgId]}`;
					content = content.replace(oldMsg, newMsg);
				}
			});
			
			// Create download link
			const blob = new Blob([content], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileData.fileName;
			document.body.appendChild(a);
			a.click();
			setTimeout(() => {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}, 100);
		});
	}
    
    // Track edits
	document.addEventListener('input', function(e) {
		if (e.target.classList.contains('event-editable') || 
			e.target.classList.contains('message-editable')) {
			hasUnsavedChanges = true;
			saveSection.style.display = 'block';
			
			if (e.target.classList.contains('event-editable')) {
				editedEvents[e.target.dataset.id] = e.target.value;
			}
			else if (e.target.classList.contains('message-editable')) {
				editedMessages[e.target.dataset.id] = e.target.value;
			}
		}
	});
	// Function to toggle statistics visibility
	function toggleStats() {
		statsVisible = !statsVisible;
		statsPanel.style.display = statsVisible ? 'block' : 'none';
		statsToggleBtn.innerHTML = statsVisible ? 
		'<i class="fas fa-chart-bar"></i> Hide Statistics' : 
		'<i class="fas fa-chart-bar"></i> Show Statistics';
	}
	
	// Function to update file info
	function updateFileInfo() {
		fileCount.textContent = allFilesData.length;
		
		// Calculate total events and messages
		let totalEventsCount = 0;
		let totalMessagesCount = 0;
		
		allFilesData.forEach(file => {
			totalEventsCount += file.events.length;
			totalMessagesCount += file.messages.length;
		});
		
		totalEvents.textContent = totalEventsCount;
		totalMessages.textContent = totalMessagesCount;
	}
	
	// Function to update statistics
	function updateStats() {
		statFiles.textContent = allFilesData.length;
		
		let totalEventsCount = 0;
		let totalMessagesCount = 0;
		
		allFilesData.forEach(file => {
			totalEventsCount += file.events.length;
			totalMessagesCount += file.messages.length;
		});
		
		statEvents.textContent = totalEventsCount;
		statMessages.textContent = totalMessagesCount;
		
		// Calculate average events per file
		const avgEvents = allFilesData.length > 0 ? 
		(totalEventsCount / allFilesData.length).toFixed(1) : 0;
		statAvgEvents.textContent = avgEvents;
		
		// Update file stats list
		fileStatsList.innerHTML = '';
		
		allFilesData.forEach(file => {
			const fileStat = document.createElement('div');
			fileStat.className = 'file-stat-item';
			
			fileStat.innerHTML = `
			<div class="file-name" title="${file.fileName}">
			<i class="fas fa-file-alt"></i> ${file.fileName}
			</div>
			<div class="file-counts">
			<div class="file-count">${file.events.length}</div>
			<div class="file-count">${file.messages.length}</div>
			</div>
			`;
			
			fileStatsList.appendChild(fileStat);
		});
	}
	
	// Function to clear results
	function clearResults() {
		allFilesData = [];
		eventsContainer.innerHTML = '';
		messagesContainer.innerHTML = '';
		resultsSection.style.display = 'none';
		emptyState.style.display = 'block';
		pasteArea.value = '';
		fileInput.value = '';
		statsPanel.style.display = 'none';
		statsVisible = false;
		statsToggleBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Show Statistics';
		switchView('events');
		switchGroupMode('grouped');
	}
});