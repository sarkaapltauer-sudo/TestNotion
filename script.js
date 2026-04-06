document.addEventListener('DOMContentLoaded', () => {

    /* --- Hamburger Menu Toggle --- */
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    /* --- Zavření navigace po kliknutí (Mobile) --- */
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger && hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    });

    /* --- Smooth Scrolling --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    /* --- Intersection Observer Animations --- */
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    /* --- Navbar Scroll Effect --- */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* --- Cookie Banner Logic --- */
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookiesBtn = document.getElementById('accept-cookies');

    if (cookieBanner && acceptCookiesBtn) {
        if (!localStorage.getItem('cookiesAccepted')) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1000);
        }

        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieBanner.classList.remove('show');
        });
    }

    /* --- Ochrana proti spamu (Honeypot validace např. před odesláním) --- */
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const honeypot = document.getElementById('mesto').value;
            if (honeypot !== "") {
                // Pokud bot vyplnil honeypot, zabráníme odeslání, ale tváříme se že OK
                e.preventDefault();
                alert("Děkujeme za zprávu.");
                form.reset();
            }
        });
    }

    /* --- Načtení dat z CSV (Notion Export) --- */
    async function loadNotionData() {
        try {
            // Název souboru CSV z aktuální složky
            const response = await fetch('Testnotion 33afc6bada9e80108c98c3d28f2a8304.csv');
            if (!response.ok) throw new Error("Nelze načíst CSV soubor");
            
            const csvText = await response.text();
            parseAndRenderCSV(csvText);
        } catch (error) {
            console.error("Chyba při načítání CSV:", error);
            const container = document.getElementById('notion-data-container');
            if (container) {
                container.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1;">Žádné aktuální novinky nejsou k dispozici.</p>';
            }
        }
    }

    function parseCSVLine(text) {
        let result = [];
        let curVal = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (inQuotes) {
                if (char === '"' && text[i + 1] === '"') {
                    curVal += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    curVal += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    result.push(curVal);
                    curVal = '';
                } else {
                    curVal += char;
                }
            }
        }
        result.push(curVal);
        return result;
    }

    function parseAndRenderCSV(csvText) {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return; // První řádek hlavičky, takže musí být alespoň 2
        
        const headers = parseCSVLine(lines[0]);
        const dataContainer = document.getElementById('notion-data-container');
        if (!dataContainer) return;
        
        let html = '';
        
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            // Kolonky z CSV podle názvů sloupců
            const title = rowData['Test notion'] || 'Novinka';
            const textContent = rowData['Text 1'] || '';
            const date = rowData['Date'] || '';
            const media = rowData['Files & media'] || '';

            // Skládáme html kód s využitím zavedeného designu bento-card a glass-card
            html += `
                <article class="bento-card glass-card notion-card fade-in delay-${(i % 3) + 1}">
                    ${media ? `<div class="notion-media"><img src="${media}" alt="${title}" onerror="this.style.display='none'" loading="lazy"></div>` : ''}
                    <div class="notion-content">
                        ${date ? `<span class="notion-date"><i class="bi bi-calendar3"></i> ${date}</span>` : ''}
                        <h3>${title}</h3>
                        ${textContent ? `<p>${textContent}</p>` : ''}
                    </div>
                </article>
            `;
        }
        
        dataContainer.innerHTML = html;
        
        // Znovu aplikujeme Intersection Observer na nově přidané prvky
        const newFaders = dataContainer.querySelectorAll('.fade-in');
        newFaders.forEach(fader => {
            appearOnScroll.observe(fader);
        });
    }

    loadNotionData();
});
