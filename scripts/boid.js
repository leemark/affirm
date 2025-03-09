class Boid {
    constructor(character, x, y, targetX, targetY) {
        this.character = character;
        this.position = createVector(x, y);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.acceleration = createVector(0, 0);
        this.targetPosition = createVector(targetX, targetY);
        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.size = textSize();
        this.alpha = 255; // Opacity
        this.trail = []; // For trailing effect
        this.maxTrailLength = 10;
        this.isActive = true; // Whether this boid should still be displayed/updated
        this.isInTargetMode = false; // Whether to seek target or flock
        this.isSettling = false; // Whether the boid is settling into place
        this.arrivalThreshold = 5; // How close to consider "arrived"
        
        // Add a rotation angle for smoother transitions
        this.rotationAngle = 0;
        this.targetRotationAngle = 0;
        
        // Per-boid unique values for subtle variation
        this.separationWeight = random(1.5, 2.5);
        this.alignmentWeight = random(1.0, 1.5);
        this.cohesionWeight = random(1.0, 1.5);
        this.mouseInfluenceWeight = random(0.2, 0.8);
    }
    
    update() {
        if (!this.isActive) return;
        
        // Add current position to trail
        if (TRAILS_ENABLED) {
            this.trail.push({
                pos: createVector(this.position.x, this.position.y),
                alpha: 200
            });
            
            // Limit trail length
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
            
            // Fade trail points
            for (let i = 0; i < this.trail.length; i++) {
                this.trail[i].alpha -= 20;
            }
        }
        
        // Calculate target rotation angle if moving
        if (this.velocity.mag() > 0.1) {
            this.targetRotationAngle = atan2(this.velocity.y, this.velocity.x) + HALF_PI;
        }
        
        // Smoothly interpolate current rotation angle towards target
        const angleDiff = this.targetRotationAngle - this.rotationAngle;
        
        // Normalize the angle difference to be between -PI and PI
        let normalizedDiff = angleDiff;
        while (normalizedDiff > PI) normalizedDiff -= TWO_PI;
        while (normalizedDiff < -PI) normalizedDiff += TWO_PI;
        
        // Apply a smooth interpolation
        this.rotationAngle += normalizedDiff * 0.1;
        
        // Update position based on physics
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
        
        // Handle screen wrap-around
        this.handleEdges();
    }
    
    display() {
        if (!this.isActive) return;
        
        // Draw trail
        if (TRAILS_ENABLED) {
            noStroke();
            let prevPos = null;
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                if (prevPos) {
                    // Calculate distance between current point and previous point
                    const distance = dist(prevPos.x, prevPos.y, point.pos.x, point.pos.y);
                    
                    // Only draw the line if points are reasonably close
                    // (prevents lines from stretching across the screen)
                    if (distance < 50) {
                        const trailAlpha = point.alpha;
                        stroke(255, trailAlpha * 0.7);
                        strokeWeight(this.size / 10);
                        line(prevPos.x, prevPos.y, point.pos.x, point.pos.y);
                        noStroke();
                    }
                }
                prevPos = point.pos;
            }
        }
        
        // Draw character
        push();
        translate(this.position.x, this.position.y);
        
        // Use the smoothly interpolated rotation angle for display
        if (!this.isSettling) {
            rotate(this.rotationAngle);
        }
        
        fill(255, this.alpha);
        noStroke();
        textAlign(CENTER, CENTER);
        text(this.character, 0, 0);
        pop();
    }
    
    applyForce(force) {
        this.acceleration.add(force);
    }
    
    flock(boids) {
        if (this.isInTargetMode) {
            // Move towards final text position
            const arrival = this.arrive(this.targetPosition);
            arrival.mult(2.5); // Stronger pull when forming text
            this.applyForce(arrival);
            
            // Slow down as we approach the target
            const distance = p5.Vector.dist(this.position, this.targetPosition);
            if (distance < 50) {
                const slowingFactor = map(distance, 0, 50, 0.8, 1.0);
                this.velocity.mult(slowingFactor);
                
                // Check if we've arrived
                if (distance < this.arrivalThreshold) {
                    this.isSettling = true;
                    this.velocity.mult(0.8); // Damp velocity when settling
                    
                    // Snap to final position when very close
                    if (distance < 1) {
                        this.position = this.targetPosition.copy();
                        this.velocity.mult(0);
                    }
                }
            }
        } else {
            // Standard flocking behavior
            const separation = this.separate(boids);
            const alignment = this.align(boids);
            const cohesion = this.cohesion(boids);
            
            // Apply weights
            separation.mult(this.separationWeight);
            alignment.mult(this.alignmentWeight);
            cohesion.mult(this.cohesionWeight);
            
            // Apply all forces
            this.applyForce(separation);
            this.applyForce(alignment);
            this.applyForce(cohesion);
        }
    }
    
    // Flocking behavior: avoid crowding neighbors
    separate(boids) {
        const desiredSeparation = this.size * 2;
        const steer = createVector(0, 0);
        let count = 0;
        
        for (const other of boids) {
            if (!other.isActive || other === this) continue;
            
            const distance = p5.Vector.dist(this.position, other.position);
            if (distance > 0 && distance < desiredSeparation) {
                const diff = p5.Vector.sub(this.position, other.position);
                diff.normalize();
                diff.div(distance); // Weight by distance
                steer.add(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steer.div(count);
        }
        
        if (steer.mag() > 0) {
            steer.normalize();
            steer.mult(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
        }
        
        return steer;
    }
    
    // Flocking behavior: steer towards average heading of neighbors
    align(boids) {
        const neighborDistance = 50;
        const sum = createVector(0, 0);
        let count = 0;
        
        for (const other of boids) {
            if (!other.isActive || other === this) continue;
            
            const distance = p5.Vector.dist(this.position, other.position);
            if (distance > 0 && distance < neighborDistance) {
                sum.add(other.velocity);
                count++;
            }
        }
        
        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(this.maxSpeed);
            
            const steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxForce);
            return steer;
        } else {
            return createVector(0, 0);
        }
    }
    
    // Flocking behavior: steer towards average position of neighbors
    cohesion(boids) {
        const neighborDistance = 50;
        const sum = createVector(0, 0);
        let count = 0;
        
        for (const other of boids) {
            if (!other.isActive || other === this) continue;
            
            const distance = p5.Vector.dist(this.position, other.position);
            if (distance > 0 && distance < neighborDistance) {
                sum.add(other.position);
                count++;
            }
        }
        
        if (count > 0) {
            sum.div(count);
            return this.seek(sum);
        } else {
            return createVector(0, 0);
        }
    }
    
    // Basic steering behavior: pursue target
    seek(target) {
        const desired = p5.Vector.sub(target, this.position);
        desired.normalize();
        desired.mult(this.maxSpeed);
        
        const steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }
    
    // Advanced seeking behavior: slow down on approach
    arrive(target) {
        const desired = p5.Vector.sub(target, this.position);
        const distance = desired.mag();
        
        // The closer we are, the slower we go
        if (distance < 100) {
            const speed = map(distance, 0, 100, 0, this.maxSpeed);
            desired.normalize();
            desired.mult(speed);
        } else {
            desired.normalize();
            desired.mult(this.maxSpeed);
        }
        
        const steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }
    
    // Handle edges of the screen
    handleEdges() {
        const buffer = this.size;
        
        // If in target mode, don't wrap around
        if (this.isInTargetMode) return;
        
        // Check if we need to wrap around
        let wrapped = false;
        
        // Wrap around screen edges
        if (this.position.x < -buffer) {
            this.position.x = width + buffer;
            wrapped = true;
        }
        if (this.position.y < -buffer) {
            this.position.y = height + buffer;
            wrapped = true;
        }
        if (this.position.x > width + buffer) {
            this.position.x = -buffer;
            wrapped = true;
        }
        if (this.position.y > height + buffer) {
            this.position.y = -buffer;
            wrapped = true;
        }
        
        // If the boid wrapped around the screen, clear the trail to avoid long lines
        if (wrapped && TRAILS_ENABLED) {
            this.trail = [];
        }
    }
    
    // Set whether this boid should seek its target position
    setTargetMode(isInTargetMode) {
        this.isInTargetMode = isInTargetMode;
        this.isSettling = false;
        
        // If entering target mode, increase force for faster convergence
        if (isInTargetMode) {
            this.maxForce = 0.4;
        } else {
            this.maxForce = 0.2;
        }
    }
    
    // Apply mouse influence
    applyMouseInfluence(mouseX, mouseY, isAttract) {
        // Only apply mouse influence when in boids mode
        if (this.isInTargetMode) return;
        
        const mousePos = createVector(mouseX, mouseY);
        const distance = p5.Vector.dist(this.position, mousePos);
        
        // Only apply influence within a certain radius
        if (distance < 150) {
            const force = createVector();
            if (isAttract) {
                force.sub(p5.Vector.sub(this.position, mousePos)); // Attraction
            } else {
                force.add(p5.Vector.sub(this.position, mousePos)); // Repulsion
            }
            
            // Scale force by distance (stronger when closer)
            const strength = map(distance, 0, 150, this.mouseInfluenceWeight, 0);
            force.normalize();
            force.mult(strength);
            
            this.applyForce(force);
        }
    }
    
    // Fade in/out
    setAlpha(alpha) {
        this.alpha = alpha;
    }
    
    // Set if the boid is active (should be updated/displayed)
    setActive(isActive) {
        this.isActive = isActive;
    }
} 