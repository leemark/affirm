class AffirmationManager {
    constructor() {
        this.currentAffirmation = '';
        this.nextAffirmation = '';
        this.fontSize = 32;
        this.boids = [];
        this.isReady = false;
        this.particleSystem = new ParticleSystem();
        
        // Configuration
        this.lineHeight = 1.5;
        this.maxWidth = width * 0.8;
        this.textX = width / 2;
        this.textY = height / 2;
        
        // Mouse influence
        this.mouseInfluenceType = 'repel'; // 'attract' or 'repel'
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
        try {
            // For now, use static placeholders until the API is implemented
            // this.nextAffirmation = await this.fetchRelatedAffirmation(this.currentAffirmation);
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
            
            return this.nextAffirmation;
        } catch (error) {
            console.error('Error requesting next affirmation:', error);
            // Use a fallback
            this.nextAffirmation = "Every moment is a fresh beginning.";
            return this.nextAffirmation;
        }
    }
    
    // Calculate and set appropriate text size
    initializeTextSize() {
        textSize(this.fontSize);
        
        // Adjust text size to fit screen if needed
        const textWidth = this.calculateTextWidth(this.currentAffirmation);
        if (textWidth > this.maxWidth) {
            this.fontSize = this.fontSize * (this.maxWidth / textWidth);
            textSize(this.fontSize);
        }
    }
    
    // Calculate the width of multi-line text
    calculateTextWidth(text) {
        const words = text.split(' ');
        let longestLine = 0;
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + word + ' ';
            const testWidth = textWidth(testLine);
            
            if (testWidth > this.maxWidth) {
                longestLine = Math.max(longestLine, textWidth(currentLine));
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        
        return Math.max(longestLine, textWidth(currentLine));
    }
    
    // Break text into lines that fit within maxWidth
    breakTextIntoLines(text) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + word + ' ';
            const testWidth = textWidth(testLine);
            
            if (testWidth > this.maxWidth) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        
        lines.push(currentLine.trim());
        return lines;
    }
    
    // Get the position of a specific character in the text
    getCharacterPosition(charIndex, lines) {
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineY = this.textY - ((lines.length - 1) * this.fontSize * this.lineHeight / 2) + (i * this.fontSize * this.lineHeight);
            
            for (let j = 0; j < lines[i].length; j++) {
                if (charCount === charIndex) {
                    const lineX = this.textX - textWidth(lines[i]) / 2;
                    const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(lines[i][j]) / 2;
                    return {x: charX, y: lineY};
                }
                charCount++;
            }
        }
        
        // Default position if character not found
        return {x: this.textX, y: this.textY};
    }
    
    // Create initial boids in static formation for the text
    prepareInitialBoids() {
        // Clear existing boids
        this.boids = [];
        
        // Break text into lines
        const lines = this.breakTextIntoLines(this.currentAffirmation);
        
        // Create a boid for each character in the text
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineY = this.textY - ((lines.length - 1) * this.fontSize * this.lineHeight / 2) + (i * this.fontSize * this.lineHeight);
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                // Skip spaces
                if (char !== ' ') {
                    const lineX = this.textX - textWidth(lines[i]) / 2;
                    const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(lines[i][j]) / 2;
                    
                    // Create a boid for this character at the correct static position
                    const boid = new Boid(char, charX, lineY, charX, lineY);
                    
                    // Set the boid to be static (not moving)
                    boid.velocity = createVector(0, 0);
                    boid.isStatic = true;
                    
                    this.boids.push(boid);
                }
                charCount++;
            }
        }
    }
    
    // Display boids in static formation (as text)
    updateAndDisplayStaticBoids() {
        if (this.boids.length === 0) return;
        
        // Update and display each boid
        for (const boid of this.boids) {
            // No flocking behavior when static
            boid.isStatic = true; 
            boid.update();
            boid.display();
            
            // Occasionally emit particles from static boids for subtle effects
            if (random() < 0.001) {
                this.particleSystem.emit(boid.position.x, boid.position.y, 1);
            }
        }
        
        // Update and display particles
        this.particleSystem.update();
        this.particleSystem.display();
    }
    
    // Prepare for transition to flying formation
    prepareForFlying() {
        // Nothing needs to be done here now - boids are already created
        // Just keep track of original positions for potential transitions
        for (const boid of this.boids) {
            boid.originalX = boid.position.x;
            boid.originalY = boid.position.y;
            boid.isStatic = false;
        }
    }
    
    // Transition from static to flying boids
    transitionToFlying(progress) {
        if (this.boids.length === 0) return;
        
        // Update and display each boid
        for (let i = 0; i < this.boids.length; i++) {
            const boid = this.boids[i];
            
            // Gradually increase freedom as progress increases
            const startTime = i / this.boids.length; // Staggered start times
            const boidProgress = constrain((progress - startTime) * 3, 0, 1);
            
            if (boidProgress > 0) {
                // Allow boid to move more freely as transition progresses
                boid.isStatic = false;
                boid.velocity.mult(0.95 + boidProgress * 0.1);
                boid.maxSpeed = 1 + boidProgress * 3;
                
                // Add some randomness to break away from starting position
                if (boidProgress < 0.5) {
                    const randomForce = p5.Vector.random2D();
                    randomForce.mult(0.1 * boidProgress);
                    boid.applyForce(randomForce);
                }
                
                // Update and display the boid
                boid.update();
                boid.display();
                
                // Emit particles occasionally during transition
                if (random() < 0.05 * boidProgress) {
                    this.particleSystem.emit(boid.position.x, boid.position.y, 1);
                }
            } else {
                // Just display the boid at its starting position
                boid.display();
            }
        }
        
        // Update and display particles
        this.particleSystem.update();
        this.particleSystem.display();
    }
    
    // Update and display boids in flying mode
    updateAndDisplayFlyingBoids() {
        if (this.boids.length === 0) return;
        
        // Update and display each boid
        for (const boid of this.boids) {
            boid.flock(this.boids);
            boid.update();
            boid.display();
            
            // Occasionally emit particles from boids
            if (random() < 0.01) {
                this.particleSystem.emit(boid.position.x, boid.position.y, 1);
            }
        }
        
        // Update and display particles
        this.particleSystem.update();
        this.particleSystem.display();
    }
    
    // Prepare for transition to static formation
    prepareForStatic() {
        // Analyze current and next affirmations to determine which boids to keep
        const currentChars = this.currentAffirmation.replace(/\s/g, '').split('');
        const nextChars = this.nextAffirmation.replace(/\s/g, '').split('');
        
        // Calculate letter counts for current affirmation
        const currentLetterCounts = {};
        for (const char of currentChars) {
            currentLetterCounts[char] = (currentLetterCounts[char] || 0) + 1;
        }
        
        // Calculate letter counts for next affirmation
        const nextLetterCounts = {};
        for (const char of nextChars) {
            nextLetterCounts[char] = (nextLetterCounts[char] || 0) + 1;
        }
        
        // Determine which boids to keep and which to fade out
        for (const boid of this.boids) {
            const char = boid.character;
            
            // Determine if we need this character for the next affirmation
            const neededCount = nextLetterCounts[char] || 0;
            const availableCount = currentLetterCounts[char] || 0;
            
            if (neededCount > 0) {
                // We need this character for the next affirmation
                nextLetterCounts[char]--; // Decrease needed count
                boid.setTargetMode(true); // Put in target mode
            } else {
                // This character will fade out
                boid.setTargetMode(false);
                boid.isForRemoval = true;
            }
        }
        
        // Calculate new positions for the next affirmation text
        // Break text into lines
        const lines = this.breakTextIntoLines(this.nextAffirmation);
        
        // Create an array of character positions that will be assigned to boids
        const characterPositions = [];
        
        let charIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineY = this.textY - ((lines.length - 1) * this.fontSize * this.lineHeight / 2) + (i * this.fontSize * this.lineHeight);
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                // Skip spaces
                if (char !== ' ') {
                    const lineX = this.textX - textWidth(lines[i]) / 2;
                    const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(lines[i][j]) / 2;
                    
                    characterPositions.push({
                        char: char,
                        x: charX,
                        y: lineY,
                        index: charIndex
                    });
                }
                charIndex++;
            }
        }
        
        // Instead of completely random shuffling, we'll use a more strategic approach
        // Sort by distance from current center to reduce the chaotic appearance
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Apply a semi-random ordering that still maintains some structure
        characterPositions.sort((a, b) => {
            // Compute distances from center
            const distA = dist(a.x, a.y, centerX, centerY);
            const distB = dist(b.x, b.y, centerX, centerY);
            
            // 70% weight to distance (closer characters arrive first)
            // 30% weight to randomness (for some variation)
            return (distA * 0.7 + random(-10, 10) * 0.3) - (distB * 0.7 + random(-10, 10) * 0.3);
        });
        
        // Assign arrival order to boids
        for (let i = 0; i < characterPositions.length; i++) {
            const pos = characterPositions[i];
            
            // Find a boid for this character that isn't marked for removal
            const availableBoid = this.boids.find(b => b.character === pos.char && !b.isForRemoval && !b.hasTargetAssigned);
            
            if (availableBoid) {
                // Assign target position
                availableBoid.targetPosition.x = pos.x;
                availableBoid.targetPosition.y = pos.y;
                availableBoid.hasTargetAssigned = true;
                
                // Assign an arrival order (0 to 1) for staggered arrival
                // Use a narrower range to reduce the staggering effect
                availableBoid.arrivalOrder = i / characterPositions.length * 0.7;
            } else {
                // We need to create a new boid for this character
                const startX = random(width);
                const startY = random(height);
                const newBoid = new Boid(pos.char, startX, startY, pos.x, pos.y);
                newBoid.setAlpha(0); // Start invisible
                newBoid.isNew = true;
                newBoid.hasTargetAssigned = true;
                newBoid.setTargetMode(true);
                
                // Assign an arrival order (0 to 1) for staggered arrival
                // Use a narrower range to reduce the staggering effect
                newBoid.arrivalOrder = i / characterPositions.length * 0.7;
                
                this.boids.push(newBoid);
            }
        }
        
        // Update current affirmation to next
        this.currentAffirmation = this.nextAffirmation;
        this.nextAffirmation = '';
    }
    
    // Transition from flying to static formation
    transitionToStatic(progress) {
        // Calculate fadeIn/fadeOut based on progress
        const fadeOutValue = 255 * (1 - progress);
        const fadeInValue = 255 * progress;
        
        // We'll render characters as individual boids through the entire transition
        // This prevents the abrupt snap to the final text layout
        
        // Update and display all boids
        for (const boid of this.boids) {
            // Handle fading out of unused characters
            if (boid.isForRemoval) {
                boid.setAlpha(fadeOutValue);
                if (progress > 0.5) {
                    const randomForce = p5.Vector.random2D();
                    randomForce.mult(0.05);
                    boid.applyForce(randomForce);
                }
            } 
            // Handle fading in of new characters
            else if (boid.isNew) {
                boid.setAlpha(fadeInValue);
            }
            
            // Calculate individual boid transition progress based on arrivalOrder
            // This creates a staggered arrival effect
            // Reduce the stagger effect by lowering the multiplier from 0.5 to 0.3
            const boidProgress = constrain((progress - boid.arrivalOrder * 0.3) * 1.5, 0, 1);
            
            // Only move boids according to their individual progress
            if (boidProgress > 0 && !boid.isForRemoval) {
                // Adjust maxSpeed based on progress to slow down as they arrive
                boid.maxSpeed = 4 * (1 - boidProgress * 0.8);
                
                // Set isSettling flag when getting close to destination
                boid.isSettling = boidProgress > 0.7;
                
                // Calculate distance to target
                const distToTarget = dist(
                    boid.position.x, boid.position.y,
                    boid.targetPosition.x, boid.targetPosition.y
                );
                
                // If close to target and boid's individual progress is high enough, fully settle in place
                // Lower the distance threshold and the progress threshold to settle earlier
                if (distToTarget < 2 && boidProgress > 0.6) {
                    boid.position.x = boid.targetPosition.x;
                    boid.position.y = boid.targetPosition.y;
                    boid.velocity.mult(0);
                    boid.isStatic = true; // Set to static mode
                } else {
                    // Apply force toward target based on individual progress
                    const arriveForce = boid.arrive(boid.targetPosition);
                    // Increase the minimum force for faster initial movement
                    arriveForce.mult(0.5 + boidProgress * 0.7); // Stronger force as progress increases
                    boid.applyForce(arriveForce);
                }
            }
            
            // Update all boids
            boid.flock(this.boids);
            boid.update();
            boid.display();
            
            // Emit particles during transition
            if (random() < 0.02 * progress) {
                this.particleSystem.emit(boid.position.x, boid.position.y, 1);
            }
        }
        
        // Update and display particles
        this.particleSystem.update();
        this.particleSystem.display();
        
        // Clean up boids at the end of transition
        if (progress >= 0.95) {
            // Remove boids marked for removal
            this.boids = this.boids.filter(boid => !boid.isForRemoval);
            
            // Reset flags for next cycle
            for (const boid of this.boids) {
                boid.isNew = false;
                boid.hasTargetAssigned = false;
            }
        }
    }
    
    // Handle window resize
    handleResize() {
        this.textX = width / 2;
        this.textY = height / 2;
        
        // Recalculate font size if needed
        this.initializeTextSize();
        
        // Reposition boids if they're in static formation
        if (this.boids.length > 0) {
            // Break text into lines
            const lines = this.breakTextIntoLines(this.currentAffirmation);
            
            // Reposition each boid for the new screen size
            // This logic is similar to prepareInitialBoids
            let boidIndex = 0;
            let charCount = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const lineY = this.textY - ((lines.length - 1) * this.fontSize * this.lineHeight / 2) + (i * this.fontSize * this.lineHeight);
                
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    
                    // Skip spaces
                    if (char !== ' ') {
                        if (boidIndex < this.boids.length) {
                            const lineX = this.textX - textWidth(lines[i]) / 2;
                            const charX = lineX + textWidth(lines[i].substring(0, j)) + textWidth(lines[i][j]) / 2;
                            
                            // Update boid position and target
                            const boid = this.boids[boidIndex];
                            
                            // Only update if the boid is in static mode
                            if (boid.isStatic) {
                                boid.position.x = charX;
                                boid.position.y = lineY;
                                boid.targetPosition.x = charX;
                                boid.targetPosition.y = lineY;
                            }
                            
                            boidIndex++;
                        }
                    }
                    charCount++;
                }
            }
        }
    }
    
    // Handle mouse influence for boids
    handleMouseInfluence(mouseX, mouseY) {
        for (const boid of this.boids) {
            boid.applyMouseInfluence(mouseX, mouseY, this.mouseInfluenceType === 'attract');
        }
    }
    
    // Toggle between attract and repel mouse influence
    toggleMouseInfluence() {
        this.mouseInfluenceType = this.mouseInfluenceType === 'attract' ? 'repel' : 'attract';
        return this.mouseInfluenceType;
    }
    
    // Fetch an affirmation from the API
    async fetchAffirmation() {
        // To be implemented with Cloudflare Worker
        return "You are worthy of love and belong exactly where you are.";
    }
    
    // Fetch a related affirmation from the API based on the current one
    async fetchRelatedAffirmation(currentAffirmation) {
        // To be implemented with Cloudflare Worker and Gemini API
        return "Your journey is uniquely yours, and every step has meaning.";
    }
} 