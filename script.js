/**
 * Enhanced Graduation Invitation Application
 * Optimized for performance, accessibility, and user experience
 */

import * as THREE from 'three';

/* ==================== CONSTANTS & CONFIGURATION ==================== */
const CONFIG = {
    animation: {
        duration: {
            fast: 0.3,
            normal: 0.6,
            slow: 1.0,
            confetti: 3.0
        },
        easing: {
            default: 'power2.out',
            bounce: 'bounce.out',
            elastic: 'elastic.out(1, 0.3)'
        }
    },
    three: {
        particleCount: 3000,
        cameraDistance: 5,
        mouseInfluence: 0.02
    },
    confetti: {
        particleCount: 150,
        spread: 160,
        decay: 0.9,
        gravity: 0.8
    }
};

const GRADUATION_IMAGES = [
    'Images/thienhuong-grad-3.jpg'
];

const INVITATION_TEMPLATE = `
    <div class="divider"></div>
    <p class="invite-header">Trân trọng kính mời bạn tới tham dự</p>
    <h2 class="event-title">LỄ TRAO BẰNG TỐT NGHIỆP</h2>
    <p class="event-host">của <strong>Thiên Hương</strong></p>
    <div class="event-details">
        <p><strong>Thời gian:</strong> 10:30 - 12:00, Thứ Sáu, Ngày 15 tháng 08 năm 2025</p>
        <p><strong>Địa điểm:</strong> Đại học Văn Lang CS3 - 69/68 Đ. Đặng Thùy Trâm, Phường 13, Bình Thạnh, TPHCM</p>
    </div>
    <p class="closing-text">Sự hiện diện của {name} là niềm vinh hạnh và là món quà lớn nhất đối với tui! 💝</p>
`;

/* ==================== STATE MANAGEMENT ==================== */
class AppState {
    constructor() {
        this.currentScreen = 'form';
        this.userName = '';
        this.userType = ''; // Add user type tracking
        this.wishes = [];
        this.isLoading = false;
        this.threeScene = null;
        this.animations = new Map();
    }

    setScreen(screen) {
        this.currentScreen = screen;
        document.body.className = screen === 'form' ? '' : `${screen}-screen-active`;
    }

    setUserName(name) {
        this.userName = name.trim();
    }

    setUserType(type) {
        this.userType = type;
    }

    setWishes(wishes) {
        this.wishes = wishes;
    }

    setLoading(loading) {
        this.isLoading = loading;
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.toggle('hidden', !loading);
        }
    }

    addAnimation(key, animation) {
        if (this.animations.has(key)) {
            this.animations.get(key).kill();
        }
        this.animations.set(key, animation);
    }

    killAnimation(key) {
        if (this.animations.has(key)) {
            this.animations.get(key).kill();
            this.animations.delete(key);
        }
    }

    killAllAnimations() {
        this.animations.forEach(animation => animation.kill());
        this.animations.clear();
    }
}

/* ==================== DOM ELEMENTS ==================== */
class DOMElements {
    constructor() {
        this.containers = {
            form: document.getElementById('form-container'),
            gift: document.getElementById('gift-container'),
            reveal: document.getElementById('reveal-container')
        };

        this.form = {
            element: document.getElementById('wish-form'),
            nameInput: document.getElementById('name'),
            userTypeSelect: document.getElementById('user-type')
        };

        this.gift = {
            wrapper: document.getElementById('gift-wrapper'),
            box: document.getElementById('gift-box'),
            lid: null // Will be set after DOM is ready
        };

        this.reveal = {
            image: document.getElementById('revealed-image'),
            wish: document.getElementById('revealed-wish'),
            details: document.getElementById('invitation-details'),
            resetBtn: document.getElementById('reset-button')
        };

        this.canvas = {
            three: document.getElementById('three-canvas'),
            confetti: document.getElementById('confetti-canvas')
        };

        this.loadingScreen = document.getElementById('loading-screen');
    }

    init() {
        // Set the lid element after DOM is ready
        this.gift.lid = this.gift.box?.querySelector('.lid');
        return this;
    }
}

/* ==================== UTILITIES ==================== */
class Utils {
    static getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static validateName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 50;
    }

    static sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    }
}

/* ==================== WISH LOADER ==================== */
class WishLoader {
    constructor() {
        this.defaultWishes = [
            { text: "Cảm ơn {name} vì đã dành thời gian quý báu để đến dự lễ tốt nghiệp của mình. Sự hiện diện của bạn khiến ngày hôm đó trở nên ý nghĩa hơn rất nhiều!" },
            { text: "Lễ tốt nghiệp của mình không thể trọn vẹn nếu thiếu {name}. Cảm ơn bạn vì đã đến và chia sẻ khoảnh khắc đặc biệt ấy cùng mình." },
            { text: "Thật hạnh phúc khi được nhìn thấy {name} trong ngày lễ tốt nghiệp. Cảm ơn vì đã có mặt và mang theo những nụ cười ấm áp!" },
            { text: "Mình biết bạn bận rộn, nên sự có mặt của {name} hôm ấy càng khiến mình cảm động hơn. Cảm ơn thật nhiều!" },
            { text: "Cảm ơn {name} vì đã không ngại đường xa đến chung vui với mình trong buổi lễ tốt nghiệp. Bạn tuyệt vời lắm!" }
        ];
    }

    async load() {
        try {
            // In a real app, this would fetch from wishes.json
            // For demo purposes, we'll use the default wishes
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
            return this.defaultWishes;
        } catch (error) {
            console.warn('Could not load wishes, using defaults:', error);
            return this.defaultWishes;
        }
    }
}

/* ==================== THREE.JS SCENE MANAGER ==================== */
class ThreeSceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouse = new THREE.Vector2();
        this.animationId = null;
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = CONFIG.three.cameraDistance;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create particles
        this.createParticles();

        // Start animation loop
        this.animate();
    }

    createParticles() {
        const particleCount = CONFIG.three.particleCount;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorPalette = [
            new THREE.Color('#667eea'),
            new THREE.Color('#f093fb'),
            new THREE.Color('#4facfe'),
            new THREE.Color('#f6d365'),
            new THREE.Color('#ffffff')
        ];

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position
            positions[i3] = (Math.random() - 0.5) * 15;
            positions[i3 + 1] = (Math.random() - 0.5) * 15;
            positions[i3 + 2] = (Math.random() - 0.5) * 15;

            // Color
            const randomColor = Utils.getRandomItem(colorPalette);
            colors[i3] = randomColor.r;
            colors[i3 + 1] = randomColor.g;
            colors[i3 + 2] = randomColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.015,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (!this.particles) return;

        const elapsedTime = Date.now() * 0.0001;

        // Rotate particles
        this.particles.rotation.y = elapsedTime * 0.1;
        this.particles.rotation.x = elapsedTime * 0.05;

        // Mouse parallax effect
        const targetX = this.mouse.x * 0.1;
        const targetY = -this.mouse.y * 0.1;
        
        this.camera.position.x = Utils.lerp(
            this.camera.position.x,
            targetX,
            CONFIG.three.mouseInfluence
        );
        this.camera.position.y = Utils.lerp(
            this.camera.position.y,
            targetY,
            CONFIG.three.mouseInfluence
        );

        this.camera.lookAt(this.scene.position);
        this.renderer.render(this.scene, this.camera);
    }

    handleMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setupEventListeners() {
        const debouncedResize = Utils.debounce(() => this.handleResize(), 100);
        const throttledMouseMove = Utils.debounce((e) => this.handleMouseMove(e), 16);

        window.addEventListener('resize', debouncedResize);
        document.addEventListener('mousemove', throttledMouseMove);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }
    }
}

/* ==================== CONFETTI MANAGER ==================== */
class ConfettiManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.confetti = null;
        this.init();
    }

    init() {
        if (window.confetti) {
            this.confetti = window.confetti.create(this.canvas, {
                resize: true,
                useWorker: true
            });
        }
    }

    trigger(options = {}) {
        if (!this.confetti) return;

        const defaultOptions = {
            particleCount: CONFIG.confetti.particleCount,
            spread: CONFIG.confetti.spread,
            origin: { y: 0.6 },
            colors: ['#667eea', '#f093fb', '#4facfe', '#f6d365', '#ffffff'],
            decay: CONFIG.confetti.decay,
            gravity: CONFIG.confetti.gravity,
            ...options
        };

        // Multiple bursts for better effect
        setTimeout(() => this.confetti(defaultOptions), 0);
        setTimeout(() => this.confetti({
            ...defaultOptions,
            particleCount: defaultOptions.particleCount * 0.7,
            origin: { x: 0.3, y: 0.7 }
        }), 250);
        setTimeout(() => this.confetti({
            ...defaultOptions,
            particleCount: defaultOptions.particleCount * 0.7,
            origin: { x: 0.7, y: 0.7 }
        }), 400);
    }

    burst() {
        this.trigger({
            particleCount: 200,
            spread: 180,
            startVelocity: 45,
            scalar: 1.2
        });
    }
}

/* ==================== ANIMATION MANAGER ==================== */
class AnimationManager {
    constructor(state) {
        this.state = state;
    }

    fadeTransition(fromContainer, toContainer, callback) {
        const tl = gsap.timeline({
            onComplete: callback
        });

        tl.to(fromContainer, {
            duration: CONFIG.animation.duration.fast,
            opacity: 0,
            ease: CONFIG.animation.easing.default
        })
        .set(fromContainer, { className: 'container' })
        .set(toContainer, { className: 'container active' })
        .fromTo(toContainer, 
            { opacity: 0 },
            { 
                duration: CONFIG.animation.duration.normal,
                opacity: 1,
                ease: CONFIG.animation.easing.default
            }
        );

        this.state.addAnimation('transition', tl);
        return tl;
    }

    animateGiftEntrance(giftBox) {
        const tl = gsap.timeline();
        
        tl.fromTo(giftBox,
            { 
                y: -400, 
                opacity: 0, 
                scale: 0.3,
                rotation: -180
            },
            { 
                duration: CONFIG.animation.duration.slow * 1.5,
                y: 0, 
                opacity: 1, 
                scale: 1,
                rotation: 0,
                ease: CONFIG.animation.easing.bounce
            }
        )
        .to(giftBox, {
            duration: 2.5,
            y: -10,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
        });

        this.state.addAnimation('giftFloat', tl);
        return tl;
    }

    animateGiftOpening(giftBox, lid, callback) {
        this.state.killAnimation('giftFloat');
        
        const tl = gsap.timeline({
            onComplete: callback
        });

        // Shake animation
        tl.to(giftBox, {
            duration: 0.05,
            x: 'random(-8, 8)',
            y: 'random(-4, 4)',
            rotation: 'random(-3, 3)',
            repeat: 15,
            ease: 'power1.inOut'
        })
        // Lid opens
        .to(lid, {
            duration: 0.6,
            y: -150,
            rotation: 25,
            opacity: 0,
            ease: 'power2.in'
        }, '-=0.3')
        // Fade out entire gift
        .to(giftBox.parentElement, {
            duration: 0.5,
            opacity: 0,
            scale: 0.8,
            ease: 'power1.in'
        }, '+=0.2');

        this.state.addAnimation('giftOpening', tl);
        return tl;
    }

    animateRevealEntrance(imageSection, contentSection) {
        const tl = gsap.timeline();

        tl.fromTo(imageSection,
            { x: -100, opacity: 0 },
            { 
                duration: CONFIG.animation.duration.slow,
                x: 0, 
                opacity: 1, 
                ease: CONFIG.animation.easing.default 
            }
        )
        .fromTo(contentSection,
            { x: 100, opacity: 0 },
            { 
                duration: CONFIG.animation.duration.slow,
                x: 0, 
                opacity: 1, 
                ease: CONFIG.animation.easing.default 
            }, 
            '-=0.4'
        );

        this.state.addAnimation('revealEntrance', tl);
        return tl;
    }

    pulseElement(element, options = {}) {
        const defaultOptions = {
            scale: 1.05,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut',
            ...options
        };

        return gsap.to(element, defaultOptions);
    }
}

/* ==================== FORM MANAGER ==================== */
class FormManager {
    constructor(elements, state, animationManager) {
        this.elements = elements;
        this.state = state;
        this.animationManager = animationManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupValidation();
    }

    setupEventListeners() {
        this.elements.form.element.addEventListener('submit', (e) => this.handleSubmit(e));
        this.elements.form.nameInput.addEventListener('input', (e) => this.handleInput(e));
        this.elements.form.nameInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        this.elements.form.userTypeSelect.addEventListener('change', (e) => this.handleUserTypeChange(e));
        
        // Setup custom select
        this.setupCustomSelect();
    }

    setupValidation() {
        const input = this.elements.form.nameInput;
        const select = this.elements.form.userTypeSelect;
        const submitBtn = this.elements.form.element.querySelector('.submit-btn');

        const validateForm = () => {
            const isNameValid = Utils.validateName(input.value);
            const isTypeValid = select.value !== '';
            const isValid = isNameValid && isTypeValid;
            
            submitBtn.disabled = !isValid;
            submitBtn.classList.toggle('disabled', !isValid);
        };

        input.addEventListener('input', validateForm);
        select.addEventListener('change', validateForm);
    }

    handleInput(event) {
        const input = event.target;
        const value = input.value;
        
        // Real-time validation feedback
        if (value.length > 0 && value.length < 2) {
            input.setCustomValidity('Tên phải có ít nhất 2 ký tự');
        } else if (value.length > 50) {
            input.setCustomValidity('Tên không được quá 50 ký tự');
        } else {
            input.setCustomValidity('');
        }
    }

    handleUserTypeChange(event) {
        const select = event.target;
        if (select.value === '') {
            select.setCustomValidity('Vui lòng chọn loại khách mời');
        } else {
            select.setCustomValidity('');
        }
    }

    handleKeyPress(event) {
        // Prevent form submission on Enter if input is invalid
        if (event.key === 'Enter' && !Utils.validateName(event.target.value)) {
            event.preventDefault();
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const nameValue = this.elements.form.nameInput.value;
        const userTypeValue = this.elements.form.userTypeSelect.value;
        const sanitizedName = Utils.sanitizeInput(nameValue);
        
        if (!Utils.validateName(sanitizedName)) {
            this.showError('Vui lòng nhập tên hợp lệ (2-50 ký tự)');
            return;
        }

        if (!userTypeValue) {
            this.showError('Vui lòng chọn loại khách mời');
            return;
        }

        this.state.setUserName(sanitizedName);
        this.state.setUserType(userTypeValue);
        
        // Add loading state
        const submitBtn = event.target.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Đang xử lý...</span>';
        submitBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
            this.transitionToGiftScreen();
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError('Có lỗi xảy ra, vui lòng thử lại');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showError(message) {
        // Create and show error message
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInDown 0.3s ease-out;
        `;

        document.body.appendChild(errorEl);

        setTimeout(() => {
            errorEl.remove();
        }, 3000);
    }

    setupCustomSelect() {
        const customSelect = document.getElementById('custom-select');
        const trigger = customSelect.querySelector('.custom-select__trigger');
        const options = customSelect.querySelectorAll('.custom-select__option');
        const placeholder = customSelect.querySelector('.custom-select__placeholder');
        const hiddenSelect = this.elements.form.userTypeSelect;

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('open');
            
            // Add click outside to close
            if (customSelect.classList.contains('open')) {
                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                }, 0);
            }
        });

        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.dataset.value;
                const text = option.querySelector('.option-text').textContent;
                
                // Update visual state
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Update placeholder
                placeholder.textContent = text;
                placeholder.style.color = '#2d3748';
                
                // Update hidden select
                hiddenSelect.value = value;
                hiddenSelect.dispatchEvent(new Event('change'));
                
                // Close dropdown
                customSelect.classList.remove('open');
                document.removeEventListener('click', closeDropdown);
                
                // Add success animation
                this.animateOptionSelection(option);
                
                // Add confetti effect
                if (window.confetti) {
                    confetti({
                        particleCount: 30,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            });
        });

        function closeDropdown() {
            customSelect.classList.remove('open');
            document.removeEventListener('click', closeDropdown);
        }
    }

    animateOptionSelection(option) {
        // Create sparkle effect
        const sparkles = ['✨', '⭐', '💫', '🌟'];
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('span');
                sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
                sparkle.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    font-size: 1.2rem;
                    pointer-events: none;
                    animation: sparkleFloat 1s ease-out forwards;
                    z-index: 1000;
                `;
                option.appendChild(sparkle);
                
                setTimeout(() => sparkle.remove(), 1000);
            }, i * 100);
        }
    }

    transitionToGiftScreen() {
        this.state.setScreen('gift');
        this.animationManager.fadeTransition(
            this.elements.containers.form,
            this.elements.containers.gift,
            () => {
                // Start gift animations after transition
                this.animationManager.animateGiftEntrance(this.elements.gift.box);
            }
        );
    }
}

/* ==================== GIFT MANAGER ==================== */
class GiftManager {
    constructor(elements, state, animationManager, confettiManager) {
        this.elements = elements;
        this.state = state;
        this.animationManager = animationManager;
        this.confettiManager = confettiManager;
        this.isOpened = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const wrapper = this.elements.gift.wrapper;
        if (wrapper) {
            wrapper.addEventListener('click', () => this.openGift());
            wrapper.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openGift();
                }
            });
        }
    }

    openGift() {
        if (this.isOpened) return;
        this.isOpened = true;

        const wrapper = this.elements.gift.wrapper;
        const box = this.elements.gift.box;
        const lid = this.elements.gift.lid;

        // Remove click handler to prevent multiple clicks
        wrapper.style.pointerEvents = 'none';

        // Trigger confetti first
        setTimeout(() => this.confettiManager.burst(), 200);

        // Animate gift opening
        this.animationManager.animateGiftOpening(box, lid, () => {
            this.transitionToRevealScreen();
        });
    }

    transitionToRevealScreen() {
        this.state.setScreen('reveal');
        this.animationManager.fadeTransition(
            this.elements.containers.gift,
            this.elements.containers.reveal,
            () => {
                this.setupRevealScreen();
            }
        );
    }

    setupRevealScreen() {
        // Set random graduation image
        const randomImage = Utils.getRandomItem(GRADUATION_IMAGES);
        this.elements.reveal.image.src = randomImage;

        // Set personalized wish
        const randomWish = Utils.getRandomItem(this.state.wishes);
        const personalizedWish = randomWish.text.replace('{name}', this.state.userName);
        this.elements.reveal.wish.textContent = personalizedWish;

        // Create invitation template with QR code information
        const qrMessage = this.createQRMessage();
        const invitationContent = INVITATION_TEMPLATE.replace('{name}', this.state.userName) + qrMessage;
        
        // Set invitation details
        this.elements.reveal.details.innerHTML = invitationContent;

        // Animate reveal entrance
        const imageSection = this.elements.containers.reveal.querySelector('.invitation-image-section');
        const contentSection = this.elements.containers.reveal.querySelector('.invitation-content-section');
        
        if (imageSection && contentSection) {
            this.animationManager.animateRevealEntrance(imageSection, contentSection);
        }
    }

    createQRMessage() {
        const isOutsider = this.state.userType === 'outsider';
        const className = isOutsider ? 'outsider' : 'insider';
        
        if (isOutsider) {
            return `
                <div class="qr-message ${className}">
                    <p>QR code sẽ được gửi về email cá nhân của <strong>${this.state.userName}</strong> é nhe. Check mail thường xuyên nhé có QR code mới được vào trường dự lễ nhoaa 📧</p>
                </div>
            `;
        } else {
            return `
                <div class="qr-message ${className}">
                    <p>Sinh viên trường thì ko cần mã QR 🎓</p>
                </div>
            `;
        }
    }
}

/* ==================== MAIN APPLICATION ==================== */
class GraduationApp {
    constructor() {
        this.state = new AppState();
        this.elements = new DOMElements();
        this.wishLoader = new WishLoader();
        this.threeSceneManager = null;
        this.confettiManager = null;
        this.animationManager = null;
        this.formManager = null;
        this.giftManager = null;
    }

    async init() {
        try {
            this.state.setLoading(true);

            // Initialize DOM elements
            this.elements.init();

            // Load wishes data
            const wishes = await this.wishLoader.load();
            this.state.setWishes(wishes);

            // Initialize managers
            this.animationManager = new AnimationManager(this.state);
            this.confettiManager = new ConfettiManager(this.elements.canvas.confetti);
            
            if (this.elements.canvas.three) {
                this.threeSceneManager = new ThreeSceneManager(this.elements.canvas.three);
                this.state.threeScene = this.threeSceneManager;
            }

            this.formManager = new FormManager(this.elements, this.state, this.animationManager);
            this.giftManager = new GiftManager(this.elements, this.state, this.animationManager, this.confettiManager);

            // Setup reset functionality
            this.setupResetButton();

            // Show initial screen
            this.showInitialScreen();

            this.state.setLoading(false);

        } catch (error) {
            console.error('App initialization error:', error);
            this.state.setLoading(false);
            this.showError('Ứng dụng gặp lỗi khi khởi tạo');
        }
    }

    setupResetButton() {
        const resetBtn = this.elements.reveal.resetBtn;
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    showInitialScreen() {
        this.state.setScreen('form');
        this.elements.containers.form.classList.add('active');
        
        // Animate form entrance
        gsap.from(this.elements.containers.form.querySelector('.card'), {
            duration: CONFIG.animation.duration.slow,
            y: 50,
            opacity: 0,
            ease: CONFIG.animation.easing.default,
            delay: 0.2
        });
    }

    reset() {
        // Clean up current state
        this.state.killAllAnimations();
        this.state.setUserName('');
        this.state.setUserType('');
        this.giftManager.isOpened = false;

        // Reset form
        this.elements.form.element.reset();
        this.elements.form.nameInput.setCustomValidity('');
        this.elements.form.userTypeSelect.setCustomValidity('');

        // Reset gift wrapper
        const wrapper = this.elements.gift.wrapper;
        if (wrapper) {
            wrapper.style.pointerEvents = 'auto';
        }

        // Reset containers
        Object.values(this.elements.containers).forEach(container => {
            container.classList.remove('active');
        });

        // Transition back to form
        this.state.setScreen('form');
        this.elements.containers.form.classList.add('active');

        // Animate form re-entrance
        gsap.from(this.elements.containers.form.querySelector('.card'), {
            duration: CONFIG.animation.duration.normal,
            scale: 0.9,
            opacity: 0,
            ease: CONFIG.animation.easing.default
        });
    }

    showError(message) {
        console.error(message);
        // Implement user-friendly error display
        alert(message); // Simple fallback
    }

    destroy() {
        // Clean up resources
        this.state.killAllAnimations();
        
        if (this.threeSceneManager) {
            this.threeSceneManager.destroy();
        }
    }
}

/* ==================== INITIALIZATION ==================== */
document.addEventListener('DOMContentLoaded', async () => {
    // Check for required dependencies
    if (typeof gsap === 'undefined') {
        console.error('GSAP is required but not loaded');
        return;
    }

    if (typeof confetti === 'undefined') {
        console.warn('Confetti library not loaded, confetti effects will be disabled');
    }

    try {
        const app = new GraduationApp();
        await app.init();

        // Store app instance globally for debugging
        window.graduationApp = app;

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            app.destroy();
        });

    } catch (error) {
        console.error('Failed to initialize graduation app:', error);
    }
});

/* ==================== ERROR HANDLING ==================== */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

/* ==================== PERFORMANCE MONITORING ==================== */
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}