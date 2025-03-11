// Global variables
let canvas;
let affirmationManager;
let interactiveUI;
let currentState = 'emotion_selection'; // 'emotion_selection', 'initializing', 'displaying', 'transitioning', 'creating', 'choice_selection'
let displayDuration = 15000; // how long to display text before transition (ms) - increased to 15 seconds
let displayStartTime = 0;
let lastStateChange = 0; // Track when we last changed states
let debugMode = true; // Enable for console logs
let isMousePressed = false; // Track if mouse is pressed
let lastEmitTime = 0; // Track last time particles were emitted
let emitInterval = 5; // Minimum interval between particle emissions (ms) - reduced from 10ms to 5ms
let mouseDownTime = 0; // Track how long mouse has been pressed
let mouseHoldDuration = 0; // Duration mouse has been held down
let lastMouseX = 0, lastMouseY = 0; // Track previous mouse position for velocity
let requestInProgress = false; // Track when an API request is in progress
let lastApiRequestTime = 0; // Track when the last API request was made
const MIN_API_INTERVAL = 15000; // Minimum time between API requests (15 seconds)
let selectedEmotion = null; // Store the selected emotion
let selectedChoice = null; // Store the selected choice

// API Configuration
// To enable the API after deploying the Cloudflare Worker:
// 1. Uncomment the line below and replace with your worker URL
const API_URL = 'https://affirm-api.leemark.workers.dev';

// P5.js setup function - runs once at the beginning
function setup() {
    // Create canvas that fills the container
    const container = document.getElementById('canvas-container');
    canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvas-container');

    // Initialize affirmation manager
    affirmationManager = new AffirmationManager();
    
    // Initialize interactive UI
    interactiveUI = new InteractiveUI();
    interactiveUI.initialize();
    
    // To connect to the deployed API, uncomment the following line:
    if (typeof API_URL !== 'undefined') affirmationManager.enableAPI(API_URL);
    
    // Initialize timing variables
    lastApiRequestTime = millis() - MIN_API_INTERVAL; // Allow first API request immediately
    
    // Show emotion selection UI
    showEmotionSelectionUI();
    
    // Set text properties
    textFont('Playfair Display');
    textAlign(CENTER, CENTER);
    
    // Initialize last mouse position
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    
    // Hide loading indicator
    document.getElementById('loading').classList.add('hidden');
}

// Show emotion selection UI
function showEmotionSelectionUI() {
    if (debugMode) console.log("Showing emotion selection UI");
    
    // Show the emotion selection UI and set callback
    interactiveUI.showEmotionSelection((emotion) => {
        selectedEmotion = emotion;
        if (debugMode) console.log("Selected emotion:", emotion);
        
        // Start the affirmation process with the selected emotion
        changeState('initializing');
        loadInitialAffirmationWithEmotion(emotion);
    });
}

// Show binary choice UI
async function showChoiceSelectionUI() {
    if (debugMode) console.log("Showing choice selection UI");
    
    try {
        // Fetch dynamic interactive elements from the API
        const interactiveElements = await affirmationManager.fetchInteractiveElements();
        
        // Track the last choice in the affirmation manager
        if (selectedChoice) {
            affirmationManager.addChoiceToHistory(selectedChoice);
        }
        
        // Show the dynamic choice selection UI and set callback
        interactiveUI.showChoiceSelection(interactiveElements, (choice) => {
            selectedChoice = choice;
            if (debugMode) console.log("Selected choice:", choice);
            
            // Reset the affirmation counter
            interactiveUI.resetAffirmationCount();
            
            // Start transition to the next affirmation
            changeState('transitioning');
            
            // Request the next affirmation based on the selected choice
            requestNextAffirmationWithChoice(choice);
        });
    } catch (error) {
        console.error("Error fetching interactive elements:", error);
        
        // Fallback to generating choices based on current affirmation
        const choices = interactiveUI.generateChoiceOptions(affirmationManager.currentAffirmation);
        
        // Show the choice selection UI with fallback options
        interactiveUI.showChoiceSelection(choices, (choice) => {
            selectedChoice = choice;
            if (debugMode) console.log("Selected choice:", choice);
            
            // Reset the affirmation counter
            interactiveUI.resetAffirmationCount();
            
            // Start transition to the next affirmation
            changeState('transitioning');
            
            // Request the next affirmation based on the selected choice
            requestNextAffirmationWithChoice(choice);
        });
    }
}

// Load initial affirmation with emotion context
function loadInitialAffirmationWithEmotion(emotion) {
    // Update last API request time
    lastApiRequestTime = millis();
    
    // Load initial affirmation with emotion
    affirmationManager.loadInitialAffirmationWithEmotion(emotion).then(() => {
        // Initialize the first set of characters with fade-in animation
        affirmationManager.initializeCharacters();
        
        // Set current state and start timer
        changeState('displaying');
    });
}

// Request next affirmation with choice context
function requestNextAffirmationWithChoice(choice) {
    // Update last API request time
    lastApiRequestTime = millis();
    requestInProgress = true;
    
    if (debugMode) console.log("Requesting next affirmation with choice:", choice);
    
    // Request the next affirmation with choice
    affirmationManager.requestNextAffirmationWithChoice(choice).then(() => {
        // Start fading out current characters
        affirmationManager.prepareForTransition();
        changeState('transitioning');
    }).catch(error => {
        console.error("Error requesting next affirmation:", error);
        requestInProgress = false;
    });
}

// Helper function to change states with logging
function changeState(newState) {
    if (debugMode) console.log(`State change: ${currentState} -> ${newState} at ${millis()}ms`);
    
    // Special handling for transitioning from choice_selection
    if (currentState === 'choice_selection' && newState === 'transitioning') {
        // Force a canvas redraw immediately to clear any lingering text
        background(0); // Clear the canvas with black background
    }
    
    currentState = newState;
    lastStateChange = millis();
    
    // State-specific actions
    switch (newState) {
        case 'emotion_selection':
            // Show the emotion selection UI
            interactiveUI.showEmotionSelection();
            break;
            
        case 'initializing':
            // No special actions needed
            break;
            
        case 'displaying':
            displayStartTime = millis();
            requestInProgress = false; // Reset flag when entering displaying state
            break;
            
        case 'transitioning':
            // No specific actions needed
            break;
            
        case 'creating':
            // No specific actions needed
            break;
            
        case 'choice_selection':
            // No specific actions needed 
            break;
    }
}

// P5.js draw function - runs continuously
function draw() {
    background(0); // Black background

    // Handle different states
    switch (currentState) {
        case 'emotion_selection':
            // Just show emotion selection UI, handled by InteractiveUI
            break;
            
        case 'initializing':
            // Just show loading state, handled by HTML/CSS
            break;
            
        case 'displaying':
            // Display and update characters
            affirmationManager.updateAndDisplayCharacters();
            
            // Check if it's time to transition to a new affirmation
            if (!requestInProgress && 
                millis() - displayStartTime > displayDuration && 
                affirmationManager.isFadeInComplete()) {
                
                // Increment affirmation count and check if it's time to show choices
                if (interactiveUI.incrementAffirmationCount()) {
                    if (debugMode) console.log("Time to show choices");
                    
                    // Show choice selection UI
                    changeState('choice_selection');
                    showChoiceSelectionUI();
                    return;
                }
                
                // Enforce minimum time between API requests
                const currentTime = millis();
                if (currentTime - lastApiRequestTime < MIN_API_INTERVAL) {
                    // Not enough time has passed since the last API request
                    if (debugMode) console.log(`Waiting for minimum API interval (${Math.floor((MIN_API_INTERVAL - (currentTime - lastApiRequestTime)) / 1000)}s remaining)`);
                    return;
                }
                
                // Set flag to prevent multiple requests
                requestInProgress = true;
                lastApiRequestTime = currentTime;
                
                if (debugMode) console.log("Requesting next affirmation (API call)");
                
                // Request the next affirmation and start transition
                affirmationManager.requestNextAffirmation().then(() => {
                    // Start fading out current characters
                    affirmationManager.prepareForTransition();
                    changeState('transitioning');
                }).catch(error => {
                    console.error("Error requesting next affirmation:", error);
                    requestInProgress = false; // Reset flag on error
                });
                
                // Safety timeout to reset the flag in case of unexpected issues
                setTimeout(() => {
                    if (requestInProgress && currentState === 'displaying') {
                        console.warn("Safety timeout: resetting requestInProgress flag");
                        requestInProgress = false;
                    }
                }, 5000); // 5 second timeout
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
            
        case 'choice_selection':
            // Just show choice selection UI, handled by InteractiveUI
            break;
    }
    
    // Track mouse position for particle effects
    const dx = mouseX - lastMouseX;
    const dy = mouseY - lastMouseY;
    const speed = sqrt(dx*dx + dy*dy);
    
    // Update mouseHoldDuration if mouse is pressed
    if (isMousePressed) {
        mouseHoldDuration = millis() - mouseDownTime;
    }
    
    // Always emit particles from cursor position if we're past minimum interval
    if (affirmationManager && millis() - lastEmitTime > emitInterval) {
        // Create a color that changes based on position
        colorMode(HSB, 360, 100, 100);
        const hue = map(mouseX, 0, width, 180, 360) % 360;
        // Saturation based on mouse Y position (50-100%)
        const saturation = map(mouseY, 0, height, 50, 100);
        // Base brightness
        let brightness = 70;
        
        // Determine particle count based on whether mouse is pressed
        let particleCount;
        
        if (isMousePressed) {
            // More particles when mouse is pressed
            if (speed > 10) {
                // More particles for faster movement
                particleCount = floor(map(speed, 10, 50, 2, 8, true));
            } else {
                // Standard amount for slow/no movement when pressed
                particleCount = floor(random(2, 4));
            }
            
            // Increase brightness based on hold duration when pressed
            brightness = map(min(mouseHoldDuration, 2000), 0, 2000, 70, 100);
        } else {
            // Fewer particles when mouse is not pressed - continuous gentle emission
            particleCount = speed > 5 ? floor(random(1, 2)) : floor(random(0, 1));
        }
        
        // Convert HSB to RGB for our particle system
        const c = color(hue, saturation, brightness);
        colorMode(RGB, 255); // Switch back to RGB
        
        const cursorColor = [red(c), green(c), blue(c)];
        
        // Emit particles from mouse cursor
        if (particleCount > 0) {
            affirmationManager.emitParticlesFromCursor(mouseX, mouseY, particleCount, cursorColor);
        }
        
        lastEmitTime = millis();
    }
    
    // Update last mouse position
    lastMouseX = mouseX;
    lastMouseY = mouseY;
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