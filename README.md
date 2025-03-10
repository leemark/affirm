# Affirm

A serene, meditative digital art piece where positive affirmations fade into view with ethereal particle effects.

## Overview

This web-based art installation creates an immersive experience where positive affirmations gracefully appear on screen one character at a time, with each letter emitting gentle particles as it fades into view. The experience is designed to create a calm, reflective space for engaging with uplifting messages.

## Features

- **Sequential Character Animation**
  - Letters appear one by one in a smooth, choreographed sequence
  - Each character emits ethereal particles as it materializes
  - Elegant transitions between different affirmations

- **Interactive Particle Effects**
  - Click and drag on the canvas to create vibrant particle bursts
  - Dynamic color changes based on cursor position
  - Particle behavior reacts to movement speed and hold duration
  - Full touch support for mobile devices

- **Visual Aesthetics**
  - Minimalist dark background for focus and contrast
  - Subtle particle effects create a magical atmosphere
  - Smooth animations with proper easing functions
  - Responsive design that adapts to different screen sizes

- **Content**
  - Currently using enhanced hardcoded affirmations
  - Prepared for integration with Gemini API for AI-generated content
  - Seamless transitions between related positive messages

## Technologies

- **Frontend**: HTML5, CSS, JavaScript, p5.js
- **Backend**: (Prepared) Cloudflare Workers, Gemini API

## Implementation Details

The application was recently redesigned for a more elegant and reliable experience:

- Moved from a complex boids-based animation system to a simpler, more focused character animation approach
- Created a lightweight particle system with efficient design
- Added interactive elements that respond to user input
- Implemented robust error handling and performance optimizations
- Enhanced the transition system between affirmations

## Local Development

1. Clone the repository
2. Open index.html in your browser or use a local server:
   ```
   python -m http.server
   ```
3. For the full experience with AI-generated content, deploy the Cloudflare Worker (documentation forthcoming)

## Future Plans

- Fine-tune performance for optimal experience across devices
- Complete backend deployment for AI-generated affirmations
- Potentially add ambient sound effects to enhance the experience
- Explore additional interactive elements and visual enhancements

## License

[MIT](LICENSE) 