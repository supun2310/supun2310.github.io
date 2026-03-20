// admin.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// TODO: Replace this with your app's Firebase project configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');
const addProjectForm = document.getElementById('add-project-form');
const projectsListWrap = document.getElementById('admin-projects-list');

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in.
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadProjects(); // Load projects when logged in
    } else {
        // User is signed out.
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const submitBtn = loginForm.querySelector('button');

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        await signInWithEmailAndPassword(auth, email, password);
        authError.textContent = "";
        loginForm.reset();
    } catch (error) {
        // Only show message to user, do not log full error visually
        authError.textContent = "Invalid email or password.";
        console.error(error);
    } finally {
        submitBtn.innerHTML = 'Login';
    }
});

// Handle Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Handle Adding a Project
addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('proj-title').value;
    const category = document.getElementById('proj-category').value;
    let imageUrl = document.getElementById('proj-image').value;
    const link = document.getElementById('proj-link').value;
    const description = document.getElementById('proj-desc').value;

    // Convert Google Drive sharing link to direct image view link
    try {
        if (imageUrl) {
            const urlObj = new URL(imageUrl);
            if (urlObj.hostname.includes('drive.google.com')) {
                const paths = urlObj.pathname.split('/');
                if (paths.includes('file') && paths.includes('d')) {
                    const fileId = paths[paths.indexOf('d') + 1];
                    imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                } else if (urlObj.searchParams.get('id')) {
                    imageUrl = `https://drive.google.com/uc?export=view&id=${urlObj.searchParams.get('id')}`;
                }
            }
        }
    } catch (e) {
        // Handled silently
    }
    const btn = document.getElementById('add-project-btn');

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        await addDoc(collection(db, "projects"), {
            title: title,
            category: category,
            imageUrl: imageUrl, 
            link: link,
            description: description,
            createdAt: new Date().toISOString()
        });

        addProjectForm.reset();
        await loadProjects(); // reload list
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to add project. Ensure Firestore is configured properly.");
    } finally {
        btn.innerHTML = 'Save Project';
        btn.disabled = false;
    }
});

// Load Projects from Firestore
async function loadProjects() {
    projectsListWrap.innerHTML = '<div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Loading...</div>';

    try {
        // Order by creation date descending
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        projectsListWrap.innerHTML = ''; // clear loading

        if (querySnapshot.empty) {
            projectsListWrap.innerHTML = '<p style="text-align:center; color:#ccc">No projects found. Add one!</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;

            let imgSrc = data.imageUrl || '';
            try {
                const urlObj = new URL(imgSrc);
                if (urlObj.hostname.includes('drive.google.com')) {
                    const paths = urlObj.pathname.split('/');
                    if (paths.includes('file') && paths.includes('d')) {
                        const fileId = paths[paths.indexOf('d') + 1];
                        imgSrc = `https://drive.google.com/uc?export=view&id=${fileId}`;
                    } else if (urlObj.searchParams.get('id')) {
                        imgSrc = `https://drive.google.com/uc?export=view&id=${urlObj.searchParams.get('id')}`;
                    }
                }
            } catch (e) {}

            const div = document.createElement('div');
            div.className = 'admin-project-item';
            div.innerHTML = `
                <img src="${imgSrc}" class="admin-proj-img" alt="${data.title}">
                <div class="admin-proj-info">
                    <h4>${data.title}</h4>
                    <span>${data.category}</span>
                </div>
                <button class="delete-btn" data-id="${id}" title="Delete Project">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            projectsListWrap.appendChild(div);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteProject);
        });

    } catch (error) {
        console.error("Error getting documents: ", error);
        projectsListWrap.innerHTML = '<p class="error-msg">Failed to load projects. Check console.</p>';
    }
}

// Delete Project
async function deleteProject(e) {
    // Navigate to the button element (handling icon clicks)
    const btn = e.target.closest('button');
    const id = btn.getAttribute('data-id');

    if (confirm("Are you sure you want to delete this project?")) {
        try {
            // Change button icon to spinner
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await deleteDoc(doc(db, "projects", id));
            await loadProjects(); // reload list
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("Failed to delete project.");
        }
    }
}
