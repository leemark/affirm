class Particle {
    constructor(x, y, color = [255, 255, 255]) {
        this.position = createVector(x, y);
        this.velocity = p5.Vector.random2D();
        this.velocity.mult(random(0.3, 1.2));
        this.size = random(1, 3);
        this.alpha = 255;
        this.fadeSpeed = random(3, 8);
        this.color = color;
        this.lifespan = random(20, 60);
    }
    
    update() {
        this.position.add(this.velocity);
        this.alpha -= this.fadeSpeed;
        this.lifespan--;
        
        // Add a slight drift upward for ethereal effect
        this.position.y -= 0.1;
        
        // Add some random movement
        this.position.x += random(-0.3, 0.3);
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
        this.maxParticles = 300; // Limit to prevent performance issues
    }
    
    emit(x, y, count = 1, color = [255, 255, 255]) {
        // Only add new particles if we're under the maximum
        if (this.particles.length < this.maxParticles) {
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(x, y, color));
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