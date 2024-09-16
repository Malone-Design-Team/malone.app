window.onload = () => {
  "use strict";

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
};

document.addEventListener("DOMContentLoaded", (event) => {
  const weekNavigation = document.getElementById('week-navigation');
  const tabLinks = document.querySelectorAll('.nav-link');

  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (link.id === 'home-tab') {
        weekNavigation.style.display = 'flex';
      } else {
        weekNavigation.style.display = 'none';
      }
    });
  });

  // home page week loader
  const weekFiles = [
    "./markdown/weeks/week1.md",
    "./markdown/weeks/week2.md",
    "./markdown/weeks/week3.md",
    "./markdown/weeks/week4.md",
    "./markdown/weeks/week5.md",
  ];
  const weekContainer = document.querySelector("#home-content");
  let currentWeekIndex = 0;

  function loadWeekContent(index) {
    if (index < 0 || index >= weekFiles.length) return;

    fetch(weekFiles[index])
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.text();
      })
      .then((markdown) => {
        const html = marked.parse(markdown);
        const doc = new DOMParser().parseFromString(html, "text/html");
        weekContainer.innerHTML = ''; // Clear previous content
        const card = document.createElement("div");
        card.append(...doc.body.childNodes);
        weekContainer.appendChild(card);
        updateWeekNavigation();
      })
      .catch((error) => {
        console.error("Error loading week:", error);
      });
  }

  function updateWeekNavigation() {
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const weekIndicator = document.getElementById('weekIndicator');

    prevWeekBtn.disabled = currentWeekIndex === 0;
    nextWeekBtn.disabled = currentWeekIndex === weekFiles.length - 1;
    weekIndicator.textContent = `Week ${currentWeekIndex + 1}`;
  }

  document.getElementById('prevWeek').addEventListener('click', () => {
    if (currentWeekIndex > 0) {
      currentWeekIndex--;
      loadWeekContent(currentWeekIndex);
    }
  });

  document.getElementById('nextWeek').addEventListener('click', () => {
    if (currentWeekIndex < weekFiles.length - 1) {
      currentWeekIndex++;
      loadWeekContent(currentWeekIndex);
    }
  });

  loadWeekContent(currentWeekIndex); // Start loading from the first file

  // FAQ page loader
  const faqFiles = [
    "./markdown/faqs/short-example.md",
    "./markdown/faqs/long-example.md",
    `./markdown/faqs/partner-tired.md`,
    `./markdown/faqs/sky-blue.md`,
    `./markdown/faqs/maya-hee.md`,
  ];
  const faqContainer = document.querySelector(".faq-cards");

  faqFiles.forEach((file) => {
    fetch(file)
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
        console.log(question);
        console.log(answer);
        card.className = "card mt-2 mb-2";
        card.innerHTML = `	<div class="card-header">
	  								<h5 class="text-start p-1">${question}</h5>
	        						</div>
	        						<div class="card-body">
	        							<p class="card-text text-end">${answer}</p>
	          					</div>`;
        faqContainer.appendChild(card);
      })
      .catch((error) => {
        console.error("Error loading FAQ:", error);
      });
  });
  // resources
  const resourceFiles = [
    "./markdown/resources/jane-doe-obgyn.md",
    `./markdown/resources/adira-orehlian-social-worker.md`,
  ];
  const resourcesContainer = document.querySelector(".resource-cards");

  resourceFiles.forEach((file) => {
    fetch(file)
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
  // settings
  const settingsForm = document.getElementById('settings-form');
  const expectedDayInput = document.getElementById('expected-day');
  const roleInputs = document.querySelectorAll('input[name="role"]');
  const communicationInputs = document.querySelectorAll('input[name="communication"]');

  // Load settings from local storage
  expectedDayInput.value = localStorage.getItem('expectedDay') || '';
  roleInputs.forEach(input => {
    if(input.value === localStorage.getItem('role')) {
      input.checked = true;
    }
  });
  communicationInputs.forEach(input => {
    input.checked = localStorage.getItem(input.value) === 'true';
  });

  // Save settings to local storage
  settingsForm.addEventListener('submit', function(event) {
    event.preventDefault();
    localStorage.setItem('expectedDay', expectedDayInput.value);
    roleInputs.forEach(input => {
      if(input.checked) {
        localStorage.setItem('role', input.value);
      }
    });
    communicationInputs.forEach(input => {
      localStorage.setItem(input.value, input.checked);
    });
    alert('Settings saved!');
  });
});
