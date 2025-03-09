class Particle {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.velocity.normalize();
        this.velocity.mult(random(0.5, 2));
        this.acceleration = createVector(0, 0);
        this.size = random(1, 4);
        this.alpha = 255;
        this.lifespan = random(30, 80);
        this.fadeRate = 255 / this.lifespan;
    }
    
    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
        this.alpha -= this.fadeRate;
        
        // Apply some drag
        this.velocity.mult(0.97);
    }
    
    display() {
        noStroke();
        fill(255, this.alpha);
        ellipse(this.position.x, this.position.y, this.size, this.size);
    }
    
    isDead() {
        return this.alpha <= 0;
    }
    
    applyForce(force) {
        this.acceleration.add(force);
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addParticle(x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < MAX_PARTICLES) {
                this.particles.push(new Particle(x, y));
            }
        }
    }
    
    update() {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            
            // Remove dead particles
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    display() {
        // Draw all particles
        for (const particle of this.particles) {
            particle.display();
        }
    }
    
    // Create an emission burst at a specific location
    emit(x, y, count) {
        this.addParticle(x, y, count);
    }
    
    // Apply force to all particles
    applyForce(force) {
        for (const particle of this.particles) {
            particle.applyForce(force);
        }
    }
    
    // Get number of active particles
    getCount() {
        return this.particles.length;
    }
    
    // Clear all particles
    clear() {
        this.particles = [];
    }
} 