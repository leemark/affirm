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
    }
    
    // Load the initial affirmation from the API
    async loadInitialAffirmation() {
        try {
            // For now, use a static placeholder until the API is implemented
            // this.currentAffirmation = await this.fetchAffirmation();
            
            // Array of initial affirmations to choose from
            const initialAffirmations = [
                "You are enough exactly as you are, embracing both your strengths and your beautiful imperfections.",
                "Within you resides a strength that has carried you through every challenge so far.",
                "Your presence in this world makes a difference, even in ways you cannot see.",
                "Today is a new canvas waiting for you to paint it with possibility."
            ];
            
            // Select a random initial affirmation
            this.currentAffirmation = initialAffirmations[Math.floor(Math.random() * initialAffirmations.length)];
            
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
        console.log("Creating new characters for: ", this.nextAffirmation);
        
        // If nextAffirmation is empty, something went wrong
        if (!this.nextAffirmation || this.nextAffirmation.trim() === '') {
            console.error("Error: Next affirmation is empty!");
            this.nextAffirmation = "Each small step forward is still movement in the right direction.";
        }
        
        // Make sure we're using p5.js functions within draw context
        push(); // Save the current drawing state
        
        // Calculate text size for new text
        textSize(this.fontSize);
        const calculatedTextWidth = this.calculateTextWidth(this.nextAffirmation);
        if (calculatedTextWidth > this.maxWidth) {
            this.fontSize = floor(this.fontSize * (this.maxWidth / calculatedTextWidth));
            textSize(this.fontSize);
        }
        
        // Create new characters
        const lines = this.breakTextIntoLines(this.nextAffirmation);
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
        this.currentAffirmation = this.nextAffirmation;
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
        return "Peace begins with the compassion you show yourself.";
    }
    
    async fetchRelatedAffirmation(currentAffirmation) {
        return "You carry within you the power to begin again, no matter what came before.";
    }
} 