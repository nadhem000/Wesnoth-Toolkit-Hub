// images_advanced_tools.js
document.addEventListener('DOMContentLoaded', function() {
    const lightboxImagePath = document.getElementById('imag-tools-lightbox-image-path');
    const editablePathInput = document.getElementById('imag-tools-lightbox-editable-path');
    const funcButtons = document.querySelectorAll('.imag-tools-func-btn');
    
    // Create editable path input if it doesn't exist
    if (!editablePathInput) {
        const pathContainer = document.querySelector('.imag-tools-lightbox-path');
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'imag-tools-lightbox-editable-path';
        input.className = 'imag-tools-lightbox-image-path-input';
        pathContainer.appendChild(input);
    }
    
    // Add event listeners to function buttons
    funcButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sample = this.getAttribute('data-sample');
            const currentValue = editablePathInput.value;
            
            // Append the function to the current path
            editablePathInput.value = currentValue + sample;
            
            // Update the path display
            lightboxImagePath.textContent = editablePathInput.value;
        });
    });
    
    // Make the path editable
    if (editablePathInput) {
        editablePathInput.addEventListener('input', function() {
            lightboxImagePath.textContent = this.value;
        });
    }
});