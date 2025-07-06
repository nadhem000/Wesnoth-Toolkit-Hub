document.addEventListener('DOMContentLoaded', function() {
	// Elements
	const dropZone = document.getElementById('imag-animat-dropZone');
	const fileInput = document.getElementById('imag-animat-fileInput');
	const frameDuration = document.getElementById('imag-animat-frameDuration');
	const frameDurationValue = document.getElementById('imag-animat-frameDurationValue');
	const applyDuration = document.getElementById('imag-animat-applyDuration');
	const playBtn = document.getElementById('imag-animat-playBtn');
	const pauseBtn = document.getElementById('imag-animat-pauseBtn');
	const stopBtn = document.getElementById('imag-animat-stopBtn');
	const previewSpeed = document.getElementById('imag-animat-previewSpeed');
	const speedValue = document.getElementById('imag-animat-speedValue');
	const animationPreview = document.getElementById('imag-animat-animationPreview');
	const timeline = document.getElementById('imag-animat-timeline');
	const addFrame = document.getElementById('imag-animat-addFrame');
	const removeFrame = document.getElementById('imag-animat-removeFrame');
	const duplicateFrame = document.getElementById('imag-animat-duplicateFrame');
	const reverseFrames = document.getElementById('imag-animat-reverseFrames');
	const exportBtn = document.getElementById('imag-animat-exportBtn');
	const wmlBtn = document.getElementById('imag-animat-wmlBtn');
	const wmlPreview = document.getElementById('imag-animat-wmlPreview');
	const haloInput = document.getElementById('imag-animat-haloInput');
	const haloEffect = document.getElementById('imag-animat-haloEffect');
	const positionHalo = document.getElementById('imag-animat-positionHalo');
	const tabs = document.querySelectorAll('.imag-animat-tab');
	const tabContents = document.querySelectorAll('.imag-animat-tab-content');
	const opacitySlider = document.getElementById('imag-animat-opacity');
	const opacityValue = document.getElementById('imag-animat-opacityValue');
	const clearBtn = document.getElementById('imag-animat-clearBtn');
	const offsetX = document.getElementById('imag-animat-offsetX');
	const offsetY = document.getElementById('imag-animat-offsetY');
	const applyOffset = document.getElementById('imag-animat-applyOffset');
	const soundInput = document.getElementById('imag-animat-soundInput');
	const addSoundBtn = document.getElementById('imag-animat-addSound');
	const soundList = document.getElementById('imag-animat-soundList');
	const frameSelector = document.getElementById('imag-animat-frameSelector');
	const soundSelector = document.getElementById('imag-animat-soundSelector');
	const assignSoundBtn = document.getElementById('imag-animat-assignSound');
	const gridToggle = document.getElementById('imag-animat-gridToggle');
	const gridOverlay = document.getElementById('imag-animat-gridOverlay');
	const hitPoint = document.getElementById('imag-animat-hitPoint');
	const hitX = document.getElementById('imag-animat-hitX');
	const hitY = document.getElementById('imag-animat-hitY');
	const placeHitPoint = document.getElementById('imag-animat-placeHitPoint');
	const presets = document.querySelectorAll('.imag-animat-preset');
	const animationType = document.getElementById('imag-animat-animationType');
	const volumeSlider = document.getElementById('imag-animat-volume');
	const volumeValue = document.getElementById('imag-animat-volumeValue');
	const progressContainer = document.getElementById('imag-animat-progressContainer');
	const progressBar = document.getElementById('imag-animat-progressBar');
	const exportFormat = document.getElementById('imag-animat-exportFormat');
	const gifPreviewContainer = document.getElementById('gifPreviewContainer');
	const gifPreview = document.getElementById('gifPreview');
	const gifStatus = document.getElementById('gifStatus');
	const saveGifBtn = document.getElementById('saveGifBtn');
	
	// State
	let uploadedImages = [];
	let currentFrame = 0;
	let animationInterval = null;
	let isPlaying = false;
	let frameTimes = [200, 200]; // Default frame times
	let soundEffects = [];
	let frameSounds = {};
	let frameProperties = [];
	let isDragging = false;
	let dragSrcIndex = null;
	let animationTimeout = null;
	let audioContext = null;
	let audioBuffers = {};
	let volume = 0.8; // Default volume (80%)
	let generatedGifUrl = null;
	
	// Initialize frame properties
	function initFrameProperties() {
		frameProperties = frameTimes.map(() => ({
			offsetX: 0,
			offsetY: 0,
			blendMode: 'normal',
			opacity: 1,
			hue: 0,
			saturation: 100,
			brightness: 100,
			contrast: 100,
			text: '',
			sound: null,
			hitPoint: { x: 50, y: 50 }
		}));
	}
	
	initFrameProperties();
	
	// Setup tab switching
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const tabId = tab.getAttribute('data-tab');
			
			// Update tabs
			tabs.forEach(t => t.classList.remove('imag-animat-active'));
			tab.classList.add('imag-animat-active');
			
			// Update content
			tabContents.forEach(content => {
				content.classList.remove('imag-animat-active');
				if (content.id === tabId) {
					content.classList.add('imag-animat-active');
				}
			});
		});
	});
	
	// Setup event listeners
	dropZone.addEventListener('click', () => fileInput.click());
	dropZone.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropZone.style.backgroundColor = 'rgba(82, 121, 111, 0.4)';
	});
	dropZone.addEventListener('dragleave', () => {
		dropZone.style.backgroundColor = 'rgba(52, 78, 65, 0.2)';
	});
	dropZone.addEventListener('drop', (e) => {
		e.preventDefault();
		dropZone.style.backgroundColor = 'rgba(52, 78, 65, 0.2)';
		handleFiles(e.dataTransfer.files);
	});
	
	fileInput.addEventListener('change', (e) => {
		handleFiles(e.target.files);
	});
	
	frameDuration.addEventListener('input', () => {
		frameDurationValue.value = frameDuration.value;
	});
	
	frameDurationValue.addEventListener('input', () => {
		const value = Math.min(1000, Math.max(50, parseInt(frameDurationValue.value) || 200));
		frameDuration.value = value;
		frameDurationValue.value = value;
	});
	
	applyDuration.addEventListener('click', () => {
		const duration = parseInt(frameDurationValue.value);
		frameTimes = frameTimes.map(() => duration);
		updateTimeline();
	});
	
	previewSpeed.addEventListener('input', () => {
		speedValue.textContent = previewSpeed.value;
	});
	
	opacitySlider.addEventListener('input', () => {
		opacityValue.textContent = `${opacitySlider.value}%`;
		applyOpacityToFrame();
	});
	
	playBtn.addEventListener('click', playAnimation);
	pauseBtn.addEventListener('click', pauseAnimation);
	stopBtn.addEventListener('click', stopAnimation);
	
	addFrame.addEventListener('click', () => {
		frameTimes.push(parseInt(frameDurationValue.value));
		frameProperties.push({
			offsetX: 0,
			offsetY: 0,
			blendMode: 'normal',
			opacity: 1,
			hue: 0,
			saturation: 100,
			brightness: 100,
			contrast: 100,
			text: '',
			sound: null,
			hitPoint: { x: 50, y: 50 }
		});
		updateTimeline();
		updateFrameSelector();
	});
	
	duplicateFrame.addEventListener('click', () => {
		if (currentFrame < frameTimes.length) {
			frameTimes.splice(currentFrame + 1, 0, frameTimes[currentFrame]);
			frameProperties.splice(currentFrame + 1, 0, {...frameProperties[currentFrame]});
			updateTimeline();
			updateFrameSelector();
			currentFrame++;
			updatePreview();
		}
	});
	
	removeFrame.addEventListener('click', () => {
		if (frameTimes.length > 1) {
			frameTimes.splice(currentFrame, 1);
			frameProperties.splice(currentFrame, 1);
			if (currentFrame >= frameTimes.length) currentFrame = frameTimes.length - 1;
			updateTimeline();
			updateFrameSelector();
			updatePreview();
		}
	});
	
	reverseFrames.addEventListener('click', () => {
		frameTimes.reverse();
		uploadedImages.reverse();
		frameProperties.reverse();
		updateTimeline();
	});
	
	haloInput.addEventListener('change', (e) => {
		if (e.target.files && e.target.files[0]) {
			const reader = new FileReader();
			reader.onload = (event) => {
				haloEffect.src = event.target.result;
				haloEffect.style.display = 'block';
			};
			reader.readAsDataURL(e.target.files[0]);
		}
	});
	
	positionHalo.addEventListener('click', () => {
		const offsetX = Math.floor(Math.random() * 50) - 25;
		const offsetY = Math.floor(Math.random() * 50) - 25;
		haloEffect.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
	});
	
	clearBtn.addEventListener('click', () => {
		uploadedImages = [];
		frameTimes = [200, 200];
		initFrameProperties();
		updateTimeline();
		updatePreview();
		haloEffect.style.display = 'none';
		hitPoint.style.display = 'none';
		document.querySelector('.imag-animat-status-bar p').textContent = 
		"All images cleared. Ready to upload new images.";
		stopAnimation();
		gifPreviewContainer.style.display = 'none';
	});
	
	applyOffset.addEventListener('click', () => {
		if (currentFrame < frameProperties.length) {
			frameProperties[currentFrame].offsetX = parseInt(offsetX.value) || 0;
			frameProperties[currentFrame].offsetY = parseInt(offsetY.value) || 0;
			updatePreview();
		}
	});
	
	gridToggle.addEventListener('change', () => {
		gridOverlay.style.display = gridToggle.checked ? 'block' : 'none';
	});
	
	placeHitPoint.addEventListener('click', () => {
		hitPoint.style.display = 'block';
		const x = parseInt(hitX.value) || 50;
		const y = parseInt(hitY.value) || 50;
		hitPoint.style.left = `${x}%`;
		hitPoint.style.top = `${y}%`;
		
		if (currentFrame < frameProperties.length) {
			frameProperties[currentFrame].hitPoint = { x, y };
		}
	});
	
	presets.forEach(preset => {
		preset.addEventListener('click', () => {
			const presetType = preset.getAttribute('data-preset');
			applyPreset(presetType);
		});
	});
	
	animationType.addEventListener('change', () => {
		if (animationType.value !== 'custom') {
			applyPreset(animationType.value);
		}
	});
	
	wmlBtn.addEventListener('click', generateWML);
	
	exportBtn.addEventListener('click', async () => {
		const format = exportFormat.value;
		
		if (uploadedImages.length === 0) {
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Upload images first before exporting.";
			return;
		}
		
		progressContainer.style.display = 'block';
		progressBar.style.width = '0%';
		
		try {
			if (format === 'gif') {
				await exportGIF();
				} else if (format === 'spritesheet') {
				await exportSpriteSheet();
				} else if (format === 'wml') {
				generateWML();
			}
			} catch (e) {
			console.error('Export failed:', e);
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Export failed: " + e.message;
			} finally {
			setTimeout(() => {
				progressContainer.style.display = 'none';
			}, 2000);
		}
	});
	
	// Volume control
	volumeSlider.addEventListener('input', () => {
		volume = parseInt(volumeSlider.value) / 100;
		volumeValue.textContent = `${parseInt(volumeSlider.value)}%`;
	});
	
	// Predefined halo buttons
	document.querySelectorAll('[data-halo]').forEach(button => {
		button.addEventListener('click', () => {
			const haloType = button.getAttribute('data-halo');
			if (predefinedAssets.halos[haloType]) {
				haloEffect.src = predefinedAssets.halos[haloType];
				haloEffect.style.display = 'block';
				document.querySelector('.imag-animat-status-bar p').textContent = 
				`Loaded "${haloType}" halo. Drag to reposition.`;
			}
		});
	});
	
	// Predefined sound buttons
	document.querySelectorAll('[data-sound]').forEach(button => {
		button.addEventListener('click', () => {
			const soundType = button.getAttribute('data-sound');
			if (predefinedAssets.sounds[soundType]) {
				const soundUrl = predefinedAssets.sounds[soundType];
				const soundName = soundType.charAt(0).toUpperCase() + soundType.slice(1);
				
				// Check if already exists
				if (soundEffects.some(s => s.name === soundName)) {
					document.querySelector('.imag-animat-status-bar p').textContent = 
					`Sound "${soundName}" already added.`;
					return;
				}
				
				// Add to soundEffects array
				soundEffects.push({
					name: soundName,
					url: soundUrl
				});
				
				// Preload the audio
				preloadAudio(soundUrl, soundName);
				
				// Add to UI list
				const soundItem = document.createElement('div');
				soundItem.className = 'imag-animat-sound-item';
				soundItem.innerHTML = `
				<span>${soundName}</span>
				<div class="imag-animat-sound-controls">
				<button class="imag-animat-btn imag-animat-btn-blue play-sound">▶</button>
				<button class="imag-animat-btn imag-animat-btn-red remove-sound">✕</button>
				</div>
				`;
				
				soundList.appendChild(soundItem);
				
				// Add to sound selector
				const option = document.createElement('option');
				option.value = soundName;
				option.textContent = soundName;
				soundSelector.appendChild(option);
				
				// Add event listeners to new buttons
				soundItem.querySelector('.play-sound').addEventListener('click', () => {
					playSound(soundName);
				});
				
				soundItem.querySelector('.remove-sound').addEventListener('click', () => {
					soundList.removeChild(soundItem);
					// Remove from soundEffects array
					soundEffects = soundEffects.filter(s => s.name !== soundName);
					// Remove from audio buffers
					delete audioBuffers[soundName];
					// Remove from sound selector
					const optionToRemove = Array.from(soundSelector.options).find(opt => opt.value === soundName);
					if (optionToRemove) {
						soundSelector.removeChild(optionToRemove);
					}
				});
				
				document.querySelector('.imag-animat-status-bar p').textContent = 
				`Sound "${soundName}" added.`;
			}
		});
	});
	
	// Initialize audio context
	function initAudio() {
		try {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			} catch (e) {
			console.error('Web Audio API not supported:', e);
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Web Audio API not supported. Sound effects disabled.";
		}
	}
	
	// Preload audio buffer
	async function preloadAudio(url, name) {
		if (!audioContext) return;
		
		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			audioBuffers[name] = audioBuffer;
			} catch (e) {
			console.error('Error loading audio:', e);
		}
	}
	
	// Play sound by name
	function playSound(name) {
		if (!audioContext || !audioBuffers[name]) return;
		
		try {
			const source = audioContext.createBufferSource();
			const gainNode = audioContext.createGain();
			
			source.buffer = audioBuffers[name];
			gainNode.gain.value = volume;
			
			source.connect(gainNode);
			gainNode.connect(audioContext.destination);
			source.start(0);
			} catch (e) {
			console.error('Error playing sound:', e);
		}
	}
	
	// Sound management
	addSoundBtn.addEventListener('click', () => {
		if (soundInput.files && soundInput.files[0]) {
			const file = soundInput.files[0];
			const reader = new FileReader();
			
			reader.onload = function(event) {
				const soundName = file.name;
				const soundUrl = event.target.result;
				
				// Add to soundEffects array
				soundEffects.push({
					name: soundName,
					url: soundUrl
				});
				
				// Preload the audio
				preloadAudio(soundUrl, soundName);
				
				// Add to UI list
				const soundItem = document.createElement('div');
				soundItem.className = 'imag-animat-sound-item';
				soundItem.innerHTML = `
				<span>${soundName}</span>
				<div class="imag-animat-sound-controls">
				<button class="imag-animat-btn imag-animat-btn-blue play-sound">▶</button>
				<button class="imag-animat-btn imag-animat-btn-red remove-sound">✕</button>
				</div>
				`;
				
				soundList.appendChild(soundItem);
				
				// Add to sound selector
				const option = document.createElement('option');
				option.value = soundName;
				option.textContent = soundName;
				soundSelector.appendChild(option);
				
				// Add event listeners to new buttons
				soundItem.querySelector('.play-sound').addEventListener('click', () => {
					playSound(soundName);
				});
				
				soundItem.querySelector('.remove-sound').addEventListener('click', () => {
					soundList.removeChild(soundItem);
					// Remove from soundEffects array
					soundEffects = soundEffects.filter(s => s.name !== soundName);
					// Remove from audio buffers
					delete audioBuffers[soundName];
					// Remove from sound selector
					const optionToRemove = Array.from(soundSelector.options).find(opt => opt.value === soundName);
					if (optionToRemove) {
						soundSelector.removeChild(optionToRemove);
					}
				});
			};
			
			reader.readAsDataURL(file);
		}
	});
	
	assignSoundBtn.addEventListener('click', () => {
		const frameIndex = parseInt(frameSelector.value) - 1;
		const soundName = soundSelector.value;
		
		if (frameIndex >= 0 && frameIndex < frameProperties.length) {
			frameProperties[frameIndex].sound = soundName || null;
			
			if (soundName) {
				document.querySelector('.imag-animat-status-bar p').textContent = 
				`Sound "${soundName}" assigned to frame ${frameIndex + 1}`;
				} else {
				document.querySelector('.imag-animat-status-bar p').textContent = 
				`Sound removed from frame ${frameIndex + 1}`;
			}
		}
	});
	
	// Export functions
	async function exportGIF() {
		document.querySelector('.imag-animat-status-bar p').textContent = 
		"Generating GIF animation...";
		
		try {
			// Use the first image to get dimensions
			const firstImg = await loadImage(uploadedImages[0]);
			const width = firstImg.width;
			const height = firstImg.height;
			
			// Create canvas for drawing frames
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			
			// Create GIF encoder
			const encoder = new GIFEncoder(width, height);
			
			// Process each frame
			for (let i = 0; i < uploadedImages.length; i++) {
				const img = await loadImage(uploadedImages[i]);
				
				// Clear canvas
				ctx.clearRect(0, 0, width, height);
				
				// Draw frame with properties
				const props = frameProperties[i];
				ctx.globalAlpha = props.opacity;
				ctx.drawImage(img, props.offsetX, props.offsetY);
				
				// Get image data
				const imageData = ctx.getImageData(0, 0, width, height);
				
				// Add frame to encoder
				encoder.addFrame(imageData.data, frameTimes[i]);
				
				// Update progress
				progressBar.style.width = `${((i + 1) / uploadedImages.length) * 100}%`;
			}
			
			// Generate GIF
			const gifData = encoder.encode();
			const blob = new Blob([gifData], { type: 'image/gif' });
			generatedGifUrl = URL.createObjectURL(blob);
			
			// Display GIF
			const gifImg = document.createElement('img');
			gifImg.src = generatedGifUrl;
			gifImg.className = 'gif-preview';
			gifImg.alt = 'Generated GIF';
			
			gifPreview.innerHTML = '';
			gifPreview.appendChild(gifImg);
			
			// Show preview panel
			gifPreviewContainer.style.display = 'block';
			gifStatus.className = 'gif-status success';
			gifStatus.textContent = 'GIF created successfully!';
			saveGifBtn.style.display = 'block';
			
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"GIF animation created successfully!";
			} catch (e) {
			console.error('GIF creation failed:', e);
			gifStatus.className = 'gif-status error';
			gifStatus.textContent = 'Failed to create GIF: ' + e.message;
			saveGifBtn.style.display = 'none';
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"GIF creation failed: " + e.message;
		}
	}
	
	// Save GIF button
	saveGifBtn.addEventListener('click', () => {
		if (generatedGifUrl) {
			const a = document.createElement('a');
			a.href = generatedGifUrl;
			a.download = 'wesnoth_animation.gif';
			a.click();
			gifStatus.textContent = 'GIF downloaded successfully!';
		}
	});
	
	async function exportSpriteSheet() {
		document.querySelector('.imag-animat-status-bar p').textContent = 
		"Generating sprite sheet...";
		
		// Load all images
		const images = [];
		for (const src of uploadedImages) {
			const img = await loadImage(src);
			images.push(img);
		}
		
		// Calculate sprite sheet dimensions
		const frameWidth = images[0].width;
		const frameHeight = images[0].height;
		const spriteWidth = frameWidth * images.length;
		const spriteHeight = frameHeight;
		
		// Create canvas for sprite sheet
		const canvas = document.createElement('canvas');
		canvas.width = spriteWidth;
		canvas.height = spriteHeight;
		const ctx = canvas.getContext('2d');
		
		// Draw all frames on the sprite sheet
		for (let i = 0; i < images.length; i++) {
			ctx.drawImage(images[i], i * frameWidth, 0);
			progressBar.style.width = `${((i + 1) / images.length) * 100}%`;
		}
		
		// Convert to data URL and download
		canvas.toBlob(function(blob) {
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'wesnoth_spritesheet.png';
			a.click();
			
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Sprite sheet downloaded successfully!";
		});
	}
	
	function loadImage(src) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}
	
	// Functions
	function handleFiles(files) {
		uploadedImages = [];
		for (let i = 0; i < Math.min(files.length, 20); i++) {
			const file = files[i];
			if (!file.type.match('image.*')) continue;
			
			const reader = new FileReader();
			reader.onload = (function(file) {
				return function(e) {
					uploadedImages.push(e.target.result);
					if (uploadedImages.length === Math.min(files.length, 20)) {
						// Adjust frameTimes to match the number of uploaded images
						if (frameTimes.length < uploadedImages.length) {
							const diff = uploadedImages.length - frameTimes.length;
							for (let j = 0; j < diff; j++) {
								frameTimes.push(parseInt(frameDurationValue.value));
								frameProperties.push({
									offsetX: 0,
									offsetY: 0,
									blendMode: 'normal',
									opacity: 1,
									hue: 0,
									saturation: 100,
									brightness: 100,
									contrast: 100,
									text: '',
									sound: null,
									hitPoint: { x: 50, y: 50 }
								});
							}
						}
						updateTimeline();
						updatePreview();
						updateFrameSelector();
						hitPoint.style.display = 'block';
					}
				};
			})(file);
			reader.readAsDataURL(file);
		}
		
		document.querySelector('.imag-animat-status-bar p').textContent = 
		`Loaded ${Math.min(files.length, 20)} images. Drag frames to reorder.`;
	}
	
	function updateFrameSelector() {
		frameSelector.innerHTML = '';
		for (let i = 1; i <= frameTimes.length; i++) {
			const option = document.createElement('option');
			option.value = i;
			option.textContent = `Frame ${i}`;
			frameSelector.appendChild(option);
		}
	}
	
	function updateTimeline() {
		timeline.innerHTML = '';
		frameTimes.forEach((time, index) => {
			const frame = document.createElement('div');
			frame.className = 'imag-animat-timeline-frame';
			frame.draggable = true;
			frame.dataset.index = index;
			
			if (index === currentFrame && isPlaying) {
				frame.classList.add('imag-animat-active');
			}
			
			if (index === currentFrame) {
				frame.classList.add('imag-animat-selected');
			}
			
			const frameNumber = document.createElement('span');
			frameNumber.className = 'imag-animat-frame-number';
			frameNumber.textContent = index + 1;
			
			const frameDuration = document.createElement('span');
			frameDuration.className = 'imag-animat-frame-duration';
			frameDuration.textContent = `${time}ms`;
			
			frame.appendChild(frameNumber);
			frame.appendChild(frameDuration);
			
			if (uploadedImages[index]) {
				const img = document.createElement('img');
				img.src = uploadedImages[index];
				img.style.width = '100%';
				img.style.height = '100%';
				img.style.objectFit = 'cover';
				frame.appendChild(img);
				} else {
				frame.textContent = `Frame ${index + 1}`;
				frame.style.fontSize = '12px';
				frame.style.padding = '5px';
			}
			
			// Add drag events
			frame.addEventListener('dragstart', (e) => {
				isDragging = true;
				dragSrcIndex = index;
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/html', frame.innerHTML);
				frame.classList.add('imag-animat-dragging');
			});
			
			frame.addEventListener('dragover', (e) => {
				e.preventDefault();
				return false;
			});
			
			frame.addEventListener('dragenter', (e) => {
				frame.classList.add('imag-animat-over');
			});
			
			frame.addEventListener('dragleave', () => {
				frame.classList.remove('imag-animat-over');
			});
			
			frame.addEventListener('drop', (e) => {
				e.stopPropagation();
				if (dragSrcIndex !== index) {
					// Reorder items
					[uploadedImages[dragSrcIndex], uploadedImages[index]] = [uploadedImages[index], uploadedImages[dragSrcIndex]];
					[frameTimes[dragSrcIndex], frameTimes[index]] = [frameTimes[index], frameTimes[dragSrcIndex]];
					[frameProperties[dragSrcIndex], frameProperties[index]] = [frameProperties[index], frameProperties[dragSrcIndex]];
					updateTimeline();
				}
				frame.classList.remove('imag-animat-over');
				return false;
			});
			
			frame.addEventListener('dragend', () => {
				isDragging = false;
				document.querySelectorAll('.imag-animat-timeline-frame').forEach(f => {
					f.classList.remove('imag-animat-over', 'imag-animat-dragging');
				});
			});
			
			// Add click event to select frame
			frame.addEventListener('click', () => {
				document.querySelectorAll('.imag-animat-timeline-frame').forEach(f => {
					f.classList.remove('imag-animat-selected');
				});
				frame.classList.add('imag-animat-selected');
				currentFrame = index;
				updatePreview();
				updateFramePropertiesUI();
			});
			
			timeline.appendChild(frame);
		});
	}
	
	function updateFramePropertiesUI() {
		if (currentFrame < frameProperties.length) {
			const props = frameProperties[currentFrame];
			offsetX.value = props.offsetX;
			offsetY.value = props.offsetY;
			opacitySlider.value = props.opacity * 100;
			opacityValue.textContent = `${props.opacity * 100}%`;
			hitX.value = props.hitPoint.x;
			hitY.value = props.hitPoint.y;
			hitPoint.style.left = `${props.hitPoint.x}%`;
			hitPoint.style.top = `${props.hitPoint.y}%`;
		}
	}
	
	function applyOpacityToFrame() {
		if (currentFrame < frameProperties.length) {
			frameProperties[currentFrame].opacity = opacitySlider.value / 100;
			animationPreview.style.opacity = frameProperties[currentFrame].opacity;
		}
	}
	
	function updatePreview() {
		if (uploadedImages.length > 0 && currentFrame < uploadedImages.length) {
			animationPreview.src = uploadedImages[currentFrame];
			
			// Apply frame properties
			if (currentFrame < frameProperties.length) {
				const props = frameProperties[currentFrame];
				animationPreview.style.transform = `translate(${props.offsetX}px, ${props.offsetY}px)`;
				animationPreview.style.opacity = props.opacity;
				hitPoint.style.left = `${props.hitPoint.x}%`;
				hitPoint.style.top = `${props.hitPoint.y}%`;
			}
		}
	}
	
	// Animation playback system
	function playAnimation() {
		if (uploadedImages.length === 0 || isPlaying) return;
		
		isPlaying = true;
		playBtn.disabled = true;
		pauseBtn.disabled = false;
		stopBtn.disabled = false;
		
		const loopOption = document.getElementById('imag-animat-loopOption').value;
		const direction = document.getElementById('imag-animat-direction').value;
		const speed = parseFloat(previewSpeed.value);
		
		animateFrames(0, 'forward', loopOption, direction, speed);
	}
	
	function animateFrames(frameIndex, currentDirection, loopOption, direction, speed) {
		if (!isPlaying) return;
		
		updateFrame(frameIndex);
		
		const nextFrame = getNextFrame(frameIndex, currentDirection, loopOption, direction);
		if (nextFrame === null) {
			stopAnimation();
			return;
		}
		
		const frameTime = frameTimes[frameIndex] / speed;
		animationTimeout = setTimeout(() => {
			animateFrames(nextFrame.index, nextFrame.direction, loopOption, direction, speed);
		}, frameTime);
	}
	
	function getNextFrame(currentIndex, currentDirection, loopOption, directionSetting) {
		let nextIndex = currentIndex;
		let nextDirection = currentDirection;
		
		if (directionSetting === 'reverse') {
			nextIndex--;
			if (nextIndex < 0) {
				if (loopOption === 'loop') {
					nextIndex = uploadedImages.length - 1;
					} else {
					return null;
				}
			}
			} else {
			if (currentDirection === 'forward') {
				nextIndex++;
				} else {
				nextIndex--;
			}
			
			if (nextIndex >= uploadedImages.length) {
				if (loopOption === 'loop') {
					nextIndex = 0;
					} else if (loopOption === 'bounce' || loopOption === 'pingpong') {
					nextDirection = 'reverse';
					nextIndex = uploadedImages.length - 2;
					} else {
					return null;
				}
				} else if (nextIndex < 0) {
				if (loopOption === 'pingpong') {
					nextDirection = 'forward';
					nextIndex = 1;
					} else {
					return null;
				}
			}
		}
		
		return { index: nextIndex, direction: nextDirection };
	}
	
	function updateFrame(index) {
		currentFrame = index;
		if (uploadedImages[index]) {
			animationPreview.src = uploadedImages[index];
			
			// Apply frame properties
			if (index < frameProperties.length) {
				const props = frameProperties[index];
				animationPreview.style.transform = `translate(${props.offsetX}px, ${props.offsetY}px)`;
				animationPreview.style.opacity = props.opacity;
				hitPoint.style.left = `${props.hitPoint.x}%`;
				hitPoint.style.top = `${props.hitPoint.y}%`;
				
				// Play sound if assigned
				if (props.sound) {
					playSound(props.sound);
				}
			}
		}
		
		// Update timeline
		document.querySelectorAll('.imag-animat-timeline-frame').forEach((frame, i) => {
			frame.classList.remove('imag-animat-active');
			if (i === index) {
				frame.classList.add('imag-animat-active');
			}
		});
	}
	
	function pauseAnimation() {
		if (!isPlaying) return;
		
		clearTimeout(animationTimeout);
		isPlaying = false;
		playBtn.disabled = false;
		pauseBtn.disabled = true;
	}
	
	function stopAnimation() {
		clearTimeout(animationTimeout);
		isPlaying = false;
		currentFrame = 0;
		updatePreview();
		updateTimeline();
		playBtn.disabled = false;
		pauseBtn.disabled = true;
		stopBtn.disabled = true;
	}
	
	function applyPreset(presetType) {
		// Reset to default
		frameTimes = [200, 200, 200, 200];
		initFrameProperties();
		
		switch(presetType) {
			case 'attack':
			frameProperties[0].offsetX = -10;
			frameProperties[1].offsetX = 15;
			frameProperties[2].offsetX = 5;
			frameProperties[3].offsetX = 0;
			frameTimes = [150, 100, 150, 200];
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Melee attack preset applied: Forward lunge with weapon";
			break;
			case 'ranged':
			frameProperties[1].offsetY = -5;
			frameProperties[2].offsetY = 0;
			frameTimes = [200, 300, 150, 250];
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Ranged attack preset applied: Bow draw and release";
			break;
			case 'defend':
			frameProperties[1].offsetX = -5;
			frameProperties[2].offsetX = 10;
			frameTimes = [200, 100, 200, 300];
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Defend preset applied: Shield raise and impact";
			break;
			case 'death':
			frameProperties[2].offsetY = 20;
			frameProperties[3].opacity = 0.3;
			frameTimes = [250, 250, 350, 500];
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Death preset applied: Fall and fade out";
			break;
			case 'victory':
			frameProperties[1].offsetY = -10;
			frameProperties[2].offsetY = 0;
			frameProperties[3].offsetY = -5;
			frameTimes = [300, 200, 200, 300];
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Victory preset applied: Cheer and weapon raise";
			break;
			case 'magic':
			frameProperties[1].offsetX = 5;
			frameProperties[2].offsetX = -5;
			frameTimes = [300, 200, 200, 300];
			document.querySelector('.imag-animat-status-bar p').textContent = 
			"Magic cast preset applied: Spell casting with glow";
			break;
		}
		
		updateTimeline();
		updatePreview();
		updateFrameSelector();
	}
	
	function generateWML() {
		if (uploadedImages.length === 0) {
			wmlPreview.textContent = "Upload images first to generate WML code";
			wmlPreview.style.display = 'block';
			return;
		}
		
		let wmlCode = `[animation]\n`;
		wmlCode += `    id=${animationType.value || "custom"}_animation\n`;
		wmlCode += `    image="your_unit_image.png" # Replace with actual image path\n\n`;
		
		wmlCode += `    # Frame definitions\n`;
		frameTimes.forEach((time, index) => {
			wmlCode += `    [frame]\n`;
			wmlCode += `        duration=${time}\n`;
			if (frameProperties[index].offsetX !== 0 || frameProperties[index].offsetY !== 0) {
				wmlCode += `        offset_x=${frameProperties[index].offsetX}\n`;
				wmlCode += `        offset_y=${frameProperties[index].offsetY}\n`;
			}
			if (frameProperties[index].hitPoint) {
				wmlCode += `        hit_x=${frameProperties[index].hitPoint.x}\n`;
				wmlCode += `        hit_y=${frameProperties[index].hitPoint.y}\n`;
			}
			if (frameProperties[index].sound) {
				wmlCode += `        sound="${frameProperties[index].sound}"\n`;
			}
			wmlCode += `    [/frame]\n`;
		});
		
		wmlCode += `[/animation]`;
		
		wmlPreview.textContent = wmlCode;
		wmlPreview.style.display = 'block';
		document.querySelector('.imag-animat-status-bar p').textContent = 
		"WML code generated. Copy and use in your Wesnoth unit files.";
	}
	
	// Initialize the timeline and grid
	initAudio();
	updateTimeline();
	updateFrameSelector();
	gridOverlay.style.display = 'block';
	
});