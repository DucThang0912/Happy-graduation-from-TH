/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as THREE from 'three';

// GSAP and Confetti are loaded from CDN in index.html

// --- DOM Element Selectors ---
const formContainer = document.getElementById('form-container');
const giftContainer = document.getElementById('gift-container');
const revealContainer = document.getElementById('reveal-container');
const wishForm = document.getElementById('wish-form');
const nameInput = document.getElementById('name');
const giftWrapper = document.getElementById('gift-wrapper');
const giftBox = document.getElementById('gift-box');
const revealedImage = document.getElementById('revealed-image');
const revealedWish = document.getElementById('revealed-wish');
const invitationDetails = document.getElementById('invitation-details');
const resetButton = document.getElementById('reset-button');

// --- Three.js Variables ---
let scene, camera, renderer, particles, mouse;

let userName = '';
let wishes = [];
let giftBoxAnimation; // To store the GSAP animation instance

// --- Content ---

// A list of graduation photos for Thiên Hương.
// IMPORTANT: Make sure to create an 'Images' folder and add these files.
const GRADUATION_IMAGES = [
    'Images/thienhuong-grad-1.jpg',
    'Images/thienhuong-grad-2.jpg'
];

// Invitation for Slot 1 (Morning)
const INVITATION_HTML_SLOT_1 = `
    <div class="divider"></div>
    <p class="invite-header">Trân trọng kính mời bạn tới tham dự</p>
    <h2 class="event-title">LỄ TRAO BẰNG TỐT NGHIỆP</h2>
    <p class="event-host">của <strong>Thiên Hương</strong></p>
    <div class="event-details">
        <p><strong>Thời gian:</strong> 10:30 -> 12:00, Thứ Sáu, Ngày 15 tháng 08 năm 2025</p>
        <p><strong>Địa điểm:</strong> Đại học Văn Lang CS3 - 69/68 Đ. Đặng Thùy Trâm, Phường 13, Bình Thạnh, TPHCM</p>
    </div>
    <p class="closing-text">Sự hiện diện của bạn là niềm vinh hạnh và là món quà lớn nhất đối với mình!</p>
`;

// Invitation for Slot 2 (Afternoon)
const INVITATION_HTML_SLOT_2 = `
    <div class="divider"></div>
    <p class="invite-header">Trân trọng kính mời bạn tới tham dự</p>
    <h2 class="event-title">LỄ TRAO BẰNG TỐT NGHIỆP</h2>
    <p class="event-host">của <strong>Thiên Hương</strong></p>
    <div class="event-details">
        <p><strong>Thời gian:</strong> 14:00 -> 15:30, Thứ Sáu, Ngày 15 tháng 08 năm 2025</p>
        <p><strong>Địa điểm:</strong> Đại học Văn Lang CS3 - 69/68 Đ. Đặng Thùy Trâm, Phường 13, Bình Thạnh, TPHCM</p>
    </div>
    <p class="closing-text">Sự hiện diện của bạn là niềm vinh hạnh và là món quà lớn nhất đối với mình!</p>
`;


// --- Functions ---

/**
 * Fetches wishes from the local JSON file.
 */
async function loadWishes() {
    try {
        const response = await fetch('wishes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        wishes = await response.json();
    } catch (error) {
        console.error("Could not load wishes:", error);
        // Fallback wishes in case the fetch fails
        wishes = [
            { text: "Cảm ơn {name} rất nhiều vì đã luôn ở bên cạnh và ủng hộ mình!" },
            { text: "Hành trình này sẽ không thể trọn vẹn nếu thiếu đi sự đồng hành của {name}. Trân trọng bạn!" }
        ];
    }
}

/**
 * Picks a random item from an array.
 * @param {Array} arr The array to pick from.
 * @returns A random item from the array.
 */
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Triggers a confetti explosion.
 */
function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const celebration = confetti.create(canvas, {
        resize: true,
        useWorker: true
    });
    celebration({
        particleCount: 200,
        spread: 180,
        origin: { y: 0.6 },
        colors: ['#6a11cb', '#2575fc', '#ffffff', '#f1c40f']
    });
}

/**
 * Sets up and shows the revealed gift card.
 */
function showReveal() {
    // Add class to expand the main container
    document.body.classList.add('reveal-screen-active');

    // Set a random graduation image of Thiên Hương
    revealedImage.src = getRandomItem(GRADUATION_IMAGES);
    
    // Get a random thank you message and personalize it
    const randomWish = getRandomItem(wishes).text;
    revealedWish.textContent = randomWish.replace('{name}', userName);

    // Determine which invitation to show based on URL
    const path = window.location.pathname;
    let invitationHTML;
    
    // Check if the path ends with '/1' or '/1/'
    // This handles URLs like .../Happy-graduation-from-TH/1
    if (path.endsWith('/1') || path.endsWith('/1/')) {
        invitationHTML = INVITATION_HTML_SLOT_2;
    } else {
        invitationHTML = INVITATION_HTML_SLOT_1;
    }

    // Add the invitation details
    invitationDetails.innerHTML = invitationHTML;

    // Show the reveal container
    giftContainer.classList.add('hidden');
    revealContainer.classList.remove('hidden');
    gsap.set(revealContainer, { opacity: 1 });

    // Animate in the new layout
    const tl = gsap.timeline();
    tl.from('#invitation-image-wrapper', {
        duration: 0.8,
        x: -80,
        opacity: 0,
        ease: 'power3.out'
    })
    .from('#invitation-text-wrapper', {
        duration: 0.8,
        x: 80,
        opacity: 0,
        ease: 'power3.out'
    }, "-=0.6") // overlap animation
    .from('#reset-button', {
        duration: 0.6,
        y: 50,
        opacity: 0,
        ease: 'back.out(1.7)'
    }, "-=0.4");
}


/**
 * Handles the gift box click event.
 */
function handleGiftClick() {
    giftWrapper.removeEventListener('click', handleGiftClick); // Prevent multiple clicks
    
    // Stop the breathing animation
    if (giftBoxAnimation) {
        giftBoxAnimation.kill();
    }
    // Reset hover styles on wrapper
    gsap.to(giftWrapper, { scale: 1, y: 0, filter: 'none', duration: 0.1 });

    const tl = gsap.timeline({
        onComplete: showReveal // Call showReveal once this timeline is done
    });
    const lid = giftBox.querySelector('.lid');

    // 1. Shake animation
    tl.to(giftBox, { 
        duration: 0.07, 
        x: 'random(-10, 10)', 
        y: 'random(-5, 5)', 
        rotation: 'random(-5, 5)', 
        repeat: 10, 
        ease: 'power1.inOut' 
    });

    // 2. Open lid
    tl.to(lid, { 
        duration: 0.5, 
        y: -120, 
        rotation: 30, 
        opacity: 0, 
        ease: 'power2.in' 
    }, ">-0.2");

    // 3. Trigger confetti during lid opening
    tl.call(triggerConfetti, [], "<0.2");

    // 4. Fade out the gift container to transition smoothly
    tl.to(giftContainer, {
        duration: 0.5,
        opacity: 0,
        ease: 'power1.in'
    }, "+=0.1");
}

/**
 * Transitions to the gift screen and starts animations.
 */
function showGiftScreen() {
    document.body.classList.add('gift-screen-active');
    formContainer.classList.add('hidden');
    giftContainer.classList.remove('hidden');
    gsap.set(giftContainer, { opacity: 1 }); // Reset opacity before showing
    giftWrapper.addEventListener('click', handleGiftClick);
    
    const lid = giftBox.querySelector('.lid');
    gsap.set([giftWrapper, giftBox, lid], { clearProps: "all" });

    // Animate the gift box appearing and then start breathing
    giftBoxAnimation = gsap.timeline()
        .fromTo(giftBox, 
            { y: -300, opacity: 0, scale: 0.5 }, 
            { duration: 1, y: 0, opacity: 1, scale: 1, ease: 'bounce.out' }
        )
        .to(giftBox, 
            { 
                y: -15,
                scale: 1.03, // Add gentle scaling to the breathing
                duration: 2.5, 
                repeat: -1, 
                yoyo: true, 
                ease: 'power1.inOut' 
            },
            "+=0.2"
        );
}


/**
 * Handles the form submission.
 * @param {Event} event The form submission event.
 */
function handleFormSubmit(event) {
    event.preventDefault();
    userName = nameInput.value.trim();
    if (userName) {
        showGiftScreen();
    }
}

/**
 * Resets the application to its initial state.
 */
function resetApp() {
    document.body.classList.remove('gift-screen-active');
    document.body.classList.remove('reveal-screen-active'); // Remove the reveal class
    revealContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
    wishForm.reset();

    if (giftBoxAnimation) {
        giftBoxAnimation.kill();
    }
    const lid = giftBox.querySelector('.lid');
    gsap.set([giftWrapper, giftBox, lid], { clearProps: "all" });

    gsap.from('#form-container .card', { duration: 0.7, y: 50, opacity: 0, ease: 'power2.out' });
}


// --- Three.js Functions ---

/**
 * Initializes the Three.js scene, camera, renderer, and particles.
 */
function initThreeJS() {
    // Scene
    scene = new THREE.Scene();

    // Mouse tracking for parallax
    mouse = new THREE.Vector2();
    document.addEventListener('mousemove', onMouseMove, false);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const canvas = document.getElementById('three-canvas');
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particles
    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColors = [
        new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--primary-color')),
        new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--secondary-color')),
        new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--gift-color')),
        new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--ribbon-color')),
    ];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 12;
        positions[i3 + 1] = (Math.random() - 0.5) * 12;
        positions[i3 + 2] = (Math.random() - 0.5) * 12;

        const randomColor = baseColors[Math.floor(Math.random() * baseColors.length)];
        colors[i3] = randomColor.r;
        colors[i3 + 1] = randomColor.g;
        colors[i3 + 2] = randomColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Listeners
    window.addEventListener('resize', onWindowResize, false);

    // Start animation
    animateThree();
}

/**
 * Animation loop for the Three.js scene.
 */
function animateThree() {
    requestAnimationFrame(animateThree);

    const elapsedTime = new Date().getTime() * 0.0001;

    // Animate particles
    particles.rotation.y = elapsedTime * 0.2;
    particles.rotation.x = elapsedTime * 0.1;

    // Animate camera (parallax effect)
    if (mouse.x && mouse.y) {
       camera.position.x += (mouse.x * 0.1 - camera.position.x) * 0.02;
       camera.position.y += (-mouse.y * 0.1 - camera.position.y) * 0.02;
    }
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

/**
 * Handles window resize events.
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Handles mouse move events to update the mouse vector.
 * @param {MouseEvent} event
 */
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    loadWishes();
    initThreeJS();
    wishForm.addEventListener('submit', handleFormSubmit);
    resetButton.addEventListener('click', resetApp);
    
    gsap.from('#form-container .card', { duration: 0.7, y: 50, opacity: 0, ease: 'power2.out', delay: 0.2 });
});
