// images_advanced_tools.js
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

// Define slider parameters for each function
const functionParameters = {
    '~ADJUST_ALPHA()': {min: 0, max: 255, value: 128, step: 1},
    '~BRIGHTEN()': {min: -100, max: 100, value: 0, step: 1},
    '~CONTRAST()': {min: 0, max: 300, value: 100, step: 10},
    '~O()': {min: 0, max: 100, value: 70, step: 1},
    '~R()': {min: 0, max: 360, value: 0, step: 1}
};

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
        <button class="imag-tools-func-copy">Copy Path</button>
        <button class="imag-tools-func-close">Close</button>
    `;
    details.appendChild(actionButtons);
    
    // Event listeners for action buttons
    const applyBtn = actionButtons.querySelector('.imag-tools-func-apply');
    const copyBtn = actionButtons.querySelector('.imag-tools-func-copy');
    const closeBtn = actionButtons.querySelector('.imag-tools-func-close');
    
    applyBtn.addEventListener('click', function() {
        const sample = func.samples[0].value;
        const modifiedSample = applySliderValue(func.name, sample);
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

  // Look for the slider in the current function details container
  const container = document.getElementById('imag-tools-function-details-container');
  if (!container) return sample;

  const slider = container.querySelector('.imag-tools-func-slider-input');
  if (!slider) return sample;

  return sample.replace(/\([^)]*\)/, `(${slider.value})`);
}

// Append value to path input
function appendToPathInput(value) {
  const input = document.getElementById('imag-tools-lightbox-editable-path');
  if (input) {
    input.value += value;
    input.dispatchEvent(new Event('input'));
  }
}

// Copy value to clipboard
function copyToClipboard(value) {
  navigator.clipboard.writeText(value).then(() => {
    alert('Copied to clipboard!');
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create editable path input if it doesn't exist
  const pathContainer = document.querySelector('.imag-tools-lightbox-path');
  if (pathContainer && !document.getElementById('imag-tools-lightbox-editable-path')) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'imag-tools-lightbox-editable-path';
    input.className = 'imag-tools-lightbox-image-path-input';
    pathContainer.appendChild(input);
  }
  
  // Attach event listeners to simple buttons
  document.querySelectorAll('.imag-tools-function-buttons .imag-tools-func-btn').forEach(button => {
    button.addEventListener('click', function() {
      const sample = this.getAttribute('data-sample');
      const funcName = sample.split('(')[0] + ')';
      showFunctionDetails(funcName);
    });
  });
});