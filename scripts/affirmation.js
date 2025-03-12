class AffirmationManager {
    constructor() {
        this.currentAffirmation = '';
        this.nextAffirmation = '';
        this.fontSize = 32;
        this.isReady = false;
        this.characters = []; // Will store all character objects
        this.particleSystem = new ParticleSystem();
        
        // Configuration
        this.lineHeight = 1.5;
        this.maxWidth = width * 0.8;
        this.textX = width / 2;
        this.textY = height / 2;
        
        // Animation timing (in milliseconds)
        this.fadeInDuration = 800; // Shorter fade-in for each character
        this.fadeOutDuration = 1500;
        this.staggerDelay = 100; // More pronounced delay between characters
        this.particleEmissionRate = 0.4; // Chance to emit particles (0-1)
        
        // API configuration
        this.API_ENABLED = false; // Set to true once the worker is deployed
        
        // Emotional context
        this.selectedEmotion = null;
        this.lastChoice = null;
        this.choiceHistory = [];
        
        // User preferences
        this.userPreferences = {
            themes: [],
            favoriteAffirmations: [],
            excludedTopics: [],
            affirmationLength: 'medium' // 'short', 'medium', 'long'
        };
        
        // Visual theme
        this.currentTheme = null;
        this.targetBackgroundColor = [0, 0, 0]; // Black default
        this.currentBackgroundColor = [0, 0, 0];
        
        // Load saved preferences if available
        this.loadUserPreferences();
    }
    
    // User preferences methods
    loadUserPreferences() {
        try {
            const savedPrefs = localStorage.getItem('affirm_preferences');
            if (savedPrefs) {
                this.userPreferences = JSON.parse(savedPrefs);
                console.log('Loaded user preferences:', this.userPreferences);
            }
            
            // Load saved favorites
            const savedFavorites = localStorage.getItem('affirm_favorites');
            if (savedFavorites) {
                this.userPreferences.favoriteAffirmations = JSON.parse(savedFavorites);
                console.log('Loaded favorites:', this.userPreferences.favoriteAffirmations.length, 'items');
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            // Reset to defaults if there was an error
            this.userPreferences = {
                themes: [],
                favoriteAffirmations: [],
                excludedTopics: [],
                affirmationLength: 'medium'
            };
        }
    }
    
    saveUserPreferences() {
        try {
            // Save only the main preferences, handle favorites separately
            const prefsToSave = {
                themes: this.userPreferences.themes,
                excludedTopics: this.userPreferences.excludedTopics,
                affirmationLength: this.userPreferences.affirmationLength
            };
            
            localStorage.setItem('affirm_preferences', JSON.stringify(prefsToSave));
            console.log('Saved user preferences');
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }
    
    addUserPreferenceTheme(theme) {
        if (!this.userPreferences.themes.includes(theme)) {
            this.userPreferences.themes.push(theme);
            this.saveUserPreferences();
            return true;
        }
        return false;
    }
    
    removeUserPreferenceTheme(theme) {
        const index = this.userPreferences.themes.indexOf(theme);
        if (index !== -1) {
            this.userPreferences.themes.splice(index, 1);
            this.saveUserPreferences();
            return true;
        }
        return false;
    }
    
    setAffirmationLength(length) {
        if (['short', 'medium', 'long'].includes(length)) {
            this.userPreferences.affirmationLength = length;
            this.saveUserPreferences();
            return true;
        }
        return false;
    }
    
    addExcludedTopic(topic) {
        if (!this.userPreferences.excludedTopics.includes(topic)) {
            this.userPreferences.excludedTopics.push(topic);
            this.saveUserPreferences();
            return true;
        }
        return false;
    }
    
    removeExcludedTopic(topic) {
        const index = this.userPreferences.excludedTopics.indexOf(topic);
        if (index !== -1) {
            this.userPreferences.excludedTopics.splice(index, 1);
            this.saveUserPreferences();
            return true;
        }
        return false;
    }
    
    // Favorites/Collection methods
    addFavoriteAffirmation(affirmation) {
        // Don't add duplicates
        if (!this.userPreferences.favoriteAffirmations.some(fav => fav.text === affirmation)) {
            const newFavorite = {
                id: Date.now(), // Simple unique ID based on timestamp
                text: affirmation,
                date: new Date().toISOString(),
                emotion: this.selectedEmotion || null
            };
            
            this.userPreferences.favoriteAffirmations.push(newFavorite);
            this.saveFavorites();
            return true;
        }
        return false;
    }
    
    removeFavoriteAffirmation(id) {
        const initialLength = this.userPreferences.favoriteAffirmations.length;
        this.userPreferences.favoriteAffirmations = this.userPreferences.favoriteAffirmations.filter(
            fav => fav.id !== id
        );
        
        if (initialLength !== this.userPreferences.favoriteAffirmations.length) {
            this.saveFavorites();
            return true;
        }
        return false;
    }
    
    saveFavorites() {
        try {
            localStorage.setItem('affirm_favorites', JSON.stringify(this.userPreferences.favoriteAffirmations));
            console.log('Saved favorites');
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }
    
    getFavorites() {
        return this.userPreferences.favoriteAffirmations;
    }
    
    // Visual theme methods
    setVisualThemeForEmotion(emotion) {
        const themes = {
            anxious: {
                backgroundColor: [10, 10, 40], // Deep blue
                particleColors: [[100, 150, 255], [70, 130, 230], [50, 100, 200]],
                transitionSpeed: 1.2 // Slightly faster for anxious state
            },
            hopeful: {
                backgroundColor: [40, 20, 60], // Purple tone
                particleColors: [[255, 200, 100], [230, 180, 80], [200, 150, 50]],
                transitionSpeed: 0.9
            },
            tired: {
                backgroundColor: [40, 30, 20], // Warm dark brown
                particleColors: [[150, 120, 100], [130, 100, 80], [100, 80, 60]],
                transitionSpeed: 0.7 // Slower for tired state
            },
            sad: {
                backgroundColor: [20, 30, 40], // Dark teal
                particleColors: [[100, 130, 150], [80, 110, 130], [60, 90, 110]],
                transitionSpeed: 0.8
            },
            calm: {
                backgroundColor: [20, 40, 30], // Dark green
                particleColors: [[100, 200, 150], [80, 180, 130], [60, 160, 110]],
                transitionSpeed: 0.85
            },
            overwhelmed: {
                backgroundColor: [40, 25, 25], // Dark burgundy
                particleColors: [[200, 100, 100], [180, 80, 80], [160, 60, 60]],
                transitionSpeed: 1.1
            },
            content: {
                backgroundColor: [30, 35, 25], // Olive green
                particleColors: [[180, 200, 120], [160, 180, 100], [140, 160, 80]],
                transitionSpeed: 0.8
            },
            excited: {
                backgroundColor: [45, 25, 35], // Magenta tone
                particleColors: [[255, 130, 180], [235, 110, 160], [215, 90, 140]],
                transitionSpeed: 1.3 // Faster for excited state
            },
            grateful: {
                backgroundColor: [40, 35, 15], // Gold tone
                particleColors: [[255, 215, 80], [235, 195, 60], [215, 175, 40]],
                transitionSpeed: 0.9
            },
            neutral: {
                backgroundColor: [25, 25, 30], // Neutral gray-blue
                particleColors: [[150, 150, 170], [130, 130, 150], [110, 110, 130]],
                transitionSpeed: 1.0
            },
            curious: {
                backgroundColor: [20, 35, 45], // Turquoise tone
                particleColors: [[80, 200, 230], [60, 180, 210], [40, 160, 190]],
                transitionSpeed: 1.1
            },
            peaceful: {
                backgroundColor: [25, 35, 40], // Slate blue
                particleColors: [[120, 150, 200], [100, 130, 180], [80, 110, 160]],
                transitionSpeed: 0.75 // Slower for peaceful state
            }
        };
        
        // Set the theme based on emotion, or default to calm
        this.currentTheme = themes[emotion] || themes['calm'];
        
        // Apply background color transition
        this.targetBackgroundColor = this.currentTheme.backgroundColor;
        
        // Update animation timing based on emotion state
        if (this.currentTheme.transitionSpeed) {
            // Adjust animation timings proportionally
            const baseSpeed = 1.0;
            const speedFactor = this.currentTheme.transitionSpeed / baseSpeed;
            
            this.fadeInDuration = Math.round(800 / speedFactor);
            this.fadeOutDuration = Math.round(1500 / speedFactor);
            this.staggerDelay = Math.round(100 / speedFactor);
        }
        
        console.log('Set visual theme for emotion:', emotion);
    }
    
    // Get a particle color from the current theme
    getThemeParticleColor() {
        if (!this.currentTheme || !this.currentTheme.particleColors) {
            return [255, 255, 255]; // Default white
        }
        
        // Select a random color from the theme's particle color palette
        const colors = this.currentTheme.particleColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Load the initial affirmation from the API
    async loadInitialAffirmation() {
        try {
            if (this.API_ENABLED) {
                // Use the API to get an affirmation
                this.currentAffirmation = await this.fetchAffirmation();
            } else {
                // Array of initial affirmations to choose from
                const initialAffirmations = [
                    "You are enough exactly as you are, embracing both your strengths and your beautiful imperfections.",
                    "Within you resides a strength that has carried you through every challenge so far.",
                    "Your presence in this world makes a difference, even in ways you cannot see.",
                    "Today is a new canvas waiting for you to paint it with possibility."
                ];
                
                // Select a random initial affirmation
                this.currentAffirmation = initialAffirmations[Math.floor(Math.random() * initialAffirmations.length)];
            }
            
            // Setup is complete
            this.isReady = true;
            this.initializeTextSize();
            
            return this.currentAffirmation;
        } catch (error) {
            console.error('Error loading initial affirmation:', error);
            // Use a fallback
            this.currentAffirmation = "You are capable of amazing things.";
            this.isReady = true;
            this.initializeTextSize();
            
            return this.currentAffirmation;
        }
    }
    
    // Request the next affirmation from the API
    async requestNextAffirmation() {
        console.log("Requesting next affirmation, current is:", this.currentAffirmation);
        try {
            if (this.API_ENABLED) {
                // Use the API to get a related affirmation
                this.nextAffirmation = await this.fetchRelatedAffirmation(this.currentAffirmation);
            } else {
                // For now, use static placeholders until the API is implemented
                const affirmations = [
                    "Each breath is a reminder that you are alive and filled with possibility.",
                    "Trust your journey, even when the path ahead seems unclear.",
                    "Your courage grows stronger each time you face your fears.",
                    "The light within you illuminates the world in ways you may never fully see.",
                    "You are not defined by your mistakes, but by how you learn from them.",
                    "In the quiet moments, remember that stillness is also a form of progress.",
                    "Your resilience is a testament to your spirit's unwavering strength.",
                    "Every challenge you face is an opportunity for growth and transformation.",
                    "The kindness you show others creates ripples that extend far beyond your sight.",
                    "Your uniqueness is not just acceptable, it is essential to the world.",
                    "Peace begins with the compassion you show yourself.",
                    "There is wisdom in your heart that transcends rational thought.",
                    "Your vulnerability is not weakness, but a profound form of courage.",
                    "Each small step forward is still movement in the right direction.",
                    "You carry within you the power to begin again, no matter what came before."
                ];
                
                // Make sure we don't select the same affirmation as the current one
                let filteredAffirmations = affirmations.filter(a => a !== this.currentAffirmation);
                
                // If somehow all affirmations were filtered out, use the original list
                if (filteredAffirmations.length === 0) {
                    filteredAffirmations = affirmations;
                }
                
                this.nextAffirmation = filteredAffirmations[Math.floor(Math.random() * filteredAffirmations.length)];
            }
            
            console.log("Selected next affirmation:", this.nextAffirmation);
            
            return this.nextAffirmation;
        } catch (error) {
            console.error('Error requesting next affirmation:', error);
            // Use a fallback
            this.nextAffirmation = "Every moment is a fresh beginning.";
            console.log("Using fallback affirmation:", this.nextAffirmation);
            return this.nextAffirmation;
        }
    }
    
    // Calculate and set appropriate text size
    initializeTextSize() {
        textSize(this.fontSize);
        
        // Adjust text size to fit screen if needed
        const textWidth = this.calculateTextWidth(this.currentAffirmation);
        if (textWidth > this.maxWidth) {
            this.fontSize = floor(this.fontSize * (this.maxWidth / textWidth));
            textSize(this.fontSize);
        }
    }
    
    // Calculate the width of a text string
    calculateTextWidth(text) {
        // Ensure we're in a drawing context for p5.js functions
        push();
        textSize(this.fontSize);
        
        const lines = this.breakTextIntoLines(text);
        let maxLineWidth = 0;
        
        for (const line of lines) {
            const lineWidth = textWidth(line);
            if (lineWidth > maxLineWidth) {
                maxLineWidth = lineWidth;
            }
        }
        
        pop();
        return maxLineWidth;
    }
    
    // Break text into lines based on max width
    breakTextIntoLines(text) {
        // Ensure we're in a drawing context for p5.js functions
        push();
        textSize(this.fontSize);
        
        const words = text.split(' ');
        const lines = [];
        
        // Handle empty text or single word
        if (!words.length) {
            pop();
            return [''];
        }
        
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            
            try {
                if (textWidth(testLine) <= this.maxWidth) {
                    currentLine = testLine;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            } catch (e) {
                console.error("Error measuring text width:", e);
                // Fallback: just add the word and move on
                lines.push(currentLine);
                currentLine = word;
            }
        }
        
        lines.push(currentLine);
        pop();
        return lines;
    }
    
    // Create initial characters with fade-in animation
    initializeCharacters() {
        console.log("Initializing characters for:", this.currentAffirmation);
        
        // Make sure we're using p5.js functions within draw context
        push();
        textSize(this.fontSize);
        
        this.characters = [];
        
        const lines = this.breakTextIntoLines(this.currentAffirmation);
        let charIndex = 0;
        let totalChars = 0;
        
        // First count total visible characters (excluding spaces)
        for (const line of lines) {
            for (const char of line) {
                if (char !== ' ') {
                    totalChars++;
                }
            }
        }
        
        // Now create character objects
        for (let i = 0; i < lines.length; i++) {
            const lineY = this.textY - ((lines.length - 1) * this.fontSize * this.lineHeight / 2) + (i * this.fontSize * this.lineHeight);
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                try {
                    // Skip spaces (we don't animate them)
                    if (char !== ' ') {
                        const lineWidth = textWidth(lines[i]);
                        const lineX = this.textX - lineWidth / 2;
                        const charWidth = textWidth(char);
                        let substringWidth = 0;
                        
                        // Calculate the width of the substring up to the current character
                        if (j > 0) {
                            substringWidth = textWidth(lines[i].substring(0, j));
                        }
                        
                        const charX = lineX + substringWidth + charWidth / 2;
                        
                        // For more sequential appearance, use index directly with less randomness
                        // This makes letters appear more one-by-one
                        const sequentialDelay = charIndex * this.staggerDelay;
                        
                        this.characters.push({
                            char: char,
                            x: charX,
                            y: lineY,
                            opacity: 0, // Start fully transparent
                            animationStart: millis() + sequentialDelay,
                            fadeIn: true,
                            fadeOut: false,
                            isSpace: false,
                            hasEmittedParticles: false, // Track if we've emitted particles already
                            particleEmissionThreshold: 0.7 // Emit particles when opacity reaches this level
                        });
                        
                        charIndex++;
                    } else {
                        // Add spaces as non-animated placeholders
                        const lineWidth = textWidth(lines[i]);
                        const lineX = this.textX - lineWidth / 2;
                        const charWidth = textWidth(char);
                        let substringWidth = 0;
                        
                        // Calculate the width of the substring up to the current character
                        if (j > 0) {
                            substringWidth = textWidth(lines[i].substring(0, j));
                        }
                        
                        const charX = lineX + substringWidth + charWidth / 2;
                        
                        this.characters.push({
                            char: char,
                            x: charX,
                            y: lineY,
                            opacity: 0,
                            isSpace: true
                        });
                    }
                } catch (e) {
                    console.error("Error initializing character:", char, e);
                }
            }
        }
        
        pop();
        console.log("Created", this.characters.length, "characters");
    }
    
    // Display and update all characters
    updateAndDisplayCharacters() {
        if (!this.characters || this.characters.length === 0) {
            return; // No characters to display
        }
        
        const currentTime = millis();
        
        push();
        textAlign(CENTER, CENTER);
        textSize(this.fontSize);
        
        // Draw spaces first (as background characters)
        for (const character of this.characters) {
            if (character.isSpace) {
                // Spaces are just placeholders, no need to render them
                continue;
            }
        }
        
        // Then draw all non-space characters with their fade effects
        for (const character of this.characters) {
            if (character.isSpace) {
                continue;
            }
            
            try {
                // Calculate fade progress
                if (character.fadeIn && currentTime >= character.animationStart) {
                    const elapsed = currentTime - character.animationStart;
                    const progress = constrain(elapsed / this.fadeInDuration, 0, 1);
                    
                    // Apply easing for smoother animation
                    character.opacity = 255 * this.easeInOutCubic(progress);
                    
                    // Emit particles when the character is reaching visibility
                    if (!character.hasEmittedParticles && character.opacity > 255 * character.particleEmissionThreshold) {
                        // Emit particles at the character position
                        const particleCount = floor(random(3, 8));
                        this.particleSystem.emit(character.x, character.y, particleCount);
                        character.hasEmittedParticles = true;
                    }
                    
                    // Continue emitting particles occasionally while fading in
                    if (progress < 1 && random() < this.particleEmissionRate * 0.05) {
                        this.particleSystem.emit(character.x, character.y, 1);
                    }
                    
                    // Complete fade in
                    if (progress >= 1) {
                        character.fadeIn = false;
                        character.opacity = 255;
                    }
                }
                
                // Handle fade out
                if (character.fadeOut && currentTime >= character.animationStart) {
                    const elapsed = currentTime - character.animationStart;
                    const progress = constrain(elapsed / this.fadeOutDuration, 0, 1);
                    
                    // Apply easing for smoother animation
                    character.opacity = 255 * (1 - this.easeInOutCubic(progress));
                    
                    // Emit particles occasionally while fading out
                    if (random() < this.particleEmissionRate * 0.02) {
                        this.particleSystem.emit(character.x, character.y, 1);
                    }
                    
                    // Complete fade out
                    if (progress >= 1) {
                        character.fadeOut = false;
                        character.opacity = 0;
                    }
                }
                
                // Draw the character
                fill(255, character.opacity);
                text(character.char, character.x, character.y);
            } catch (e) {
                console.error("Error updating/displaying character:", character.char, e);
            }
        }
        
        pop();
        
        // Update and display particle system
        this.particleSystem.update();
        this.particleSystem.display();
    }
    
    // Prepare for transition to new affirmation
    prepareForTransition() {
        // Set all current characters to fade out with staggered timing
        const totalChars = this.characters.filter(c => !c.isSpace).length;
        let charIndex = 0;
        
        for (let i = 0; i < this.characters.length; i++) {
            if (!this.characters[i].isSpace) {
                // More sequential fade-out with less randomness
                this.characters[i].fadeOut = true;
                this.characters[i].animationStart = millis() + (charIndex * this.staggerDelay * 0.5);
                this.characters[i].hasEmittedParticles = false; // Reset particle emission flag
                charIndex++;
            }
        }
    }
    
    // Create new characters for the next affirmation
    createNewCharacters() {
        if (debugMode) console.log("Creating new characters for: ", this.nextAffirmation);
        
        // If nextAffirmation is empty, something went wrong
        if (!this.nextAffirmation || this.nextAffirmation.trim() === '') {
            console.error("Error: Next affirmation is empty! Using default wisdom.");
            this.nextAffirmation = "The journey of a thousand miles begins beneath one's feet.";
        }
        
        // Make sure we're using p5.js functions within draw context
        push(); // Save the current drawing state
        
        // Update current affirmation to the next one
        this.currentAffirmation = this.nextAffirmation;
        
        // Calculate text size for new text
        textSize(this.fontSize);
        const calculatedTextWidth = this.calculateTextWidth(this.currentAffirmation);
        if (calculatedTextWidth > this.maxWidth) {
            this.fontSize = floor(this.fontSize * (this.maxWidth / calculatedTextWidth));
            textSize(this.fontSize);
        }
        
        // Create new characters
        const lines = this.breakTextIntoLines(this.currentAffirmation);
        const newCharacters = [];
        let charIndex = 0;
        let totalChars = 0;
        
        // First count total visible characters
        for (const line of lines) {
            for (const char of line) {
                if (char !== ' ') {
                    totalChars++;
                }
            }
        }
        
        // Now create character objects
        for (let i = 0; i < lines.length; i++) {
            const lineY = this.textY - ((lines.length - 1) * this.fontSize * this.lineHeight / 2) + (i * this.fontSize * this.lineHeight);
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                // Skip animation for spaces but include them
                const isSpace = char === ' ';
                const lineWidth = textWidth(lines[i]);
                const lineX = this.textX - lineWidth / 2;
                const charWidth = textWidth(char);
                let substringWidth = 0;
                
                // Calculate the width of the substring up to the current character
                if (j > 0) {
                    substringWidth = textWidth(lines[i].substring(0, j));
                }
                
                const charX = lineX + substringWidth + charWidth / 2;
                
                if (!isSpace) {
                    // Make fade-in more sequential - just use index directly for clearer sequence
                    const sequentialDelay = charIndex * this.staggerDelay;
                    
                    newCharacters.push({
                        char: char,
                        x: charX,
                        y: lineY,
                        opacity: 0, // Start fully transparent
                        animationStart: millis() + sequentialDelay,
                        fadeIn: true,
                        fadeOut: false,
                        isSpace: false,
                        hasEmittedParticles: false,
                        particleEmissionThreshold: 0.7
                    });
                    
                    charIndex++;
                } else {
                    // Add space as non-animated
                    newCharacters.push({
                        char: char,
                        x: charX,
                        y: lineY,
                        opacity: 0,
                        isSpace: true
                    });
                }
            }
        }
        
        pop(); // Restore the drawing state
        
        // Update characters array with new characters
        this.characters = newCharacters;
        this.nextAffirmation = '';
        
        console.log("Created", newCharacters.length, "characters");
    }
    
    // Check if all characters have completed their fade out
    isFadeOutComplete() {
        // Check if there are any non-space characters still in fadeOut state
        const visibleChars = this.characters.filter(c => !c.isSpace);
        
        // If no characters are still fading out and all opacities are 0, transition is complete
        return !visibleChars.some(c => c.fadeOut || c.opacity > 0);
    }
    
    // Check if all characters have completed their fade in
    isFadeInComplete() {
        // Check if there are any non-space characters still in fadeIn state
        const visibleChars = this.characters.filter(c => !c.isSpace);
        
        // If no characters are still fading in and all opacities are 255, transition is complete
        return !visibleChars.some(c => c.fadeIn) && visibleChars.every(c => c.opacity >= 254);
    }
    
    // Handle window resize
    handleResize() {
        this.textX = width / 2;
        this.textY = height / 2;
        this.maxWidth = width * 0.8;
        
        // Recalculate positions of characters
        if (this.characters.length > 0) {
            // Store current opacity and animation states
            const opacityMap = new Map();
            const fadeInMap = new Map();
            const fadeOutMap = new Map();
            const animationStartMap = new Map();
            
            for (let i = 0; i < this.characters.length; i++) {
                opacityMap.set(i, this.characters[i].opacity);
                fadeInMap.set(i, this.characters[i].fadeIn);
                fadeOutMap.set(i, this.characters[i].fadeOut);
                animationStartMap.set(i, this.characters[i].animationStart);
            }
            
            // Reinitialize with the current affirmation to update positions
            this.initializeTextSize();
            
            // Create new character array with updated positions
            const lines = this.breakTextIntoLines(this.currentAffirmation);
            const newCharacters = [];
            let index = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const lineY = this.textY - ((lines.length - 1) * this.fontSize * this.lineHeight / 2) + (i * this.fontSize * this.lineHeight);
                
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    const lineX = this.textX - textWidth(lines[i]) / 2;
                    const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(char) / 2;
                    
                    if (index < this.characters.length) {
                        newCharacters.push({
                            char: char,
                            x: charX,
                            y: lineY,
                            opacity: opacityMap.get(index) || 0,
                            animationStart: animationStartMap.get(index) || 0,
                            fadeIn: fadeInMap.get(index) || false,
                            fadeOut: fadeOutMap.get(index) || false,
                            isSpace: char === ' '
                        });
                        
                        index++;
                    }
                }
            }
            
            this.characters = newCharacters;
        }
    }
    
    // Easing function for smooth animations
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    
    // Emit particles from the cursor position
    emitParticlesFromCursor(x, y, count = 5, color = null) {
        // If there's no particle system yet, create one
        if (!this.particleSystem) {
            this.particleSystem = new ParticleSystem();
        }
        
        // Use theme color if no color is provided and a theme is set
        if (!color && this.currentTheme && this.currentTheme.particleColors) {
            color = this.getThemeParticleColor();
        } else if (!color) {
            // Default white if no theme or color provided
            color = [255, 255, 255];
        }
        
        // Emit cursor particles with the specified color
        // Set isCursorParticle to true for special cursor particle behavior
        this.particleSystem.emit(x, y, count, color, true);
    }
    
    // Placeholder methods for future API implementation
    async fetchAffirmation() {
        try {
            // Use the configured API URL
            const response = await fetch(`${this.API_URL}/api/affirmation`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch affirmation');
            }
            
            const data = await response.json();
            return data.affirmation;
        } catch (error) {
            console.error('Error fetching affirmation:', error);
            // Fallback to a static affirmation
            return "Peace begins not with the world around you, but with the world within you.";
        }
    }
    
    async fetchRelatedAffirmation(currentAffirmation) {
        try {
            // Use the configured API URL
            const response = await fetch(`${this.API_URL}/api/related-affirmation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ previousAffirmation: currentAffirmation })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch related affirmation');
            }
            
            const data = await response.json();
            return data.affirmation;
        } catch (error) {
            console.error('Error fetching related affirmation:', error);
            // Fallback to a static affirmation
            return "From the ashes of what was, you have risen; your thoughts shape your future.";
        }
    }
    
    // Call this method to enable API usage with the deployed worker URL
    enableAPI(apiUrl) {
        this.API_URL = apiUrl;
        this.API_ENABLED = true;
        console.log('API enabled with URL:', apiUrl);
    }
    
    // Load the initial affirmation with emotion context
    async loadInitialAffirmationWithEmotion(emotion) {
        try {
            this.selectedEmotion = emotion;
            
            if (this.API_ENABLED) {
                // Use the API to get an emotion-based affirmation
                this.currentAffirmation = await this.fetchEmotionAffirmation(emotion);
            } else {
                // Get a hardcoded affirmation appropriate for the emotion
                this.currentAffirmation = this.getHardcodedEmotionAffirmation(emotion);
            }
            
            // Setup is complete
            this.isReady = true;
            this.initializeTextSize();
            
            return this.currentAffirmation;
        } catch (error) {
            console.error('Error loading initial affirmation with emotion:', error);
            // Use a fallback
            this.currentAffirmation = "You are capable of amazing things.";
            this.isReady = true;
            this.initializeTextSize();
            
            return this.currentAffirmation;
        }
    }
    
    // Request the next affirmation with choice context
    async requestNextAffirmationWithChoice(choice) {
        try {
            this.lastChoice = choice;
            
            if (this.API_ENABLED) {
                // Use the API to get a choice-based affirmation
                this.nextAffirmation = await this.fetchChoiceAffirmation(this.currentAffirmation, choice);
            } else {
                // Get a hardcoded affirmation for the choice
                this.nextAffirmation = this.getHardcodedChoiceAffirmation(choice);
            }
            
            console.log("Selected next affirmation with choice:", this.nextAffirmation);
            
            return this.nextAffirmation;
        } catch (error) {
            console.error('Error requesting next affirmation with choice:', error);
            // Use a fallback
            this.nextAffirmation = "Every moment is a fresh beginning.";
            console.log("Using fallback affirmation:", this.nextAffirmation);
            return this.nextAffirmation;
        }
    }
    
    // Get a hardcoded affirmation appropriate for the specified emotion
    getHardcodedEmotionAffirmation(emotion) {
        const emotionAffirmations = {
            anxious: [
                "Not all who wander in the mind are lost; your anxiety is temporary.",
                "Between what you fear and what truly is, there often remains a vast distance.",
                "Like shadows that flee at dawn, anxious thoughts flee when faced with your light.",
                "In your darkest thoughts, you may find a ring of truth, but its power over you is yours to command."
            ],
            hopeful: [
                "Even the smallest hope can change the course of the future.",
                "Like a tree with roots deep and strong, hope grows in your heart through winter's harshest days.",
                "The road that winds ahead may seem long, but you must walk it with hope.",
                "Hope is the eagle that soars above the mountain of your present circumstances."
            ],
            tired: [
                "Rest is essential, for a warrior's strength is renewed through stillness, not constant battle.",
                "Even the mightiest river begins as a stream that knows when to rest in still pools.",
                "Your weariness is but the echo of battles fought well; honor it as you would honor a faithful companion.",
                "The garden of your energy requires seasons of rest to bloom most beautifully."
            ],
            sad: [
                "You must walk through the valley of sorrow to climb the mountain of joy that awaits.",
                "Your tears are rivers carving canyons of wisdom in the landscape of your soul.",
                "You may grieve, you should grieve, but do not become consumed by grief.",
                "Joy and sorrow are inseparable; together they come, and when one sits alone with you, remember that the other is asleep upon your bed."
            ],
            calm: [
                "In the quiet spaces between thoughts, you will find the greatest power.",
                "Like the eye of a storm, your calm center remains unmoved while winds of chaos howl.",
                "Your tranquility is not the absence of darkness, but the presence of inner light, ever burning.",
                "The stillness you feel now is but the echo of ancient mountains within your spirit."
            ],
            overwhelmed: [
                "You need only see one step at a time; you will break down the mountain.",
                "Even the greatest of journeys begins with but a single forward glance.",
                "Focus on what you can control, accept what you cannot - this is the wisdom of ages.",
                "When the task seems too great, remember that you are greater still, forged in trials of old."
            ]
        };
        
        // Get affirmations for the selected emotion, or use default if not found
        const affirmations = emotionAffirmations[emotion] || [
            "You have been tested and you have proven yourself; you must recognize your strength.",
            "The road goes ever on, but within you lies the courage for each new turning.",
            "Your thoughts shape the world you perceive; change your thoughts and the world transforms with them.",
            "You are not merely the drop in the ocean, but the ocean in a drop."
        ];
        
        // Select a random affirmation from the array
        return affirmations[Math.floor(Math.random() * affirmations.length)];
    }
    
    // Get a hardcoded affirmation for the choice
    getHardcodedChoiceAffirmation(choice) {
        const choiceAffirmations = {
            // Strength-focused choices
            strength: [
                "Like mithril forged in the depths, your strength grows more precious with each test.",
                "You are strong when you acknowledge your weakness.",
                "Your power lies not in never falling, but in rising each time you fall with newfound wisdom.",
                "The oak that bends in the storm outlives the rigid pine; flexibility is your greatest asset in strength."
            ],
            inner_strength: [
                "Deep in the silent forest of your heart, ancient strength awaits its awakening.",
                "Do not judge yourself by your size. In spirit, you are boundless.",
                "When the night is darkest, your inner light burns most brightly - this is the paradox of courage.",
                "Your thoughts are the seeds from which your strength grows; tend them with care."
            ],
            overcome_challenges: [
                "Not the absence of obstacles, but the presence of determination defines your path.",
                "Nothing is impossible when persistence becomes your weapon.",
                "The greatest adventure is not conquering mountains, but conquering the fears that would keep you from climbing.",
                "Your challenges are not punishment, but opportunities dressed in work clothes."
            ],
            
            // Gratitude-focused choices
            gratitude: [
                "The eyes that see beauty everywhere belong to souls that cultivate gratitude within.",
                "Gratitude transforms what we have into enough.",
                "In giving thanks for the rain, we find joy even in storms.",
                "What you focus on expands; when gratitude fills your vision, abundance appears."
            ],
            appreciate_present: [
                "All we have to decide is what to do with the time that is given us.",
                "Only the present exists. Yesterday and tomorrow are illusions.",
                "The secret of life is to be fully present in the unfolding moment, neither clinging to the past nor grasping for the future.",
                "Your mind creates stories about what this moment lacks; challenge these stories, and you will find peace."
            ],
            find_joy: [
                "Even in the shadow of Mordor, a flower may bloom if one has eyes to see.",
                "You must find joy, not because it is easy, but because it is necessary.",
                "Joy is not the absence of suffering, but the presence of meaning that transcends it.",
                "When you identify the thoughts that dim your joy, you gain power over them."
            ],
            
            // Peace-focused choices
            inner_peace: [
                "The noise of the world grows quiet when you enter the peace of your inner sanctuary.",
                "Peace is a choice. You can make it at each moment.",
                "Like the depths of the sea that remain undisturbed by surface storms, your inner peace waits below your thoughts.",
                "Identify what disturbs your tranquility, and choice returns to you."
            ],
            mindful_presence: [
                "In the space between breaths, the whole of creation dwells.",
                "Your mind wandering is natural. Notice it and return to now; this is the way.",
                "Be fully where you are, for that is the only place where life can truly be met.",
                "Each moment observed with full attention becomes a doorway to eternity."
            ],
            
            // Growth-focused choices
            personal_growth: [
                "Not all those who wander are lost; sometimes, wandering is the path to finding oneself.",
                "Either grow or do not grow. There is no try.",
                "Your becoming is a journey without end, each step revealing new horizons within.",
                "The beliefs that limit your growth are but shadows; shine light upon them and watch them fade."
            ],
            embrace_change: [
                "Even the smallest person can change the course of the future.",
                "Fear of change is the path to stagnation. You must embrace it.",
                "The wind of change polishes the stone of your character until it shines with its true nature.",
                "When you resist what is happening, you create suffering; accept change as your ally, not your enemy."
            ]
        };
        
        // Get affirmations for the selected choice, or use default if not found
        const affirmations = choiceAffirmations[choice] || [
            "Many paths lie before you; you must trust in yourself to choose wisely.",
            "You are the author of your tale; with each choice, a new chapter begins.",
            "The thought 'I cannot' is rarely the truth, but merely a belief waiting to be challenged.",
            "Your life is not a burden to be endured, but a mystery to be lived."
        ];
        
        // Select a random affirmation from the array
        return affirmations[Math.floor(Math.random() * affirmations.length)];
    }
    
    // API methods to fetch emotion-based and choice-based affirmations
    async fetchEmotionAffirmation(emotion) {
        try {
            // Use the configured API URL
            const response = await fetch(`${this.API_URL}/api/emotion-affirmation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emotion })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch emotion-based affirmation');
            }
            
            const data = await response.json();
            return data.affirmation;
        } catch (error) {
            console.error('Error fetching emotion-based affirmation:', error);
            // Fallback to a hardcoded emotion-based affirmation
            return this.getHardcodedEmotionAffirmation(emotion);
        }
    }
    
    async fetchChoiceAffirmation(currentAffirmation, choice) {
        try {
            // Use the configured API URL
            const response = await fetch(`${this.API_URL}/api/choice-affirmation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    previousAffirmation: currentAffirmation,
                    choice: choice
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch choice affirmation');
            }
            
            const data = await response.json();
            return data.affirmation;
        } catch (error) {
            console.error('Error fetching choice affirmation:', error);
            // Fallback to a static affirmation based on the choice
            return this.getHardcodedChoiceAffirmation(choice);
        }
    }
    
    // Fetch interactive elements (question and choice buttons) from the API
    async fetchInteractiveElements() {
        try {
            if (!this.API_ENABLED) {
                // Return default interactive elements if API is not enabled
                return {
                    question: "Which path would you like to explore next?",
                    optionA: "Inner strength",
                    optionAId: "strength",
                    optionB: "Self-compassion",
                    optionBId: "compassion"
                };
            }
            
            // Construct user path data
            const userPath = {
                initialEmotion: this.selectedEmotion,
                choices: this.choiceHistory || []
            };
            
            // Use the configured API URL
            const response = await fetch(`${this.API_URL}/api/interactive-elements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    previousAffirmation: this.currentAffirmation,
                    userPath: userPath
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch interactive elements');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching interactive elements:', error);
            // Fallback to default interactive elements
            return {
                question: "Which path would you like to explore next?",
                optionA: "Inner strength",
                optionAId: "strength",
                optionB: "Self-compassion",
                optionBId: "compassion"
            };
        }
    }
    
    // Track the user's choice history
    addChoiceToHistory(choice) {
        if (!this.choiceHistory) {
            this.choiceHistory = [];
        }
        this.choiceHistory.push(choice);
    }
} 