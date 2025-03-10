/**
 * Interactive UI Components for Affirm
 * Handles emotion selection and binary choice interfaces
 */

class InteractiveUI {
    constructor() {
        // Configuration
        this.emotions = [
            { id: 'anxious', label: 'Anxious' },
            { id: 'hopeful', label: 'Hopeful' },
            { id: 'tired', label: 'Tired' },
            { id: 'sad', label: 'Sad' },
            { id: 'calm', label: 'Calm' },
            { id: 'overwhelmed', label: 'Overwhelmed' }
        ];
        
        // UI Elements
        this.container = null;
        this.emotionCallback = null;
        this.choiceCallback = null;
        
        // State
        this.selectedEmotion = null;
        this.choiceHistory = [];
        this.affirmationCount = 0;
        this.CHOICE_INTERVAL = 3; // Show choices every 3 affirmations
    }
    
    /**
     * Initialize the UI components
     */
    initialize() {
        // Create container for UI elements
        this.container = document.createElement('div');
        this.container.className = 'interactive-container';
        document.querySelector('.container').appendChild(this.container);
        
        // Add styles
        this.addStyles();
    }
    
    /**
     * Add required CSS styles for the UI
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .interactive-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                z-index: 10;
                opacity: 0;
                transition: opacity 0.5s ease;
                pointer-events: none;
            }
            
            .interactive-container.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            .question {
                font-family: 'Playfair Display', serif;
                font-size: 2.5rem;
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .button-container {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 1rem;
                max-width: 80%;
            }
            
            @media (max-width: 768px) {
                .button-container {
                    flex-direction: column;
                }
                
                .question {
                    font-size: 1.8rem;
                    padding: 0 1rem;
                }
            }
            
            .interactive-button {
                background: transparent;
                border: 2px solid rgba(255, 255, 255, 0.8);
                color: white;
                padding: 0.8rem 1.5rem;
                font-family: 'Playfair Display', serif;
                font-size: 1.2rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 150px;
                text-align: center;
            }
            
            .interactive-button:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
            }
            
            .interactive-button:active {
                transform: translateY(0);
            }
            
            .progress-indicator {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 8px;
            }
            
            .progress-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transition: background 0.3s ease;
            }
            
            .progress-dot.active {
                background: rgba(255, 255, 255, 0.8);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Show the emotion selection UI
     * @param {Function} callback - Function to call with selected emotion
     */
    showEmotionSelection(callback) {
        this.emotionCallback = callback;
        this.container.innerHTML = '';
        this.container.classList.add('active');
        
        // Create question
        const question = document.createElement('div');
        question.className = 'question';
        question.textContent = 'How are you feeling right now?';
        this.container.appendChild(question);
        
        // Create buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        this.container.appendChild(buttonContainer);
        
        // Create emotion buttons
        this.emotions.forEach(emotion => {
            const button = document.createElement('button');
            button.className = 'interactive-button';
            button.textContent = emotion.label;
            button.addEventListener('click', () => this.onEmotionSelected(emotion.id));
            buttonContainer.appendChild(button);
        });
    }
    
    /**
     * Handle emotion selection
     * @param {string} emotionId - Selected emotion ID
     */
    onEmotionSelected(emotionId) {
        this.selectedEmotion = emotionId;
        this.hideUI();
        
        if (this.emotionCallback) {
            this.emotionCallback(emotionId);
        }
    }
    
    /**
     * Show binary choice UI
     * @param {Array} choices - Array of choice objects with id and label
     * @param {Function} callback - Function to call with selected choice
     */
    showChoiceSelection(choices, callback) {
        this.choiceCallback = callback;
        this.container.innerHTML = '';
        this.container.classList.add('active');
        
        // Create question
        const question = document.createElement('div');
        question.className = 'question';
        question.textContent = 'Which path would you like to explore next?';
        this.container.appendChild(question);
        
        // Create buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        this.container.appendChild(buttonContainer);
        
        // Create choice buttons
        choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'interactive-button';
            button.textContent = choice.label;
            button.addEventListener('click', () => this.onChoiceSelected(choice.id));
            buttonContainer.appendChild(button);
        });
    }
    
    /**
     * Handle choice selection
     * @param {string} choiceId - Selected choice ID
     */
    onChoiceSelected(choiceId) {
        this.choiceHistory.push(choiceId);
        this.hideUI();
        
        if (this.choiceCallback) {
            this.choiceCallback(choiceId);
        }
    }
    
    /**
     * Hide the UI
     */
    hideUI() {
        this.container.classList.remove('active');
    }
    
    /**
     * Increment affirmation counter and check if it's time to show choices
     * @returns {boolean} True if it's time to show choices
     */
    incrementAffirmationCount() {
        this.affirmationCount++;
        return this.affirmationCount % this.CHOICE_INTERVAL === 0;
    }
    
    /**
     * Show progress indicators for next choice
     * @param {number} current - Current affirmation count in the cycle
     */
    updateProgressIndicator(current) {
        const indicatorContainer = document.querySelector('.progress-indicator');
        
        // Create if it doesn't exist
        if (!indicatorContainer) {
            const container = document.createElement('div');
            container.className = 'progress-indicator';
            
            for (let i = 0; i < this.CHOICE_INTERVAL; i++) {
                const dot = document.createElement('div');
                dot.className = 'progress-dot';
                if (i < current) {
                    dot.classList.add('active');
                }
                container.appendChild(dot);
            }
            
            document.querySelector('.container').appendChild(container);
        } else {
            // Update existing
            const dots = indicatorContainer.querySelectorAll('.progress-dot');
            dots.forEach((dot, index) => {
                if (index < current) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }
    
    /**
     * Hide progress indicator
     */
    hideProgressIndicator() {
        const indicator = document.querySelector('.progress-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
        }
    }
    
    /**
     * Show progress indicator
     */
    showProgressIndicator() {
        const indicator = document.querySelector('.progress-indicator');
        if (indicator) {
            indicator.style.opacity = '1';
        }
    }
    
    /**
     * Reset affirmation counter after showing choices
     */
    resetAffirmationCount() {
        this.affirmationCount = 0;
    }
    
    /**
     * Get the currently selected emotion
     * @returns {string} Selected emotion ID
     */
    getSelectedEmotion() {
        return this.selectedEmotion;
    }
    
    /**
     * Get the last selected choice
     * @returns {string} Last selected choice ID
     */
    getLastChoice() {
        if (this.choiceHistory.length > 0) {
            return this.choiceHistory[this.choiceHistory.length - 1];
        }
        return null;
    }
    
    /**
     * Generate choice options based on current affirmation
     * @param {string} currentAffirmation - The current affirmation text
     * @returns {Array} Array of choice objects with id and label
     */
    generateChoiceOptions(currentAffirmation) {
        // Default choices if we can't determine better ones
        const defaultChoices = [
            { id: 'strength', label: 'Focus on strength' },
            { id: 'gratitude', label: 'Explore gratitude' }
        ];
        
        // If we have a current affirmation, try to generate more relevant choices
        if (currentAffirmation) {
            // Extract key themes from the affirmation
            const strengthThemes = ['strength', 'power', 'capable', 'resilient', 'overcome'];
            const gratitudeThemes = ['gratitude', 'thankful', 'appreciate', 'blessed', 'gift'];
            const calmThemes = ['peace', 'calm', 'serenity', 'stillness', 'tranquil'];
            const growthThemes = ['growth', 'journey', 'progress', 'develop', 'evolve'];
            
            // Check which themes are present in the affirmation
            let hasStrength = strengthThemes.some(theme => currentAffirmation.toLowerCase().includes(theme));
            let hasGratitude = gratitudeThemes.some(theme => currentAffirmation.toLowerCase().includes(theme));
            let hasCalm = calmThemes.some(theme => currentAffirmation.toLowerCase().includes(theme));
            let hasGrowth = growthThemes.some(theme => currentAffirmation.toLowerCase().includes(theme));
            
            // Generate relevant choices based on themes
            if (hasStrength) {
                return [
                    { id: 'inner_strength', label: 'Explore inner strength' },
                    { id: 'overcome_challenges', label: 'Overcome challenges' }
                ];
            } else if (hasGratitude) {
                return [
                    { id: 'appreciate_present', label: 'Appreciate the present' },
                    { id: 'find_joy', label: 'Find joy in small things' }
                ];
            } else if (hasCalm) {
                return [
                    { id: 'inner_peace', label: 'Cultivate inner peace' },
                    { id: 'mindful_presence', label: 'Practice mindfulness' }
                ];
            } else if (hasGrowth) {
                return [
                    { id: 'personal_growth', label: 'Focus on personal growth' },
                    { id: 'embrace_change', label: 'Embrace change' }
                ];
            }
        }
        
        // If no themes match or no affirmation provided, use default choices
        return defaultChoices;
    }
} 