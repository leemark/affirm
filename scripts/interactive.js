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
            { id: 'overwhelmed', label: 'Overwhelmed' },
            { id: 'content', label: 'Content' },
            { id: 'excited', label: 'Excited' },
            { id: 'grateful', label: 'Grateful' },
            { id: 'neutral', label: 'Neutral' },
            { id: 'curious', label: 'Curious' },
            { id: 'peaceful', label: 'Peaceful' }
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
        
        // Create journal storage if it doesn't exist
        this.initializeJournalStorage();
        
        // Create preferences button
        this.createPreferencesButton();
        
        // Create streak display
        this.createStreakDisplay();
        
        // Create favorites button
        this.createFavoritesButton();
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
                transition: opacity 0.3s ease, visibility 0.3s ease;
                pointer-events: none;
                visibility: hidden;
                background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent background to cover canvas */
            }
            
            .interactive-container.active {
                opacity: 1;
                pointer-events: auto;
                visibility: visible;
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
     * Initialize journal storage in localStorage
     */
    initializeJournalStorage() {
        if (!localStorage.getItem('affirm_journal')) {
            localStorage.setItem('affirm_journal', JSON.stringify([]));
        }
    }
    
    /**
     * Show journal prompt for an affirmation
     * @param {string} affirmation - The affirmation to reflect on
     */
    showJournalPrompt(affirmation) {
        // Create journal container
        const journalContainer = document.createElement('div');
        journalContainer.className = 'journal-container';
        journalContainer.id = 'journal-container';
        
        // Create prompt text
        const promptText = document.createElement('p');
        promptText.textContent = 'How did this affirmation make you feel?';
        
        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Write your thoughts here...';
        textarea.id = 'journal-textarea';
        
        // Create save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Reflection';
        saveButton.addEventListener('click', () => {
            this.saveJournalEntry(affirmation, textarea.value);
            this.hideJournalPrompt();
        });
        
        // Create skip button
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip';
        skipButton.className = 'secondary-button';
        skipButton.addEventListener('click', () => {
            this.hideJournalPrompt();
        });
        
        // Append all elements
        journalContainer.appendChild(promptText);
        journalContainer.appendChild(textarea);
        journalContainer.appendChild(saveButton);
        journalContainer.appendChild(skipButton);
        
        // Append to container
        document.querySelector('.container').appendChild(journalContainer);
        
        // Focus the textarea
        setTimeout(() => {
            textarea.focus();
        }, 300);
    }
    
    /**
     * Hide journal prompt
     */
    hideJournalPrompt() {
        const journalContainer = document.getElementById('journal-container');
        if (journalContainer) {
            journalContainer.style.opacity = '0';
            setTimeout(() => {
                journalContainer.remove();
            }, 500);
        }
    }
    
    /**
     * Save journal entry to localStorage
     * @param {string} affirmation - The affirmation that was reflected on
     * @param {string} reflection - The user's reflection
     */
    saveJournalEntry(affirmation, reflection) {
        // Don't save empty reflections
        if (!reflection.trim()) return;
        
        try {
            // Get current journal entries
            const journalEntries = JSON.parse(localStorage.getItem('affirm_journal') || '[]');
            
            // Add new entry
            journalEntries.push({
                id: Date.now(),
                affirmation: affirmation,
                reflection: reflection,
                date: new Date().toISOString(),
                emotion: affirmationManager.selectedEmotion || 'unknown'
            });
            
            // Save updated entries
            localStorage.setItem('affirm_journal', JSON.stringify(journalEntries));
            console.log('Saved journal entry');
            
            // Add to favorites as well
            affirmationManager.addFavoriteAffirmation(affirmation);
        } catch (error) {
            console.error('Error saving journal entry:', error);
        }
    }
    
    /**
     * Get all journal entries
     * @returns {Array} Array of journal entries
     */
    getJournalEntries() {
        try {
            return JSON.parse(localStorage.getItem('affirm_journal') || '[]');
        } catch (error) {
            console.error('Error getting journal entries:', error);
            return [];
        }
    }
    
    /**
     * Show journal entries panel
     */
    showJournalEntries() {
        // Create journal panel
        const journalPanel = document.createElement('div');
        journalPanel.className = 'favorites-panel'; // Reuse favorites panel styling
        journalPanel.id = 'journal-panel';
        
        // Create header
        const header = document.createElement('h2');
        header.textContent = 'Your Reflections';
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-preferences';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', () => {
            this.hideJournalEntries();
        });
        
        // Get journal entries
        const entries = this.getJournalEntries();
        
        // Create entries list
        const entriesList = document.createElement('div');
        entriesList.className = 'favorites-list'; // Reuse favorites list styling
        
        if (entries.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'You haven\'t saved any reflections yet.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.opacity = '0.7';
            entriesList.appendChild(emptyMessage);
        } else {
            // Sort entries by date (newest first)
            entries.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Add entries to list
            entries.forEach(entry => {
                const entryElement = document.createElement('div');
                entryElement.className = 'favorite-item';
                entryElement.dataset.id = entry.id;
                
                const affirmationElement = document.createElement('div');
                affirmationElement.className = 'favorite-text';
                affirmationElement.textContent = `"${entry.affirmation}"`;
                affirmationElement.style.fontStyle = 'italic';
                
                const reflectionElement = document.createElement('div');
                reflectionElement.className = 'favorite-text';
                reflectionElement.textContent = entry.reflection;
                reflectionElement.style.marginTop = '10px';
                reflectionElement.style.paddingLeft = '15px';
                reflectionElement.style.borderLeft = '2px solid rgba(255, 255, 255, 0.2)';
                
                const dateElement = document.createElement('div');
                dateElement.className = 'favorite-date';
                
                // Format date nicely
                const entryDate = new Date(entry.date);
                dateElement.textContent = entryDate.toLocaleDateString() + ' • ' + entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Create remove button
                const removeButton = document.createElement('button');
                removeButton.className = 'favorite-remove';
                removeButton.innerHTML = '×';
                removeButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeJournalEntry(entry.id);
                    entryElement.remove();
                    
                    // If no more entries, show empty message
                    if (entriesList.children.length === 0) {
                        const emptyMessage = document.createElement('p');
                        emptyMessage.textContent = 'You haven\'t saved any reflections yet.';
                        emptyMessage.style.textAlign = 'center';
                        emptyMessage.style.opacity = '0.7';
                        entriesList.appendChild(emptyMessage);
                    }
                });
                
                // Append elements
                entryElement.appendChild(affirmationElement);
                entryElement.appendChild(reflectionElement);
                entryElement.appendChild(dateElement);
                entryElement.appendChild(removeButton);
                entriesList.appendChild(entryElement);
            });
        }
        
        // Append elements
        journalPanel.appendChild(header);
        journalPanel.appendChild(closeButton);
        journalPanel.appendChild(entriesList);
        
        // Append to container
        document.querySelector('.container').appendChild(journalPanel);
        
        // Animate in
        setTimeout(() => {
            journalPanel.classList.add('active');
        }, 10);
    }
    
    /**
     * Hide journal entries panel
     */
    hideJournalEntries() {
        const journalPanel = document.getElementById('journal-panel');
        if (journalPanel) {
            journalPanel.classList.remove('active');
            setTimeout(() => {
                journalPanel.remove();
            }, 300);
        }
    }
    
    /**
     * Remove a journal entry
     * @param {number} id - ID of the entry to remove
     */
    removeJournalEntry(id) {
        try {
            // Get current entries
            const entries = this.getJournalEntries();
            
            // Filter out the entry to remove
            const updatedEntries = entries.filter(entry => entry.id !== id);
            
            // Save updated entries
            localStorage.setItem('affirm_journal', JSON.stringify(updatedEntries));
            console.log('Removed journal entry');
        } catch (error) {
            console.error('Error removing journal entry:', error);
        }
    }
    
    /**
     * Create preferences button
     */
    createPreferencesButton() {
        const preferencesButton = document.createElement('div');
        preferencesButton.className = 'preferences-button';
        preferencesButton.innerHTML = '⚙';
        preferencesButton.title = 'Preferences';
        preferencesButton.addEventListener('click', () => {
            this.showPreferencesPanel();
        });
        
        document.querySelector('.container').appendChild(preferencesButton);
    }
    
    /**
     * Show preferences panel
     */
    showPreferencesPanel() {
        // Create panel
        const panel = document.createElement('div');
        panel.className = 'preferences-panel';
        panel.id = 'preferences-panel';
        
        // Create header
        const header = document.createElement('h2');
        header.textContent = 'Preferences';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-preferences';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', () => {
            this.hidePreferencesPanel();
        });
        
        // Create theme section
        const themeSection = document.createElement('div');
        themeSection.className = 'preferences-section';
        
        const themeHeader = document.createElement('h3');
        themeHeader.textContent = 'Themes';
        
        const themeOptions = document.createElement('div');
        themeOptions.className = 'theme-options';
        
        // Theme options
        const themes = [
            { id: 'growth', label: 'Personal Growth' },
            { id: 'calm', label: 'Inner Peace' },
            { id: 'confidence', label: 'Self-Confidence' },
            { id: 'gratitude', label: 'Gratitude' },
            { id: 'wisdom', label: 'Wisdom' },
            { id: 'resilience', label: 'Resilience' }
        ];
        
        // Get current themes
        const currentThemes = affirmationManager.userPreferences.themes || [];
        
        // Create theme options
        themes.forEach(theme => {
            const option = document.createElement('div');
            option.className = 'theme-option';
            option.textContent = theme.label;
            
            // Check if theme is selected
            if (currentThemes.includes(theme.id)) {
                option.classList.add('selected');
            }
            
            // Add click handler
            option.addEventListener('click', () => {
                if (option.classList.contains('selected')) {
                    option.classList.remove('selected');
                    affirmationManager.removeUserPreferenceTheme(theme.id);
                } else {
                    option.classList.add('selected');
                    affirmationManager.addUserPreferenceTheme(theme.id);
                }
            });
            
            themeOptions.appendChild(option);
        });
        
        // Create affirmation length section
        const lengthSection = document.createElement('div');
        lengthSection.className = 'preferences-section';
        
        const lengthHeader = document.createElement('h3');
        lengthHeader.textContent = 'Affirmation Length';
        
        const lengthOptions = document.createElement('div');
        lengthOptions.className = 'theme-options';
        
        // Length options
        const lengths = [
            { id: 'short', label: 'Short' },
            { id: 'medium', label: 'Medium' },
            { id: 'long', label: 'Long' }
        ];
        
        // Get current length
        const currentLength = affirmationManager.userPreferences.affirmationLength || 'medium';
        
        // Create length options
        lengths.forEach(length => {
            const option = document.createElement('div');
            option.className = 'theme-option';
            option.textContent = length.label;
            
            // Check if length is selected
            if (currentLength === length.id) {
                option.classList.add('selected');
            }
            
            // Add click handler
            option.addEventListener('click', () => {
                // Remove selected class from all options
                lengthOptions.querySelectorAll('.theme-option').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update affirmation length
                affirmationManager.setAffirmationLength(length.id);
            });
            
            lengthOptions.appendChild(option);
        });
        
        // Create journal button
        const journalButton = document.createElement('button');
        journalButton.textContent = 'View Your Reflections';
        journalButton.style.marginTop = '20px';
        journalButton.style.width = '100%';
        journalButton.addEventListener('click', () => {
            this.hidePreferencesPanel();
            setTimeout(() => {
                this.showJournalEntries();
            }, 300);
        });
        
        // Assemble theme section
        themeSection.appendChild(themeHeader);
        themeSection.appendChild(themeOptions);
        
        // Assemble length section
        lengthSection.appendChild(lengthHeader);
        lengthSection.appendChild(lengthOptions);
        
        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(closeButton);
        panel.appendChild(themeSection);
        panel.appendChild(lengthSection);
        panel.appendChild(journalButton);
        
        // Append to container
        document.querySelector('.container').appendChild(panel);
        
        // Animate in
        setTimeout(() => {
            panel.classList.add('active');
        }, 10);
    }
    
    /**
     * Hide preferences panel
     */
    hidePreferencesPanel() {
        const panel = document.getElementById('preferences-panel');
        if (panel) {
            panel.classList.remove('active');
            setTimeout(() => {
                panel.remove();
            }, 300);
        }
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
     * Show the choice selection UI
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
        question.textContent = choices.question || 'Which path would you like to explore next?';
        this.container.appendChild(question);
        
        // Create buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        this.container.appendChild(buttonContainer);
        
        // If choices comes from the API with optionA/optionB format
        if (choices.optionA && choices.optionB) {
            const optionA = document.createElement('button');
            optionA.className = 'interactive-button';
            optionA.textContent = choices.optionA;
            optionA.addEventListener('click', () => this.onChoiceSelected(choices.optionAId));
            buttonContainer.appendChild(optionA);
            
            const optionB = document.createElement('button');
            optionB.className = 'interactive-button';
            optionB.textContent = choices.optionB;
            optionB.addEventListener('click', () => this.onChoiceSelected(choices.optionBId));
            buttonContainer.appendChild(optionB);
        } 
        // Otherwise use the traditional array format
        else if (Array.isArray(choices)) {
            // Create choice buttons
            choices.forEach(choice => {
                const button = document.createElement('button');
                button.className = 'interactive-button';
                button.textContent = choice.label;
                button.addEventListener('click', () => this.onChoiceSelected(choice.id));
                buttonContainer.appendChild(button);
            });
        }
    }
    
    /**
     * Handle choice selection
     * @param {string} choiceId - Selected choice ID
     */
    onChoiceSelected(choiceId) {
        // Immediately hide the UI with a faster transition
        this.container.style.transition = 'opacity 0.15s ease, visibility 0.15s ease';
        this.hideUI();
        
        // Reset transition timing after a brief delay
        setTimeout(() => {
            this.container.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
        }, 200);
        
        // Add the choice to history
        this.choiceHistory.push(choiceId);
        
        // Execute the callback
        if (this.choiceCallback) {
            this.choiceCallback(choiceId);
        }
    }
    
    /**
     * Hide the UI
     */
    hideUI() {
        this.container.classList.remove('active');
        
        // Clear the container content more quickly when transitioning from choice to wisdom
        // Use a shorter timeout for better synchronization with the faster transition
        setTimeout(() => {
            this.container.innerHTML = '';
        }, 150); // Shorter delay aligned with the faster transition
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
        // Progress indicator functionality removed
    }
    
    /**
     * Hide progress indicator
     */
    hideProgressIndicator() {
        // Progress indicator functionality removed
    }
    
    /**
     * Show progress indicator
     */
    showProgressIndicator() {
        // Progress indicator functionality removed
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
    
    /**
     * Create streak display
     */
    createStreakDisplay() {
        // Initialize streak from localStorage
        const streakData = this.initializeStreakData();
        
        // Create streak container
        const streakContainer = document.createElement('div');
        streakContainer.className = 'streak-container';
        streakContainer.id = 'streak-container';
        
        // Create flame icon
        const streakFlame = document.createElement('span');
        streakFlame.className = 'streak-flame';
        streakFlame.innerHTML = '🔥';
        
        // Create streak count
        const streakCount = document.createElement('span');
        streakCount.className = 'streak-count';
        streakCount.textContent = streakData.currentStreak;
        
        // Create streak label
        const streakLabel = document.createElement('span');
        streakLabel.textContent = ' day streak';
        
        // Append to container
        streakContainer.appendChild(streakFlame);
        streakContainer.appendChild(streakCount);
        streakContainer.appendChild(streakLabel);
        
        // Add click handler to show streak details
        streakContainer.addEventListener('click', () => {
            this.showStreakDetails();
        });
        
        // Only display if there's a streak
        if (streakData.currentStreak > 0) {
            document.querySelector('.container').appendChild(streakContainer);
        }
    }
    
    /**
     * Initialize streak data in localStorage
     * @returns {Object} Current streak data
     */
    initializeStreakData() {
        try {
            // Get current streak data or initialize
            let streakData = JSON.parse(localStorage.getItem('affirm_streak') || '{"currentStreak": 0, "lastVisit": null, "milestones": []}');
            
            // Check if this is a new day
            const today = new Date().toDateString();
            const lastVisit = streakData.lastVisit;
            
            if (lastVisit !== today) {
                // This is the first visit today
                
                // Check if the last visit was yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayString = yesterday.toDateString();
                
                if (lastVisit === yesterdayString) {
                    // Increment streak - visited yesterday
                    streakData.currentStreak += 1;
                    
                    // Check for milestones
                    if (streakData.currentStreak % 7 === 0) {
                        // Weekly milestone
                        this.scheduleStreakMilestone(streakData.currentStreak);
                        
                        // Record milestone
                        if (!streakData.milestones) {
                            streakData.milestones = [];
                        }
                        streakData.milestones.push({
                            streak: streakData.currentStreak,
                            date: today
                        });
                    }
                } else if (lastVisit) {
                    // Streak broken - last visit was before yesterday
                    if (streakData.currentStreak >= 3) {
                        // Only show reset message for meaningful streaks
                        this.scheduleStreakReset(streakData.currentStreak);
                    }
                    streakData.currentStreak = 1;
                } else {
                    // First visit ever
                    streakData.currentStreak = 1;
                }
                
                // Update last visit
                streakData.lastVisit = today;
                
                // Save updated streak data
                localStorage.setItem('affirm_streak', JSON.stringify(streakData));
            }
            
            return streakData;
        } catch (error) {
            console.error('Error initializing streak data:', error);
            return { currentStreak: 0, lastVisit: null };
        }
    }
    
    /**
     * Schedule a streak milestone celebration
     * @param {number} streak - The current streak count
     */
    scheduleStreakMilestone(streak) {
        // Schedule milestone celebration after initial affirmation loads
        setTimeout(() => {
            this.showStreakMilestone(streak);
        }, 8000); // Wait 8 seconds after page loads
    }
    
    /**
     * Show streak milestone celebration
     * @param {number} streak - The current streak count
     */
    showStreakMilestone(streak) {
        // Create milestone container
        const milestoneContainer = document.createElement('div');
        milestoneContainer.className = 'milestone-celebration';
        milestoneContainer.id = 'milestone-celebration';
        
        // Create milestone text
        const milestoneText = document.createElement('div');
        milestoneText.className = 'milestone-text';
        milestoneText.innerHTML = `<span style="color: #ff7b00;">🔥 ${streak} Day Streak! 🔥</span>`;
        
        // Create milestone subtext
        const milestoneSubtext = document.createElement('div');
        milestoneSubtext.className = 'milestone-subtext';
        
        // Different messages for different milestones
        let message;
        if (streak === 7) {
            message = "You've completed a full week of reflection and growth. Your dedication to self-improvement is admirable.";
        } else if (streak === 14) {
            message = "Two weeks of consistent practice! You're building a powerful habit of positive thinking.";
        } else if (streak === 21) {
            message = "Three weeks strong! They say it takes 21 days to form a habit - you've reached that milestone!";
        } else if (streak === 30) {
            message = "A full month of daily affirmations! Your commitment to your well-being is truly inspiring.";
        } else if (streak % 30 === 0) {
            const months = streak / 30;
            message = `${months} months of daily practice! Your consistency is extraordinary.`;
        } else {
            message = `${streak} days of positive affirmations! Your commitment to yourself is making a difference.`;
        }
        
        milestoneSubtext.textContent = message;
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'milestone-close';
        closeButton.textContent = 'Continue';
        closeButton.addEventListener('click', () => {
            this.hideMilestone();
        });
        
        // Append elements
        milestoneContainer.appendChild(milestoneText);
        milestoneContainer.appendChild(milestoneSubtext);
        milestoneContainer.appendChild(closeButton);
        
        // Append to container
        document.querySelector('.container').appendChild(milestoneContainer);
        
        // Animate in
        setTimeout(() => {
            milestoneContainer.classList.add('active');
        }, 10);
    }
    
    /**
     * Hide milestone celebration
     */
    hideMilestone() {
        const milestoneContainer = document.getElementById('milestone-celebration');
        if (milestoneContainer) {
            milestoneContainer.classList.remove('active');
            setTimeout(() => {
                milestoneContainer.remove();
            }, 500);
        }
    }
    
    /**
     * Schedule streak reset notification
     * @param {number} previousStreak - The previous streak that was broken
     */
    scheduleStreakReset(previousStreak) {
        // Schedule reset notification after initial affirmation loads
        setTimeout(() => {
            this.showStreakReset(previousStreak);
        }, 10000); // Wait 10 seconds after page loads
    }
    
    /**
     * Show streak reset notification
     * @param {number} previousStreak - The previous streak that was broken
     */
    showStreakReset(previousStreak) {
        // Create milestone container (reuse milestone styling)
        const resetContainer = document.createElement('div');
        resetContainer.className = 'milestone-celebration';
        resetContainer.id = 'streak-reset';
        resetContainer.style.animation = 'none'; // No pulse animation
        
        // Create reset text
        const resetText = document.createElement('div');
        resetText.className = 'milestone-text';
        resetText.innerHTML = "Welcome Back!";
        resetText.style.animation = 'none'; // No float animation
        
        // Create reset subtext
        const resetSubtext = document.createElement('div');
        resetSubtext.className = 'milestone-subtext';
        resetSubtext.innerHTML = `Your previous ${previousStreak}-day streak has been reset, but that's okay! Today is a new opportunity to begin again with fresh insights.`;
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'milestone-close';
        closeButton.textContent = 'Begin Again';
        closeButton.addEventListener('click', () => {
            this.hideStreakReset();
        });
        
        // Append elements
        resetContainer.appendChild(resetText);
        resetContainer.appendChild(resetSubtext);
        resetContainer.appendChild(closeButton);
        
        // Append to container
        document.querySelector('.container').appendChild(resetContainer);
        
        // Animate in
        setTimeout(() => {
            resetContainer.classList.add('active');
        }, 10);
    }
    
    /**
     * Hide streak reset notification
     */
    hideStreakReset() {
        const resetContainer = document.getElementById('streak-reset');
        if (resetContainer) {
            resetContainer.classList.remove('active');
            setTimeout(() => {
                resetContainer.remove();
            }, 500);
        }
    }
    
    /**
     * Show streak details
     */
    showStreakDetails() {
        try {
            // Get streak data
            const streakData = JSON.parse(localStorage.getItem('affirm_streak') || '{"currentStreak": 0, "lastVisit": null, "milestones": []}');
            
            // Create details container (reuse milestone styling)
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'milestone-celebration';
            detailsContainer.id = 'streak-details';
            detailsContainer.style.animation = 'none'; // No pulse animation
            
            // Create header
            const header = document.createElement('div');
            header.className = 'milestone-text';
            header.innerHTML = `<span style="color: #ff7b00;">🔥 ${streakData.currentStreak} Day Streak 🔥</span>`;
            header.style.animation = 'none'; // No float animation
            
            // Create details
            const details = document.createElement('div');
            details.className = 'milestone-subtext';
            
            // Calculate percentage of personal best
            let personalBest = streakData.currentStreak;
            if (streakData.milestones && streakData.milestones.length > 0) {
                // Find highest streak from milestones
                const highestMilestone = Math.max(...streakData.milestones.map(m => m.streak));
                personalBest = Math.max(highestMilestone, streakData.currentStreak);
            }
            
            const percentOfBest = Math.round((streakData.currentStreak / personalBest) * 100);
            
            let detailsText = `
                <p>Personal Best: ${personalBest} days</p>
                <p>Current Progress: ${percentOfBest}% of your best streak</p>
                <p>Last Visit: ${new Date(streakData.lastVisit).toLocaleDateString()}</p>
            `;
            
            // Add milestone history if available
            if (streakData.milestones && streakData.milestones.length > 0) {
                detailsText += '<p style="margin-top: 15px; font-weight: bold;">Milestone History:</p><ul style="text-align: left; margin-top: 5px;">';
                
                // Sort milestones by streak (descending)
                const sortedMilestones = [...streakData.milestones].sort((a, b) => b.streak - a.streak);
                
                // Show up to 5 most recent milestones
                sortedMilestones.slice(0, 5).forEach(milestone => {
                    detailsText += `<li>${milestone.streak} days on ${new Date(milestone.date).toLocaleDateString()}</li>`;
                });
                
                detailsText += '</ul>';
            }
            
            details.innerHTML = detailsText;
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.className = 'milestone-close';
            closeButton.textContent = 'Close';
            closeButton.addEventListener('click', () => {
                this.hideStreakDetails();
            });
            
            // Append elements
            detailsContainer.appendChild(header);
            detailsContainer.appendChild(details);
            detailsContainer.appendChild(closeButton);
            
            // Append to container
            document.querySelector('.container').appendChild(detailsContainer);
            
            // Animate in
            setTimeout(() => {
                detailsContainer.classList.add('active');
            }, 10);
        } catch (error) {
            console.error('Error showing streak details:', error);
        }
    }
    
    /**
     * Hide streak details
     */
    hideStreakDetails() {
        const detailsContainer = document.getElementById('streak-details');
        if (detailsContainer) {
            detailsContainer.classList.remove('active');
            setTimeout(() => {
                detailsContainer.remove();
            }, 500);
        }
    }
    
    /**
     * Update streak display
     * @param {number} streak - The current streak count
     */
    updateStreakDisplay(streak) {
        const streakContainer = document.getElementById('streak-container');
        
        if (streakContainer) {
            // Update streak count
            const streakCount = streakContainer.querySelector('.streak-count');
            if (streakCount) {
                streakCount.textContent = streak;
            }
            
            // Show container if it was hidden
            streakContainer.style.display = streak > 0 ? 'flex' : 'none';
        } else if (streak > 0) {
            // Create streak display if it doesn't exist
            this.createStreakDisplay();
        }
    }
    
    /**
     * Create favorites button
     */
    createFavoritesButton() {
        const favoritesContainer = document.createElement('div');
        favoritesContainer.className = 'favorites-container';
        favoritesContainer.innerHTML = '⭐';
        favoritesContainer.title = 'Your Favorite Affirmations';
        
        // Add click handler
        favoritesContainer.addEventListener('click', () => {
            this.showFavoritesPanel();
        });
        
        // Append to container
        document.querySelector('.container').appendChild(favoritesContainer);
    }
    
    /**
     * Show favorites panel
     */
    showFavoritesPanel() {
        // Create panel
        const panel = document.createElement('div');
        panel.className = 'favorites-panel';
        panel.id = 'favorites-panel';
        
        // Create header
        const header = document.createElement('h2');
        header.textContent = 'Favorite Affirmations';
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-preferences';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', () => {
            this.hideFavoritesPanel();
        });
        
        // Get favorites
        const favorites = affirmationManager.getFavorites();
        
        // Create favorites list
        const favoritesList = document.createElement('div');
        favoritesList.className = 'favorites-list';
        
        if (favorites.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'You haven\'t saved any favorite affirmations yet.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.opacity = '0.7';
            favoritesList.appendChild(emptyMessage);
        } else {
            // Sort favorites by date (newest first)
            favorites.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Add favorites to list
            favorites.forEach(favorite => {
                const favoriteElement = document.createElement('div');
                favoriteElement.className = 'favorite-item';
                favoriteElement.dataset.id = favorite.id;
                
                const textElement = document.createElement('div');
                textElement.className = 'favorite-text';
                textElement.textContent = favorite.text;
                
                const dateElement = document.createElement('div');
                dateElement.className = 'favorite-date';
                
                // Format date nicely
                const favoriteDate = new Date(favorite.date);
                dateElement.textContent = favoriteDate.toLocaleDateString() + ' • ' + (favorite.emotion || 'unknown mood');
                
                // Add "Use This" button
                const useButton = document.createElement('button');
                useButton.textContent = 'Use This';
                useButton.style.fontSize = '0.8rem';
                useButton.style.padding = '3px 8px';
                useButton.style.marginTop = '10px';
                useButton.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                useButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                useButton.style.borderRadius = '3px';
                useButton.style.color = 'white';
                useButton.style.cursor = 'pointer';
                
                useButton.addEventListener('click', () => {
                    // Use this affirmation next
                    affirmationManager.nextAffirmation = favorite.text;
                    
                    // Hide panel
                    this.hideFavoritesPanel();
                    
                    // Transition to next affirmation
                    changeState('pre_choice_transition');
                });
                
                // Create remove button
                const removeButton = document.createElement('button');
                removeButton.className = 'favorite-remove';
                removeButton.innerHTML = '×';
                removeButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    affirmationManager.removeFavoriteAffirmation(favorite.id);
                    favoriteElement.remove();
                    
                    // If no more favorites, show empty message
                    if (favoritesList.children.length === 0) {
                        const emptyMessage = document.createElement('p');
                        emptyMessage.textContent = 'You haven\'t saved any favorite affirmations yet.';
                        emptyMessage.style.textAlign = 'center';
                        emptyMessage.style.opacity = '0.7';
                        favoritesList.appendChild(emptyMessage);
                    }
                });
                
                // Append elements
                favoriteElement.appendChild(textElement);
                favoriteElement.appendChild(dateElement);
                favoriteElement.appendChild(useButton);
                favoriteElement.appendChild(removeButton);
                favoritesList.appendChild(favoriteElement);
            });
        }
        
        // Append elements
        panel.appendChild(header);
        panel.appendChild(closeButton);
        panel.appendChild(favoritesList);
        
        // Append to container
        document.querySelector('.container').appendChild(panel);
        
        // Animate in
        setTimeout(() => {
            panel.classList.add('active');
        }, 10);
    }
    
    /**
     * Hide favorites panel
     */
    hideFavoritesPanel() {
        const panel = document.getElementById('favorites-panel');
        if (panel) {
            panel.classList.remove('active');
            setTimeout(() => {
                panel.remove();
            }, 300);
        }
    }
} 