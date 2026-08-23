/**
 * me.s1on.wtf ✦ 个人主页 · 交互脚本
 * Canvas 动态星空粒子 · 鼠标视差 · 平滑微交互
 */

document.addEventListener('DOMContentLoaded', () => {
    initCanvasStarfield();
});

/* =========================================================
   Canvas 动态星空粒子系统
   ========================================================= */
function initCanvasStarfield() {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initStars();
    });

    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
    });

    let stars = [];
    const STAR_COUNT = Math.min(Math.floor((width * height) / 10000), 90);

    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.6 + 0.4;
            this.alpha = Math.random() * 0.7 + 0.2;
            this.baseAlpha = this.alpha;
            this.blinkSpeed = Math.random() * 0.02 + 0.005;
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.speedY = (Math.random() - 0.5) * 0.2;
            this.hue = Math.random() > 0.6 ? 195 : (Math.random() > 0.5 ? 270 : 45); // Cyan, Purple or Gold
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            this.alpha += this.blinkSpeed;
            if (this.alpha > 0.9 || this.alpha < 0.2) {
                this.blinkSpeed = -this.blinkSpeed;
            }
        }

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 90%, 80%, ${this.alpha})`;
            ctx.shadowBlur = this.size * 6;
            ctx.shadowColor = `hsla(${this.hue}, 90%, 75%, 0.8)`;
            ctx.fill();
            ctx.restore();
        }
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }
    }

    initStars();

    function animate() {
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        ctx.clearRect(0, 0, width, height);

        stars.forEach(star => {
            star.update();
            star.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();
}
