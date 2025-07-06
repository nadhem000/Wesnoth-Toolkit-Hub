class ModuleLoader {
    constructor(containerId = 'tool-container') {
        this.container = document.getElementById(containerId);
        this.currentModule = null;
    }
    
    async loadModule(moduleName) {
        try {
            // Use relative paths without protocol
            const response = await fetch(`modules/${moduleName}.html`);
            if (!response.ok) throw new Error('Module not found');
            const html = await response.text();
            
            this.container.innerHTML = html;
            this.currentModule = moduleName;
            
            // Load module script
            const script = document.createElement('script');
            script.src = `scripts/${moduleName}.js`;
            document.body.appendChild(script);
            
            history.pushState({ module: moduleName }, '', `#${moduleName}`);
        } catch (error) {
            console.error('Failed to load module:', error);
            this.container.innerHTML = `
            <div class="error-message">
                <h3>Module Load Error</h3>
                <p>Failed to load ${moduleName} tool</p>
                <button class="btn" id="return-dashboard">Back to Dashboard</button>
            </div>`;
        }
    }
    
    init() {
        // Check if running locally
        if (window.location.protocol === 'file:') {
            console.warn('Running in local file mode - some features may be limited');
        }
        
        // Load module from URL hash
        if (window.location.hash) {
            const moduleName = window.location.hash.substring(1);
            this.loadModule(moduleName);
        }
        
        // Handle back button
        window.addEventListener('popstate', (e) => {
            if (e.state?.module) {
                this.loadModule(e.state.module);
            } else {
                this.showDashboard();
            }
        });
    }
    
    showDashboard() {
        this.container.innerHTML = `
        <div class="tools-container">
            ${document.querySelector('.tools-container').innerHTML}
        </div>`;
        this.currentModule = null;
    }
}

const loader = new ModuleLoader();
document.addEventListener('DOMContentLoaded', () => loader.init());