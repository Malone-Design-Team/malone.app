// Constants and Utility Functions
const TOTAL_WEEKS = 6;

// Helper function for creating resource cards
function createResourceCard(doc) {
	const card = document.createElement("div");
	const title = doc.querySelector("h1")?.innerText || "No Title";
	const image = doc.querySelector("img");

	// Remove the image from the document body if it exists
	if (image) {
		image.parentNode.removeChild(image);
	}

	const content = Array.from(doc.body.children)
		.filter((el) => el.tagName !== "H1")
		.map((el) => el.outerHTML)
		.join("");

	card.className = "card mt-2 mb-2";
	card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${title}</h3>
        </div>
        <div class="card-body d-flex">
            <div class="flex-grow-1">
                ${content}
            </div>
            ${
							image
								? `
                <div class="ms-3" style="min-width: 150px; max-width: 200px;">
                    <img src="${image.src}" alt="${image.alt}" class="img-fluid">
                </div>
            `
								: ""
						}
        </div>
    `;

	return card;
}

// Helper function for creating FAQ cards
function createFAQCard(doc) {
	const card = document.createElement("div");
	const question = doc.querySelector("h3").innerText;
	const answerElements = Array.from(doc.body.children).filter(
		(el) => el.tagName !== "H3",
	);
	const answer = answerElements.map((el) => el.outerHTML).join("");

	card.className = "card mt-2 mb-2";
	card.innerHTML = `
        <div class="card-header">
            <h5 class="text-start p-1">${question}</h5>
        </div>
        <div class="card-body">
            ${answer}
        </div>
    `;

	return card;
}

function hideWeekNavigation() {
	document.getElementById("week-navigation").style.display = "none";
}

function showWeekNavigation() {
	document.getElementById("week-navigation").style.display = "flex";
}

// Service Worker Registration
window.onload = () => {
	"use strict";
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("./sw.js");
	}
};

// Main Application Logic
document.addEventListener("DOMContentLoaded", () => {
	// DOM Elements
	const weekNavigation = document.getElementById("week-navigation");
	const tabLinks = document.querySelectorAll(".nav-link");
	const homeTab = document.getElementById("home-tab");
	const weekContainer = document.querySelector("#home-content");

	let currentWeekIndex = 0;

	// Deep Linking Handler
	function handleDeepLink() {
		const urlParams = new URLSearchParams(window.location.search);
		const tab = urlParams.get("tab");
		const module = urlParams.get("module");

		if (tab) {
			const tabElement = document.getElementById(`${tab}-tab`);
			if (tabElement) {
				tabElement.click();
			}

			if (tab === "modules" && module) {
				const [folder, ...pathParts] = module.split("/");
				const path = pathParts.join("/");

				hideWeekNavigation();
				path ? loadModuleFile(folder, `/${path}`) : loadModuleContents(folder);
				updateModuleNavigation(folder, `/${path}`);
			}

			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}

	// Tab Navigation
	function initializeTabNavigation() {
		tabLinks.forEach((link) => {
			link.addEventListener("click", () => {
				link.id === "home-tab" ? showWeekNavigation() : hideWeekNavigation();

				const moduleNav = document.getElementById("module-navigation");
				if (link.id !== "modules-tab") {
					moduleNav.style.display = "none";
				} else {
					const folderIndicator = moduleNav.querySelector("span");
					if (folderIndicator.textContent) {
						moduleNav.style.display = "flex";
					}
				}
			});
		});

		// Week navigation click handler
		weekNavigation.addEventListener("click", (event) => {
			event.stopPropagation();
			showWeekNavigation();
		});
	}

	// Week Content Management
	function calculateCurrentWeek() {
		const expectedDay = localStorage.getItem("expectedDay");
		if (!expectedDay) return 1;

		const expectedDate = new Date(expectedDay);
		const today = new Date();
		const diffTime = Math.abs(today - expectedDate);
		return Math.ceil(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) / 7);
	}

	function loadWeekContent(week) {
		const isPartnerMode = localStorage.getItem("partnerMode") === "true";
		const userType = isPartnerMode ? "partner" : "mom";
		const weekFiles = [
			{ file: `week${week}.md`, alwaysInclude: true },
			{ file: `week${week}-development.md`, preference: "Development" },
			{ file: `week${week}-exercise.md`, preference: "Exercise" },
			{ file: `week${week}-mentalhealth.md`, preference: "Mental Health" },
			{ file: `week${week}-nutrition.md`, preference: "Nutrition" },
		];

		const filesToLoad = weekFiles.filter(
			(file) =>
				file.alwaysInclude || localStorage.getItem(file.preference) === "true",
		);

		Promise.all(
			filesToLoad.map((file) =>
				fetch(`./markdown/weeks/week${week}/${userType}/${file.file}`)
					.then((response) => {
						if (!response.ok)
							throw new Error(`HTTP error ${response.status} for ${file.file}`);
						return response.text();
					})
					.catch((error) => {
						console.error(`Error loading ${file.file}:`, error);
						return ""; // Return empty string if file not found or other error
					}),
			),
		)
			.then((markdowns) => {
				const combinedMarkdown = markdowns.join("\n\n");
				const html = marked.parse(combinedMarkdown);
				const doc = new DOMParser().parseFromString(html, "text/html");
				doc.querySelectorAll("h1")[0]?.classList.add("week-title");

				weekContainer.innerHTML = "";
				const card = document.createElement("div");
				card.className = "header-colors";
				card.append(...doc.body.childNodes);
				weekContainer.appendChild(card);
				updateWeekNavigation();
			})
			.catch((error) => {
				console.error("Error loading week:", error);
				currentWeekIndex--;
				alert(`Week ${week} content is not available.`);
			});
	}

	function updateWeekNavigation() {
		const prevWeekBtn = document.getElementById("prevWeek");
		const nextWeekBtn = document.getElementById("nextWeek");
		const weekIndicator = document.getElementById("weekIndicator");

		prevWeekBtn.disabled = currentWeekIndex === 1;
		nextWeekBtn.disabled = currentWeekIndex >= TOTAL_WEEKS;
		weekIndicator.textContent = `Week ${currentWeekIndex}`;
	}

	// FAQ Management
	function initializeFAQ() {
		const faqContainer = document.querySelector(".faq-cards");
		const faqSearchInput = document.getElementById("faq-search");
		const faqCountElement = document.getElementById("faq-count");
		let faqCards = [];

		function updateFAQCount(filteredCount) {
			const totalCount = faqCards.length;
			faqCountElement.textContent =
				filteredCount === totalCount
					? `Showing all ${totalCount} questions`
					: `Showing ${filteredCount} of ${totalCount} questions`;
		}

		function filterFAQs(searchTerm) {
			let visibleCount = 0;
			faqCards.forEach((card) => {
				const isVisible = card.textContent
					.toLowerCase()
					.includes(searchTerm.toLowerCase());
				card.style.display = isVisible ? "block" : "none";
				if (isVisible) visibleCount++;
			});
			updateFAQCount(visibleCount);
		}

		faqSearchInput.addEventListener("input", (e) => filterFAQs(e.target.value));

		// Load FAQ content
		fetch("./markdown/faqs/index.json")
			.then((response) => response.json())
			.then((faqFiles) => {
				const loadPromises = faqFiles.map((file) =>
					fetch(`./markdown/faqs/${file.name}`)
						.then((response) => response.text())
						.then((markdown) => {
							const html = marked.parse(markdown);
							const doc = new DOMParser().parseFromString(html, "text/html");
							const card = createFAQCard(doc);
							faqContainer.appendChild(card);
							faqCards.push(card);
						}),
				);

				Promise.all(loadPromises).then(() => updateFAQCount(faqCards.length));
			})
			.catch((error) => console.error("Error loading FAQ index:", error));
	}

	// Resource Management
	function initializeResources() {
		const lincolnContainer = document.querySelector(".lincoln-resources");
		const omahaContainer = document.querySelector(".omaha-resources");
		const searchInput = document.getElementById("resource-search");
		const countElement = document.getElementById("resource-count");
		const resourceCards = []; // This needs to be accessible to both loading and filtering

		function updateResourceCount(filteredCount) {
			const totalCount = resourceCards.length;
			countElement.textContent =
				filteredCount === totalCount
					? `Showing all ${totalCount} resources`
					: `Showing ${filteredCount} of ${totalCount} resources`;
		}

		function filterResources(searchTerm) {
			let visibleCount = 0;
			resourceCards.forEach((card) => {
				const isVisible = card.textContent
					.toLowerCase()
					.includes(searchTerm.toLowerCase());
				card.style.display = isVisible ? "block" : "none";
				card.classList.toggle("d-flex", isVisible);
				if (isVisible) visibleCount++;
			});
			updateResourceCount(visibleCount);
		}

		function loadResources(city, container) {
			return fetch(`./markdown/resources/${city}/index.json`)
				.then((response) => response.json())
				.then((resourceFiles) => {
					const loadPromises = resourceFiles.map((file) => {
						return fetch(`./markdown/resources/${city}/${file.name}`)
							.then((response) => {
								if (!response.ok) {
									throw new Error("HTTP error " + response.status);
								}
								return response.text();
							})
							.then((markdown) => {
								const html = marked.parse(markdown);
								const doc = new DOMParser().parseFromString(html, "text/html");
								const card = createResourceCard(doc);
								container.appendChild(card);
								resourceCards.push(card); // Add card to the tracked array
								return card;
							})
							.catch((error) => {
								console.error(`Error loading ${city} resources:`, error);
							});
					});
					return Promise.all(loadPromises);
				});
		}

		searchInput.addEventListener("input", (e) =>
			filterResources(e.target.value),
		);

		// Load resources for both cities
		Promise.all([
			loadResources("lincoln", lincolnContainer),
			loadResources("omaha", omahaContainer),
		]).then(() => {
			updateResourceCount(resourceCards.length);
		});
	}

	// Settings Management
	function initializeSettings() {
		const settingsForm = document.getElementById("settings-form");
		const expectedDayInput = document.getElementById("expected-day");
		const roleInputs = document.querySelectorAll('input[name="role"]');
		const communicationInputs = document.querySelectorAll(
			'input[name="communication"]',
		);
		const disclaimerCheckbox = document.getElementById("disclaimer-checkbox");
		// Load saved settings
		expectedDayInput.value = localStorage.getItem("expectedDay") || "";
		const savedRole = localStorage.getItem("role");
		roleInputs.forEach((input) => {
			input.checked = input.value === savedRole;
		});
		communicationInputs.forEach((input) => {
			input.checked = localStorage.getItem(input.value) === "true";
		});
		disclaimerCheckbox.checked =
			localStorage.getItem("disclaimerAccepted") === "true";
		
		// Set partner mode based on the saved role
		localStorage.setItem("partnerMode", savedRole === "Father/Partner");

		// Show disclaimer if not accepted
		if (localStorage.getItem("disclaimerAccepted") !== "true") {
			alert("Welcome to the Malone app. This is not medical advice.");
		}

		// Save settings
		settingsForm.addEventListener("submit", (event) => {
			event.preventDefault();

			localStorage.setItem("expectedDay", expectedDayInput.value);
			roleInputs.forEach((input) => {
				if (input.checked) localStorage.setItem("role", input.value);
			});
			communicationInputs.forEach((input) => {
				localStorage.setItem(input.value, input.checked);
			});
			localStorage.setItem("disclaimerAccepted", disclaimerCheckbox.checked);
			const selectedRole = Array.from(roleInputs).find(input => input.checked)?.value;
			localStorage.setItem("partnerMode", selectedRole === "Father/Partner");

			alert("Settings saved!");

			currentWeekIndex = calculateCurrentWeek();
			loadWeekContent(currentWeekIndex);
			document.getElementById("home-tab").click();
		});

		// Add event listener for role change
		roleInputs.forEach(input => {
			input.addEventListener('change', (event) => {
				localStorage.setItem("partnerMode", event.target.value === "Father/Partner");
			});
		});
	}

	// Initialize Application
	handleDeepLink();
	initializeTabNavigation();
	loadModules();
	currentWeekIndex = calculateCurrentWeek();
	loadWeekContent(currentWeekIndex);
	initializeFAQ();
	initializeResources();
	initializeSettings();

	// Initial home tab state
	if (homeTab.classList.contains("active")) {
		showWeekNavigation();
	}

	// Observer for home tab state
	new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (
				mutation.type === "attributes" &&
				mutation.attributeName === "class"
			) {
				if (homeTab.classList.contains("active")) {
					showWeekNavigation();
				}
			}
		});
	}).observe(homeTab, { attributes: true });
});

// Module System Functions
function loadModules() {
	const modulesContainer = document.querySelector("#modules-content");
	const modules = [
		{ name: "Breastfeeding", folder: "breastfeeding" },
		{ name: "Exercise", folder: "exercise" },
		{ name: "Mental Health", folder: "mental-health" },
		{ name: "Mindfulness", folder: "mindfulness" },
		{ name: "Nutrition", folder: "nutrition" },
		{ name: "Sexual Health", folder: "sexual-health" },
		{ name: "Social Support", folder: "social-support" },
		{ name: "Extra Resources", folder: "extra-resources" },
	];

	// Create module grid
	const grid = document.createElement("div");
	grid.className = "row row-cols-2 row-cols-md-2 g-4 module-grid";

	// Generate module cards
	modules.forEach((module) => {
		const card = document.createElement("div");
		card.className = "col";
		card.innerHTML = `
            <div class="card h-100 module-card" data-folder="${module.folder}">
                <div class="card-body text-center">
                    <i class="fas fa-folder fa-3x mb-3"></i>
                    <h5 class="card-title">${module.name}</h5>
                </div>
            </div>
        `;
		grid.appendChild(card);
	});

	// Clear and update container
	modulesContainer.innerHTML = "";
	modulesContainer.appendChild(grid);

	// Add click handler for module cards
	modulesContainer.addEventListener("click", (event) => {
		const moduleCard = event.target.closest(".module-card");
		if (moduleCard) {
			loadModuleContents(moduleCard.dataset.folder);
		}
	});

	// Reset module navigation
	updateModuleNavigation();
	document.querySelector("#modules h1").style.display = "block";
}

function loadModuleContents(folder, path = "") {
	const modulesContainer = document.querySelector("#modules-content");
	const folderPath = `./markdown/modules/${folder}${path}`;

	hideWeekNavigation();

	// Load directory contents
	fetch(`${folderPath}/index.json`)
		.then((response) => response.json())
		.then((items) => {
			const grid = document.createElement("div");
			grid.className = "row row-cols-2 row-cols-md-2 g-4 module-grid";

			// Create cards for each item
			items.forEach((item) => {
				const isFolder = item.type === "directory" || item.type === "folder";
				const card = document.createElement("div");
				card.className = "col";
				card.innerHTML = `
                    <div class="card h-100 ${isFolder ? "folder-card" : "file-card"}"
                         data-folder="${folder}"
                         data-path="${path}"
                         data-item="${item.name}">
                        <div class="card-body text-center">
                            <i class="fas ${isFolder ? "fa-folder" : "fa-file-alt"} fa-3x mb-3"></i>
                            <h5 class="card-title">${item.name.replace(".md", "")}</h5>
                        </div>
                    </div>
                `;
				grid.appendChild(card);
			});

			// Update container and add click handlers
			modulesContainer.innerHTML = "";
			modulesContainer.appendChild(grid);

			grid.addEventListener("click", (event) => {
				const card = event.target.closest(".folder-card, .file-card");
				if (card) {
					const { folder, path: currentPath, item } = card.dataset;
					if (card.classList.contains("folder-card")) {
						loadModuleContents(folder, `${currentPath}/${item}`);
					} else {
						loadModuleFile(folder, `${currentPath}/${item}`);
					}
				}
			});

			// Update navigation state
			updateModuleNavigation(folder, path);
			document.querySelector("#modules h1").style.display = "none";
		})
		.catch((error) => console.error(`Error loading module contents:`, error));
}

function updateModuleNavigation(folder, path) {
	const moduleNavigation = document.getElementById("module-navigation");
	const backButton = moduleNavigation.querySelector("button");
	const folderIndicator = moduleNavigation.querySelector("span");

	// Configure back button
	backButton.innerHTML = "&lt; Modules";
	backButton.onclick = loadModules;

	// Update folder indicator
	folderIndicator.textContent = path ? path.split("/").pop() || folder : folder;

	// Show/hide navigation based on context
	const modulesTab = document.getElementById("modules-tab");
	moduleNavigation.style.display =
		modulesTab.classList.contains("active") && folder ? "flex" : "none";
}

function loadModuleFile(folder, filePath) {
	const modulesContainer = document.querySelector("#modules-content");
	const fullPath = `./markdown/modules/${folder}${filePath}`;

	hideWeekNavigation();

	// Attempt to load content
	fetch(fullPath)
		.then((response) => {
			if (response.ok) {
				// Handle file content
				return response.text().then((markdown) => {
					const html = marked.parse(markdown);
					modulesContainer.innerHTML = "";

					const content = document.createElement("div");
					content.className = "markdown-content";
					content.innerHTML = html;
					modulesContainer.appendChild(content);

					document.querySelector("#modules h1").style.display = "none";
					updateModuleNavigation(folder, filePath);
				});
			} else {
				// Check if path is a directory
				return fetch(`${fullPath}/index.json`).then((response) => {
					if (response.ok) {
						loadModuleContents(folder, filePath);
					} else {
						throw new Error("Path is neither a file nor a directory");
					}
				});
			}
		})
		.catch((error) => console.error(`Error loading file or directory:`, error));
}
