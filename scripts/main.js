// Global variables
let canvas;
let affirmationManager;
let currentMode = 'static'; // 'static', 'transition', 'flying'
let transitionProgress = 0;
let transitionDirection = 'to-flying'; // 'to-flying', 'to-static'
let transitionDuration = 3000; // milliseconds for boids transition
let textTransitionDuration = 2500; // milliseconds for text transition (shortened for faster formation)
let transitionStartTime = 0;
let displayDuration = 6000; // how long to display text before transition
let displayStartTime = 0;
let flyingDuration = 8000; // how long boids fly before next affirmation
let flyingStartTime = 0;

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
        currentMode = 'static';
        
        // Prepare initial boids in static formation
        affirmationManager.prepareInitialBoids();
        
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
        case 'static':
            // Display boids in static formation (as text)
            affirmationManager.updateAndDisplayStaticBoids();
            
            // Check if it's time to transition to flying mode
            if (millis() - displayStartTime > displayDuration) {
                currentMode = 'transition';
                transitionDirection = 'to-flying';
                transitionStartTime = millis();
                transitionProgress = 0;
                affirmationManager.prepareForFlying();
            }
            break;
            
        case 'transition':
            // Calculate transition progress (0 to 1)
            if (transitionDirection === 'to-flying') {
                transitionProgress = constrain((millis() - transitionStartTime) / transitionDuration, 0, 1);
            } else { // to-static - use longer duration for smoother effect
                transitionProgress = constrain((millis() - transitionStartTime) / textTransitionDuration, 0, 1);
            }
            
            if (transitionDirection === 'to-flying') {
                affirmationManager.transitionToFlying(transitionProgress);
                
                // Check if transition is complete
                if (transitionProgress >= 1) {
                    currentMode = 'flying';
                    flyingStartTime = millis();
                }
            } else { // to-static
                affirmationManager.transitionToStatic(transitionProgress);
                
                // Check if transition is complete
                if (transitionProgress >= 1) {
                    currentMode = 'static';
                    displayStartTime = millis();
                }
            }
            break;
            
        case 'flying':
            affirmationManager.updateAndDisplayFlyingBoids();
            
            // Check if it's time to transition back to static
            if (millis() - flyingStartTime > flyingDuration) {
                // Request new affirmation if needed
                affirmationManager.requestNextAffirmation().then(() => {
                    currentMode = 'transition';
                    transitionDirection = 'to-static';
                    transitionStartTime = millis();
                    transitionProgress = 0;
                    affirmationManager.prepareForStatic();
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
    if (currentMode === 'flying' && affirmationManager) {
        affirmationManager.handleMouseInfluence(mouseX, mouseY);
    }
} 