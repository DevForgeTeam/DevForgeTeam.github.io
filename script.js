// ==============================
// Editable site settings
// ==============================

const SITE_CONFIG = {
    githubOrganization: "DevForgeTeam",
    githubOrganizationUrl: "https://github.com/DevForgeTeam",
    githubReposApi: "https://api.github.com/orgs/DevForgeTeam/repos?sort=updated&per_page=3",
    themeStorageKey: "devforge-theme",
    memberPreviewLimit: 4
};

// Add or remove team members here. The page updates automatically.
const teamMembers = [
    {
        name: "Erkan",
        role: "Student Developer",
        github: "https://github.com/ErkanSoftwareDeveloper"
    },
    {
        name: "Huseyin",
        role: "Student Developer",
        github: "https://github.com/hseyinblgc"
    },
    {
        name: "Madhav",
        role: "Full-Stack Developer",
        github: "https://github.com/MadhavAgarwal1411"
    },
    {
        name: "Rezbee",
        role: "Software Developer",
        github: "https://github.com/rezbee-dev"
    }
];

// ==============================
// DOM elements
// ==============================

const elements = {
    memberList: document.querySelector("#member-list"),
    memberCount: document.querySelector("#member-count"),
    memberToggle: document.querySelector("#member-toggle"),
    projectsList: document.querySelector("#projects-list"),
    themeToggle: document.querySelector("#theme-toggle")
};

const state = {
    showAllMembers: false
};

// ==============================
// Small helpers
// ==============================

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        return;
    }
}

function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function formatProjectDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "recently";
    }

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

// ==============================
// Team members
// ==============================

function createMemberItem(member) {
    const name = escapeHTML(member.name);
    const role = escapeHTML(member.role);
    const github = escapeHTML(member.github);
    const initials = escapeHTML(getInitials(member.name));

    return `
        <li>
            <span class="member-avatar">${initials}</span>
            <span class="member-info">
                <span class="member-name">${name}</span>
                <span class="member-role">${role}</span>
            </span>
            <a href="${github}" target="_blank" rel="noopener">GitHub</a>
        </li>
    `;
}

function renderTeamMembers() {
    if (!elements.memberList || !elements.memberCount) {
        return;
    }

    const visibleMembers = state.showAllMembers
        ? teamMembers
        : teamMembers.slice(0, SITE_CONFIG.memberPreviewLimit);

    elements.memberCount.textContent = teamMembers.length;
    elements.memberList.innerHTML = visibleMembers.map(createMemberItem).join("");

    if (elements.memberToggle) {
        elements.memberToggle.hidden = teamMembers.length <= SITE_CONFIG.memberPreviewLimit;
        elements.memberToggle.textContent = state.showAllMembers
            ? "Show fewer members"
            : `View all members (${teamMembers.length})`;
    }
}

function setupTeamMembers() {
    renderTeamMembers();

    if (!elements.memberToggle) {
        return;
    }

    elements.memberToggle.addEventListener("click", () => {
        state.showAllMembers = !state.showAllMembers;
        renderTeamMembers();
    });
}

// ==============================
// Theme toggle
// ==============================

function setTheme(mode) {
    const isDark = mode === "dark";
    document.body.classList.toggle("dark-mode", isDark);

    if (elements.themeToggle) {
        elements.themeToggle.textContent = isDark ? "Light" : "Dark";
        elements.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }

    writeStorage(SITE_CONFIG.themeStorageKey, mode);
}

function setupThemeToggle() {
    const savedTheme = readStorage(SITE_CONFIG.themeStorageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const startTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(startTheme);

    if (!elements.themeToggle) {
        return;
    }

    elements.themeToggle.addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
        setTheme(nextTheme);
    });
}

// ==============================
// Page navigation
// ==============================

function setupPageLinks() {
    const pageLinks = document.querySelectorAll('a[href^="#"]');

    pageLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");
            const target = document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.pushState(null, "", targetId);
        });
    });
}

// ==============================
// GitHub projects
// ==============================

function createProjectCard(repo) {
    const name = escapeHTML(repo.name);
    const url = escapeHTML(repo.html_url);
    const description = escapeHTML(repo.description || "A DevForgeTeam project from our GitHub organization.");
    const language = escapeHTML(repo.language || "Code");
    const updatedAt = escapeHTML(formatProjectDate(repo.updated_at));
    const stars = Number(repo.stargazers_count || 0);

    return `
        <a class="project-card" href="${url}" target="_blank" rel="noopener">
            <h3>${name}</h3>
            <p>${description}</p>
            <span class="project-meta">
                <span class="project-language">${language}</span>
                <span>${stars} stars</span>
                <span>Updated ${updatedAt}</span>
            </span>
        </a>
    `;
}

function renderProjects(repositories) {
    if (!elements.projectsList) {
        return;
    }

    if (!repositories.length) {
        elements.projectsList.innerHTML = '<p class="projects-message">No public projects found yet.</p>';
        return;
    }

    elements.projectsList.innerHTML = repositories.map(createProjectCard).join("");
}

async function loadGitHubProjects() {
    if (!elements.projectsList) {
        return;
    }

    try {
        const response = await fetch(SITE_CONFIG.githubReposApi);

        if (!response.ok) {
            throw new Error("GitHub request failed");
        }

        const repositories = await response.json();
        renderProjects(repositories);
    } catch (error) {
        elements.projectsList.innerHTML = `
            <p class="projects-message">
                GitHub projects could not be loaded right now. You can still visit our
                <a href="${SITE_CONFIG.githubOrganizationUrl}" target="_blank" rel="noopener">organization page</a>.
            </p>
        `;
    }
}

// ==============================
// Start the page
// ==============================

setupTeamMembers();
setupThemeToggle();
setupPageLinks();
loadGitHubProjects();
