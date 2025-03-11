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
    emitParticlesFromCursor(x, y, count = 5, color = [255, 255, 255]) {
        // If there's no particle system yet, create one
        if (!this.particleSystem) {
            this.particleSystem = new ParticleSystem();
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
            return "Peace begins with the compassion you show yourself.";
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
            return "You carry within you the power to begin again, no matter what came before.";
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
                "Your anxiety does not define you; it's just weather passing through your mind.",
                "In this moment, you are safe and doing the best you can.",
                "Each breath you take is an anchor to the present, away from anxious thoughts."
            ],
            hopeful: [
                "The light of possibility shines brightly when you keep hope in your heart.",
                "Your optimism is planting seeds for beautiful tomorrows.",
                "Hope lives within you, illuminating paths that fear tries to darken."
            ],
            tired: [
                "Rest is not a luxury but essential nourishment for your extraordinary spirit.",
                "Your worth is not measured by your productivity but by your presence.",
                "Even in fatigue, your strength remains; it's just resting, not gone."
            ],
            sad: [
                "Your sadness is evidence of your capacity to deeply feel and care.",
                "This heaviness will lift; your heart knows the way back to lightness.",
                "Your tears water the garden of compassion within you."
            ],
            calm: [
                "The tranquility you feel is your natural state, always waiting beneath the noise.",
                "Your peaceful center remains unchanged despite the world's chaos.",
                "The serenity within you is a gift you can return to anytime."
            ],
            overwhelmed: [
                "You need only focus on the next small step, not the entire mountain.",
                "Breaking down what overwhelms you transforms mountains into manageable hills.",
                "Your capacity to navigate complexity is greater than you realize."
            ]
        };
        
        // Get affirmations for the selected emotion, or use default if not found
        const affirmations = emotionAffirmations[emotion] || [
            "Your resilience through challenges reveals the depth of your strength.",
            "Every experience is shaping you into the person you're meant to become.",
            "The power to create positive change exists within you right now."
        ];
        
        // Select a random affirmation from the array
        return affirmations[Math.floor(Math.random() * affirmations.length)];
    }
    
    // Get a hardcoded affirmation for the choice
    getHardcodedChoiceAffirmation(choice) {
        const choiceAffirmations = {
            // Strength-focused choices
            strength: [
                "The reservoir of strength within you is deeper than any challenge you face.",
                "Your resilience has been forged through every difficulty you've already overcome.",
                "You possess the power to transform obstacles into stepping stones."
            ],
            inner_strength: [
                "The quiet voice of courage within you speaks louder than any doubt.",
                "Your inner strength grows each time you choose to persevere.",
                "The wisdom of your heart guides you through uncertainty with grace."
            ],
            overcome_challenges: [
                "Each challenge you face is an invitation to discover new capabilities.",
                "You have weathered storms before and emerged stronger on the other side.",
                "Your ability to adapt and overcome reveals your extraordinary nature."
            ],
            
            // Gratitude-focused choices
            gratitude: [
                "Your appreciation for life's gifts multiplies their presence in your experience.",
                "Gratitude opens your eyes to abundance that was always there.",
                "The more you acknowledge life's blessings, the more they expand."
            ],
            appreciate_present: [
                "This moment contains everything you need for peace and fulfillment.",
                "Your presence in the now unlocks life's richest treasures.",
                "The beauty of this moment unfolds when you give it your full attention."
            ],
            find_joy: [
                "Your capacity for joy remains undiminished, waiting for your recognition.",
                "Small moments of delight build a life of extraordinary happiness.",
                "Your heart knows how to find light even in shadowed places."
            ],
            
            // Peace-focused choices
            inner_peace: [
                "The sanctuary of peace within you remains untouched by external chaos.",
                "Your tranquil center is always accessible, just a few breaths away.",
                "Peace flows naturally when you release what you cannot control."
            ],
            mindful_presence: [
                "Your full attention to this moment is the gateway to deeper awareness.",
                "Mindfulness reveals the extraordinary beauty hidden in ordinary moments.",
                "Your conscious presence transforms routine actions into sacred ritual."
            ],
            
            // Growth-focused choices
            personal_growth: [
                "Every step in your evolution reveals new horizons of possibility.",
                "Your commitment to growth guarantees that your future exceeds your past.",
                "The path of self-discovery leads to treasures beyond imagination."
            ],
            embrace_change: [
                "Your willingness to evolve makes you as limitless as the universe itself.",
                "Embracing change activates the creative force within you.",
                "Your adaptability is transforming challenges into opportunities for renewal."
            ]
        };
        
        // Get affirmations for the selected choice, or use default if not found
        const affirmations = choiceAffirmations[choice] || [
            "Your journey continues to unfold with purpose and meaning.",
            "Each choice you make shapes the beautiful tapestry of your life.",
            "The next chapter of your story contains wonderful possibilities."
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