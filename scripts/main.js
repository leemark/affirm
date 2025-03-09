// Global variables
let canvas;
let affirmationManager;
let currentState = 'initializing'; // 'initializing', 'displaying', 'transitioning', 'creating'
let displayDuration = 6000; // how long to display text before transition (ms)
let displayStartTime = 0;
let lastStateChange = 0; // Track when we last changed states
let debugMode = true; // Enable for console logs
let isMousePressed = false; // Track if mouse is pressed
let lastEmitTime = 0; // Track last time particles were emitted
let emitInterval = 10; // Minimum interval between particle emissions (ms)
let mouseDownTime = 0; // Track how long mouse has been pressed
let mouseHoldDuration = 0; // Duration mouse has been held down
let lastMouseX = 0, lastMouseY = 0; // Track previous mouse position for velocity

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
    
    // Initialize last mouse position
    lastMouseX = mouseX;
    lastMouseY = mouseY;
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
    
    // Emit particles when mouse is pressed
    if (isMousePressed && affirmationManager && millis() - lastEmitTime > emitInterval) {
        // Calculate mouse movement speed
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        const speed = sqrt(dx*dx + dy*dy);
        
        // Update mouseHoldDuration
        mouseHoldDuration = millis() - mouseDownTime;
        
        // Determine particle count based on speed and hold time
        let particleCount;
        if (speed > 10) {
            // More particles for faster movement
            particleCount = floor(map(speed, 10, 50, 2, 8, true));
        } else {
            // Standard amount for slow/no movement
            particleCount = floor(random(2, 4));
        }
        
        // Create a color that changes based on position and hold duration
        // Use hue based on mouse X position (0-360)
        const hue = map(mouseX, 0, width, 180, 360) % 360;
        // Saturation based on mouse Y position (50-100%)
        const saturation = map(mouseY, 0, height, 50, 100);
        // Brightness based on hold duration (70-100%)
        const brightness = map(min(mouseHoldDuration, 2000), 0, 2000, 70, 100);
        
        // Convert HSB to RGB for our particle system
        colorMode(HSB, 360, 100, 100);
        const c = color(hue, saturation, brightness);
        colorMode(RGB, 255); // Switch back to RGB
        
        const cursorColor = [red(c), green(c), blue(c)];
        
        // Emit particles from mouse cursor
        affirmationManager.emitParticlesFromCursor(mouseX, mouseY, particleCount, cursorColor);
        lastEmitTime = millis();
        
        // Update last mouse position
        lastMouseX = mouseX;
        lastMouseY = mouseY;
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

// Called when mouse is pressed
function mousePressed() {
    isMousePressed = true;
    mouseDownTime = millis();
    mouseHoldDuration = 0;
    
    // Emit a burst of particles on initial click
    if (affirmationManager) {
        const burstCount = floor(random(10, 15));
        // Create a color based on position
        colorMode(HSB, 360, 100, 100);
        const hue = map(mouseX, 0, width, 180, 360) % 360;
        const c = color(hue, 80, 90);
        colorMode(RGB, 255);
        
        const clickColor = [red(c), green(c), blue(c)];
        affirmationManager.emitParticlesFromCursor(mouseX, mouseY, burstCount, clickColor);
    }
    
    // Prevent default behavior to avoid text selection, etc.
    return false;
}

// Called when mouse is released
function mouseReleased() {
    if (isMousePressed && affirmationManager) {
        // Final burst when releasing after holding for a while
        if (mouseHoldDuration > 500) {
            const burstCount = floor(map(mouseHoldDuration, 500, 3000, 5, 25, true));
            
            // Create a color based on hold duration
            colorMode(HSB, 360, 100, 100);
            const hue = map(mouseHoldDuration, 0, 3000, 200, 300) % 360;
            const c = color(hue, 90, 95);
            colorMode(RGB, 255);
            
            const releaseColor = [red(c), green(c), blue(c)];
            affirmationManager.emitParticlesFromCursor(mouseX, mouseY, burstCount, releaseColor);
        }
    }
    
    isMousePressed = false;
    return false;
}

// Handle touch events for mobile
function touchStarted() {
    // Call mousePressed to handle touch in the same way
    mousePressed();
    return false;
}

function touchEnded() {
    // Call mouseReleased to handle touch end in the same way
    mouseReleased();
    return false;
} 