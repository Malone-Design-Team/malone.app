function hideWeekNavigation() {
	const weekNavigation = document.getElementById("week-navigation");
	weekNavigation.style.display = "none";
}

window.onload = () => {
	"use strict";

	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("./sw.js");
	}
};

document.addEventListener("DOMContentLoaded", (event) => {
	const weekNavigation = document.getElementById("week-navigation");
	const tabLinks = document.querySelectorAll(".nav-link");
	const homeTab = document.getElementById("home-tab");

	// Function to handle deep linking
	function handleDeepLink() {
		const urlParams = new URLSearchParams(window.location.search);
		const tab = urlParams.get('tab');
		const module = urlParams.get('module');

		if (tab) {
			const tabElement = document.getElementById(`${tab}-tab`);
			if (tabElement) {
				tabElement.click();
			}

			if (tab === 'modules' && module) {
				const [folder, ...pathParts] = module.split('/');
				const path = pathParts.join('/');

				hideWeekNavigation();
				if (path) {
					loadModuleFile(folder, `/${path}`);
				} else {
					loadModuleContents(folder);
				}
				updateModuleNavigation(folder, `/${path}`);
			}

			// Clear the query parameters
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}

	// Call handleDeepLink on page load
	handleDeepLink();

function showWeekNavigation() {
	const weekNavigation = document.getElementById("week-navigation");
	weekNavigation.style.display = "flex";
}

tabLinks.forEach((link) => {
		link.addEventListener("click", () => {
			if (link.id === "home-tab") {
				showWeekNavigation();
			} else {
				hideWeekNavigation();
			}
		});
	});

	// Ensure week navigation stays visible when interacting with it
	weekNavigation.addEventListener("click", (event) => {
		event.stopPropagation();
		showWeekNavigation();
	});

	// Show week navigation when home tab is active
	const observer = new MutationObserver((mutations) => {
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
	});

	observer.observe(homeTab, { attributes: true });

	// Initial check
	if (homeTab.classList.contains("active")) {
		showWeekNavigation();
	}

	// Load modules
	loadModules();

	// home page week loader
	const weekContainer = document.querySelector("#home-content");
	let currentWeekIndex = 0;

	function calculateCurrentWeek() {
		const expectedDay = localStorage.getItem("expectedDay");
		if (!expectedDay) return 1; // Default to week 1 if no date is set

		const expectedDate = new Date(expectedDay);
		const today = new Date();
		const diffTime = Math.abs(today - expectedDate);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.ceil(diffDays / 7);
	}

	function loadWeekContent(week) {
		const weekFile = `./markdown/weeks/week${week}.md`;

		fetch(weekFile)
			.then((response) => {
				if (!response.ok) {
					throw new Error("HTTP error " + response.status);
				}
				return response.text();
			})
			.then((markdown) => {
				const html = marked.parse(markdown);
				const doc = new DOMParser().parseFromString(html, "text/html");
				weekContainer.innerHTML = ""; // Clear previous content
				var card = document.createElement("div");
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
		const totalPages = 7;

		prevWeekBtn.disabled = currentWeekIndex === 1;
		nextWeekBtn.disabled = currentWeekIndex >= totalPages; // Always allow moving to next week
		weekIndicator.textContent = `Week ${currentWeekIndex}`;
	}

	document.getElementById("prevWeek").addEventListener("click", () => {
		if (currentWeekIndex > 1) {
			currentWeekIndex--;
			loadWeekContent(currentWeekIndex);
		}
	});

	document.getElementById("nextWeek").addEventListener("click", () => {
		currentWeekIndex++;
		loadWeekContent(currentWeekIndex);
	});

	// Start loading from the calculated current week
	currentWeekIndex = calculateCurrentWeek();
	loadWeekContent(currentWeekIndex);

	// FAQ page loader
	const faqContainer = document.querySelector(".faq-cards");

	fetch("./markdown/faqs/index.json")
		.then((response) => response.json())
		.then((faqFiles) => {
			faqFiles.forEach((file) => {
				fetch(`./markdown/faqs/${file.name}`)
					.then((response) => {
						if (!response.ok) {
							throw new Error("HTTP error " + response.status);
						}
						return response.text();
					})
					.then((markdown) => {
						const html = marked.parse(markdown);
						const doc = new DOMParser().parseFromString(html, "text/html");
						const card = document.createElement("div");
						const question = doc.getElementsByTagName("h3")[0].innerText;
						const answer = doc.getElementsByTagName("p")[0].innerText;
						card.className = "card mt-2 mb-2";
						card.innerHTML = `	<div class="card-header">
											<h5 class="text-start p-1">${question}</h5>
											</div>
											<div class="card-body">
												<p class="card-text">${answer}</p>
											</div>`;
						faqContainer.appendChild(card);
					})
					.catch((error) => {
						console.error("Error loading FAQ:", error);
					});
			});
		})
		.catch((error) => {
			console.error("Error loading FAQ index:", error);
		});

	// resources
	const resourcesContainer = document.querySelector(".resource-cards");

	fetch("./markdown/resources/index.json")
		.then((response) => response.json())
		.then((resourceFiles) => {
			resourceFiles.forEach((file) => {
				fetch(`./markdown/resources/${file.name}`)
					.then((response) => {
						if (!response.ok) {
							throw new Error("HTTP error " + response.status);
						}
						return response.text();
					})
					.then((markdown) => {
						const html = marked.parse(markdown);
						const doc = new DOMParser().parseFromString(html, "text/html");
						const card = document.createElement("div");
						const title =
							doc.getElementsByTagName("h1")[0]?.innerText || "No Title";
						const detailsElements = doc.getElementsByTagName("p");
						const imageElement = doc.getElementsByTagName("img")[0];
						let detailsHTML = "";
						for (let detail of detailsElements) {
							detailsHTML += `<p class="card-text p-0 m-0">${detail.innerText}</p>`;
						}
						card.className = "card d-flex flex-row align-items-center mt-2 mb-2";
						card.style.maxWidth = "100%";
						card.style.boxSizing = "border-box";
						card.innerHTML = `
							<div style="flex-grow: 1; min-width: 0;">
								<div class="card-body">
									<h3 class="card-title">${title}</h3>
									${detailsHTML}
								</div>
							</div>
							${imageElement ? `<img src="${imageElement.src}" style="width: 128px; height: auto; object-fit: cover;" class="ml-3" alt="...">` : ""}
						`;

						resourcesContainer.appendChild(card);
					})
					.catch((error) => {
						console.error("Error loading resources:", error);
					});
			});
		})
		.catch((error) => {
			console.error("Error loading resources index:", error);
		});
	// settings
	const settingsForm = document.getElementById("settings-form");
	const expectedDayInput = document.getElementById("expected-day");
	const roleInputs = document.querySelectorAll('input[name="role"]');
	const communicationInputs = document.querySelectorAll(
		'input[name="communication"]',
	);

	// Load settings from local storage
	expectedDayInput.value = localStorage.getItem("expectedDay") || "";
	roleInputs.forEach((input) => {
		if (input.value === localStorage.getItem("role")) {
			input.checked = true;
		}
	});
	communicationInputs.forEach((input) => {
		input.checked = localStorage.getItem(input.value) === "true";
	});

	// save settings to browser storage
	settingsForm.addEventListener("submit", function (event) {
		event.preventDefault();
		localStorage.setItem("expectedDay", expectedDayInput.value);
		roleInputs.forEach((input) => {
			if (input.checked) {
				localStorage.setItem("role", input.value);
			}
		});
		communicationInputs.forEach((input) => {
			localStorage.setItem(input.value, input.checked);
		});
		alert("Settings saved!");

		// Update the current week and load the new content
		currentWeekIndex = calculateCurrentWeek();
		loadWeekContent(currentWeekIndex);

		// Ensure we're on the home tab to see the updated week content
		const homeTab = document.getElementById("home-tab");
		homeTab.click();
	});
});

function loadModules() {
	const modulesContainer = document.querySelector("#modules-content");
	const modules = [
		{ name: "Exercise", folder: "exercise" },
		{ name: "Mental Health", folder: "mental-health" },
		{ name: "Mindfulness", folder: "mindfulness" },
		{ name: "Nutrition", folder: "nutrition" },
		{ name: "Sexual Health", folder: "sexual-health" },
		{ name: "Social Support", folder: "social-support" },
	];

	const grid = document.createElement("div");
	grid.className = "row row-cols-2 row-cols-md-2 g-4 module-grid";

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

	modulesContainer.innerHTML = "";
	modulesContainer.appendChild(grid);

	// Add click event listener to the container
	modulesContainer.addEventListener("click", (event) => {
		const moduleCard = event.target.closest(".module-card");
		if (moduleCard) {
			const folder = moduleCard.dataset.folder;
			loadModuleContents(folder);
		}
	});

	// Hide the module navigation when showing the main modules list
	updateModuleNavigation();

	document.querySelector("#modules h1").style.display = "block";
}

function loadModuleContents(folder, path = "") {
	const modulesContainer = document.querySelector("#modules-content");
	const folderPath = `./markdown/modules/${folder}${path}`;

	hideWeekNavigation();

	// Fetch the list of files and folders in the current directory
	fetch(`${folderPath}/index.json`)
		.then((response) => response.json())
		.then((items) => {
			const grid = document.createElement("div");
			grid.className = "row row-cols-2 row-cols-md-2 g-4 module-grid";

			items.forEach((item) => {
				const card = document.createElement("div");
				card.className = "col";
				const isFolder = item.type === "directory" || item.type === "folder";
				card.innerHTML = `
          <div class="card h-100 ${isFolder ? "folder-card" : "file-card"}" data-folder="${folder}" data-path="${path}" data-item="${item.name}">
            <div class="card-body text-center">
              <i class="fas ${isFolder ? "fa-folder" : "fa-file-alt"} fa-3x mb-3"></i>
              <h5 class="card-title">${item.name.replace(".md", "")}</h5>
            </div>
          </div>
        `;
				grid.appendChild(card);
			});

			modulesContainer.innerHTML = "";
			modulesContainer.appendChild(grid);

			// Add click event listener for files and folders
			grid.addEventListener("click", (event) => {
				const card = event.target.closest(".folder-card, .file-card");
				if (card) {
					const folder = card.dataset.folder;
					const currentPath = card.dataset.path;
					const item = card.dataset.item;
					if (card.classList.contains("folder-card")) {
						loadModuleContents(folder, `${currentPath}/${item}`);
					} else {
						loadModuleFile(folder, `${currentPath}/${item}`);
					}
				}
			});

			updateModuleNavigation(folder, path);

			// Show the modules title
			document.querySelector("#modules h1").style.display = "none";
		})
		.catch((error) => console.error(`Error loading module contents:`, error));
}

function updateModuleNavigation(folder, path) {
	const moduleNavigation = document.getElementById("module-navigation");
	const backButton = moduleNavigation.querySelector("button");
	const folderIndicator = moduleNavigation.querySelector("span");

	backButton.innerHTML = "&lt; Modules";
	backButton.onclick = loadModules;
	folderIndicator.textContent = path ? path.split("/").pop() || folder : folder;
	moduleNavigation.style.display = folder ? "flex" : "none";
}

function loadModuleFile(folder, filePath) {
	const modulesContainer = document.querySelector("#modules-content");
	const fullPath = `./markdown/modules/${folder}${filePath}`;

	hideWeekNavigation();

	// First, check if the path is a file
	fetch(fullPath)
		.then((response) => {
			if (response.ok) {
				// If it's a file, load its content
				return response.text().then((markdown) => {
					const html = marked.parse(markdown);
					modulesContainer.innerHTML = "";

					const content = document.createElement("div");
					content.className = "markdown-content";
					content.innerHTML = html;
					modulesContainer.appendChild(content);

					// Hide the modules title when viewing an article
					document.querySelector("#modules h1").style.display = "none";
					updateModuleNavigation(folder, filePath);
				});
			} else {
				// If it's not a file, check if it's a directory
				return fetch(`${fullPath}/index.json`).then((response) => {
					if (response.ok) {
						// If it's a directory, load its contents
						loadModuleContents(folder, filePath);
					} else {
						throw new Error("Path is neither a file nor a directory");
					}
				});
			}
		})
		.catch((error) => console.error(`Error loading file or directory:`, error));
}
