// Global variables
let canvas;
let affirmationManager;
let currentState = 'initializing'; // 'initializing', 'displaying', 'transitioning', 'creating'
let displayDuration = 6000; // how long to display text before transition (ms)
let displayStartTime = 0;

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
        currentState = 'displaying';
        displayStartTime = millis();
        
        // Hide loading indicator
        document.getElementById('loading').classList.add('hidden');
    });

    // Set text properties
    textFont('Playfair Display');
    textAlign(CENTER, CENTER);
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
            if (millis() - displayStartTime > displayDuration && affirmationManager.isFadeInComplete()) {
                // Request the next affirmation
                affirmationManager.requestNextAffirmation().then(() => {
                    // Start fading out current characters
                    affirmationManager.prepareForTransition();
                    currentState = 'transitioning';
                });
            }
            break;
            
        case 'transitioning':
            // Display characters that are fading out
            affirmationManager.updateAndDisplayCharacters();
            
            // When all characters have faded out, create new ones
            if (affirmationManager.isFadeOutComplete()) {
                affirmationManager.createNewCharacters();
                currentState = 'creating';
            }
            break;
            
        case 'creating':
            // Display characters that are fading in
            affirmationManager.updateAndDisplayCharacters();
            
            // When all characters have faded in, go back to displaying state
            if (affirmationManager.isFadeInComplete()) {
                currentState = 'displaying';
                displayStartTime = millis();
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