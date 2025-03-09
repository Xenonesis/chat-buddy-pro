import React, { useEffect, useRef } from 'react';
import styles from '../styles/AnimatedBackground.module.css';

interface AnimatedBackgroundProps {
  theme: 'light' | 'dark' | 'system';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Call once to initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Configure particles
    const particles: Particle[] = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 8), 120);
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas, ctx, theme));
    }
    
    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Connect particles that are close to each other
      connectParticles();
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Draw connections between particles
    const connectParticles = () => {
      const maxDistance = canvas.width * 0.07;
      
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            // Line opacity based on distance
            const opacity = 1 - (distance / maxDistance);
            
            ctx.beginPath();
            ctx.strokeStyle = theme === 'dark' 
              ? `rgba(0, 166, 255, ${opacity * 0.15})` 
              : `rgba(0, 112, 243, ${opacity * 0.1})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
    };
    
    // Start animation
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);
  
  return <canvas ref={canvasRef} className={styles.animatedBackground} />;
};

// Particle class
class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  theme: 'light' | 'dark' | 'system';
  
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: 'light' | 'dark' | 'system') {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    
    // Slower movement for more subtle effect
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
  }
  
  update() {
    // Bounce off edges with reversed direction
    if (this.x > this.canvas.width || this.x < 0) {
      this.speedX = -this.speedX;
    }
    
    if (this.y > this.canvas.height || this.y < 0) {
      this.speedY = -this.speedY;
    }
    
    this.x += this.speedX;
    this.y += this.speedY;
  }
  
  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    
    // Different colors based on theme
    if (this.theme === 'dark') {
      this.ctx.fillStyle = `rgba(0, 166, 255, ${Math.random() * 0.2 + 0.1})`;
    } else {
      this.ctx.fillStyle = `rgba(0, 112, 243, ${Math.random() * 0.15 + 0.05})`;
    }
    
    this.ctx.fill();
  }
}

export default AnimatedBackground;
