class AffirmationManager {
    constructor() {
        this.currentAffirmation = '';
        this.nextAffirmation = '';
        this.fontSize = 32;
        this.isReady = false;
        this.characters = []; // Will store all character objects
        
        // Configuration
        this.lineHeight = 1.5;
        this.maxWidth = width * 0.8;
        this.textX = width / 2;
        this.textY = height / 2;
        
        // Animation timing (in milliseconds)
        this.fadeInDuration = 2000; 
        this.fadeOutDuration = 1500;
        this.staggerDelay = 70; // Delay between each character's animation
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
        const lines = this.breakTextIntoLines(text);
        let maxLineWidth = 0;
        
        for (const line of lines) {
            const lineWidth = textWidth(line);
            if (lineWidth > maxLineWidth) {
                maxLineWidth = lineWidth;
            }
        }
        
        return maxLineWidth;
    }
    
    // Break text into lines based on max width
    breakTextIntoLines(text) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            
            if (textWidth(testLine) <= this.maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        
        lines.push(currentLine);
        return lines;
    }
    
    // Create initial characters with fade-in animation
    initializeCharacters() {
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
                
                // Skip spaces (we don't animate them)
                if (char !== ' ') {
                    const lineX = this.textX - textWidth(lines[i]) / 2;
                    const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(char) / 2;
                    
                    // Add randomness to the animation order (0-1 normalized)
                    const randomDelay = random(0, 0.3);
                    const normalizedIndex = charIndex / totalChars;
                    
                    this.characters.push({
                        char: char,
                        x: charX,
                        y: lineY,
                        opacity: 0, // Start fully transparent
                        animationStart: millis() + (normalizedIndex + randomDelay) * this.staggerDelay,
                        fadeIn: true,
                        fadeOut: false,
                        isSpace: false
                    });
                    
                    charIndex++;
                } else {
                    // Add spaces as non-animated placeholders
                    const lineX = this.textX - textWidth(lines[i]) / 2;
                    const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(char) / 2;
                    
                    this.characters.push({
                        char: char,
                        x: charX,
                        y: lineY,
                        opacity: 0,
                        isSpace: true
                    });
                }
            }
        }
    }
    
    // Display and update all characters
    updateAndDisplayCharacters() {
        const currentTime = millis();
        
        push();
        textAlign(CENTER, CENTER);
        textSize(this.fontSize);
        
        for (const character of this.characters) {
            // Skip animation for spaces
            if (character.isSpace) {
                continue;
            }
            
            // Calculate fade progress
            if (character.fadeIn && currentTime >= character.animationStart) {
                const elapsed = currentTime - character.animationStart;
                const progress = constrain(elapsed / this.fadeInDuration, 0, 1);
                
                // Apply easing for smoother animation
                character.opacity = 255 * this.easeInOutCubic(progress);
                
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
                
                // Complete fade out
                if (progress >= 1) {
                    character.fadeOut = false;
                    character.opacity = 0;
                }
            }
            
            // Draw the character
            fill(255, character.opacity);
            text(character.char, character.x, character.y);
        }
        
        pop();
    }
    
    // Prepare for transition to new affirmation
    prepareForTransition() {
        // Set all current characters to fade out with staggered timing
        const totalChars = this.characters.filter(c => !c.isSpace).length;
        let charIndex = 0;
        
        for (let i = 0; i < this.characters.length; i++) {
            if (!this.characters[i].isSpace) {
                // Add randomness to animation order
                const randomDelay = random(0, 0.3);
                const normalizedIndex = charIndex / totalChars;
                
                this.characters[i].fadeOut = true;
                this.characters[i].animationStart = millis() + (normalizedIndex + randomDelay) * this.staggerDelay;
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
        
        // Calculate text size for new text
        textSize(this.fontSize);
        const textWidth = this.calculateTextWidth(this.nextAffirmation);
        if (textWidth > this.maxWidth) {
            this.fontSize = floor(this.fontSize * (this.maxWidth / textWidth));
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
                const lineX = this.textX - textWidth(lines[i]) / 2;
                const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(char) / 2;
                
                if (!isSpace) {
                    // Add randomness to animation order
                    const randomDelay = random(0, 0.3);
                    const normalizedIndex = charIndex / totalChars;
                    
                    newCharacters.push({
                        char: char,
                        x: charX,
                        y: lineY,
                        opacity: 0, // Start fully transparent
                        animationStart: millis() + (normalizedIndex + randomDelay) * this.staggerDelay * 1.5, // Delay new chars a bit more
                        fadeIn: true,
                        fadeOut: false,
                        isSpace: false
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
    
    // Placeholder methods for future API implementation
    async fetchAffirmation() {
        return "Peace begins with the compassion you show yourself.";
    }
    
    async fetchRelatedAffirmation(currentAffirmation) {
        return "You carry within you the power to begin again, no matter what came before.";
    }
} 