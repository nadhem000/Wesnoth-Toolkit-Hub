// Function data array
const imageFunctions = [
	{
		name: "~ADJUST_ALPHA()",
		description: "Adjusts image transparency.",
		samples: [
			{ label: "50% Opacity", value: "~ADJUST_ALPHA(128)" }
		]
	},
	{
		name: "~BL()",
		description: "Adds a black outline to team-colored parts.",
		samples: [
			{ label: "Apply Black Outline", value: "~BL()" }
		]
	},
	{
		name: "~BLIT()",
		description: "Composites an image onto another at specified coordinates.",
		samples: [
			{ label: "Place Unit (12,18)", value: "~BLIT(units/knight.png,12,18)" }
		]
	},
	{
		name: "~BRIGHTEN()",
		description: "Adjusts image brightness.",
		samples: [
			{ label: "+40 Brightness", value: "~BRIGHTEN(40)" }
		]
	},
	{
		name: "~CONTRAST()",
		description: "Adjusts image contrast.",
		samples: [
			{ label: "1.5x Contrast", value: "~CONTRAST(1.5)" }
		]
	},
	{
		name: "~CROP()",
		description: "Extracts a rectangular region from an image.",
		samples: [
			{ label: "Crop Section (10,15,80,120)", value: "~CROP(10,15,80,120)" }
		]
	},
	{
		name: "~CS()",
		description: "Recolors via RGB multipliers (0-256).",
		samples: [
			{ label: "Gold Tint (220,180,100)", value: "~CS(220,180,100)" }
		]
	},
	{
		name: "~FL()",
		description: "Flips image horizontally/vertically.",
		samples: [
			{ label: "Horizontal Flip", value: "~FL(1,0)" },
			{ label: "Vertical Flip", value: "~FL(0,1)" },
			{ label: "Both Flip", value: "~FL(1,1)" }
		]
	},
	{
		name: "~GS()",
		description: "Converts to grayscale.",
		samples: [
			{ label: "Apply Grayscale", value: "~GS()" }
		]
	},
	{
		name: "~NEG()",
		description: "Inverts image colors.",
		samples: [
			{ label: "Apply Negative", value: "~NEG()" }
		]
	},
	{
		name: "~O()",
		description: "Sets opacity (0.0-1.0).",
		samples: [
			{ label: "70% Opacity", value: "~O(0.7)" }
		]
	},
	{
		name: "~R()",
		description: "Rotates image clockwise.",
		samples: [
			{ label: "45° Rotation", value: "~R(45)" }
		]
	},
	{
		name: "~RC()",
		description: "Recolors to a single RGB color.",
		samples: [
			{ label: "Cyan (0,255,255)", value: "~RC(0,255,255)" }
		]
	},
	{
		name: "~SCALE()",
		description: "Resizes to specified dimensions.",
		samples: [
			{ label: "Resize to 150x200", value: "~SCALE(150,200)" }
		]
	}
];
const advancedOptions = [
	{
		name: "ADJUST_ALPHA",
		description: "Adjusts image transparency.",
		parameters: [
			{ name: "amount", type: "slider", min: 0, max: 255, defaultValue: 128, value: 128 }
		]
	},
	{
		name: "BRIGHTEN",
		description: "Adjusts image brightness.",
		parameters: [
			{ name: "amount", type: "slider", min: -100, max: 100, defaultValue: 0, value: 0 }
		]
	},
	{
		name: "CONTRAST",
		description: "Adjusts image contrast.",
		parameters: [
			{ 
				name: "factor", 
				type: "slider", 
				min: 0, 
				max: 300, 
				defaultValue: 100,
				value: 100,
				convert: v => (v / 100).toFixed(1)
			}
		]
	},
	{
		name: "O",
		description: "Sets image opacity.",
		parameters: [
			{ 
				name: "opacity", 
				type: "slider", 
				min: 0, 
				max: 100, 
				defaultValue: 100,
				value: 100,
				convert: v => (v / 100).toFixed(1)
			}
		]
	},
	{
		name: "R",
		description: "Rotates the image.",
		parameters: [
			{ name: "degrees", type: "slider", min: 0, max: 360, defaultValue: 0, value: 0 }
		]
	}
];
// Define slider parameters for each function
const functionParameters = {
    '~ADJUST_ALPHA()': {min: 0, max: 255, value: 128, step: 1},
    '~BRIGHTEN()': {min: -100, max: 100, value: 0, step: 1},
    '~CONTRAST()': {min: 0, max: 300, value: 100, step: 10, convert: v => v/100},
    '~O()': {min: 0, max: 100, value: 70, step: 1, convert: v => v/100},
    '~R()': {min: 0, max: 360, value: 0, step: 1}
};

function parseTransformFunction(funcString) {
    const match = funcString.match(/^~([A-Z_]+)\(([^)]*)\)/);
    if (!match) return null;
    return {
        func: match[1],
        params: match[2].split(',').map(p => p.trim())
    };
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function transformImageElement(img, transform) {
    try {
        return window.imageTransforms.apply(img, transform);
    } catch (error) {
        console.error('Transform error', error);
        return img.src;
    }
}

async function applyFunctionChain(originalSrc, functionChain) {
    const functionStrings = functionChain.split('~').filter(s => s.trim() !== '');
    let currentSrc = originalSrc;

    for (const funcString of functionStrings) {
        const fullFuncString = '~' + funcString;
        const transform = parseTransformFunction(fullFuncString);
        if (!transform) continue;

        const img = await loadImage(currentSrc);
        currentSrc = transformImageElement(img, transform);
    }

    return currentSrc;
}

async function updateGridItemImage(item, originalSrc) {
    const input = item.querySelector('.imag-tools-grid-item-path-input');
    if (!input) return;

    const functionChain = input.value;
    
    try {
        const img = item.querySelector('img');
        if (!img) return;
        
        if (!functionChain.includes('~')) {
            img.src = originalSrc;
        } else {
            const transformed = await applyFunctionChain(originalSrc, functionChain);
            img.src = transformed;
        }
    } catch (error) {
        console.error('Error applying function chain:', error);
    }
}
function generateAdvancedOptions() {
	let html = '';
	advancedOptions.forEach(option => {
		html += `<div class="option-row" id="option-${option.name}">`;
		html += `<h4>${option.name}: ${option.description}</h4>`;
		// Change reset button to call resetAdvancedOption
		html += `<button onclick="resetAdvancedOption('${option.name}')" class="imag-tools-reset-btn">Reset</button>`;
		option.parameters.forEach(param => {
			html += `
			<div class="imag-tools-param-group">
			<label>${param.name}:</label>
			<input type="range" 
			min="${param.min}" 
			max="${param.max}" 
			value="${param.value}"
			class="param-slider"
			data-option="${option.name}"
			data-param="${param.name}">
			<span class="slider-value">${param.value}</span>
			</div>
			`;
		});
		html += `<button onclick="applyAdvancedOption('${option.name}')">Apply</button>`;
		html += `</div>`;
	});
	document.getElementById('advanced-options-container').innerHTML = html;
	// Add event listeners to sliders
	document.querySelectorAll('.param-slider').forEach(slider => {
		slider.addEventListener('input', function() {
			const valueSpan = this.nextElementSibling;
			valueSpan.textContent = this.value;
		});
	});
}
async function applyAdvancedOption(optionName) {
    const option = advancedOptions.find(opt => opt.name === optionName);
    if (!option) return;

    const loadingIndicator = document.getElementById('imag-tools-loading');
    const viewMode = window.wesnothImageTools?.lightboxViewMode || 'single';
    
    try {
        // Show loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        
        // Get parameter values
        const paramValues = option.parameters.map(param => {
            const slider = document.querySelector(
                `[data-option="${optionName}"][data-param="${param.name}"]`
            );
            const rawValue = slider?.value;
            return param.convert ? param.convert(rawValue) : rawValue;
        });

        if (viewMode === 'single') {
            await applyToSingleView(optionName, paramValues);
        } else if (viewMode === 'all') {
            await applyToAllView(optionName, paramValues);
        }
    } catch (error) {
        console.error('Error applying option:', error);
        showErrorNotification('Transformation failed');
    } finally {
        // Always hide loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

async function applyToSingleView(optionName, paramValues) {
    const preview = document.getElementById('imag-tools-lightbox-img');
    if (!preview?.dataset.original) return;

    try {
        // Get the current function chain from the input
        const input = document.querySelector('.imag-tools-lightbox-image-path-input');
        const functionChain = input ? input.value : '';
        
        // Add the new function to the chain
        const newFunc = `~${optionName}(${paramValues.join(',')})`;
        const newChain = deduplicateFunctions(functionChain + newFunc);
        
        // Apply the entire function chain
        const transformed = await applyFunctionChain(
            preview.dataset.original, 
            newChain
        );
        
        preview.src = transformed;
        
        // Update the input
        if (input) {
            input.value = newChain;
        }
    } catch (error) {
        console.error('Single view transformation failed:', error);
        throw error;
    }
}

async function applyToAllView(optionName, paramValues) {
    const gridItems = document.querySelectorAll('.imag-tools-grid-item');
    if (gridItems.length === 0) return;

    const updatePromises = [];
    for (const item of gridItems) {
        const input = item.querySelector('.imag-tools-grid-item-path-input');
        if (!input) continue;

        const img = item.querySelector('img');
        if (!img || !img.dataset.original) continue;
        
        const newFunc = `~${optionName}(${paramValues.join(',')})`;
        const newChain = deduplicateFunctions(input.value + newFunc);
        input.value = newChain;
        
        updatePromises.push((async () => {
            try {
                const transformed = await applyFunctionChain(img.dataset.original, newChain);
                img.src = transformed;
            } catch (error) {
                console.error('Error updating grid item image:', error);
            }
        })());
    }

    await Promise.all(updatePromises);
}

function transformImage(src, func, params) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                resolve(window.imageTransforms.apply(img, { func, params }));
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = src;
    });
}

// Utility function (implementation not shown)
function showErrorNotification(message) {
    // Show error to user (toast/notification)
}
function resetAdvancedOption(optionName) {
    const option = advancedOptions.find(opt => opt.name === optionName);
    const viewMode = window.wesnothImageTools?.lightboxViewMode || 'single';
    if (!option) return;

    // Reset sliders to default values
    option.parameters.forEach(param => {
        const slider = document.querySelector(
            `[data-option="${optionName}"][data-param="${param.name}]`
        );
        if (slider) {
            slider.value = param.defaultValue;
            const valueSpan = slider.nextElementSibling;
            if (valueSpan) {
                valueSpan.textContent = param.defaultValue;
            }
        }
    });

    // Remove function from path inputs
    if (viewMode === 'single') {
        const input = document.querySelector('.imag-tools-lightbox-image-path-input');
        if (input) {
            const funcPattern = new RegExp(`~${optionName}\\([^)]*\\)`, 'g');
            input.value = input.value.replace(funcPattern, '');
        }
        
        const preview = document.getElementById('imag-tools-lightbox-img');
        if (preview && preview.dataset.original) {
            preview.src = preview.dataset.original;
        }
    } 
    else if (viewMode === 'all') {
        const gridItems = document.querySelectorAll('.imag-tools-grid-item');
        gridItems.forEach(item => {
            const input = item.querySelector('.imag-tools-grid-item-path-input');
            if (input) {
                const funcPattern = new RegExp(`~${optionName}\\([^)]*\\)`, 'g');
                input.value = input.value.replace(funcPattern, '');
                input.dispatchEvent(new Event('input'));
            }
            
            const img = item.querySelector('img');
            if (img && img.dataset.original) {
                img.src = img.dataset.original;
            }
        });
    }
}
// Helper to update image preview
function updateImagePreview(path) {
	document.getElementById('image-preview').src = path;
	document.getElementById('output-path').value = path;
}
function deduplicateFunctions(path) {
	if (!path.includes('~')) return path;
	const firstTilde = path.indexOf('~');
	const imageBase = path.substring(0, firstTilde);
	const functionString = path.substring(firstTilde);
	// Split functions and keep last occurrence of each type
	const functions = [];
	const seen = new Set();
	functionString.split('~').filter(Boolean).reverse().forEach(func => {
		const funcName = func.split('(')[0];
		if (!seen.has(funcName)) {
			functions.unshift(func);
			seen.add(funcName);
		}
	});
	return imageBase + '~' + functions.join('~');
}
// Show function details when a button is clicked
function showFunctionDetails(funcName) {
	const container = document.getElementById('imag-tools-function-details-container');
	container.innerHTML = '';
	const func = imageFunctions.find(f => f.name === funcName);
	if (!func) return;
	const details = document.createElement('div');
	details.className = 'imag-tools-func-details';
	// Add description
	const desc = document.createElement('div');
	desc.className = 'imag-tools-func-description';
	desc.textContent = func.description;
	details.appendChild(desc);
	// Add samples
	func.samples.forEach(sample => {
		const sampleDiv = document.createElement('div');
		sampleDiv.className = 'imag-tools-func-sample';
		sampleDiv.innerHTML = `<strong>${sample.label}:</strong> <code>${sample.value}</code>`;
		details.appendChild(sampleDiv);
		const sampleDesc = document.createElement('div');
		sampleDesc.className = 'imag-tools-func-sample-desc';
		sampleDesc.textContent = getSampleDescription(func.name, sample.value);
		details.appendChild(sampleDesc);
	});
	// Add slider if applicable
	if (functionParameters[func.name]) {
		const params = functionParameters[func.name];
		const sliderContainer = document.createElement('div');
		sliderContainer.className = 'imag-tools-func-slider';
		sliderContainer.innerHTML = `
		<label>Adjust value:</label>
		<input type="range" min="${params.min}" max="${params.max}" 
		value="${params.value}" step="${params.step}" 
		class="imag-tools-func-slider-input">
		<span class="imag-tools-func-slider-value">${params.value}</span>
		`;
		details.appendChild(sliderContainer);
		const slider = sliderContainer.querySelector('.imag-tools-func-slider-input');
		const valueDisplay = sliderContainer.querySelector('.imag-tools-func-slider-value');
		slider.addEventListener('input', function() {
			valueDisplay.textContent = this.value;
		});
	}
	// Add action buttons
	const actionButtons = document.createElement('div');
	actionButtons.className = 'imag-tools-func-actions';
	actionButtons.innerHTML = `
	<button class="imag-tools-func-apply">Apply</button>
	<button class="imag-tools-func-reset">Reset</button>
	<button class="imag-tools-func-copy" id="imag-tools-copy-full-path">Copy Path</button>
	<button class="imag-tools-func-close">Close</button>
	`;
	details.appendChild(actionButtons);
	// Event listeners for action buttons
	const applyBtn = actionButtons.querySelector('.imag-tools-func-apply');
	const copyBtn = actionButtons.querySelector('.imag-tools-func-copy');
	const closeBtn = actionButtons.querySelector('.imag-tools-func-close');
	const resetBtn = actionButtons.querySelector('.imag-tools-func-reset');
	resetBtn.addEventListener('click', function() {
		const preview = document.getElementById('imag-tools-lightbox-img');
		if (preview && preview.dataset.original) {
			preview.src = preview.dataset.original;
		}
		// Clear path input
		if (window.wesnothImageTools.lightboxViewMode === 'single') {
			const input = document.querySelector('.imag-tools-lightbox-image-path-input');
			if (input) input.value = '';
			} else {
			document.querySelectorAll('.imag-tools-path-input').forEach(input => {
				input.value = '';
			});
		}
	});
	applyBtn.addEventListener('click', function() {
		const sample = func.samples[0].value;
		const modifiedSample = applySliderValue(func.name, sample);
		const viewMode = window.wesnothImageTools?.lightboxViewMode || 'single';
		if (viewMode === 'single') {
			const preview = document.getElementById('imag-tools-lightbox-img');
			if (!preview || !preview.dataset.original) return;
			// Extract function name and parameters
			const funcPart = modifiedSample.substring(1);
			const funcName = funcPart.split('(')[0];
			const params = funcPart.match(/\(([^)]+)\)/)[1].split(',').map(p => p.trim());
			const img = new Image();
			img.onload = function() {
				try {
					const transformed = window.imageTransforms.apply(img, {
						func: funcName,
						params: params
					});
					preview.src = transformed;
					} catch (e) {
					console.error('Transformation failed:', e);
				}
			};
			img.src = preview.dataset.original;
		}
		// Update path input
		appendToPathInput(modifiedSample);
	});
	copyBtn.addEventListener('click', function() {
		const sample = func.samples[0].value;
		const modifiedSample = applySliderValue(func.name, sample);
		copyToClipboard(modifiedSample);
	});
	closeBtn.addEventListener('click', function() {
		container.innerHTML = '';
	});
	container.appendChild(details);
}
// Get sample description based on function and value
function getSampleDescription(funcName, sampleValue) {
	const baseSample = sampleValue.split('(')[0];
	const value = sampleValue.match(/\(([^)]+)\)/)?.[1] || '';
	const descriptions = {
		'~ADJUST_ALPHA()': `Sets opacity to ${value}/255 ≈ ${Math.round((value/255)*100)}%`,
		'~BL()': 'Adds black outline to team-colored parts',
		'~BLIT()': `Places image at position (${value.split(',')[1]},${value.split(',')[2]})`,
		'~BRIGHTEN()': `Adjusts brightness by ${value} units`,
		'~CONTRAST()': `Sets contrast to ${value}x`,
		'~CROP()': `Crops to rectangle starting at (${value.split(',')[0]},${value.split(',')[1]})`,
		'~CS()': `Applies RGB multipliers (${value})`,
		'~FL()': value === '1,0' ? 'Flips horizontally' : 
		value === '0,1' ? 'Flips vertically' : 'Flips both directions',
		'~GS()': 'Converts to grayscale',
		'~NEG()': 'Inverts colors (negative)',
		'~O()': `Sets opacity to ${value * 100}%`,
		'~R()': `Rotates ${value}° clockwise`,
		'~RC()': `Recolors to RGB(${value})`,
		'~SCALE()': `Resizes to ${value.replace(',', '×')} pixels`
	};
	return descriptions[funcName] || `Applies ${funcName} function`;
}
// Apply current slider value to sample
function applySliderValue(funcName, sample) {
	if (!functionParameters[funcName]) return sample;
	const container = document.getElementById('imag-tools-function-details-container');
	if (!container) return sample;
	const slider = container.querySelector('.imag-tools-func-slider-input');
	if (!slider) return sample;
	const paramConfig = functionParameters[funcName];
	let value = slider.value;
	if (paramConfig.convert) {
		value = paramConfig.convert(value);
	}
	return sample.replace(/\([^)]*\)/, `(${value})`);
}
// Append value to path input
function appendToPathInput(value) {
	const viewMode = window.wesnothImageTools?.lightboxViewMode || 'single';
	if (viewMode === 'single') {
		const input = document.querySelector('.imag-tools-lightbox-image-path-input');
		if (input) {
			input.value = deduplicateFunctions(input.value + value);
			input.dispatchEvent(new Event('input'));
		}
	} 
	else if (viewMode === 'all') {
		const allInputs = document.querySelectorAll('.imag-tools-path-input');
		allInputs.forEach(input => {
			input.value = deduplicateFunctions(input.value + value);
			input.dispatchEvent(new Event('input'));
		});
	}
}
// Copy value to clipboard
function copyToClipboard(value) {
	const viewMode = window.wesnothImageTools?.lightboxViewMode || 'single';
	let textToCopy = '';
	if (viewMode === 'single') {
		const base = window.currentImageBase || '';
		const ext = window.currentImageExt ? '.' + window.currentImageExt : '';
		textToCopy = base + ext + value;
	} 
	else if (viewMode === 'all') {
		// Check if getSelectedImagesData exists
		if (typeof window.getSelectedImagesData === 'function') {
			const selectedImages = window.getSelectedImagesData();
			textToCopy = selectedImages.map(img => {
				return img.path + value;
			}).join('\n');
			} else {
			// Fallback in case function isn't available
			textToCopy = 'Error: Could not get image data';
		}
	}
	navigator.clipboard.writeText(textToCopy).then(() => {
		alert('Copied to clipboard!');
	});
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
	// Attach event listeners to simple buttons
	document.querySelectorAll('.imag-tools-function-buttons .imag-tools-func-btn').forEach(button => {
		button.addEventListener('click', function() {
			const sample = this.getAttribute('data-sample');
			// FIX: Use a safer function name extraction method
			const funcName = extractFunctionName(sample);
			if (funcName) {
				showFunctionDetails(funcName);
				} else {
				console.error('Could not extract function name from:', sample);
			}
		});
	});
	// Parse function string and extract name/params
	function parseFunctionString(funcString) {
		const match = funcString.match(/^(~[A-Z_]+)\(([^)]*)\)/);
		if (!match) return null;
		return {
			name: match[1] + '()',
			params: match[2].split(',').map(p => p.trim())
		};
	}
	// Update function panel based on path input
	// Update this function
	function updateFunctionPanelFromPath(text) {
		const funcData = parseFunctionString(text);
		if (!funcData) return;
		// Find matching function
		const func = imageFunctions.find(f => f.name === funcData.name);
		if (!func || !functionParameters[func.name]) return;
		// Show function details
		showFunctionDetails(func.name);
		// Set slider value
		setTimeout(() => {
			const container = document.getElementById('imag-tools-function-details-container');
			const slider = container?.querySelector('.imag-tools-func-slider-input');
			const valueDisplay = container?.querySelector('.imag-tools-func-slider-value');
			if (slider && valueDisplay) {
				// Handle different value types
				let value = funcData.params[0];
				if (func.name === '~O()') {
					value = parseFloat(value) * 100; // Convert 0.7 to 70
				}
				slider.value = value;
				valueDisplay.textContent = value;
			}
		}, 10);
	}
	// Helper function to extract function name
	function extractFunctionName(sample) {
		// Match the function signature without parameters
		const match = sample.match(/^([^\(]+)\(\)/);
		if (match) return match[0];
		// Try to match functions with parameters
		const baseName = sample.split('(')[0];
		if (baseName) return baseName + '()';
		return null;
	}
	window.updateFunctionPanelFromPath = updateFunctionPanelFromPath;
});

/* Based on the [ImagePathFunctions page](https://wiki.wesnoth.org/ImagePathFunctions) from the Wesnoth Wiki, here are the supported path functions with sample paths and explanations:
---
### 1. **`~ADJUST_ALPHA()`**  
Adjusts image transparency.  
**Example**:  
`scenery/water.png~ADJUST_ALPHA(128)`  
→ Reduces water image opacity to 50% (128/255).  
---
### 2. **`~BL()`**  
Adds a black outline to team-colored parts of an image.  
**Example**:  
`units/elvish-archer.png~BL()`  
→ Applies a black border to the archer's team-colored areas.  
---
### 3. **`~BLIT()`**  
Composites an image onto another at specified coordinates.  
**Example**:  
`terrain/grass.png~BLIT(units/knight.png,12,18)`  
→ Places the knight unit image at position (12,18) on the grass background.  
---
### 4. **`~BRIGHTEN()`**  
Adjusts image brightness.  
**Example**:  
`items/lamp.png~BRIGHTEN(40)`  
→ Increases lamp brightness by 40 units.  
---
### 5. **`~CONTRAST()`**  
Adjusts image contrast.  
**Example**:  
`portraits/orc.png~CONTRAST(1.5)`  
→ Boosts orc portrait contrast by 1.5×.  
---
### 6. **`~CROP()`**  
Extracts a rectangular region from an image.  
**Example**:  
`portraits/human.png~CROP(10,15,80,120)`  
→ Crops a 80×120-pixel section starting at (10,15).  
---
### 7. **`~CS()`**  
Recolors an image via RGB multipliers (0–256).  
**Example**:  
`units/dwarf.png~CS(220,180,100)`  
→ Tints the dwarf unit with gold-like colors.  
---
### 8. **`~FL()`**  
Flips an image horizontally/vertically.  
**Example**:  
`flags/wesnoth.png~FL(1,0)`  
→ Flips the flag horizontally.  
---
### 9. **`~GS()`**  
Converts an image to grayscale.  
**Example**:  
`icons/sword.png~GS()`  
→ Renders the sword icon in grayscale.  
---
### 10. **`~NEG()`**  
Inverts image colors (negative effect).  
**Example**:  
`scenery/clouds.png~NEG()`  
→ Inverts cloud colors to a "dark mode" style.  
---
### 11. **`~O()`**  
Sets opacity (0.0 = fully transparent, 1.0 = opaque).  
**Example**:  
`effects/smoke.png~O(0.7)`  
→ Makes smoke effect 70% opaque.  
---
### 12. **`~R()`**  
Rotates an image clockwise by degrees.  
**Example**:  
`decorations/arrow.png~R(45)`  
→ Rotates the arrow 45 degrees.  
---
### 13. **`~RC()`**  
Recolors non-transparent pixels to a single RGB color.  
**Example**:  
`misc/magic-circle.png~RC(0,255,255)`  
→ Colors the magic circle cyan (RGB: 0,255,255).  
---
### 14. **`~SCALE()`**  
Resizes an image to specified dimensions.  
**Example**:  
`portraits/elf.png~SCALE(150,200)`  
→ Scales the elf portrait to 150×200 pixels.  
---
### Notes:
- Functions can be **chained** (e.g., `image.png~CS(200,0,0)~O(0.5)` for red-tinted semi-transparency).  
- Arguments are **comma-separated** with no spaces (e.g., `~CROP(0,0,64,64)`).  
- For team colors, use `~RC()` with the team's RGB values.  
For advanced usage, see the [full documentation](https://wiki.wesnoth.org/ImagePathFunctions). */