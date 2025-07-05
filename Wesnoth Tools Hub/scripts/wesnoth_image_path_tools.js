window.wesnothImageTools = {
	lightboxViewMode: 'single'
};
function getPathBaseName(path) {
    const lastDot = path.lastIndexOf('.');
    if (lastDot === -1) return path;
    return path.substring(0, lastDot);
}

function getPathExtension(path) {
    const lastDot = path.lastIndexOf('.');
    if (lastDot === -1) return '';
    return path.substring(lastDot + 1);
}
// Add this at the top of wesnoth_image_path_tools.js
window.imageTransforms = {
    apply: function(imgElement, transform) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        ctx.drawImage(imgElement, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        switch(transform.func) {
            case 'BRIGHTEN':
			const amount = parseInt(transform.params[0]);
			for (let i = 0; i < data.length; i += 4) {
				data[i] = Math.min(255, Math.max(0, data[i] + amount));
				data[i+1] = Math.min(255, Math.max(0, data[i+1] + amount));
				data[i+2] = Math.min(255, Math.max(0, data[i+2] + amount));
			}
			break;
			
            case 'CONTRAST':
			const factor = parseFloat(transform.params[0]);
			for (let i = 0; i < data.length; i += 4) {
				data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
				data[i+1] = Math.min(255, Math.max(0, factor * (data[i+1] - 128) + 128));
				data[i+2] = Math.min(255, Math.max(0, factor * (data[i+2] - 128) + 128));
			}
			break;
			
            case 'ADJUST_ALPHA':
            case 'O':
			const alpha = transform.func === 'ADJUST_ALPHA' 
			? parseInt(transform.params[0]) 
			: Math.round(parseFloat(transform.params[0]) * 255);
			for (let i = 3; i < data.length; i += 4) {
				data[i] = alpha;
			}
			break;
			
			case 'R':
			const degrees = parseInt(transform.params[0]);
			const radians = degrees * Math.PI / 180;
			
			const w = imgElement.naturalWidth;
			const h = imgElement.naturalHeight;
			const sin = Math.abs(Math.sin(radians));
			const cos = Math.abs(Math.cos(radians));
			const newWidth = Math.floor(w * cos + h * sin);
			const newHeight = Math.floor(h * cos + w * sin);
			
			canvas.width = newWidth;
			canvas.height = newHeight;
			ctx.save();
			ctx.translate(newWidth/2, newHeight/2);
			ctx.rotate(radians);
			ctx.drawImage(imgElement, -w/2, -h/2, w, h);
			ctx.restore();
			return canvas.toDataURL();
		}
        
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
	}
};
document.addEventListener('DOMContentLoaded', function() {
	// Toggle help section
	const toggleHelpBtn = document.getElementById('imag-tools-toggle-help');
	const helpContent = document.getElementById('imag-tools-help-content');
    // Find the container where all path inputs are shown
    const pathContainer = document.getElementById('imag-tools-lightbox-image-path');
	
	toggleHelpBtn.addEventListener('click', function() {
		helpContent.classList.toggle('collapsed');
		this.textContent = helpContent.classList.contains('collapsed') ? '+' : '-';
	});
	
	// Elements
	const chooseDirectoryBtn = document.getElementById('imag-tools-choose-directory');
	const imagesContainer = document.getElementById('imag-tools-images-display');
	const viewSelectedBtn = document.getElementById('imag-tools-view-selected');
	const lightbox = document.getElementById('imag-tools-lightbox');
	const lightboxImg = document.getElementById('imag-tools-lightbox-img');
	const lightboxClose = document.querySelector('.imag-tools-lightbox-close');
	const lightboxPrev = document.querySelector('.imag-tools-lightbox-prev');
	const lightboxNext = document.querySelector('.imag-tools-lightbox-next');
	const lightboxPath = document.getElementById('imag-tools-lightbox-path');
	const zoomSelect = document.getElementById('imag-tools-lightbox-zoom');
	const rotationSelect = document.getElementById('imag-tools-lightbox-rotation');
	const selectedItemsContainer = document.getElementById('imag-tools-selected-items');
	const lightboxImagePath = document.getElementById('imag-tools-lightbox-image-path');
	
	// View mode elements
	const viewModeSelect = document.getElementById('imag-tools-lightbox-view-mode');
	const gridContainer = document.getElementById('imag-tools-lightbox-grid-container');
	const modeIndicator = document.getElementById('imag-tools-lightbox-mode-indicator');
	
	// State
	let directories = [];
	let imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
	let selectedImages = [];
	let currentLightboxIndex = 0;
	let lightboxViewMode = 'single'; // 'single' or 'all'
	let progressContainer, currentDirSpan, progressBar;
	
	// Add directory function
	async function addDirectory() {
		try {
			// Request directory access first
			const handle = await window.showDirectoryPicker();
			
			// Now show progress UI
			if (!progressContainer) {
				progressContainer = document.createElement('div');
				progressContainer.id = 'imag-tools-progress-container';
				progressContainer.style.cssText = `
                margin: 15px 0; 
                background: rgba(0,0,0,0.2); 
                padding: 10px; 
                border-radius: 4px;
                display: none;
				`;
				
				const dirDisplay = document.createElement('div');
				currentDirSpan = document.createElement('span');
				currentDirSpan.style.fontWeight = 'bold';
				dirDisplay.innerHTML = 'Scanning: ';
				dirDisplay.appendChild(currentDirSpan);
				
				progressBar = document.createElement('progress');
				progressBar.id = 'imag-tools-progress-bar';
				progressBar.style.width = '100%';
				progressBar.max = 100;
				progressBar.value = 0;
				
				progressContainer.appendChild(dirDisplay);
				progressContainer.appendChild(progressBar);
				document.querySelector('.imag-tools-controls').after(progressContainer);
			}
			
			// Show progress UI
			progressContainer.style.display = 'block';
			currentDirSpan.textContent = handle.name;
			progressBar.value = 0;
			
			// Create directory object
			const directory = {
				id: Date.now().toString(),
				handle: handle,
				name: handle.name,
				images: []
			};
			
			// Add to state
			directories.push(directory);
			renderDirectories();
			
			// Scan for images
			await scanDirectoryForImages(directory, handle);
			
			// Render images
			renderImages();
			} catch (error) {
			console.error('Error loading directory:', error);
			alert('Error loading directory. Please try again.');
			} finally {
			if (progressContainer) {
				progressContainer.style.display = 'none';
			}
		}
	}
	
	// Recursive function to scan directory for images
	async function scanDirectoryForImages(directory, handle) {
		let fileCount = 0;
		let totalFiles = 0;
		
		// First pass: count files
		for await (const entry of handle.values()) {
			if (entry.kind === 'file') totalFiles++;
		}
		
		// Second pass: process files
		for await (const entry of handle.values()) {
			if (entry.kind === 'file') {
				fileCount++;
				progressBar.value = (fileCount / totalFiles) * 100;
				currentDirSpan.textContent = `${handle.name} (${fileCount}/${totalFiles})`;
				
				const file = await entry.getFile();
				const extension = entry.name.split('.').pop().toLowerCase();
				
				if (imageExtensions.includes(extension)) {
					const url = URL.createObjectURL(file);
					
					directory.images.push({
						id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
						name: entry.name,
						path: `${directory.name}/${entry.name}`,
						url: url,
						file: file
					});
				}
				} else if (entry.kind === 'directory') {
				// Recursively scan subdirectories
				await scanDirectoryForImages(directory, entry);
			}
		}
	}
	//  render directories
	function renderDirectories() {
		const container = document.getElementById('imag-tools-directories-container');
		if (!container) return;
		
		container.innerHTML = '<h3>Loaded Directories</h3>';
		
		if (directories.length === 0) {
			container.innerHTML += '<div class="imag-tools-empty-state">No directories loaded</div>';
			return;
		}
		
		const list = document.createElement('div');
		list.className = 'imag-tools-directories-list';
		
		directories.forEach(dir => {
			const dirElement = document.createElement('div');
			dirElement.className = 'imag-tools-directory-item';
			dirElement.textContent = dir.name;
			list.appendChild(dirElement);
		});
		
		container.appendChild(list);
	}
	// Render images in grid
	function renderImages() {
		imagesContainer.innerHTML = '';
		
		// Get all images from all directories
		const allImages = [];
		directories.forEach(dir => {
			allImages.push(...dir.images);
		});
		
		if (allImages.length === 0) {
			imagesContainer.innerHTML = `
			<div class="imag-tools-empty-state">
			<h3>No images found</h3>
			<p>The selected directories don't contain any supported image files.</p>
			</div>
			`;
			return;
		}
		
		// Render images
		allImages.forEach(image => {
			const isSelected = selectedImages.includes(image.id);
			const card = document.createElement('div');
			card.className = 'imag-tools-image-card';
			card.innerHTML = `
			<img src="${image.url}" alt="${image.name}" class="imag-tools-image-preview">
			<div class="imag-tools-image-info">
			<div class="imag-tools-image-name">${image.name}</div>
			<div class="imag-tools-image-controls">
			<button class="imag-tools-btn ${isSelected ? 'imag-tools-btn-remove' : ''}" 
			data-id="${image.id}">
			${isSelected ? 'Unselect' : 'Select'}
			</button>
			</div>
			</div>
			`;
			imagesContainer.appendChild(card);
			
			// Add event listener to the button
			const btn = card.querySelector('button');
			btn.addEventListener('click', function() {
				toggleImageSelection(image.id);
			});
		});
	}
	
	// Toggle image selection
	function toggleImageSelection(id) {
		const index = selectedImages.indexOf(id);
		if (index === -1) {
			selectedImages.push(id);
			} else {
			selectedImages.splice(index, 1);
		}
		renderImages();
	}
	
	// Show lightbox with selected images
	viewSelectedBtn.addEventListener('click', function() {
		if (selectedImages.length === 0) {
			alert('No images selected. Please select some images first.');
			return;
		}
		
		currentLightboxIndex = 0;
		lightboxViewMode = 'single'; // Reset to single view
		viewModeSelect.value = 'single';
		updateLightboxView();
		lightbox.style.display = 'flex';
		document.body.style.overflow = 'hidden';
	});
	
	// Close lightbox
	lightboxClose.addEventListener('click', function() {
		lightbox.style.display = 'none';
		document.body.style.overflow = 'auto';
	});
	
	// Lightbox navigation
	lightboxPrev.addEventListener('click', function() {
		navigateLightbox(-1);
	});
	
	lightboxNext.addEventListener('click', function() {
		navigateLightbox(1);
	});
	
	// Keyboard navigation
	document.addEventListener('keydown', function(e) {
		if (lightbox.style.display === 'flex') {
			if (e.key === 'ArrowLeft') {
				navigateLightbox(-1);
				} else if (e.key === 'ArrowRight') {
				navigateLightbox(1);
				} else if (e.key === 'Escape') {
				lightbox.style.display = 'none';
				document.body.style.overflow = 'auto';
			}
		}
	});
	
	function navigateLightbox(direction) {
		if (selectedImages.length === 0) return;
		currentLightboxIndex = (currentLightboxIndex + direction + selectedImages.length) % selectedImages.length;
		showLightboxImage();
		if (lightboxViewMode === 'all') {
			renderPathList();
		}
	}
	
	// Show current image in lightbox
	function showLightboxImage() {
		const imageId = selectedImages[currentLightboxIndex];
		let image = null;
		
		// Find the image in directories
		for (const dir of directories) {
			const foundImage = dir.images.find(img => img.id === imageId);
			if (foundImage) {
				image = foundImage;
				break;
			}
		}
		
		if (image) {
			lightboxImg.src = image.url;
			
			// Get base name and extension
			const extension = getPathExtension(image.path);
			const baseName = getPathBaseName(image.path);
			window.currentImageBase = baseName;
			window.currentImageExt = extension;
			
			// Store original image URL for transformations
			lightboxImg.dataset.original = image.url;
			
			// Update path display
			lightboxImagePath.innerHTML = `
			<div class="imag-tools-path-input-container">
			<span class="imag-tools-path-basename">${baseName}</span>
			<span class="imag-tools-path-extension">.${extension}</span>
			<input type="text" class="imag-tools-lightbox-image-path-input" id="imag-tools-area-input" value="">
			</div>
			`;
			
			applyImageTransformations();
			if (lightboxViewMode === 'all') {
				renderPathList();
			}
		}
	}
	
	// get selected images
	function getSelectedImagesData() {
		const images = [];
		selectedImages.forEach(id => {
			for (const dir of directories) {
				const img = dir.images.find(i => i.id === id);
				if (img) {
					images.push({
						id: img.id,
						path: img.path,
						baseName: getPathBaseName(img.path),
						extension: getPathExtension(img.path)
					});
					break;
				}
			}
		});
		return images;
	}
	// Update selected items list in sidebar
	function updateSelectedItemsList() {
		selectedItemsContainer.innerHTML = '';
		
		if (selectedImages.length === 0) {
			selectedItemsContainer.innerHTML = '<div class="imag-tools-empty-state">No images selected</div>';
			return;
		}
		
		// Create a map of images by ID for faster lookup
		const imagesMap = new Map();
		directories.forEach(dir => {
			dir.images.forEach(image => {
				imagesMap.set(image.id, image);
			});
		});
		
		// Render selected images
		selectedImages.forEach(imageId => {
			const image = imagesMap.get(imageId);
			if (!image) return;
			
			const isActive = imageId === selectedImages[currentLightboxIndex];
			const item = document.createElement('div');
			item.className = `imag-tools-selected-item ${isActive ? 'active' : ''}`;
			item.dataset.id = imageId;
			
			item.innerHTML = `
			<img src="${image.url}" class="imag-tools-selected-thumb">
			<div class="imag-tools-selected-name">${image.name}</div>
			`;
			
			item.addEventListener('click', function() {
				const id = this.dataset.id;
				currentLightboxIndex = selectedImages.indexOf(id);
				showLightboxImage();
			});
			
			selectedItemsContainer.appendChild(item);
		});
	}
	
	// Apply zoom and rotation transformations
	function applyImageTransformations() {
		if (lightboxViewMode === 'single' && lightboxImg) {
			applyTransformationsToElement(lightboxImg);
			} else if (lightboxViewMode === 'all') {
			const gridImages = gridContainer.querySelectorAll('.imag-tools-grid-item img');
			gridImages.forEach(img => {
				applyTransformationsToElement(img);
			});
		}
	}
	
	// Toggle view mode
	viewModeSelect.addEventListener('change', function() {
		lightboxViewMode = this.value;
		updateLightboxView();
	});
	
	// Function to update lightbox view
	function updateLightboxView() {
		if (lightboxViewMode === 'single') {
			// Show single image view
			lightboxImg.style.display = 'block';
			gridContainer.style.display = 'none';
			lightboxPrev.style.display = 'flex';
			lightboxNext.style.display = 'flex';
			modeIndicator.textContent = 'Single View: ';
			showLightboxImage();
			window.wesnothImageTools.lightboxViewMode = 'single';
			} else {
			// Show all images grid
			lightboxImg.style.display = 'none';
			gridContainer.style.display = 'block';
			lightboxPrev.style.display = 'none';
			lightboxNext.style.display = 'none';
			modeIndicator.textContent = 'All Selected Images';
			lightboxImagePath.textContent = ''; // Clear image path
			renderAllSelectedImages();
			window.wesnothImageTools.lightboxViewMode = 'all';
			renderPathList();
		}
	}
	
	// Render grid view of all selected images
	function renderAllSelectedImages() {
		gridContainer.innerHTML = '';
		
		if (selectedImages.length === 0) {
			gridContainer.innerHTML = '<div class="imag-tools-empty-state">No images selected</div>';
			return;
		}
		
		// Create a map of images by ID for faster lookup
		const imagesMap = new Map();
		directories.forEach(dir => {
			dir.images.forEach(image => {
				imagesMap.set(image.id, image);
			});
		});
		
		// Create grid container
		const grid = document.createElement('div');
		grid.className = 'imag-tools-grid';
		
		// Add all selected images to the grid
		selectedImages.forEach(imageId => {
			const image = imagesMap.get(imageId);
			if (!image) return;
			
			const extension = getPathExtension(image.path);
			const baseName = getPathBaseName(image.path);
			
			const item = document.createElement('div');
			item.className = 'imag-tools-grid-item';
			item.dataset.id = imageId;
			item.dataset.baseName = baseName;
			item.dataset.extension = extension;
			
			item.innerHTML = `
			<img src="${image.url}" alt="${image.name}" 
			data-original="${image.url}"> <!-- Ensure original is stored -->
			<input type="text" class="imag-tools-grid-item-path-input" 
			value="${baseName}.${extension}">
			`;
			
			// Apply transformations to the image
			const imgElement = item.querySelector('img');
			applyTransformationsToElement(imgElement);
			
			// Only keep this click handler for selection
			item.addEventListener('click', function(e) {
				// Only activate if not clicking on input directly
				if (!e.target.classList.contains('imag-tools-grid-item-path-input')) {
					grid.querySelectorAll('.imag-tools-grid-item').forEach(el => {
						el.classList.remove('active');
					});
					this.classList.add('active');
				}
			});
			
			grid.appendChild(item);
		});
		
		gridContainer.appendChild(grid);
	}
	
	function applyTransformToAllImages(transformFunc, params) {
		const gridItems = document.querySelectorAll('.imag-tools-grid-item');
		gridItems.forEach(item => {
			const img = item.querySelector('img');
			if (img && img.dataset.original) {
				const tempImg = new Image();
				tempImg.onload = function() {
					try {
						const transformed = window.imageTransforms.apply(tempImg, {
							func: transformFunc,
							params: params
						});
						img.src = transformed;
						} catch (e) {
						console.error('Transformation failed:', e);
					}
				};
				tempImg.src = img.dataset.original;
			}
		});
	}
	function renderPathList() {
		const container = lightboxImagePath;
		container.innerHTML = '';
		
		if (selectedImages.length === 0) return;
		
		// Create a map of images by ID
		const imagesMap = new Map();
		directories.forEach(dir => {
			dir.images.forEach(image => {
				imagesMap.set(image.id, image);
			});
		});
		
		// Create path list container
		const pathListContainer = document.createElement('div');
		pathListContainer.className = 'imag-tools-path-list-container';
		
		// Create path list
		selectedImages.forEach(imageId => {
			const image = imagesMap.get(imageId);
			if (!image) return;
			
			const extension = getPathExtension(image.path);
			const baseName = getPathBaseName(image.path);
			
			const item = document.createElement('div');
			item.className = 'imag-tools-path-list-item';
			item.dataset.id = imageId;
			
			// Highlight active item
			if (imageId === selectedImages[currentLightboxIndex]) {
				item.classList.add('active');
			}
			
			item.innerHTML = `
            <div class="imag-tools-path-input-container">
			<span class="imag-tools-path-basename">${baseName}</span>
			<span class="imag-tools-path-extension">.${extension}</span>
			<input type="text" class="imag-tools-path-input" value="">
            </div>
			`;
			
			pathListContainer.appendChild(item);
		});
		
		container.appendChild(pathListContainer);
	}
	function applyTransformationsToElement(el) {
		const zoomValue = zoomSelect.value;
		const rotationValue = rotationSelect.value;
		
		el.style.objectFit = '';
		el.style.width = '';
		el.style.height = '';
		
		if (zoomValue === 'contain') {
			el.style.objectFit = 'contain';
			} else {
			el.style.width = `${zoomValue}%`;
			el.style.height = 'auto';
		}
		
		el.style.transform = `rotate(${rotationValue}deg)`;
	}
	window.applyTransformationsToElement = function(el) {
		const zoomValue = document.getElementById('imag-tools-lightbox-zoom').value;
		const rotationValue = document.getElementById('imag-tools-lightbox-rotation').value;
		
		el.style.objectFit = '';
		el.style.width = '';
		el.style.height = '';
		
		if (zoomValue === 'contain') {
			el.style.objectFit = 'contain';
			} else {
			el.style.width = `${zoomValue}%`;
			el.style.height = 'auto';
		}
		
		el.style.transform = `rotate(${rotationValue}deg)`;
		return el;
	};
	// Initialize
	chooseDirectoryBtn.addEventListener('click', addDirectory);
	zoomSelect.addEventListener('change', applyImageTransformations);
	rotationSelect.addEventListener('change', applyImageTransformations);
	
	
	zoomSelect.addEventListener('change', applyImageTransformations);
	rotationSelect.addEventListener('change', applyImageTransformations);
	// Close lightbox when clicking outside content
	lightbox.addEventListener('click', function(e) {
		if (e.target === lightbox) {
			lightbox.style.display = 'none';
			document.body.style.overflow = 'auto';
		}
	});
	// When typing happens in any input field
	pathContainer.addEventListener('input', function(e) {
		if (lightboxViewMode === 'all' && 
			e.target.classList.contains('imag-tools-path-input')) {
			
			const text = e.target.value;
			const allInputs = pathContainer.querySelectorAll('.imag-tools-path-input');
			
			// Update ALL inputs with the same value
			allInputs.forEach(input => {
				if (input !== e.target) {
					input.value = text;
				}
			});
			
			// Update function panel
			if (window.updateFunctionPanelFromPath) {
				window.updateFunctionPanelFromPath(text);
			}
		}
	});
	document.addEventListener('input', function(e) {
		if (e.target.classList.contains('imag-tools-lightbox-image-path-input')) {
			const text = e.target.value;
			if (window.updateFunctionPanelFromPath) {
				window.updateFunctionPanelFromPath(text);
			}
		}
	});
	window.getSelectedImagesData = getSelectedImagesData;
});