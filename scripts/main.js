// Global variables
let canvas;
let affirmationManager;
let currentMode = 'text'; // 'text', 'transition', 'boids'
let transitionProgress = 0;
let transitionDirection = 'to-boids'; // 'to-boids', 'to-text'
let transitionDuration = 3000; // milliseconds for boids transition
let textTransitionDuration = 4000; // milliseconds for text transition (longer for smoother effect)
let transitionStartTime = 0;
let displayDuration = 6000; // how long to display text before transition
let displayStartTime = 0;
let boidsFlightDuration = 8000; // how long boids fly before next affirmation
let boidsStartTime = 0;

// Constants
const MAX_PARTICLES = 100;
const TRAILS_ENABLED = false;

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
        // Start the display cycle
        displayStartTime = millis();
        currentMode = 'text';
        
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
    switch (currentMode) {
        case 'text':
            affirmationManager.displayText();
            
            // Check if it's time to transition to boids
            if (millis() - displayStartTime > displayDuration) {
                currentMode = 'transition';
                transitionDirection = 'to-boids';
                transitionStartTime = millis();
                transitionProgress = 0;
                affirmationManager.prepareForBoids();
            }
            break;
            
        case 'transition':
            // Calculate transition progress (0 to 1)
            if (transitionDirection === 'to-boids') {
                transitionProgress = constrain((millis() - transitionStartTime) / transitionDuration, 0, 1);
            } else { // to-text - use longer duration for smoother effect
                transitionProgress = constrain((millis() - transitionStartTime) / textTransitionDuration, 0, 1);
            }
            
            if (transitionDirection === 'to-boids') {
                affirmationManager.transitionToBoids(transitionProgress);
                
                // Check if transition is complete
                if (transitionProgress >= 1) {
                    currentMode = 'boids';
                    boidsStartTime = millis();
                }
            } else { // to-text
                affirmationManager.transitionToText(transitionProgress);
                
                // Check if transition is complete
                if (transitionProgress >= 1) {
                    // Reset text reveal for the new affirmation
                    affirmationManager.textRevealProgress = 0;
                    affirmationManager.lastCharacterTime = millis();
                    
                    currentMode = 'text';
                    displayStartTime = millis();
                }
            }
            break;
            
        case 'boids':
            affirmationManager.updateAndDisplayBoids();
            
            // Check if it's time to transition back to text
            if (millis() - boidsStartTime > boidsFlightDuration) {
                // Request new affirmation if needed
                affirmationManager.requestNextAffirmation().then(() => {
                    currentMode = 'transition';
                    transitionDirection = 'to-text';
                    transitionStartTime = millis();
                    transitionProgress = 0;
                    affirmationManager.prepareForText();
                });
            }
            break;
    }
}

// Handle window resize
function windowResized() {
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth, container.offsetHeight);
    
    // Update affirmation positioning if needed
    if (affirmationManager) {
        affirmationManager.handleResize();
    }
}

// Mouse interaction for boids
function mouseMoved() {
    if (currentMode === 'boids' && affirmationManager) {
        affirmationManager.handleMouseInfluence(mouseX, mouseY);
    }
} 