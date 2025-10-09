/**
 * HiMMP - Heaviness in Metal Music Production
 * Custom Audio Player Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize audio players on the page
    initializeAudioPlayers();
    
    // Set up comparison player if on the downloads page
    if (document.querySelector('.mix-comparison-player')) {
        initializeMixComparisonPlayer();
    }
});

/**
 * Initializes custom audio players on the page
 */
function initializeAudioPlayers() {
    const audioElements = document.querySelectorAll('audio');
    
    audioElements.forEach(audio => {
        const container = audio.closest('.audio-container');
        if (!container) return;
        
        // Get or create time display elements
        const currentTimeDisplay = container.querySelector('#current-time') || createTimeDisplay(container, 'current-time');
        const durationDisplay = container.querySelector('#duration') || createTimeDisplay(container, 'duration');
        
        // Initialize with current values
        updateTimeDisplay(audio, currentTimeDisplay, durationDisplay);
        
        // Update time displays when time updates
        audio.addEventListener('timeupdate', () => {
            updateTimeDisplay(audio, currentTimeDisplay, durationDisplay);
        });
        
        // Update duration display when metadata is loaded
        audio.addEventListener('loadedmetadata', () => {
            updateTimeDisplay(audio, currentTimeDisplay, durationDisplay);
        });
        
        // If we have custom play/pause buttons, wire them up
        const playButton = container.querySelector('.custom-play-button');
        if (playButton) {
            playButton.addEventListener('click', () => {
                togglePlayPause(audio, playButton);
            });
            
            // Update button state when audio state changes
            audio.addEventListener('play', () => {
                updatePlayButtonState(playButton, true);
            });
            
            audio.addEventListener('pause', () => {
                updatePlayButtonState(playButton, false);
            });
            
            audio.addEventListener('ended', () => {
                updatePlayButtonState(playButton, false);
            });
        }
        
        // If we have a custom progress bar, wire it up
        const progressBar = container.querySelector('.progress-bar');
        if (progressBar) {
            // Update progress bar as audio plays
            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progress}%`;
            });
            
            // Allow clicking on progress container to seek
            const progressContainer = container.querySelector('.progress-container');
            if (progressContainer) {
                progressContainer.addEventListener('click', (e) => {
                    const rect = progressContainer.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    audio.currentTime = pos * audio.duration;
                });
            }
        }
    });
}

/**
 * Creates a time display element if it doesn't exist
 */
function createTimeDisplay(container, id) {
    const timeDisplay = document.createElement('span');
    timeDisplay.id = id;
    
    const controlsContainer = container.querySelector('.audio-controls') || container;
    const timeContainer = controlsContainer.querySelector('.time-display');
    
    if (timeContainer) {
        timeContainer.appendChild(timeDisplay);
    } else {
        const newTimeContainer = document.createElement('div');
        newTimeContainer.classList.add('time-display');
        newTimeContainer.appendChild(timeDisplay);
        controlsContainer.appendChild(newTimeContainer);
    }
    
    return timeDisplay;
}

/**
 * Updates the time display elements with current audio time
 */
function updateTimeDisplay(audio, currentTimeEl, durationEl) {
    if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
    
    if (durationEl) {
        durationEl.textContent = formatTime(isNaN(audio.duration) ? 0 : audio.duration);
    }
}

/**
 * Formats seconds into MM:SS display
 */
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Toggles audio play/pause state
 */
function togglePlayPause(audio, button) {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

/**
 * Updates play button appearance based on audio state
 */
function updatePlayButtonState(button, isPlaying) {
    if (isPlaying) {
        button.classList.add('playing');
        button.setAttribute('aria-label', 'Pause');
    } else {
        button.classList.remove('playing');
        button.setAttribute('aria-label', 'Play');
    }
}

/**
 * Special player for comparing different producer mixes
 */
function initializeMixComparisonPlayer() {
    const comparisonContainer = document.querySelector('.mix-comparison-player');
    if (!comparisonContainer) return;

    const mainAudio = comparisonContainer.querySelector('audio');
    if (!mainAudio) return;

    const mixButtons = comparisonContainer.querySelectorAll('.mix-button');

    mixButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the audio source for this mix
            const mixSrc = this.getAttribute('data-src');
            if (!mixSrc) return;

            // Store current playback state and position
            const wasPlaying = !mainAudio.paused;
            const currentTime = mainAudio.currentTime;

            // Update source and reload
            mainAudio.src = mixSrc;
            mainAudio.load();

            // Set active state on button
            mixButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Set mix name display if it exists
            const mixNameDisplay = comparisonContainer.querySelector('.current-mix-name');
            if (mixNameDisplay) {
                mixNameDisplay.textContent = this.getAttribute('data-name') || '';
            }

            // Define the one-time event handler
            const handleLoadedMetadata = function() {
                mainAudio.currentTime = currentTime;

                if (wasPlaying) {
                    mainAudio.play();
                }

                // Remove the event listener after it fires once
                mainAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };

            // When loaded, restore position and play state
            mainAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
        });
    });

    // Initialize with first mix if available
    if (mixButtons.length > 0) {
        mixButtons[0].click();
    }
}