(() => {
    'use strict';
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const make = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    };
    const waLink = (msg) => `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg || CONFIG.DEFAULT_MESSAGE)}`;
    const external = (a, href) => {
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    };

    // Tipos de evento (escenario)
    const list = $('#eventsList'), media = $('#eventsMedia');
    CONFIG.EVENTS.forEach((e) => {
        const li = make('li', 'stage__item');
        const a = make('a', 'btn btn-brand mt-3', 'Consultar por este evento');
        a.dataset.wa = '';
        a.dataset.msg = `Hola! Me gustaría consultar por el servicio de ContraBarra para ${e.msg}. ¿Podrían brindarme más información?`;
        li.append(make('h3', 'display-5 mb-3', e.title), make('p', 'lead', e.text), a);
        list.append(li);
        const img = make('img');
        img.src = `assets/images/${e.img}`;
        img.alt = `Referencia: ${e.title}`;
        img.width = 800;
        img.height = 1000;
        img.loading = 'lazy';
        media.append(img);
    });

    // FAQ (acordeón de Bootstrap, uno abierto a la vez)
    const acc = $('#faqAcc');
    CONFIG.FAQ.forEach(([q, ans], i) => {
        const item = make('div', 'accordion-item'), h = make('h3', 'accordion-header'),
            b = make('button', 'accordion-button collapsed', q);
        b.type = 'button';
        b.dataset.bsToggle = 'collapse';
        b.dataset.bsTarget = `#faq${i}`;
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-controls', `faq${i}`);
        const c = make('div', 'accordion-collapse collapse');
        c.id = `faq${i}`;
        c.dataset.bsParent = '#faqAcc';
        c.append(make('div', 'accordion-body', ans));
        h.append(b);
        item.append(h, c);
        acc.append(item);
    });

    // Galería + lightbox
    const grid = $('#gallery'), big = $('#lightboxImg'), modal = new bootstrap.Modal($('#lightbox'));
    const total = CONFIG.GALLERY.length;
    let cur = 0;
    const src = (i) => `assets/images/galeria/${CONFIG.GALLERY[i]}`;
    const show = (i) => {
        cur = (i + total) % total;
        big.src = src(cur);
    };
    CONFIG.GALLERY.forEach((_, i) => {
        const b = make('button', 'gallery__item');
        b.type = 'button';
        b.setAttribute('aria-label', `Ampliar foto ${i + 1}`);
        const img = make('img');
        img.src = src(i);
        img.alt = `Experiencia ContraBarra ${i + 1}`;
        img.width = 1200;
        img.height = 900;
        img.loading = 'lazy';
        b.append(img);
        b.addEventListener('click', () => {
            show(i);
            modal.show();
        });
        grid.append(b);
    });
    $('#lbPrev').addEventListener('click', () => show(cur - 1));
    $('#lbNext').addEventListener('click', () => show(cur + 1));

    // Enlaces centralizados (WhatsApp / Instagram)
    if (!/^\d+$/.test(CONFIG.WHATSAPP_NUMBER)) console.warn('ContraBarra: configurá WHATSAPP_NUMBER en js/config.js');
    $$('[data-wa]').forEach((a) => external(a, waLink(a.dataset.msg)));
    $$('[data-ig]').forEach((a) => external(a, CONFIG.INSTAGRAM_URL));

    // Menú móvil y header
    const menu = $('#menu'), header = $('.site-header');
    $$('#menu a').forEach((a) => a.addEventListener('click', () => {
        if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }));
    addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 40), {passive: true});

    // Escenario de eventos
    const items = $$('.stage__item'), imgs = $$('#eventsMedia img'), count = $('#stageCount');
    const setActive = (i) => {
        items.forEach((n, k) => n.classList.toggle('is-active', k === i));
        imgs.forEach((n, k) => n.classList.toggle('is-active', k === i));
        count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    };
    setActive(0);

    // Animaciones al scrollear (GSAP). Sin movimiento si el usuario lo pide.
    if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('no-motion');
        return;
    }
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('[data-intro]', {
        y: 40,
        opacity: 0,
        duration: 1.1,
        stagger: .12,
        ease: 'power3.out',
        delay: .1,
        clearProps: 'transform'
    });
    gsap.to('.hero__bg', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}
    });
    // Escenario fijo: cada tramo de scroll muestra un tipo de evento (se crea antes que el resto, en orden de página)
    ScrollTrigger.create({
        trigger: '.stage',
        start: 'top top',
        end: () => `+=${innerHeight * items.length * .7}`,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (s) => setActive(Math.min(items.length - 1, Math.floor(s.progress * items.length)))
    });
    // El fondo cambia entre oscuro y claro; el menú marca la sección activa
    $$('main > section, footer').forEach((s) => ScrollTrigger.create({
        trigger: s, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => {
            if (!self.isActive) return;
            document.body.dataset.theme = s.dataset.theme;
            $$('.nav-link').forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${s.id}`));
        }
    }));
    // Textos que aparecen
    $$('[data-reveal]').forEach((n) => gsap.from(n, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: {trigger: n, start: 'top 88%'}
    }));
    // Imágenes que se abren al centro mientras scrolleás
    $$('[data-zoom]').forEach((n) => gsap.fromTo(n, {
        scale: .8,
        opacity: .2,
        clipPath: 'inset(14% 14% 14% 14% round 18px)'
    }, {
        scale: 1,
        opacity: 1,
        clipPath: 'inset(0% 0% 0% 0% round 18px)',
        ease: 'none',
        scrollTrigger: {trigger: n, start: 'top 92%', end: 'top 35%', scrub: true}
    }));
    gsap.from('.process__line', {
        scaleX: 0,
        ease: 'none',
        scrollTrigger: {trigger: '.process', start: 'top 70%', end: 'bottom 80%', scrub: true}
    });
})();
