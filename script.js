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

    /* --- Načítání aktualit z Notion API s CSV fallbackem --- */
    const loadNotionData = async () => {
        const notionList = document.querySelector('.notion-list');
        if (!notionList) return;

        try {
            // 1. Primární pokus o načtení z vlastního PHP API
            const response = await fetch('api/get-data.php');
            if (!response.ok) {
                throw new Error('PHP API selhalo (' + response.status + ')');
            }
            const result = await response.json();
            
            // Jakmile přijde výsledek
            if (result.data && result.data.length > 0) {
                renderNotionData(result.data, notionList);
            } else {
                showEmptyMessage(notionList);
            }
        } catch (error) {
            console.warn('API selhalo, probíhá pokus o fallback z lokálního CSV:', error);
            // 2. Fallback: pokus o načtení z CSV
            try {
                // Přesný název CSV souboru
                const csvResponse = await fetch('Testnotion 33afc6bada9e80108c98c3d28f2a8304.csv');
                if (!csvResponse.ok) {
                    throw new Error('CSV fallback selhal');
                }
                const csvText = await csvResponse.text();
                const parsedData = parseCSV(csvText);
                
                if (parsedData && parsedData.length > 0) {
                    renderNotionData(parsedData, notionList);
                } else {
                    showEmptyMessage(notionList);
                }
            } catch (csvError) {
                console.error('Kompletní chyba načítání dat (API i CSV selhalo):', csvError);
                showEmptyMessage(notionList);
            }
        }
    };

    const parseCSV = (csvText) => {
        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) return []; // Máme pouze hlavičku
        
        // Struktura sloupců (na základě exportu: Test notion, Text 1, Date, Files & media)
        const result = [];
        // Regex pro oddělení čárkou, ale zachování textu v uvozovkách dohromady
        const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            const row = line.split(re).map(val => val.replace(/^"|"$/g, '').trim());
            const [testNotion, text1, date, filesMedia] = row;
            
            // "Text 1" představuje nadpis v poskytnutém CSV
            if (text1) {
                result.push({
                    title: text1,
                    date: date || '',
                    description: testNotion || ''
                });
            }
        }
        return result;
    };

    const renderNotionData = (data, container) => {
        container.innerHTML = ''; // Vyčištění hardcoded obsahu
        let delay = 1;
        
        // Ikonky, případně rotace mezi několika typy
        const icons = ['bi-rocket-takeoff-fill', 'bi-shield-fill-check', 'bi-braces-asterisk'];
        
        data.forEach((item, index) => {
            // Formátování data
            let formattedDate = item.date;
            if (item.date) {
                const d = new Date(item.date);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString('cs-CZ', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                }
            }
            
            const icon = icons[index % icons.length];

            const card = document.createElement('div');
            card.className = `bento-card glass-card notion-single-box fade-in delay-${delay}`;
            card.innerHTML = `
                <div class="notion-icon-wrapper">
                    <i class="bi ${icon} text-accent"></i>
                </div>
                <div class="notion-box-content">
                    <div class="notion-date"><i class="bi bi-calendar3"></i> ${formattedDate}</div>
                    <h3>${item.title}</h3>
                    <p>${item.description || 'Pro více informací sledujte náš portál.'}</p>
                </div>
            `;
            container.appendChild(card);
            
            // Pro dynamicky vložené prvky zajistíme viditelnost s animací
            setTimeout(() => {
                card.classList.add('visible');
            }, 100 + (delay * 150));

            delay++;
            if (delay > 3) delay = 1;
        });
    };

    const showEmptyMessage = (container) => {
        container.innerHTML = `
            <div class="bento-card glass-card fade-in visible" style="text-align: center; width: 100%; grid-column: 1 / -1;">
                <h3 style="margin-bottom: 0;">Vaše věta.</h3>
            </div>
        `;
    };

    // Spouštíme stahování dat
    loadNotionData();
});
