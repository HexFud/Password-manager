// script.js (FINAL CORRECTED VERSION)
document.addEventListener('DOMContentLoaded', () => {
    // --- State and API URL ---
    const API_URL = 'http://127.0.0.1:5000/api';
    let allPasswords = [];
    let currentPasswordData = null;

    // --- DOM Elements ---
    const unlockScreen = document.getElementById('unlock-screen');
    const mainAppScreen = document.getElementById('main-app');
    const unlockForm = document.getElementById('unlock-form');
    const masterPasswordInput = document.getElementById('master-password-input');
    const confirmMasterPasswordInput = document.getElementById('confirm-master-password-input');
    const unlockTitle = document.getElementById('unlock-title');
    const unlockSubtitle = document.getElementById('unlock-subtitle');
    const unlockButton = document.getElementById('unlock-button');
    const errorMessage = document.getElementById('error-message');
    const toast = document.getElementById('toast');
    const searchInput = document.getElementById('search-input');
    const passwordListContainer = document.getElementById('password-list-container');
    const addNewButton = document.getElementById('add-new-button');
    const detailsPlaceholder = document.getElementById('details-placeholder');
    const detailsView = document.getElementById('details-view');
    const formView = document.getElementById('form-view');
    const detailsAccountName = document.getElementById('details-account-name');
    const detailsUsername = document.getElementById('details-username');
    const detailsPassword = document.getElementById('details-password');
    const detailsUrl = document.getElementById('details-url');
    const detailsCategory = document.getElementById('details-category');
    const detailsNotes = document.getElementById('details-notes');
    const revealPasswordBtn = document.getElementById('reveal-password-btn');
    const editButton = document.getElementById('edit-button');
    const deleteButton = document.getElementById('delete-button');
    const entryForm = document.getElementById('entry-form');
    const formTitle = document.getElementById('form-title');
    const formModeInput = document.getElementById('form-mode');
    const originalAccountNameInput = document.getElementById('original-account-name');
    const accountInput = document.getElementById('account-input');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const urlInput = document.getElementById('url-input');
    const categoryInput = document.getElementById('category-input');
    const notesInput = document.getElementById('notes-input');
    const generatePasswordBtn = document.getElementById('generate-password-btn');
    const cancelFormBtn = document.getElementById('cancel-form-btn');

    // --- Helper Functions ---
    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };
    const displayError = (message) => { errorMessage.textContent = message; };
    const clearError = () => { errorMessage.textContent = ''; };

    const apiCall = async (endpoint, method = 'GET', body = null) => {
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) options.body = JSON.stringify(body);
            const response = await fetch(`${API_URL}${endpoint}`, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred');
            }
            const contentType = response.headers.get("content-type");
            return contentType?.includes("application/json") ? response.json() : {};
        } catch (error) {
            console.error('API Call Failed:', error.message);
            if (endpoint !== '/login' && endpoint !== '/setup') showToast(`Error: ${error.message}`);
            throw error;
        }
    };

    // --- ANIMATION: RIPPLE EFFECT ---
    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add("ripple");
        const ripple = button.getElementsByClassName("ripple")[0];
        if (ripple) ripple.remove();
        button.appendChild(circle);
    }
    const buttons = document.querySelectorAll(".btn-primary, .btn-secondary, .btn-danger, .card button, .left-pane-header button, .detail-item button");
    buttons.forEach(button => button.addEventListener("click", createRipple));

    // --- UI Control Functions (CORRECTED) ---
    const showRightPane = (paneToShow) => {
        const currentVisible = document.querySelector('.right-pane-content.visible');
        if (currentVisible) currentVisible.classList.remove('visible');

        // Wait for the fade-out transition to finish before hiding the old pane
        setTimeout(() => {
            if (currentVisible) currentVisible.classList.add('hidden');
            if (paneToShow) {
                paneToShow.classList.remove('hidden'); // IMPORTANT FIX
                // Use a nested timeout to allow the browser to process 'display: block' before starting the opacity transition
                setTimeout(() => paneToShow.classList.add('visible'), 20);
            }
        }, 200); // This delay should be slightly less than the animation time
    };

    const renderPasswordList = (filter = '') => {
        passwordListContainer.innerHTML = '';
        const filtered = allPasswords.filter(p => p.account.toLowerCase().includes(filter.toLowerCase()));
        if (filtered.length === 0) {
            const message = allPasswords.length > 0 ? 'No matches found.' : 'Your vault is empty.<br>Click \'+\' to add an entry.';
            passwordListContainer.innerHTML = `<p style="text-align: center; opacity: 0.5;">${message}</p>`;
            return;
        }
        filtered.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.account = p.account;
            item.innerHTML = `<div class="item-account">${p.account}</div><div class="item-category">${p.category}</div>`;
            passwordListContainer.appendChild(item);
            setTimeout(() => item.classList.add('visible'), index * 50);
        });
    };

    const displayDetails = (data) => {
        currentPasswordData = data;
        detailsAccountName.textContent = data.account;
        detailsUsername.textContent = data.username;
        detailsPassword.textContent = 'â¢â¢â¢â¢â¢â¢â¢â¢â¢â¢â¢â¢';
        detailsPassword.dataset.password = data.password;
        detailsPassword.classList.add('blurred');
        revealPasswordBtn.textContent = 'Reveal';
        detailsUrl.textContent = data.url;
        detailsUrl.href = data.url && data.url.startsWith('http') ? data.url : `https://${data.url}`;
        detailsCategory.textContent = data.category;
        detailsNotes.textContent = data.notes;
        showRightPane(detailsView);
    };

    const showAddForm = () => {
        currentPasswordData = null;
        document.querySelectorAll('.list-item.active').forEach(i => i.classList.remove('active'));
        formTitle.textContent = "Add New Entry";
        entryForm.reset();
        formModeInput.value = 'add';
        accountInput.disabled = false;
        showRightPane(formView);
    };

    const showEditForm = (data) => {
        formTitle.textContent = `Edit: ${data.account}`;
        entryForm.reset();
        formModeInput.value = 'edit';
        originalAccountNameInput.value = data.account;
        accountInput.value = data.account;
        accountInput.disabled = true;
        usernameInput.value = data.username;
        passwordInput.value = data.password;
        urlInput.value = data.url;
        categoryInput.value = data.category;
        notesInput.value = data.notes;
        showRightPane(formView);
    };

    const loadAndRenderPasswords = async () => {
        try {
            allPasswords = await apiCall('/passwords');
            renderPasswordList();
        } catch (error) { /* handled */ }
    };

    const setupForFirstTime = () => {
        unlockTitle.textContent = 'Create Master Password';
        unlockSubtitle.textContent = 'Welcome! Set up a master password for your new vault.';
        confirmMasterPasswordInput.classList.remove('hidden');
        unlockButton.textContent = 'Create Vault';
    };

    // --- Event Listeners ---
    unlockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();
        const password = masterPasswordInput.value;
        const isSetupMode = !confirmMasterPasswordInput.classList.contains('hidden');
        if (isSetupMode) {
            const confirmPassword = confirmMasterPasswordInput.value;
            if (password !== confirmPassword) { return displayError('Passwords do not match.'); }
            try {
                await apiCall('/setup', 'POST', { password });
                location.reload();
            } catch (error) { displayError(error.message); }
        } else {
            try {
                await apiCall('/login', 'POST', { password });
                unlockScreen.classList.add('hidden');
                mainAppScreen.classList.remove('hidden');
                loadAndRenderPasswords();
                showRightPane(detailsPlaceholder);
            } catch (error) { displayError('Invalid master password.'); }
        }
    });

    searchInput.addEventListener('input', () => renderPasswordList(searchInput.value));

    passwordListContainer.addEventListener('click', async (e) => {
        const item = e.target.closest('.list-item');
        if (!item) return;
        document.querySelectorAll('.list-item.active').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const account = item.dataset.account;
        try {
            const details = await apiCall(`/passwords/${account}`);
            displayDetails(details);
        } catch (error) { /* Handled */ }
    });

    addNewButton.addEventListener('click', showAddForm);

    cancelFormBtn.addEventListener('click', () => {
        if (currentPasswordData) {
            showRightPane(detailsView);
        } else {
            showRightPane(detailsPlaceholder);
        }
    });

    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isEditMode = formModeInput.value === 'edit';
        const formData = {
            account: accountInput.value, username: usernameInput.value, password: passwordInput.value,
            url: urlInput.value, category: categoryInput.value || 'General', notes: notesInput.value,
        };
        try {
            let details;
            if (isEditMode) {
                const originalAccount = originalAccountNameInput.value;
                await apiCall(`/passwords/${originalAccount}`, 'PUT', formData);
                showToast('Entry updated successfully!');
                details = await apiCall(`/passwords/${formData.account}`);
            } else {
                await apiCall('/passwords', 'POST', formData);
                showToast('Entry added successfully!');
                details = await apiCall(`/passwords/${formData.account}`);
            }
            await loadAndRenderPasswords();
            setTimeout(() => {
                document.querySelector(`.list-item[data-account="${formData.account}"]`)?.classList.add('active');
            }, (allPasswords.length * 50) + 50);
            displayDetails(details);
        } catch (error) { /* Handled */ }
    });

    revealPasswordBtn.addEventListener('click', () => {
        if (detailsPassword.classList.contains('blurred')) {
            detailsPassword.textContent = detailsPassword.dataset.password;
            detailsPassword.classList.remove('blurred');
            revealPasswordBtn.textContent = 'Hide';
        } else {
            detailsPassword.textContent = 'â¢â¢â¢â¢â¢â¢â¢â¢â¢â¢â¢â¢';
            detailsPassword.classList.add('blurred');
            revealPasswordBtn.textContent = 'Reveal';
        }
    });

    document.body.addEventListener('click', e => {
        if(e.target.classList.contains('copy-btn')) {
            const targetId = e.target.dataset.copyTarget;
            const elementToCopy = document.getElementById(targetId);
            const textToCopy = targetId === 'details-password' ? elementToCopy.dataset.password : elementToCopy.textContent;
            navigator.clipboard.writeText(textToCopy);
            showToast(`${targetId.split('-')[1].charAt(0).toUpperCase() + targetId.split('-')[1].slice(1)} copied!`);
        }
    });

    editButton.addEventListener('click', () => { if (currentPasswordData) showEditForm(currentPasswordData); });

    deleteButton.addEventListener('click', async () => {
        if (!currentPasswordData) return;
        if (confirm(`Are you sure you want to delete the entry for ${currentPasswordData.account}?`)) {
            try {
                await apiCall(`/passwords/${currentPasswordData.account}`, 'DELETE');
                showToast('Entry deleted.');
                currentPasswordData = null;
                await loadAndRenderPasswords();
                showRightPane(detailsPlaceholder);
            } catch(error) { /* Handled */ }
        }
    });

    generatePasswordBtn.addEventListener('click', async () => {
        try {
            const { password } = await apiCall('/generate-password');
            passwordInput.value = password;
            showToast('New secure password generated!');
        } catch (error) { /* Handled */ }
    });

    // --- Initialization ---
    const init = async () => {
        try {
            const status = await apiCall('/status');
            if (!status.is_setup) {
                setupForFirstTime();
            }
            unlockScreen.classList.remove('hidden');
        } catch (error) {
             unlockTitle.textContent = "Connection Error";
             unlockSubtitle.textContent = "Could not connect to the backend server.";
             displayError("Please make sure 'python backend.py' is running and try again.");
        }
    };

    init();
});
