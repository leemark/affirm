// Global variables
let canvas;
let affirmationManager;
let interactiveUI;
let currentState = 'emotion_selection'; // 'emotion_selection', 'initializing', 'displaying', 'transitioning', 'creating', 'choice_selection', 'pre_choice_transition', 'breathing_guidance'
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

// Breathing guidance variables
let breathingCircle = null;
let breathingPhase = 'inhale'; // 'inhale', 'hold', 'exhale'
let breathingCycleCount = 0;
let breathingStartTime = 0;
let breathingDuration = {
    inhale: 4000, // 4 seconds
    hold: 2000,   // 2 seconds
    exhale: 4000   // 4 seconds
};
let showBreathingGuidance = true; // Set to false to disable breathing guidance

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
            
            // Hide the UI immediately but don't change state yet
            // First request the next affirmation to avoid showing a placeholder
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
            
            // Hide the UI immediately but don't change state yet
            // First request the next affirmation to avoid showing a placeholder
            requestNextAffirmationWithChoice(choice);
        });
    }
}

// Load initial affirmation with emotion context
function loadInitialAffirmationWithEmotion(emotion) {
    // Update last API request time
    lastApiRequestTime = millis();
    
    // Set the visual theme for the selected emotion
    affirmationManager.setVisualThemeForEmotion(emotion);
    
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
        // Only start the transition after we have the next affirmation
        if (debugMode) console.log("Received next affirmation, now starting transition");
        
        // Now change the state to transitioning and prepare for fade-out
        changeState('transitioning');
        
        // Start fading out current characters
        affirmationManager.prepareForTransition();
        
        // Apply a subtle theme variation based on the choice
        applyChoiceThemeVariation(choice);
    }).catch(error => {
        console.error("Error requesting next affirmation:", error);
        requestInProgress = false;
        
        // Even on error, we need to proceed with transition
        changeState('transitioning');
        affirmationManager.prepareForTransition();
    });
}

/**
 * Apply a subtle theme variation based on the selected choice
 * @param {string} choice - The selected choice
 */
function applyChoiceThemeVariation(choice) {
    // Only apply if we have a current theme
    if (!affirmationManager.currentTheme) return;
    
    // Get current background color
    const currentBg = [...affirmationManager.targetBackgroundColor];
    
    // Apply subtle variations based on choice categories
    const strengthChoices = ['strength', 'inner_strength', 'overcome_challenges', 'personal_growth'];
    const peaceChoices = ['inner_peace', 'mindful_presence', 'calm'];
    const gratitudeChoices = ['gratitude', 'appreciate_present', 'find_joy'];
    const changeChoices = ['embrace_change', 'confidence'];
    
    // Create a subtle shift in the current color
    if (strengthChoices.includes(choice)) {
        // Strength: slightly more red/warm
        currentBg[0] = Math.min(currentBg[0] + 10, 50);
        currentBg[1] = Math.max(currentBg[1] - 5, 0);
    } else if (peaceChoices.includes(choice)) {
        // Peace: slightly more blue/cool
        currentBg[2] = Math.min(currentBg[2] + 10, 50);
        currentBg[0] = Math.max(currentBg[0] - 5, 0);
    } else if (gratitudeChoices.includes(choice)) {
        // Gratitude: slightly more gold/yellow
        currentBg[0] = Math.min(currentBg[0] + 8, 50);
        currentBg[1] = Math.min(currentBg[1] + 8, 50);
    } else if (changeChoices.includes(choice)) {
        // Change: slightly more purple
        currentBg[0] = Math.min(currentBg[0] + 5, 50);
        currentBg[2] = Math.min(currentBg[2] + 5, 50);
    }
    
    // Apply the subtle variation
    affirmationManager.targetBackgroundColor = currentBg;
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
            
        case 'pre_choice_transition':
            // No specific actions needed
            break;
            
        case 'breathing_guidance':
            // No specific actions needed
            break;
    }
}

// P5.js draw function - runs continuously
function draw() {
    // Apply background color based on theme
    updateBackgroundColor();

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
                    if (debugMode) console.log("Time to prepare for choices");
                    
                    // Start fading out current characters but don't show choices yet
                    affirmationManager.prepareForTransition();
                    changeState('pre_choice_transition');
                    return;
                }
                
                // Check if we should show breathing guidance
                if (showBreathingGuidance) {
                    startBreathingGuidance();
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
            
        case 'pre_choice_transition':
            // Display characters that are fading out
            affirmationManager.updateAndDisplayCharacters();
            
            // When all characters have completely faded out, show the choice selection
            if (affirmationManager.isFadeOutComplete()) {
                if (debugMode) console.log("Faded out completely, now showing choices");
                changeState('choice_selection');
                showChoiceSelectionUI();
            }
            
            // Safety timeout - if we've been in this state too long, force next state
            if (millis() - lastStateChange > 5000) {
                if (debugMode) console.log("Safety timeout in pre_choice_transition state");
                changeState('choice_selection');
                showChoiceSelectionUI();
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
            
        case 'breathing_guidance':
            // Draw breathing guidance animation
            drawBreathingGuidance();
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

/**
 * Update background color based on theme
 */
function updateBackgroundColor() {
    if (affirmationManager && affirmationManager.targetBackgroundColor) {
        // Get current background color
        let currentBg = affirmationManager.currentBackgroundColor || [0, 0, 0];
        
        // Smoothly transition to target color
        currentBg[0] = lerp(currentBg[0], affirmationManager.targetBackgroundColor[0], 0.02);
        currentBg[1] = lerp(currentBg[1], affirmationManager.targetBackgroundColor[1], 0.02);
        currentBg[2] = lerp(currentBg[2], affirmationManager.targetBackgroundColor[2], 0.02);
        
        // Update current background
        affirmationManager.currentBackgroundColor = currentBg;
        
        // Apply background
        background(currentBg[0], currentBg[1], currentBg[2]);
    } else {
        // Default black background
        background(0);
    }
}

/**
 * Start breathing guidance animation
 */
function startBreathingGuidance() {
    if (debugMode) console.log("Starting breathing guidance");
    
    // Create breathing container if it doesn't exist
    let breathingContainer = document.getElementById('breathing-container');
    if (!breathingContainer) {
        breathingContainer = document.createElement('div');
        breathingContainer.className = 'breathing-container';
        breathingContainer.id = 'breathing-container';
        
        // Create breathing circle
        const circle = document.createElement('div');
        circle.className = 'breathing-circle';
        circle.id = 'breathing-circle';
        
        // Create breathing text
        const text = document.createElement('div');
        text.className = 'breathing-text';
        text.id = 'breathing-text';
        text.textContent = 'Inhale';
        
        // Create progress bar
        const progress = document.createElement('div');
        progress.className = 'breathing-progress';
        
        const progressInner = document.createElement('div');
        progressInner.className = 'breathing-progress-inner';
        progressInner.id = 'breathing-progress-inner';
        progressInner.style.width = '0%';
        
        progress.appendChild(progressInner);
        
        // Append elements
        breathingContainer.appendChild(circle);
        breathingContainer.appendChild(text);
        breathingContainer.appendChild(progress);
        
        // Append to container
        document.querySelector('.container').appendChild(breathingContainer);
    }
    
    // Initialize breathing variables
    breathingPhase = 'inhale';
    breathingCycleCount = 0;
    breathingStartTime = millis();
    
    // Show breathing container
    breathingContainer.classList.add('active');
    
    // Change state
    changeState('breathing_guidance');
}

/**
 * Draw breathing guidance animation
 */
function drawBreathingGuidance() {
    const currentTime = millis();
    const elapsedTime = currentTime - breathingStartTime;
    
    // Get elements
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const progressInner = document.getElementById('breathing-progress-inner');
    
    // Calculate total cycle duration
    const totalCycleDuration = breathingDuration.inhale + breathingDuration.hold + breathingDuration.exhale;
    
    // Calculate current cycle progress
    const cycleProgress = (elapsedTime % totalCycleDuration) / totalCycleDuration;
    
    // Update progress bar
    if (progressInner) {
        progressInner.style.width = `${cycleProgress * 100}%`;
    }
    
    // Determine current phase
    const inhaleEnd = breathingDuration.inhale / totalCycleDuration;
    const holdEnd = (breathingDuration.inhale + breathingDuration.hold) / totalCycleDuration;
    
    let newPhase;
    if (cycleProgress < inhaleEnd) {
        newPhase = 'inhale';
    } else if (cycleProgress < holdEnd) {
        newPhase = 'hold';
    } else {
        newPhase = 'exhale';
    }
    
    // Check if phase changed
    if (newPhase !== breathingPhase) {
        breathingPhase = newPhase;
        
        // Update text
        if (text) {
            text.textContent = breathingPhase.charAt(0).toUpperCase() + breathingPhase.slice(1);
        }
        
        // If we completed a cycle, increment counter
        if (breathingPhase === 'inhale') {
            breathingCycleCount++;
            if (debugMode) console.log(`Completed breathing cycle ${breathingCycleCount}`);
        }
    }
    
    // Update circle size based on phase
    if (circle) {
        let size;
        
        if (breathingPhase === 'inhale') {
            // Calculate progress within inhale phase
            const phaseProgress = (elapsedTime % totalCycleDuration) / breathingDuration.inhale;
            size = map(phaseProgress, 0, 1, 100, 200);
        } else if (breathingPhase === 'hold') {
            size = 200; // Maximum size during hold
        } else { // exhale
            // Calculate progress within exhale phase
            const phaseElapsed = (elapsedTime % totalCycleDuration) - breathingDuration.inhale - breathingDuration.hold;
            const phaseProgress = phaseElapsed / breathingDuration.exhale;
            size = map(phaseProgress, 0, 1, 200, 100);
        }
        
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
    }
    
    // Check if we've completed 3 cycles
    if (breathingCycleCount >= 3) {
        endBreathingGuidance();
    }
}

/**
 * End breathing guidance animation
 */
function endBreathingGuidance() {
    if (debugMode) console.log("Ending breathing guidance");
    
    // Hide breathing container
    const breathingContainer = document.getElementById('breathing-container');
    if (breathingContainer) {
        breathingContainer.classList.remove('active');
    }
    
    // Enforce minimum time between API requests
    const currentTime = millis();
    if (currentTime - lastApiRequestTime < MIN_API_INTERVAL) {
        // Not enough time has passed since the last API request
        if (debugMode) console.log(`Waiting for minimum API interval (${Math.floor((MIN_API_INTERVAL - (currentTime - lastApiRequestTime)) / 1000)}s remaining)`);
        
        // Go back to displaying state and wait for next check
        changeState('displaying');
        return;
    }
    
    // Set flag to prevent multiple requests
    requestInProgress = true;
    lastApiRequestTime = currentTime;
    
    if (debugMode) console.log("Requesting next affirmation after breathing (API call)");
    
    // Request the next affirmation and start transition
    affirmationManager.requestNextAffirmation().then(() => {
        // Start fading out current characters
        affirmationManager.prepareForTransition();
        changeState('transitioning');
    }).catch(error => {
        console.error("Error requesting next affirmation:", error);
        requestInProgress = false; // Reset flag on error
        changeState('displaying'); // Go back to displaying state
    });
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