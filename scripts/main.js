// Global variables
let canvas;
let affirmationManager;
let currentState = 'initializing'; // 'initializing', 'displaying', 'transitioning', 'creating'
let displayDuration = 6000; // how long to display text before transition (ms)
let displayStartTime = 0;
let lastStateChange = 0; // Track when we last changed states
let debugMode = true; // Enable for console logs

// P5.js setup function - runs once at the beginning
function setup() {
    // Create canvas that fills the container
    const container = document.getElementById('canvas-container');
    canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvas-container');

    // Initialize affirmation manager
    affirmationManager = new AffirmationManager();
    
    // Load initial affirmation
    affirmationManager.loadInitialAffirmation().then(() => {
        // Initialize the first set of characters with fade-in animation
        affirmationManager.initializeCharacters();
        
        // Set current state and start timer
        changeState('displaying');
        
        // Hide loading indicator
        document.getElementById('loading').classList.add('hidden');
    });

    // Set text properties
    textFont('Playfair Display');
    textAlign(CENTER, CENTER);
}

// Helper function to change states with logging
function changeState(newState) {
    if (debugMode) console.log(`State change: ${currentState} -> ${newState} at ${millis()}ms`);
    currentState = newState;
    lastStateChange = millis();
    
    if (newState === 'displaying') {
        displayStartTime = millis();
    }
}

// P5.js draw function - runs continuously
function draw() {
    background(0); // Black background

    // Handle different states
    switch (currentState) {
        case 'initializing':
            // Just show loading state, handled by HTML/CSS
            break;
            
        case 'displaying':
            // Display and update characters
            affirmationManager.updateAndDisplayCharacters();
            
            // Check if it's time to transition to a new affirmation
            if (millis() - displayStartTime > displayDuration && 
                affirmationManager.isFadeInComplete()) {
                
                // Request the next affirmation and start transition
                affirmationManager.requestNextAffirmation().then(() => {
                    // Start fading out current characters
                    affirmationManager.prepareForTransition();
                    changeState('transitioning');
                });
            }
            break;
            
        case 'transitioning':
            // Display characters that are fading out
            affirmationManager.updateAndDisplayCharacters();
            
            // When all characters have faded out, create new ones
            if (affirmationManager.isFadeOutComplete()) {
                affirmationManager.createNewCharacters();
                changeState('creating');
            }
            
            // Safety timeout - if we've been in this state too long, force next state
            if (millis() - lastStateChange > 5000) {
                if (debugMode) console.log("Safety timeout in transitioning state");
                affirmationManager.createNewCharacters();
                changeState('creating');
            }
            break;
            
        case 'creating':
            // Display characters that are fading in
            affirmationManager.updateAndDisplayCharacters();
            
            // When all characters have faded in, go back to displaying state
            if (affirmationManager.isFadeInComplete()) {
                changeState('displaying');
            }
            
            // Safety timeout - if we've been in this state too long, force next state
            if (millis() - lastStateChange > 5000) {
                if (debugMode) console.log("Safety timeout in creating state");
                changeState('displaying');
            }
            break;
    }
}

// Handle window resize
function windowResized() {
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth, container.offsetHeight);
    
    // Update affirmation positioning
    if (affirmationManager) {
        affirmationManager.handleResize();
    }
} 