// script.js

// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGpfevEiVGjE27xWOm3AJcn5NNgemKwfA",
    authDomain: "supun-portfolio.firebaseapp.com",
    projectId: "supun-portfolio",
    storageBucket: "supun-portfolio.firebasestorage.app",
    messagingSenderId: "585985466473",
    appId: "1:585985466473:web:e07ad9fa0cefe3d750c2f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProjects = []; // Store projects locally for filtering

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Navigation Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        });
    });

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Active Link Switching ---
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').includes(current)) {
                item.classList.add('active');
            }
        });
    });

    // --- Typewriter Effect ---
    const typeWriterElement = document.querySelector('.typing-text');
    const words = ['Web Developer', 'UI/UX Designer', 'WordPress Expert', 'Network Engineer', 'System Administrator'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function typeWriter() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
            typeWriterElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typeWriterElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }
        setTimeout(typeWriter, typeSpeed);
    }
    if (typeWriterElement) {
        setTimeout(typeWriter, 1000);
    }

    // --- Scroll Animations (Intersection Observer) ---
    const animatedSections = document.querySelectorAll('.fade-in-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    animatedSections.forEach(section => {
        observer.observe(section);
    });

    // --- Form Submission Handling ---
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';

            try {
                // Send AJAX POST request to FormSubmit Free API
                const response = await fetch("https://formsubmit.co/ajax/uds67162@gmail.com", {
                    method: "POST",
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        message: message
                    })
                });

                if (response.ok) {
                    contactForm.reset();
                    submitBtn.innerHTML = 'Message Sent <i class="fas fa-check"></i>';
                    submitBtn.style.background = '#00d2ff';
                } else {
                    alert("Oops! There was a problem submitting your form.");
                    submitBtn.innerHTML = 'Error <i class="fas fa-times"></i>';
                    submitBtn.style.background = '#ff4b4b';
                }
            } catch (error) {
                alert("Oops! There was a network error. Ensure ad-blockers aren't blocking the form.");
                submitBtn.innerHTML = 'Error <i class="fas fa-times"></i>';
                submitBtn.style.background = '#ff4b4b';
            }

            // Revert button after 3 seconds
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
            }, 3000);
        });
    }

    // --- Firebase Projects Loading & Filtering ---
    const projectsContainer = document.getElementById('portfolio-projects');
    const filterBtns = document.querySelectorAll('.filter-btn');

    async function fetchProjects() {
        try {
            const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            allProjects = []; // reset array
            querySnapshot.forEach((doc) => {
                allProjects.push({ id: doc.id, ...doc.data() });
            });

            renderProjects(allProjects);

        } catch (error) {
            console.error("Error fetching projects: ", error);
            if (projectsContainer) {
                projectsContainer.innerHTML = `
                    <div style="text-align: center; width: 100%; grid-column: 1 / -1;">
                        <p>No projects loaded yet or Firebase is unconfigured.</p>
                        <p style="font-size:0.9rem; color:var(--text-secondary);">Add your Firebase config to script.js and add projects via the admin panel!</p>
                    </div>`;
            }
        }
    }

    function renderProjects(projectsToRender) {
        if (!projectsContainer) return;

        projectsContainer.innerHTML = '';

        if (projectsToRender.length === 0) {
            projectsContainer.innerHTML = `
                <div style="text-align: center; width: 100%; grid-column: 1 / -1; color: var(--text-secondary);">
                    No projects found for this category.
                </div>
            `;
            return;
        }

        projectsToRender.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card glass-panel fade-in-section';
            
            let imgSrc = project.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
            try {
                const urlObj = new URL(imgSrc);
                if (urlObj.hostname.includes('drive.google.com')) {
                    const paths = urlObj.pathname.split('/');
                    if (paths.includes('file') && paths.includes('d')) {
                        const fileId = paths[paths.indexOf('d') + 1];
                        imgSrc = `https://lh3.googleusercontent.com/d/${fileId}`;
                    } else if (urlObj.searchParams.get('id')) {
                        imgSrc = `https://lh3.googleusercontent.com/d/${urlObj.searchParams.get('id')}`;
                    }
                }
            } catch (e) {}

            card.innerHTML = `
                <div class="project-img">
                    <img src="${imgSrc}" alt="${project.title}">
                </div>
                <div class="project-info">
                    <div class="project-tags">
                        <span>${project.category}</span>
                    </div>
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <button class="view-btn open-modal-btn" style="background:none;border:none;font:inherit;cursor:pointer;padding:0;">View Details <i class="fas fa-arrow-right"></i></button>
                </div>
            `;
            
            const openBtn = card.querySelector('.open-modal-btn');
            openBtn.addEventListener('click', () => {
                if (window.openProjectModal) {
                    window.openProjectModal(project, imgSrc);
                }
            });

            projectsContainer.appendChild(card);

            // Observe new elements for scroll animation
            setTimeout(() => { card.classList.add('is-visible'); }, 100);
        });
    }

    // Category Filtering
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');

            const filterValue = e.target.getAttribute('data-filter');

            if (filterValue === 'All') {
                renderProjects(allProjects);
            } else {
                const filtered = allProjects.filter(p => p.category === filterValue);
                renderProjects(filtered);
            }
        });
    });

    // --- Modal Logic ---
    const modalOverlay = document.getElementById('project-modal');
    
    if (modalOverlay) {
        const closeModalBtn = modalOverlay.querySelector('.close-modal');
        const modalTags = document.getElementById('modal-tags');
        const modalTitle = document.getElementById('modal-title');
        const modalImgMain = document.getElementById('modal-img-main');
        const modalDesc = document.getElementById('modal-desc');
        const modalLink = document.getElementById('modal-link');
        const modalScreenshotsContainer = document.getElementById('modal-screenshots-container');

        // Allow script.js to call this from render hook
        window.openProjectModal = function(project, imgSrc) {
            modalTitle.textContent = project.title;
            modalTags.innerHTML = `<span>${project.category}</span>`;
            modalImgMain.src = imgSrc;
            modalDesc.textContent = project.detailedDesc || project.description || 'No detailed description available.';
            
            if (project.link) {
                modalLink.href = project.link;
                modalLink.style.display = 'inline-block';
            } else {
                modalLink.style.display = 'none';
            }
            
            modalScreenshotsContainer.innerHTML = '';
            let screenHTML = '';
            if (project.screenshot1) {
                screenHTML += `<img src="${project.screenshot1}" alt="Screenshot 1">`;
            }
            if (project.screenshot2) {
                screenHTML += `<img src="${project.screenshot2}" alt="Screenshot 2">`;
            }
            modalScreenshotsContainer.innerHTML = screenHTML;

            // Show modal and disable body scrolling
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        closeModalBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // --- Slider Logic ---
    const sliderPrev = document.getElementById('slider-prev');
    const sliderNext = document.getElementById('slider-next');
    
    if (sliderPrev && sliderNext && projectsContainer) {
        sliderPrev.addEventListener('click', () => {
            const cardElement = projectsContainer.querySelector('.project-card');
            const cardWidth = cardElement ? cardElement.offsetWidth : 300;
            const gap = parseFloat(getComputedStyle(projectsContainer).gap) || 40;
            projectsContainer.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
        });

        sliderNext.addEventListener('click', () => {
            const cardElement = projectsContainer.querySelector('.project-card');
            const cardWidth = cardElement ? cardElement.offsetWidth : 300;
            const gap = parseFloat(getComputedStyle(projectsContainer).gap) || 40;
            projectsContainer.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        });
    }

    // Initial Fetch
    if (projectsContainer) {
        fetchProjects();
    }

});
