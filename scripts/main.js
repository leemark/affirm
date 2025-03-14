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
    inhale: 2000,  // 2 seconds
    hold: 1000,    // 1 second
    exhale: 2000   // 2 seconds
};
let showBreathingGuidance = true;

// Gamification variables
let pointSystem = {
    dailyVisit: 10,
    completedAffirmation: 5,
    completedBreathing: 15,
    journalEntry: 20,
    favoriteAffirmation: 5,
    emotionSelection: 5,
    streakDay: 2,
    streakMultiplier: 0.1,  // 10% per day of streak
    comboMultiplier: 0.05   // 5% per activity in same session
};
let userPoints = 0;
let sessionActivities = 0;
let lastPointAward = 0;
let pointAnimationQueue = [];

// Achievement definitions
let achievements = [
    {
        id: 'first_visit',
        name: 'First Step',
        description: 'Begin your affirmation journey',
        icon: '🌱',
        points: 10,
        unlocked: false
    },
    {
        id: 'three_day_streak',
        name: 'Consistency',
        description: 'Complete a 3-day streak',
        icon: '📆',
        points: 15,
        unlocked: false
    },
    {
        id: 'seven_day_streak',
        name: 'Dedicated',
        description: 'Complete a 7-day streak',
        icon: '🔥',
        points: 25,
        unlocked: false
    },
    {
        id: 'breathing_master',
        name: 'Breathing Master',
        description: 'Complete 10 breathing exercises',
        icon: '🧘',
        points: 30,
        unlocked: false
    },
    {
        id: 'reflection',
        name: 'Self-Reflection',
        description: 'Write 5 journal entries',
        icon: '📓',
        points: 25,
        unlocked: false
    },
    {
        id: 'collector',
        name: 'Collector',
        description: 'Save 10 favorite affirmations',
        icon: '💖',
        points: 20,
        unlocked: false
    },
    {
        id: 'emotional_explorer',
        name: 'Emotional Explorer',
        description: 'Experience 5 different emotions',
        icon: '🌈',
        points: 20,
        unlocked: false
    },
    {
        id: 'dedicated',
        name: 'Inner Growth',
        description: 'Earn 500 points',
        icon: '🏆',
        points: 50,
        unlocked: false
    }
];

// Daily challenge
let dailyChallenge = null;
let challengeCompleted = false;

// API Configuration
// To enable the API after deploying the Cloudflare Worker:
// 1. Uncomment the line below and replace with your worker URL
const API_URL = 'https://affirm-api.leemark.workers.dev';

// Story World Configuration
const storyWorld = {
    // The user's current chapter in their journey
    currentChapter: 1,
    
    // Total number of chapters in the journey
    totalChapters: 7,
    
    // The user's current location in the story world
    currentLocation: 'beginning',
    
    // Available locations in the narrative
    locations: [
        {id: 'beginning', name: 'The Threshold', description: 'Where all journeys begin'},
        {id: 'forest', name: 'Mindful Forest', description: 'A place of growth and self-discovery'},
        {id: 'mountain', name: 'Peak of Perspective', description: 'See your life from new heights'},
        {id: 'river', name: 'River of Reflection', description: 'Flow with your thoughts and emotions'},
        {id: 'cave', name: 'Cave of Shadows', description: 'Face your inner challenges'},
        {id: 'meadow', name: 'Meadow of Peace', description: 'Find harmony in simplicity'},
        {id: 'lighthouse', name: 'Guiding Light', description: 'Illuminate your path forward'}
    ],
    
    // Characters who guide the user on their journey
    guides: [
        {id: 'sage', name: 'The Sage', specialty: 'wisdom', avatar: '🧙'},
        {id: 'healer', name: 'The Healer', specialty: 'emotional-balance', avatar: '🌿'},
        {id: 'warrior', name: 'The Warrior', specialty: 'strength', avatar: '⚔️'},
        {id: 'creator', name: 'The Creator', specialty: 'inspiration', avatar: '✨'}
    ],
    
    // User's character growth attributes
    attributes: {
        wisdom: 0,
        courage: 0,
        compassion: 0,
        resilience: 0
    },
    
    // Story collectibles the user has found
    collectibles: [],
    
    // Story milestones the user has reached
    milestones: [],
    
    // Load story progress from localStorage
    loadProgress() {
        const savedProgress = localStorage.getItem('affirm_story_progress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.currentChapter = progress.currentChapter || 1;
            this.currentLocation = progress.currentLocation || 'beginning';
            this.attributes = progress.attributes || {wisdom: 0, courage: 0, compassion: 0, resilience: 0};
            this.collectibles = progress.collectibles || [];
            this.milestones = progress.milestones || [];
        }
    },
    
    // Save story progress to localStorage
    saveProgress() {
        const progress = {
            currentChapter: this.currentChapter,
            currentLocation: this.currentLocation,
            attributes: this.attributes,
            collectibles: this.collectibles,
            milestones: this.milestones
        };
        localStorage.setItem('affirm_story_progress', JSON.stringify(progress));
    },
    
    // Advance to the next chapter if requirements are met
    advanceChapter() {
        if (this.currentChapter < this.totalChapters) {
            this.currentChapter++;
            this.milestones.push({
                type: 'chapter_complete',
                chapter: this.currentChapter - 1,
                date: new Date().toISOString()
            });
            this.saveProgress();
            return true;
        }
        return false;
    },
    
    // Change the current location
    changeLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
            this.currentLocation = locationId;
            this.saveProgress();
            return location;
        }
        return null;
    },
    
    // Increase an attribute value
    increaseAttribute(attribute, amount = 1) {
        if (this.attributes.hasOwnProperty(attribute)) {
            this.attributes[attribute] += amount;
            this.saveProgress();
            return this.attributes[attribute];
        }
        return null;
    },
    
    // Add a collectible
    addCollectible(collectible) {
        if (!this.collectibles.some(c => c.id === collectible.id)) {
            this.collectibles.push({
                ...collectible,
                dateFound: new Date().toISOString()
            });
            this.saveProgress();
            return true;
        }
        return false;
    },
    
    // Get current guide based on user's journey
    getCurrentGuide() {
        // This could be based on user's current location, emotional state, or chapter
        const guideIndex = (this.currentChapter - 1) % this.guides.length;
        return this.guides[guideIndex];
    }
};

// P5.js setup function - runs once at the beginning
function setup() {
    // Create canvas that fills the container
    const container = document.getElementById('canvas-container');
    canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvas-container');

    // Initialize particle system - moved from setupParticleSystem()
    particleSystem = new ParticleSystem();

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
 * Start breathing guidance
 */
function startBreathingGuidance() {
    if (!showBreathingGuidance) {
        getNextAffirmation();
        return;
    }
    
    // Create breathing container if it doesn't exist
    let breathingContainer = document.querySelector('.breathing-container');
    if (!breathingContainer) {
        breathingContainer = document.createElement('div');
        breathingContainer.className = 'breathing-container';
        
        // Create breathing circle
        const breathingCircle = document.createElement('div');
        breathingCircle.className = 'breathing-circle';
        
        // Create breathing text
        const breathingText = document.createElement('div');
        breathingText.className = 'breathing-text';
        breathingText.textContent = 'Inhale';
        
        // Create cycle counter
        const cycleCounter = document.createElement('div');
        cycleCounter.className = 'breathing-counter';
        cycleCounter.id = 'breathing-counter';
        cycleCounter.textContent = 'Cycle 1 of 3';
        
        // Create progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'breathing-progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'breathing-progress';
        progressBar.id = 'breathing-progress';
        
        progressContainer.appendChild(progressBar);
        
        // Create skip button
        const skipButton = document.createElement('button');
        skipButton.className = 'breathing-skip';
        skipButton.textContent = 'Skip';
        skipButton.addEventListener('click', () => {
            // Award half points for skipping
            awardPoints(Math.floor(pointSystem.completedBreathing / 2), 'Skipped breathing');
            
            // End breathing guidance
            endBreathingGuidance();
        });
        
        // Append all elements
        breathingContainer.appendChild(breathingCircle);
        breathingContainer.appendChild(breathingText);
        breathingContainer.appendChild(cycleCounter);
        breathingContainer.appendChild(progressContainer);
        breathingContainer.appendChild(skipButton);
        
        document.querySelector('.container').appendChild(breathingContainer);
    }
    
    // Initialize breathing cycle
    breathingStartTime = Date.now();
    breathingPhase = 'inhale';
    breathingCycleCount = 0;
    totalBreathingTime = (breathingDuration.inhale + breathingDuration.hold + breathingDuration.exhale) * 3; // 3 cycles
    
    // Update cycle counter
    updateBreathingCounter(breathingCycleCount + 1, 3);
    
    // Start animation
    requestAnimationFrame(drawBreathingGuidance);
}

/**
 * Draw breathing guidance animation
 */
function drawBreathingGuidance() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - breathingStartTime;
    
    // Get elements
    const container = document.querySelector('.breathing-container');
    const circle = document.querySelector('.breathing-circle');
    const text = document.querySelector('.breathing-text');
    const progressBar = document.getElementById('breathing-progress');
    
    if (!container || !circle || !text) return;
    
    // Calculate cycle duration
    const cycleDuration = breathingDuration.inhale + breathingDuration.hold + breathingDuration.exhale;
    
    // Calculate current cycle progress
    const cycleProgress = (elapsedTime % cycleDuration) / cycleDuration;
    
    // Calculate overall progress
    const overallProgress = Math.min(elapsedTime / totalBreathingTime, 1);
    
    // Update progress bar
    if (progressBar) {
        progressBar.style.width = `${overallProgress * 100}%`;
    }
    
    // Determine current phase within the cycle
    const cycleTime = elapsedTime % cycleDuration;
    
    let newPhase = breathingPhase;
    let scale = 1;
    
    if (cycleTime < breathingDuration.inhale) {
        // Inhale phase
        newPhase = 'inhale';
        const phaseProgress = cycleTime / breathingDuration.inhale;
        scale = 1 + phaseProgress * 0.5; // Scale from 1 to 1.5
    } else if (cycleTime < breathingDuration.inhale + breathingDuration.hold) {
        // Hold phase
        newPhase = 'hold';
        scale = 1.5; // Stay at max scale
    } else {
        // Exhale phase
        newPhase = 'exhale';
        const phaseProgress = (cycleTime - breathingDuration.inhale - breathingDuration.hold) / breathingDuration.exhale;
        scale = 1.5 - phaseProgress * 0.5; // Scale from 1.5 back to 1
    }
    
    // If phase changed, update text
    if (newPhase !== breathingPhase) {
        breathingPhase = newPhase;
        
        // Update text based on phase
        if (breathingPhase === 'inhale') {
            text.textContent = 'Inhale';
            text.style.color = '#7DF9FF'; // Light blue for inhale
        } else if (breathingPhase === 'hold') {
            text.textContent = 'Hold';
            text.style.color = '#F3DE8A'; // Yellow for hold
        } else {
            text.textContent = 'Exhale';
            text.style.color = '#97C1A9'; // Green for exhale
        }
        
        // If we've completed a full cycle, increment the counter
        if (breathingPhase === 'inhale' && cycleTime < 100) { // Small buffer to avoid double counting
            // Check if we've completed an entire cycle (not the first one)
            if (elapsedTime > cycleDuration) {
                breathingCycleCount++;
                updateBreathingCounter(breathingCycleCount + 1, 3);
                
                // Provide visual feedback for completing a cycle
                circle.style.animation = 'counterPulse 0.5s';
                setTimeout(() => {
                    circle.style.animation = '';
                }, 500);
            }
        }
    }
    
    // Update circle scale
    circle.style.transform = `scale(${scale})`;
    
    // If we've completed 3 cycles, end the breathing guidance
    if (breathingCycleCount >= 3) {
        // Award points for completing the breathing exercise
        awardPoints(pointSystem.completedBreathing, 'Completed breathing');
        
        // Track breathing exercises completed
        const breathingCount = parseInt(localStorage.getItem('affirm_breathing_count') || '0') + 1;
        localStorage.setItem('affirm_breathing_count', breathingCount.toString());
        
        // Update breathing achievement
        updateBreathingAchievement(breathingCount);
        
        // End breathing guidance
        endBreathingGuidance();
        return;
    }
    
    // Continue animation
    requestAnimationFrame(drawBreathingGuidance);
}

/**
 * Update breathing counter
 * @param {number} current - Current cycle
 * @param {number} total - Total cycles
 */
function updateBreathingCounter(current, total) {
    const counter = document.getElementById('breathing-counter');
    if (counter) {
        counter.textContent = `Cycle ${current} of ${total}`;
        
        // Provide visual feedback
        counter.style.animation = 'counterPulse 0.5s';
        setTimeout(() => {
            counter.style.animation = '';
        }, 500);
    }
}

/**
 * End breathing guidance
 */
function endBreathingGuidance() {
    // Remove breathing container with fade
    const container = document.querySelector('.breathing-container');
    if (container) {
        container.style.opacity = '0';
        setTimeout(() => {
            container.remove();
        }, 500);
    }
    
    // Check if we need to wait a bit between affirmations
    const currentTime = Date.now();
    const timeElapsedSinceLastAPIRequest = currentTime - lastApiRequestTime;
    
    if (timeElapsedSinceLastAPIRequest < MIN_API_INTERVAL) {
        // Wait the remaining time
        const waitTime = MIN_API_INTERVAL - timeElapsedSinceLastAPIRequest;
        setTimeout(() => {
            getNextAffirmation();
        }, waitTime);
    } else {
        // Get next affirmation immediately
        getNextAffirmation();
    }
}

/**
 * Update breathing achievement based on count
 * @param {number} breathingCount - Number of completed breathing exercises
 */
function updateBreathingAchievement(breathingCount) {
    // Check if we've completed 10 breathing exercises
    if (breathingCount >= 10) {
        unlockAchievement('breathing_master');
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

/**
 * Initialize gamification system
 */
function initializeGamification() {
    if (debugMode) console.log("Initializing gamification system");
    
    // Load points from localStorage
    loadUserPoints();
    
    // Load achievements from localStorage
    loadAchievements();
    
    // Create points display
    createPointsDisplay();
    
    // Create badges button
    createBadgesButton();
    
    // Set up daily challenge
    setupDailyChallenge();
    
    // Award points for daily visit (only once per day)
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('affirm_last_visit');
    
    if (lastVisit !== today) {
        // First visit of the day
        awardPoints(pointSystem.dailyVisit, 'Daily visit');
        localStorage.setItem('affirm_last_visit', today);
        
        // Check for first visit achievement
        unlockAchievement('first_visit');
    }
}

/**
 * Load user points from localStorage
 */
function loadUserPoints() {
    userPoints = parseInt(localStorage.getItem('affirm_points') || '0');
    
    // Check for dedicated achievement
    if (userPoints >= 500) {
        unlockAchievement('dedicated');
    }
}

/**
 * Load achievements from localStorage
 */
function loadAchievements() {
    const savedAchievements = localStorage.getItem('affirm_achievements');
    if (savedAchievements) {
        const unlockedAchievements = JSON.parse(savedAchievements);
        
        // Update achievements array with unlocked status
        unlockedAchievements.forEach(id => {
            const achievement = achievements.find(a => a.id === id);
            if (achievement) {
                achievement.unlocked = true;
            }
        });
    }
}

/**
 * Create points display
 */
function createPointsDisplay() {
    const pointsContainer = document.createElement('div');
    pointsContainer.className = 'points-container';
    pointsContainer.id = 'points-container';
    
    // Create points icon
    const pointsIcon = document.createElement('span');
    pointsIcon.className = 'points-icon';
    pointsIcon.innerHTML = '✦';
    
    // Create points count
    const pointsCount = document.createElement('span');
    pointsCount.className = 'points-count';
    pointsCount.id = 'points-count';
    pointsCount.textContent = userPoints;
    
    // Append elements
    pointsContainer.appendChild(pointsIcon);
    pointsContainer.appendChild(pointsCount);
    
    // Append to container
    document.querySelector('.container').appendChild(pointsContainer);
}

/**
 * Create badges button
 */
function createBadgesButton() {
    const badgesButton = document.createElement('div');
    badgesButton.className = 'badges-button';
    badgesButton.innerHTML = '🏆';
    badgesButton.title = 'Achievements';
    badgesButton.addEventListener('click', () => {
        showBadgesPanel();
    });
    
    document.querySelector('.container').appendChild(badgesButton);
}

/**
 * Award points to the user
 * @param {number} points - Number of points to award
 * @param {string} reason - Reason for awarding points
 */
function awardPoints(points, reason) {
    // Apply streak multiplier if available
    const streakData = JSON.parse(localStorage.getItem('affirm_streak') || '{"currentStreak": 0}');
    const streakMultiplier = streakData.currentStreak > 1 ? 
        1 + (streakData.currentStreak * pointSystem.streakMultiplier) : 1;
    
    // Apply combo multiplier if available
    const comboMultiplier = sessionActivities > 1 ? 
        1 + (sessionActivities * pointSystem.comboMultiplier) : 1;
    
    // Calculate final points with multipliers
    const basePoints = points;
    const finalPoints = Math.round(basePoints * streakMultiplier * comboMultiplier);
    
    // Update user points
    userPoints += finalPoints;
    
    // Save to localStorage
    localStorage.setItem('affirm_points', userPoints.toString());
    
    // Update points display
    updatePointsDisplay(userPoints);
    
    // Show point award animation
    showPointAward(finalPoints, reason, streakMultiplier > 1 || comboMultiplier > 1);
    
    // Check for dedicated achievement
    if (userPoints >= 500) {
        unlockAchievement('dedicated');
    }
    
    // Check if this completes the daily challenge
    checkChallengeCompletion(reason);
    
    if (debugMode) console.log(`Awarded ${finalPoints} points (base: ${basePoints}) for: ${reason}`);
}

/**
 * Update points display
 * @param {number} points - Current points
 */
function updatePointsDisplay(points) {
    const pointsCount = document.getElementById('points-count');
    if (pointsCount) {
        pointsCount.textContent = points;
    }
}

/**
 * Show point award animation
 * @param {number} points - Points awarded
 * @param {string} reason - Reason for points
 * @param {boolean} hasMultiplier - Whether a multiplier was applied
 */
function showPointAward(points, reason, hasMultiplier) {
    // Create point award element
    const pointAward = document.createElement('div');
    pointAward.className = 'point-award';
    
    // Position near points display
    const pointsContainer = document.getElementById('points-container');
    if (pointsContainer) {
        const rect = pointsContainer.getBoundingClientRect();
        pointAward.style.top = `${rect.top + rect.height}px`;
        pointAward.style.right = `${window.innerWidth - rect.right}px`;
    } else {
        // Fallback position
        pointAward.style.top = '60px';
        pointAward.style.right = '70px';
    }
    
    // Set text based on whether there was a multiplier
    if (hasMultiplier) {
        pointAward.innerHTML = `+${points} points <span style="color:#ff7b00;">BONUS!</span>`;
    } else {
        pointAward.innerHTML = `+${points} points`;
    }
    
    // Add to container
    document.querySelector('.container').appendChild(pointAward);
    
    // Remove after animation completes
    setTimeout(() => {
        pointAward.remove();
    }, 1500);
}

/**
 * Unlock an achievement
 * @param {string} achievementId - ID of the achievement to unlock
 */
function unlockAchievement(achievementId) {
    // Find the achievement
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    // Mark as unlocked
    achievement.unlocked = true;
    
    // Save to localStorage
    const unlockedAchievements = JSON.parse(localStorage.getItem('affirm_achievements') || '[]');
    if (!unlockedAchievements.includes(achievementId)) {
        unlockedAchievements.push(achievementId);
        localStorage.setItem('affirm_achievements', JSON.stringify(unlockedAchievements));
        
        // Show achievement notification
        showAchievementNotification(achievement);
        
        // Award points for the achievement
        awardPoints(achievement.points, `Unlocked: ${achievement.name}`);
    }
}

/**
 * Show achievement notification
 * @param {Object} achievement - Achievement object
 */
function showAchievementNotification(achievement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    
    // Create title
    const title = document.createElement('div');
    title.className = 'achievement-title';
    title.innerHTML = `<div class="achievement-icon">${achievement.icon}</div><div class="achievement-name">${achievement.name}</div>`;
    
    // Create description
    const description = document.createElement('div');
    description.className = 'achievement-description';
    description.textContent = achievement.description;
    
    // Create points
    const points = document.createElement('div');
    points.className = 'achievement-points';
    points.textContent = `+${achievement.points} points`;
    
    // Append elements
    notification.appendChild(title);
    notification.appendChild(description);
    notification.appendChild(points);
    
    // Add to container
    document.querySelector('.container').appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
        notification.remove();
    }, 6000);
}

/**
 * Show badges panel
 */
function showBadgesPanel() {
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'badges-panel';
    panel.id = 'badges-panel';
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = 'Achievements';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-preferences';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => {
        hideBadgesPanel();
    });
    
    // Create badges grid
    const badgesGrid = document.createElement('div');
    badgesGrid.className = 'badges-grid';
    
    // Add each achievement to the grid
    achievements.forEach(achievement => {
        const badgeItem = document.createElement('div');
        badgeItem.className = 'badge-item';
        if (!achievement.unlocked) badgeItem.classList.add('locked');
        
        const badgeIcon = document.createElement('div');
        badgeIcon.className = 'badge-icon';
        badgeIcon.textContent = achievement.icon;
        
        const badgeName = document.createElement('div');
        badgeName.className = 'badge-name';
        badgeName.textContent = achievement.name;
        
        const badgeDescription = document.createElement('div');
        badgeDescription.className = 'badge-description';
        badgeDescription.textContent = achievement.description;
        
        const badgePoints = document.createElement('div');
        badgePoints.className = 'badge-points';
        badgePoints.textContent = `+${achievement.points}`;
        
        badgeItem.appendChild(badgeIcon);
        badgeItem.appendChild(badgeName);
        badgeItem.appendChild(badgeDescription);
        if (!achievement.unlocked) badgeItem.appendChild(badgePoints);
        
        badgesGrid.appendChild(badgeItem);
    });
    
    // Create total points display
    const totalPoints = document.createElement('div');
    totalPoints.style.textAlign = 'center';
    totalPoints.style.marginTop = '20px';
    totalPoints.style.fontSize = '1.2rem';
    totalPoints.innerHTML = `Total Points: <span style="color: #ffcc00; font-weight: 500;">${userPoints}</span>`;
    
    // Append elements
    panel.appendChild(header);
    panel.appendChild(closeButton);
    panel.appendChild(badgesGrid);
    panel.appendChild(totalPoints);
    
    // Append to container
    document.querySelector('.container').appendChild(panel);
    
    // Animate in
    setTimeout(() => {
        panel.classList.add('active');
    }, 10);
}

/**
 * Hide badges panel
 */
function hideBadgesPanel() {
    const panel = document.getElementById('badges-panel');
    if (panel) {
        panel.classList.remove('active');
        setTimeout(() => {
            panel.remove();
        }, 300);
    }
}

/**
 * Setup daily challenge
 */
function setupDailyChallenge() {
    // Check if we already have a challenge for today
    const today = new Date().toDateString();
    const storedChallenge = localStorage.getItem('affirm_daily_challenge');
    
    if (storedChallenge) {
        const challengeData = JSON.parse(storedChallenge);
        
        // If challenge is from today, use it
        if (challengeData.date === today) {
            dailyChallenge = challengeData.challenge;
            challengeCompleted = challengeData.completed;
            
            // Create challenge UI if not completed
            if (!challengeCompleted) {
                createChallengeUI(dailyChallenge);
            }
            return;
        }
    }
    
    // Generate a new challenge for today
    generateDailyChallenge(today);
}

/**
 * Generate a daily challenge
 * @param {string} date - Date string for the challenge
 */
function generateDailyChallenge(date) {
    // Possible challenges
    const challenges = [
        { type: 'breathing', description: 'Complete a breathing exercise', points: 15 },
        { type: 'journal', description: 'Write a journal entry', points: 20 },
        { type: 'favorite', description: 'Save a favorite affirmation', points: 15 },
        { type: 'emotions', description: 'Try a new emotion category', points: 10 },
        { type: 'sessions', description: 'Complete 3 affirmation sessions', points: 25 }
    ];
    
    // Select a random challenge
    const randomIndex = Math.floor(Math.random() * challenges.length);
    dailyChallenge = challenges[randomIndex];
    challengeCompleted = false;
    
    // Save to localStorage
    localStorage.setItem('affirm_daily_challenge', JSON.stringify({
        date: date,
        challenge: dailyChallenge,
        completed: false
    }));
    
    // Create challenge UI
    createChallengeUI(dailyChallenge);
}

/**
 * Create challenge UI
 * @param {Object} challenge - Challenge object
 */
function createChallengeUI(challenge) {
    // Create challenge container
    const container = document.createElement('div');
    container.className = 'challenge-container';
    container.id = 'challenge-container';
    
    // Create title
    const title = document.createElement('div');
    title.className = 'challenge-title';
    title.textContent = 'Daily Challenge';
    
    // Create description
    const description = document.createElement('div');
    description.className = 'challenge-description';
    description.textContent = challenge.description;
    
    // Create reward
    const reward = document.createElement('div');
    reward.className = 'challenge-reward';
    reward.textContent = `Reward: ${challenge.points} points`;
    
    // Append elements
    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(reward);
    
    // Append to container
    document.querySelector('.container').appendChild(container);
}

/**
 * Check if a challenge is completed
 * @param {string} action - Action that was performed
 */
function checkChallengeCompletion(action) {
    // If no challenge or already completed, return
    if (!dailyChallenge || challengeCompleted) return;
    
    let completed = false;
    
    // Check if the action completes the challenge
    switch (dailyChallenge.type) {
        case 'breathing':
            if (action === 'Completed breathing') completed = true;
            break;
        case 'journal':
            if (action.includes('journal')) completed = true;
            break;
        case 'favorite':
            if (action.includes('favorite')) completed = true;
            break;
        case 'emotions':
            if (action.includes('emotion')) completed = true;
            break;
        case 'sessions':
            // For session challenges, we need to keep count
            let sessionCount = parseInt(localStorage.getItem('affirm_daily_sessions') || '0');
            if (action === 'Completed affirmation') {
                sessionCount++;
                localStorage.setItem('affirm_daily_sessions', sessionCount.toString());
                
                if (sessionCount >= 3) completed = true;
            }
            break;
    }
    
    // If challenge is completed, mark as complete and award points
    if (completed) {
        challengeCompleted = true;
        
        // Update localStorage
        const challengeData = JSON.parse(localStorage.getItem('affirm_daily_challenge'));
        challengeData.completed = true;
        localStorage.setItem('affirm_daily_challenge', JSON.stringify(challengeData));
        
        // Update UI
        updateChallengeUI();
        
        // Award points
        awardPoints(dailyChallenge.points, 'Completed daily challenge');
    }
}

/**
 * Update challenge UI to show completion
 */
function updateChallengeUI() {
    const container = document.getElementById('challenge-container');
    if (!container) return;
    
    // Add completion indicator
    const complete = document.createElement('div');
    complete.className = 'challenge-complete';
    complete.innerHTML = '✓';
    
    container.appendChild(complete);
    
    // Add pulsing animation
    container.style.animation = 'counterPulse 1s';
    
    // Remove animation after it completes
    setTimeout(() => {
        container.style.animation = '';
    }, 1000);
}

/**
 * Initialize story UI components
 */
function initializeStoryJourney() {
    if (debugMode) console.log("Initializing story journey");
    
    // Load story progress
    storyWorld.loadProgress();
    
    // Create story status display
    createStoryStatusDisplay();
    
    // Create story panel
    createStoryPanel();
    
    // Set background theme based on current location
    applyLocationTheme(storyWorld.currentLocation);
}

/**
 * Create the story status display in the top corner
 */
function createStoryStatusDisplay() {
    const statusContainer = document.createElement('div');
    statusContainer.className = 'story-status';
    statusContainer.id = 'story-status';
    
    // Create chapter display
    const chapterDisplay = document.createElement('span');
    chapterDisplay.className = 'story-chapter';
    chapterDisplay.textContent = `Chapter ${storyWorld.currentChapter}`;
    
    // Create location display
    const locationDisplay = document.createElement('span');
    locationDisplay.className = 'location-name';
    const currentLocation = storyWorld.locations.find(loc => loc.id === storyWorld.currentLocation);
    locationDisplay.textContent = currentLocation ? currentLocation.name : 'Unknown';
    
    // Add location icon based on current location
    const locationIcon = document.createElement('span');
    locationIcon.className = 'location-icon';
    locationIcon.textContent = getLocationIcon(storyWorld.currentLocation);
    
    // Append elements
    statusContainer.appendChild(chapterDisplay);
    statusContainer.appendChild(document.createTextNode(' • '));
    statusContainer.appendChild(locationDisplay);
    statusContainer.appendChild(locationIcon);
    
    // Add click handler to open story panel
    statusContainer.addEventListener('click', () => {
        showStoryPanel();
    });
    
    // Append to container
    document.querySelector('.container').appendChild(statusContainer);
}

/**
 * Create the full story panel
 */
function createStoryPanel() {
    const panel = document.createElement('div');
    panel.className = 'story-panel';
    panel.id = 'story-panel';
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = 'Your Journey';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-preferences';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => {
        hideStoryPanel();
    });
    
    // Create journey map section
    const journeyMapSection = createJourneyMapSection();
    
    // Create current guide section
    const guideSection = createGuideSection();
    
    // Create character attributes section
    const attributesSection = createAttributesSection();
    
    // Create collectibles section
    const collectiblesSection = createCollectiblesSection();
    
    // Append all sections
    panel.appendChild(header);
    panel.appendChild(closeButton);
    panel.appendChild(journeyMapSection);
    panel.appendChild(guideSection);
    panel.appendChild(attributesSection);
    panel.appendChild(collectiblesSection);
    
    // Append to container
    document.querySelector('.container').appendChild(panel);
}

/**
 * Create the journey map section
 */
function createJourneyMapSection() {
    const section = document.createElement('div');
    section.className = 'story-journey-map';
    
    // Create journey progress bar
    const journeyProgress = document.createElement('div');
    journeyProgress.className = 'journey-progress';
    
    // Add progress fill
    const progressFill = document.createElement('div');
    progressFill.className = 'journey-progress-fill';
    const progressPercentage = ((storyWorld.currentChapter - 1) / (storyWorld.totalChapters - 1)) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    journeyProgress.appendChild(progressFill);
    
    // Add journey nodes
    for (let i = 1; i <= storyWorld.totalChapters; i++) {
        const node = document.createElement('div');
        node.className = 'journey-node';
        
        if (i < storyWorld.currentChapter) {
            node.classList.add('completed');
            node.textContent = '✓';
        } else if (i === storyWorld.currentChapter) {
            node.classList.add('active');
        }
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'node-tooltip';
        tooltip.textContent = getChapterTitle(i);
        node.appendChild(tooltip);
        
        journeyProgress.appendChild(node);
    }
    
    section.appendChild(journeyProgress);
    return section;
}

/**
 * Create the guide section
 */
function createGuideSection() {
    const section = document.createElement('div');
    section.className = 'guide-section';
    
    const currentGuide = storyWorld.getCurrentGuide();
    
    // Create guide avatar
    const avatar = document.createElement('div');
    avatar.className = 'guide-avatar';
    avatar.textContent = currentGuide.avatar;
    
    // Create guide info
    const info = document.createElement('div');
    info.className = 'guide-info';
    
    // Create guide name
    const name = document.createElement('div');
    name.className = 'guide-name';
    name.textContent = currentGuide.name;
    
    // Create guide message
    const message = document.createElement('div');
    message.className = 'guide-message';
    message.textContent = getGuideMessage(currentGuide, storyWorld.currentChapter);
    
    // Append elements
    info.appendChild(name);
    info.appendChild(message);
    
    section.appendChild(avatar);
    section.appendChild(info);
    
    return section;
}

/**
 * Create the character attributes section
 */
function createAttributesSection() {
    const section = document.createElement('div');
    section.className = 'character-attributes';
    
    // Add each attribute
    for (const [attribute, value] of Object.entries(storyWorld.attributes)) {
        const attributeItem = document.createElement('div');
        attributeItem.className = 'attribute-item';
        
        // Create attribute name
        const attributeName = document.createElement('div');
        attributeName.className = 'attribute-name';
        attributeName.textContent = capitalizeFirstLetter(attribute);
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'attribute-progress';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'attribute-progress-fill';
        const maxAttributeValue = 10;
        const percentage = Math.min((value / maxAttributeValue) * 100, 100);
        progressFill.style.width = `${percentage}%`;
        
        progressBar.appendChild(progressFill);
        
        // Create value display
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'attribute-value';
        valueDisplay.textContent = `${value}/${maxAttributeValue}`;
        
        // Append elements
        attributeItem.appendChild(attributeName);
        attributeItem.appendChild(progressBar);
        attributeItem.appendChild(valueDisplay);
        
        section.appendChild(attributeItem);
    }
    
    return section;
}

/**
 * Create the collectibles section
 */
function createCollectiblesSection() {
    const sectionWrapper = document.createElement('div');
    sectionWrapper.className = 'collectibles-section';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Collectibles';
    title.style.marginBottom = '15px';
    title.style.fontSize = '1.2rem';
    title.style.color = '#9cb8ff';
    
    // Create grid
    const grid = document.createElement('div');
    grid.className = 'collectibles-grid';
    
    // Add collectible slots (some filled, some locked)
    const totalCollectiblesPerChapter = 3;
    const totalSlots = storyWorld.totalChapters * totalCollectiblesPerChapter;
    
    // Map of collectible icons
    const collectibleIcons = {
        'crystal': '💎',
        'feather': '🪶',
        'scroll': '📜',
        'key': '🔑',
        'rune': '🔮',
        'flower': '🌺',
        'star': '⭐',
        'leaf': '🍃',
        'shell': '🐚',
        'book': '📚',
        'map': '🗺️',
        'quill': '✒️',
        'coin': '🪙',
        'gem': '💠',
        'artifact': '🏺',
        'token': '🎭',
        'lantern': '🏮',
        'compass': '🧭',
        'hourglass': '⌛',
        'chalice': '🏆',
        'shard': '🔷'
    };
    
    const collectibleNames = Object.keys(collectibleIcons);
    
    for (let i = 0; i < totalSlots; i++) {
        const collectibleItem = document.createElement('div');
        collectibleItem.className = 'collectible-item';
        
        // Check if this collectible is unlocked
        const isUnlocked = storyWorld.collectibles.length > i;
        
        if (!isUnlocked) {
            collectibleItem.classList.add('locked');
        }
        
        // Create icon
        const icon = document.createElement('div');
        icon.className = 'collectible-icon';
        
        // Create name
        const name = document.createElement('div');
        name.className = 'collectible-name';
        
        if (isUnlocked) {
            const collectible = storyWorld.collectibles[i];
            icon.textContent = collectibleIcons[collectible.type] || '❓';
            name.textContent = collectible.name;
        } else {
            icon.textContent = '❓';
            name.textContent = 'Unknown';
        }
        
        // Append elements
        collectibleItem.appendChild(icon);
        collectibleItem.appendChild(name);
        
        grid.appendChild(collectibleItem);
    }
    
    sectionWrapper.appendChild(title);
    sectionWrapper.appendChild(grid);
    
    return sectionWrapper;
}

/**
 * Show the story panel
 */
function showStoryPanel() {
    const panel = document.getElementById('story-panel');
    if (panel) {
        // Update panel content first
        updateStoryPanel();
        
        // Then show it
        panel.classList.add('active');
    }
}

/**
 * Update the story panel content
 */
function updateStoryPanel() {
    // Update the journey progress
    const progressFill = document.querySelector('.journey-progress-fill');
    if (progressFill) {
        const progressPercentage = ((storyWorld.currentChapter - 1) / (storyWorld.totalChapters - 1)) * 100;
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Update guide message
    const guideMessage = document.querySelector('.guide-message');
    const currentGuide = storyWorld.getCurrentGuide();
    if (guideMessage && currentGuide) {
        guideMessage.textContent = getGuideMessage(currentGuide, storyWorld.currentChapter);
    }
    
    // Update attributes
    for (const [attribute, value] of Object.entries(storyWorld.attributes)) {
        const attributeItem = document.querySelector(`.attribute-item:has(.attribute-name:contains('${capitalizeFirstLetter(attribute)}')`);
        if (attributeItem) {
            const progressFill = attributeItem.querySelector('.attribute-progress-fill');
            const valueDisplay = attributeItem.querySelector('.attribute-value');
            
            if (progressFill) {
                const maxAttributeValue = 10;
                const percentage = Math.min((value / maxAttributeValue) * 100, 100);
                progressFill.style.width = `${percentage}%`;
            }
            
            if (valueDisplay) {
                valueDisplay.textContent = `${value}/10`;
            }
        }
    }
}

/**
 * Hide the story panel
 */
function hideStoryPanel() {
    const panel = document.getElementById('story-panel');
    if (panel) {
        panel.classList.remove('active');
    }
}

/**
 * Show a story transition screen
 * @param {string} title - The transition title
 * @param {string} description - The transition description
 * @param {number} duration - Duration in ms before automatically hiding
 */
function showStoryTransition(title, description, duration = 5000) {
    // Create transition screen if it doesn't exist
    let transitionScreen = document.querySelector('.story-transitions');
    if (!transitionScreen) {
        transitionScreen = document.createElement('div');
        transitionScreen.className = 'story-transitions';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'transition-title';
        
        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'transition-description';
        
        transitionScreen.appendChild(titleElement);
        transitionScreen.appendChild(descriptionElement);
        
        document.querySelector('.container').appendChild(transitionScreen);
    }
    
    // Update content
    const titleElement = transitionScreen.querySelector('.transition-title');
    const descriptionElement = transitionScreen.querySelector('.transition-description');
    
    if (titleElement) titleElement.textContent = title;
    if (descriptionElement) descriptionElement.textContent = description;
    
    // Show transition
    transitionScreen.classList.add('active');
    
    // Hide after duration
    setTimeout(() => {
        transitionScreen.classList.remove('active');
    }, duration);
}

/**
 * Show a notification about story progress
 * @param {string} message - The notification message
 * @param {number} duration - Duration in ms before automatically hiding
 */
function showStoryNotification(message, duration = 3000) {
    // Create notification if it doesn't exist
    let notification = document.querySelector('.story-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'story-notification';
        document.querySelector('.container').appendChild(notification);
    }
    
    // Update content
    notification.textContent = message;
    
    // Show notification
    notification.classList.add('active');
    
    // Hide after duration
    setTimeout(() => {
        notification.classList.remove('active');
    }, duration);
}

/**
 * Change to a new location in the story
 * @param {string} locationId - ID of the location to change to
 */
function changeStoryLocation(locationId) {
    const location = storyWorld.changeLocation(locationId);
    if (location) {
        // Show transition
        showStoryTransition(
            `Arriving at ${location.name}`,
            location.description,
            4000
        );
        
        // Update location theme
        applyLocationTheme(locationId);
        
        // Update story status display
        updateStoryStatusDisplay();
        
        return true;
    }
    return false;
}

/**
 * Apply visual theme based on location
 * @param {string} locationId - ID of the location
 */
function applyLocationTheme(locationId) {
    // Each location has its own color palette
    const locationThemes = {
        'beginning': {
            backgroundColor: [10, 12, 20],
            particleColor: [100, 140, 255]
        },
        'forest': {
            backgroundColor: [10, 30, 15],
            particleColor: [60, 200, 100]
        },
        'mountain': {
            backgroundColor: [30, 30, 50],
            particleColor: [180, 200, 255]
        },
        'river': {
            backgroundColor: [10, 20, 50],
            particleColor: [50, 150, 255]
        },
        'cave': {
            backgroundColor: [20, 10, 30],
            particleColor: [150, 50, 200]
        },
        'meadow': {
            backgroundColor: [30, 40, 15],
            particleColor: [220, 240, 150]
        },
        'lighthouse': {
            backgroundColor: [40, 40, 60],
            particleColor: [255, 200, 100]
        }
    };
    
    const theme = locationThemes[locationId] || locationThemes['beginning'];
    
    // Update background color
    backgroundColor.target = theme.backgroundColor;
    
    // Update affirmation manager theme if available
    if (window.affirmationManager) {
        // This will eventually need to be updated to work with the location themes
        affirmationManager.setVisualThemeForEmotion('neutral');
    }
}

/**
 * Update the story status display
 */
function updateStoryStatusDisplay() {
    const statusContainer = document.getElementById('story-status');
    if (!statusContainer) return;
    
    // Update chapter
    const chapterDisplay = statusContainer.querySelector('.story-chapter');
    if (chapterDisplay) {
        chapterDisplay.textContent = `Chapter ${storyWorld.currentChapter}`;
    }
    
    // Update location
    const locationDisplay = statusContainer.querySelector('.location-name');
    const locationIcon = statusContainer.querySelector('.location-icon');
    
    if (locationDisplay) {
        const currentLocation = storyWorld.locations.find(loc => loc.id === storyWorld.currentLocation);
        locationDisplay.textContent = currentLocation ? currentLocation.name : 'Unknown';
    }
    
    if (locationIcon) {
        locationIcon.textContent = getLocationIcon(storyWorld.currentLocation);
    }
}

/**
 * Get a message from the current guide
 * @param {Object} guide - The guide object
 * @param {number} chapter - Current chapter number
 * @returns {string} - Guide message
 */
function getGuideMessage(guide, chapter) {
    const messages = {
        'sage': [
            "Welcome to your journey of wisdom. I will guide you through the landscapes of the mind.",
            "The path unfolds before you. Each choice shapes your inner landscape.",
            "You've come far in understanding. The middle of the journey often tests us most.",
            "The greatest wisdom lies in knowing we know very little. Keep exploring.",
            "Few reach these depths of insight. Your journey nears its pinnacle.",
            "The light of wisdom now shines within you. You've become the knowledge you sought.",
            "The circle completes. You now understand that wisdom is an endless journey."
        ],
        'healer': [
            "I sense your emotional currents beginning to flow. Let me help you navigate them.",
            "Feelings are like water - they must flow freely to remain clear and life-giving.",
            "You're learning to balance the waters of emotion. Neither too rigid nor overflowing.",
            "The healing journey requires facing both light and shadow. You're doing well.",
            "Your emotional awareness has deepened remarkably. You're becoming a healer yourself.",
            "The heart's wisdom now flows naturally through you. You've found your balance.",
            "Your emotional journey has transformed you. Now you can help others find their way."
        ],
        'warrior': [
            "Your journey of strength begins. I'll help you find the warrior within.",
            "True strength comes from knowing when to stand firm and when to yield.",
            "You're developing resilience with each challenge. The warrior grows stronger.",
            "Courage isn't absence of fear, but moving forward despite it. You show this well.",
            "Your inner strength has become remarkable. Few challenges can shake you now.",
            "The warrior's spirit shines bright in you. Your resolve inspires others.",
            "You've mastered the path of inner strength. The greatest battles are won within."
        ],
        'creator': [
            "The spark of creativity begins in you. I'll help you fan it into flame.",
            "You're learning to see possibilities where others see only what is. Good.",
            "Your creative vision expands. You're beginning to transform yourself and your world.",
            "Creating requires both inspiration and discipline. You're balancing both well.",
            "Your creative power has grown immensely. You're bringing new beauty into being.",
            "You've become a channel for inspiration. The flow moves through you effortlessly.",
            "The master creator knows all creation is transformation. You've become that master."
        ]
    };
    
    // Get the appropriate message based on chapter
    const guideMessages = messages[guide.id] || messages['sage'];
    const messageIndex = Math.min(chapter - 1, guideMessages.length - 1);
    
    return guideMessages[messageIndex];
}

/**
 * Get the title for a specific chapter
 * @param {number} chapter - Chapter number
 * @returns {string} - Chapter title
 */
function getChapterTitle(chapter) {
    const chapterTitles = [
        "The Beginning",
        "First Steps",
        "Growing Awareness",
        "Facing Challenges",
        "Finding Balance",
        "Inner Mastery",
        "Transformation"
    ];
    
    return chapterTitles[chapter - 1] || `Chapter ${chapter}`;
}

/**
 * Get the icon for a specific location
 * @param {string} locationId - Location ID
 * @returns {string} - Location icon
 */
function getLocationIcon(locationId) {
    const locationIcons = {
        'beginning': '🌅',
        'forest': '🌲',
        'mountain': '⛰️',
        'river': '🌊',
        'cave': '🕳️',
        'meadow': '🌾',
        'lighthouse': '🏮'
    };
    
    return locationIcons[locationId] || '🌍';
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Set up event listeners for the application
 * This function doesn't use any p5.js functions so it's safe to call from DOMContentLoaded
 */
function setupEventListeners() {
    // Global event listeners
    window.addEventListener('resize', windowResized);
    
    // Add any other app-specific event listeners here
    document.addEventListener('keydown', (event) => {
        // Handle keyboard shortcuts
        if (event.key === 'Escape') {
            // Close any open panels
            interactiveUI.hideUI();
            interactiveUI.hidePreferencesPanel();
            interactiveUI.hideFavoritesPanel();
            interactiveUI.hideJournalEntries();
        }
    });
}

// Update document load event listener to initialize story journey
document.addEventListener('DOMContentLoaded', () => {
    // Only set up event listeners here - p5.js specific initialization will happen in setup()
    setupEventListeners();
    
    // Initialize preference system
    initializePreferences();
    
    // Initialize streak system
    initializeStreak();
    
    // Initialize gamification system
    initializeGamification();
    
    // Initialize story journey system
    initializeStoryJourney();
    
    // Start loading affirmations in the background
    loadAffirmations();
    
    // Add theme based on current time of day if no preference
    if (!getPreference('theme')) {
        setThemeBasedOnTime();
    }
    
    // Show/hide loading indicator
    setTimeout(() => {
        document.querySelector('.loading').classList.add('hidden');
        
        // Show first-time welcome if needed
        const hasVisited = localStorage.getItem('affirm_visited');
        if (!hasVisited) {
            showWelcome();
            localStorage.setItem('affirm_visited', 'true');
        } else {
            // Start with affirmation for returning users
            getNextAffirmation();
        }
    }, 1500);
}); 