class Particle {
    constructor(x, y, color = [255, 255, 255], isCursorParticle = false) {
        this.position = createVector(x, y);
        this.velocity = p5.Vector.random2D();
        this.isCursorParticle = isCursorParticle;
        
        if (isCursorParticle) {
            // Cursor particles move faster and have more varied behavior
            this.velocity.mult(random(0.7, 2.5));
            this.size = random(1.5, 4);
            this.alpha = random(200, 255);
            this.fadeSpeed = random(3, 10);
            
            // Add slight color variation to cursor particles
            const variation = random(-20, 20);
            this.color = [
                constrain(color[0] + variation, 0, 255),
                constrain(color[1] + variation, 0, 255),
                constrain(color[2] + variation, 0, 255)
            ];
            
            this.lifespan = random(30, 70);
            this.driftSpeed = random(0.05, 0.3); // Varied drift speeds
            this.wiggleAmount = random(0.3, 0.8); // How much they wiggle
        } else {
            // Regular text particles are more subtle
            this.velocity.mult(random(0.3, 1.2));
            this.size = random(1, 3);
            this.alpha = 255;
            this.fadeSpeed = random(3, 8);
            this.color = color;
            this.lifespan = random(20, 60);
            this.driftSpeed = 0.1; // Standard drift speed
            this.wiggleAmount = 0.3; // Standard wiggle amount
        }
    }
    
    update() {
        this.position.add(this.velocity);
        this.alpha -= this.fadeSpeed;
        this.lifespan--;
        
        // Add a slight drift upward for ethereal effect
        this.position.y -= this.driftSpeed;
        
        // Add some random movement (wiggle)
        this.position.x += random(-this.wiggleAmount, this.wiggleAmount);
        
        // Slowly decrease velocity for all particles
        this.velocity.mult(0.98);
    }
    
    display() {
        noStroke();
        fill(this.color[0], this.color[1], this.color[2], this.alpha);
        ellipse(this.position.x, this.position.y, this.size);
    }
    
    isDead() {
        return this.alpha <= 0 || this.lifespan <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500; // Increased limit to accommodate cursor particles
    }
    
    emit(x, y, count = 1, color = [255, 255, 255], isCursorParticle = false) {
        // Don't add new particles if we're over 90% of max capacity
        if (this.particles.length > this.maxParticles * 0.9) {
            // Just add a few particles even when near capacity
            count = Math.min(count, 3);
        }
        
        // Only add new particles if we're under the maximum
        if (this.particles.length < this.maxParticles) {
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(x, y, color, isCursorParticle));
            }
        }
    }
    
    update() {
        // Update all particles and remove dead ones
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    display() {
        // Display all particles
        for (const particle of this.particles) {
            particle.display();
        }
    }
    
    clear() {
        this.particles = [];
    }
} 