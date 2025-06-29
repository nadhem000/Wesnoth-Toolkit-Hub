document.addEventListener('DOMContentLoaded', function() {
	// Toggle help section
	const toggleHelpBtn = document.getElementById('imag-tools-toggle-help');
	const helpContent = document.getElementById('imag-tools-help-content');
	
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
	
	// NEW: View mode elements
	const viewModeSelect = document.getElementById('imag-tools-lightbox-view-mode');
	const gridContainer = document.getElementById('imag-tools-lightbox-grid-container');
	const modeIndicator = document.getElementById('imag-tools-lightbox-mode-indicator');
	
	// State
	let directories = [];
	let imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
	let selectedImages = [];
	let currentLightboxIndex = 0;
	let lightboxViewMode = 'single'; // 'single' or 'all'
	
	// Add directory function
	async function addDirectory() {
		try {
			// Request directory access
			const handle = await window.showDirectoryPicker();
			
			// Create directory object
			const directory = {
				id: Date.now().toString(),
				handle: handle,
				name: handle.name,
				images: []
			};
			
			// Add to state
			directories.push(directory);
			
			// Scan for images
			await scanDirectoryForImages(directory, handle);
			
			// Render images
			renderImages();
			} catch (error) {
			console.error('Error loading directory:', error);
			alert('Error loading directory. Please try again.');
		}
	}
	
	// Recursive function to scan directory for images
	async function scanDirectoryForImages(directory, handle) {
		for await (const entry of handle.values()) {
			if (entry.kind === 'file') {
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
        lightboxImagePath.textContent = image.path; // Update only the path text
        applyImageTransformations();
    }
		
		updateSelectedItemsList();
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
				// Switch to single view if in grid mode
				if (lightboxViewMode === 'all') {
					lightboxViewMode = 'single';
					viewModeSelect.value = 'single';
					updateLightboxView();
				}
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
	
	// NEW: Toggle view mode
	viewModeSelect.addEventListener('change', function() {
		lightboxViewMode = this.value;
		updateLightboxView();
	});
	
	// NEW: Function to update lightbox view
	function updateLightboxView() {
		if (lightboxViewMode === 'single') {
			// Show single image view
			lightboxImg.style.display = 'block';
			gridContainer.style.display = 'none';
			lightboxPrev.style.display = 'flex';
			lightboxNext.style.display = 'flex';
        modeIndicator.textContent = 'Single View: ';
        showLightboxImage();
			} else {
			// Show all images grid
			lightboxImg.style.display = 'none';
			gridContainer.style.display = 'block';
			lightboxPrev.style.display = 'none';
			lightboxNext.style.display = 'none';
        modeIndicator.textContent = 'All Selected Images';
        lightboxImagePath.textContent = ''; // Clear image path
        renderAllSelectedImages();
		}
	}
	
	// NEW: Render grid view of all selected images
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

        const item = document.createElement('div');
        item.className = 'imag-tools-grid-item';
        item.dataset.id = imageId;

        item.innerHTML = `
            <img src="${image.url}" alt="${image.name}">
            <div class="imag-tools-grid-item-path">${image.path}</div>
        `;

        // FIX: Get the image element AFTER it's created
        const imgElement = item.querySelector('img');
        applyTransformationsToElement(imgElement); // Apply transformations here

        // Apply current transformations to each image
        applyTransformationsToElement(imgElement);
			item.className = 'imag-tools-grid-item';
			item.dataset.id = imageId;
			
			item.innerHTML = `
			<img src="${image.url}" alt="${image.name}">
			<div class="imag-tools-grid-item-path">${image.path}</div>
			`;
			
			// Add click handler to switch to single view
			item.addEventListener('click', function() {
				// Switch to single view
				lightboxViewMode = 'single';
				viewModeSelect.value = 'single';
				updateLightboxView();
				
				// Find the index of this image
				currentLightboxIndex = selectedImages.indexOf(imageId);
				showLightboxImage();
			});
			
			grid.appendChild(item);
		});
		
		gridContainer.appendChild(grid);
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
});