/* ==========================================================================
   ACADEMIC DEPARTMENT WEBSITE - CLIENT INTERACTIONS & DYNAMICS
   Vanilla JS implementation for high-performance interactivity
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initRoleSwitcher();
  initStatCounters();
  initNoticeBoard();
  initProgramTabs();
  initFacultyDirectory();
  initSearchModal();
  initHeaderScroll();
  initMobileMenu();
});

/* --------------------------------------------------------------------------
   1. Theme Toggle (Light / Dark Mode with Persistence)
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const htmlEl = document.documentElement;

  const savedTheme = localStorage.getItem('apex_dept_theme') || 'light';
  htmlEl.setAttribute('data-theme', savedTheme);
  updateThemeBtnLabel(savedTheme);

  themeBtn.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('apex_dept_theme', newTheme);
    updateThemeBtnLabel(newTheme);
  });

  function updateThemeBtnLabel(theme) {
    if (themeLabel) {
      themeLabel.textContent = theme === 'light' ? 'Dark' : 'Light';
    }
  }
}

/* --------------------------------------------------------------------------
   2. Role-Based Intent Switcher (Hero Section)
   -------------------------------------------------------------------------- */
const roleData = {
  prospective: {
    heading: 'Admissions & Degree Pathways',
    description: 'Explore undergraduate B.Tech & graduate programs, scholarship criteria, and application deadlines for the 2026 Academic Year.',
    actions: [
      { text: 'Degree Explorer', href: '#programs' },
      { text: 'Placement Track', href: '#placements' }
    ]
  },
  current: {
    heading: 'Student Hub & Daily Utilities',
    description: 'Access practical examination dates, syllabus documents, ERP attendance, and digital library resources.',
    actions: [
      { text: 'Live Circulars', href: '#notices' },
      { text: 'Lab Schedule', href: '#notices' }
    ]
  },
  researcher: {
    heading: 'Research Labs & Collaborative Grants',
    description: 'Discover funded doctoral positions, interdisciplinary research centers, and international patent portfolios.',
    actions: [
      { text: 'Research Labs', href: '#research' },
      { text: 'Publications', href: '#research' }
    ]
  },
  recruiter: {
    heading: 'Talent Acquisition & Industry MoUs',
    description: 'Review our 99.2% placement track record, recruiter guidelines, and partner with departmental research laboratories.',
    actions: [
      { text: 'Placement Report', href: '#placements' },
      { text: 'Partner Labs', href: '#research' }
    ]
  }
};

function initRoleSwitcher() {
  const roleButtons = document.querySelectorAll('.role-pill-btn');
  const roleHeading = document.getElementById('roleHeading');
  const roleDescription = document.getElementById('roleDescription');
  const roleActions = document.getElementById('roleActions');

  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const roleKey = btn.getAttribute('data-role');
      const data = roleData[roleKey];

      if (data) {
        roleHeading.textContent = data.heading;
        roleDescription.textContent = data.description;
        
        roleActions.innerHTML = data.actions.map(a => 
          `<a href="${a.href}" class="btn-sm">${a.text}</a>`
        ).join('');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. Animated Stat Counters
   -------------------------------------------------------------------------- */
function initStatCounters() {
  const counters = document.querySelectorAll('.counter');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counters.forEach(counter => {
          const target = parseFloat(counter.getAttribute('data-target'));
          const isDecimal = target % 1 !== 0;
          const duration = 1600;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          let stepCount = 0;

          const timer = setInterval(() => {
            stepCount++;
            current += increment;
            if (stepCount >= steps) {
              counter.textContent = isDecimal ? target.toFixed(1) : Math.round(target);
              clearInterval(timer);
            } else {
              counter.textContent = isDecimal ? current.toFixed(1) : Math.round(current);
            }
          }, duration / steps);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.hero-stats-grid');
  if (statsSection) {
    observer.observe(statsSection);
  }
}

/* --------------------------------------------------------------------------
   4. Live Notice Board Filtering & Keyword Search
   -------------------------------------------------------------------------- */
function initNoticeBoard() {
  const filterBtns = document.querySelectorAll('.notice-filters .filter-btn');
  const searchInput = document.getElementById('noticeSearchInput');
  const noticeItems = document.querySelectorAll('.notice-item');

  function filterNotices() {
    const activeCategory = document.querySelector('.notice-filters .filter-btn.active').getAttribute('data-category');
    const query = searchInput.value.toLowerCase().trim();

    noticeItems.forEach(item => {
      const itemCat = item.getAttribute('data-category');
      const itemText = item.textContent.toLowerCase();

      const matchesCat = (activeCategory === 'all' || itemCat === activeCategory);
      const matchesQuery = (query === '' || itemText.includes(query));

      if (matchesCat && matchesQuery) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterNotices();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', filterNotices);
  }
}

/* --------------------------------------------------------------------------
   5. Academic Program Explorer Tabs
   -------------------------------------------------------------------------- */
const programsData = {
  btech: {
    degreeType: '4-Year Full-Time Undergraduate Degree',
    title: 'Bachelor of Technology in Computer Science & Engineering',
    summary: 'A rigorous foundational engineering program integrating algorithmic principles, system architecture, cloud technologies, full-stack software development, and modern machine learning.',
    duration: '8 Semesters (4 Academic Years)',
    credits: '164 Credits (Theory + Applied Labs + Capstone)',
    intake: '180 Students (Entrance Exam Selection)',
    accreditation: 'NBA Tier-1, ABET (USA) Substantial Equivalence',
    specializations: [
      'Artificial Intelligence & ML',
      'Cloud & Distributed Systems',
      'Cyber Security & Cryptography',
      'Data Science & Big Data',
      'Computer Vision & Robotics',
      'Software Engineering & DevOps'
    ]
  },
  mtech: {
    degreeType: '2-Year Postgraduate Research Degree',
    title: 'Master of Technology in Artificial Intelligence & Data Science',
    summary: 'An advanced, research-intensive curriculum designed for graduates seeking leadership in large language models, generative AI, scalable neural architectures, and enterprise data analytics.',
    duration: '4 Semesters (2 Academic Years)',
    credits: '78 Credits (Research Thesis + Coursework)',
    intake: '45 Students (GATE Selection / Sponsored)',
    accreditation: 'AICTE Approved & NBA Accredited',
    specializations: [
      'Generative AI & LLM Systems',
      'Reinforcement Learning & Robotics',
      'High-Performance Deep Learning',
      'Scalable Vector Databases',
      'Explainable AI & Fair Algorithms'
    ]
  },
  phd: {
    degreeType: 'Doctor of Philosophy (Full-Time / Sponsored)',
    title: 'Ph.D. in Computer Science & Systems Engineering',
    summary: 'A premiere doctoral program producing world-class researchers with full fellowship support ($500/month stipend + research conference grants). Mentored directly by tenured faculty.',
    duration: '3 to 5 Years (Thesis Defense Required)',
    credits: 'Coursework + Comprehensive Exam + Dissertation',
    intake: '18 Research Scholars Per Cycle',
    accreditation: 'Recognized Worldwide | Apex University Senate',
    specializations: [
      'Zero-Knowledge Proofs & Quantum Crypto',
      'Autonomous Drone Swarms',
      'Exascale Cloud Computing & Microsecond RPC',
      'Edge AI for Biomedical Imaging',
      'Decentralized Protocol Governance'
    ]
  }
};

function initProgramTabs() {
  const tabs = document.querySelectorAll('.prog-tab-btn');
  const progDegreeType = document.getElementById('progDegreeType');
  const progTitle = document.getElementById('progTitle');
  const progSummary = document.getElementById('progSummary');
  const progDuration = document.getElementById('progDuration');
  const progCredits = document.getElementById('progCredits');
  const progIntake = document.getElementById('progIntake');
  const progAccreditation = document.getElementById('progAccreditation');
  const progSpecializations = document.getElementById('progSpecializations');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const progKey = tab.getAttribute('data-program');
      const data = programsData[progKey];

      if (data) {
        progDegreeType.textContent = data.degreeType;
        progTitle.textContent = data.title;
        progSummary.textContent = data.summary;
        progDuration.textContent = data.duration;
        progCredits.textContent = data.credits;
        progIntake.textContent = data.intake;
        progAccreditation.textContent = data.accreditation;

        progSpecializations.innerHTML = data.specializations.map(s => 
          `<span class="curriculum-chip">${s}</span>`
        ).join('');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   6. Faculty Directory Filtering & Detail Modal
   -------------------------------------------------------------------------- */
const facultyProfiles = {
  sharma: {
    name: 'Prof. Dr. Ananya Sharma',
    designation: 'Professor & Head of Department',
    photo: 'assets/faculty-dr-sharma.jpg',
    education: 'Ph.D. in Computer Science, IIT Bombay | M.Tech, IISc Bangalore',
    bio: 'Dr. Sharma leads the Department of Computer Science & Engineering. Her research focuses on deep neural vision models, self-supervised representation learning, and medical imaging diagnostics. She has authored over 95 peer-reviewed papers in IEEE TPAMI, CVPR, and NeurIPS.',
    lab: 'Intelligent Vision & Robotics Lab (Director)',
    grants: '$1.4M Department of Science & Technology (DST) AI Mission Grant',
    office: 'Turing Block, Room 302 | Office Hours: Tue/Thu 2:00 PM - 4:00 PM',
    email: 'ananya.sharma@apex.edu'
  },
  harrison: {
    name: 'Prof. Dr. David Harrison',
    designation: 'Professor & Chair of Systems Research',
    photo: 'assets/faculty-dr-harrison.jpg',
    education: 'Ph.D. in Computer Science, Carnegie Mellon University (CMU)',
    bio: 'Dr. Harrison specializes in high-throughput distributed architectures, consensus algorithms, microsecond RPC communication, and fault-tolerant storage systems. Formerly a principal engineer at Google Cloud Systems.',
    lab: 'Cloud Systems & High-Perf Computing Center',
    grants: '$2.2M National Science Foundation (NSF) Scalable Systems Award',
    office: 'Turing Block, Room 415 | Office Hours: Mon/Wed 10:00 AM - 12:00 PM',
    email: 'david.harrison@apex.edu'
  },
  reddy: {
    name: 'Dr. Vikramaditya Reddy',
    designation: 'Associate Professor (Cybersecurity & Privacy)',
    photo: '',
    education: 'Ph.D., National University of Singapore (NUS)',
    bio: 'Dr. Reddy conducts research at the intersection of cryptography, verifiable computing, zero-knowledge proofs, and post-quantum blockchain infrastructures. He holds 8 international patents.',
    lab: 'Center for Cryptography & Privacy (Lead)',
    grants: '$800K Cyber Defense Research Council Grant',
    office: 'Turing Block, Room 210 | Office Hours: Wed/Fri 3:00 PM - 5:00 PM',
    email: 'vikram.reddy@apex.edu'
  },
  rostova: {
    name: 'Dr. Elena Rostova',
    designation: 'Assistant Professor (Robotics & Spatial AI)',
    photo: '',
    education: 'Ph.D., ETH Zurich (Robotics & Perception)',
    bio: 'Dr. Rostova develops autonomous micro-aerial systems, visual-inertial odometry, and real-time 3D spatial mapping in GPS-denied environments.',
    lab: 'Intelligent Vision & Robotics Lab',
    grants: '$650K Autonomous Systems Innovation Fund',
    office: 'Turing Block, Room 118 | Office Hours: Thu 11:00 AM - 1:00 PM',
    email: 'elena.rostova@apex.edu'
  }
};

function initFacultyDirectory() {
  const tagBtns = document.querySelectorAll('.faculty-filter-pills .filter-btn');
  const searchInput = document.getElementById('facultySearchInput');
  const facultyCards = document.querySelectorAll('.faculty-card');

  function filterFaculty() {
    const activeTag = document.querySelector('.faculty-filter-pills .filter-btn.active').getAttribute('data-fac-tag');
    const query = searchInput.value.toLowerCase().trim();

    facultyCards.forEach(card => {
      const cardTags = card.getAttribute('data-tags') || '';
      const cardName = card.getAttribute('data-name') || '';
      const cardTitle = card.getAttribute('data-title') || '';
      const text = (cardName + ' ' + cardTitle + ' ' + card.textContent).toLowerCase();

      const matchesTag = (activeTag === 'all' || cardTags.includes(activeTag));
      const matchesQuery = (query === '' || text.includes(query));

      if (matchesTag && matchesQuery) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tagBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterFaculty();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', filterFaculty);
  }

  // Profile Modal Trigger
  const modal = document.getElementById('facultyModal');
  const modalName = document.getElementById('facultyModalName');
  const modalContent = document.getElementById('facultyModalContent');
  const closeBtn = document.getElementById('closeFacultyModalBtn');

  document.querySelectorAll('.btn-view-profile').forEach(btn => {
    btn.addEventListener('click', () => {
      const facId = btn.getAttribute('data-fac-id');
      const profile = facultyProfiles[facId];
      if (profile) {
        modalName.textContent = profile.name;
        modalContent.innerHTML = `
          <div style="margin-bottom:16px;">
            <div style="font-size:0.9375rem; font-weight:700; color:var(--color-secondary);">${profile.designation}</div>
            <div style="font-size:0.8125rem; color:var(--color-text-subtle);">${profile.education}</div>
          </div>
          <p style="font-size:0.9375rem; color:var(--color-text-muted); line-height:1.6; margin-bottom:16px;">
            ${profile.bio}
          </p>
          <div style="background:var(--color-bg); padding:16px; border-radius:8px; border:1px solid var(--color-border); font-size:0.875rem; display:flex; flex-direction:column; gap:8px;">
            <div><strong>Research Facility:</strong> ${profile.lab}</div>
            <div><strong>Active Grants:</strong> ${profile.grants}</div>
            <div><strong>Location & Hours:</strong> ${profile.office}</div>
            <div><strong>Institutional Email:</strong> <a href="mailto:${profile.email}">${profile.email}</a></div>
          </div>
        `;
        modal.classList.add('open');
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }
}

/* --------------------------------------------------------------------------
   7. Quick Search Modal (Cmd/Ctrl + K)
   -------------------------------------------------------------------------- */
function initSearchModal() {
  const triggerBtn = document.getElementById('searchTriggerBtn');
  const modal = document.getElementById('searchModal');
  const closeBtn = document.getElementById('closeSearchModalBtn');
  const searchInput = document.getElementById('globalSearchInput');
  const resultsList = document.getElementById('searchResultsList');

  const searchableIndex = [
    { title: 'B.Tech in Computer Science & Engineering', desc: '4-Year Undergraduate Program Curriculum & Admission', type: 'Program', href: '#programs' },
    { title: 'M.Tech in AI & Data Science', desc: 'Postgraduate Machine Learning & Analytics Degree', type: 'Program', href: '#programs' },
    { title: 'Ph.D. in Computing & Systems', desc: 'Doctoral research fellowship with full stipend', type: 'Program', href: '#programs' },
    { title: 'Prof. Dr. Ananya Sharma', desc: 'Head of Department | Deep Learning & Medical Vision', type: 'Faculty', href: '#faculty' },
    { title: 'Prof. Dr. David Harrison', desc: 'Systems Chair | High-Performance Cloud & Distributed Systems', type: 'Faculty', href: '#faculty' },
    { title: 'Dr. Vikramaditya Reddy', desc: 'Associate Professor | Cryptography & Zero-Knowledge Proofs', type: 'Faculty', href: '#faculty' },
    { title: 'Practical Lab Examination Schedule', desc: 'Exam schedules for CS401 & CS502', type: 'Notice', href: '#notices' },
    { title: 'Autumn On-Campus Placement Drive (NVIDIA & MSFT)', desc: 'Pre-placement talks and interview rosters', type: 'Placement', href: '#placements' },
    { title: 'Intelligent Vision & Robotics Lab', desc: 'Autonomous navigation and spatial perception lab', type: 'Lab', href: '#research' },
    { title: 'Cloud Systems & High-Perf Computing Center', desc: 'Exascale distributed architectures and HPC clusters', type: 'Lab', href: '#research' }
  ];

  function openSearch() {
    modal.classList.add('open');
    setTimeout(() => searchInput.focus(), 100);
  }

  function closeSearch() {
    modal.classList.remove('open');
    searchInput.value = '';
    renderResults(searchableIndex);
  }

  function renderResults(items) {
    if (items.length === 0) {
      resultsList.innerHTML = `<li style="padding:16px; text-align:center; color:var(--color-text-subtle); font-size:0.875rem;">No departmental records found matching your query.</li>`;
      return;
    }

    resultsList.innerHTML = items.map(item => `
      <li class="search-result-row" data-href="${item.href}">
        <div>
          <h5>${item.title}</h5>
          <p>${item.desc}</p>
        </div>
        <span class="badge badge-academic">${item.type}</span>
      </li>
    `).join('');

    // Attach click listeners to rows
    resultsList.querySelectorAll('.search-result-row').forEach(row => {
      row.addEventListener('click', () => {
        const href = row.getAttribute('data-href');
        closeSearch();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  if (triggerBtn) triggerBtn.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSearch();
    });
  }

  // Keyboard shortcut Ctrl/Cmd + K & Esc
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal.classList.contains('open') ? closeSearch() : openSearch();
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeSearch();
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      if (q === '') {
        renderResults(searchableIndex);
      } else {
        const filtered = searchableIndex.filter(i => 
          i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
        );
        renderResults(filtered);
      }
    });
  }
}

/* --------------------------------------------------------------------------
   8. Header Scroll Polish
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.getElementById('mainHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* --------------------------------------------------------------------------
   9. Mobile Menu Toggle
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = navMenu.style.display === 'flex';
      navMenu.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = 'var(--header-height)';
        navMenu.style.left = '0';
        navMenu.style.right = '0';
        navMenu.style.background = 'var(--color-surface)';
        navMenu.style.padding = '16px';
        navMenu.style.borderBottom = '1px solid var(--color-border)';
        navMenu.style.boxShadow = 'var(--shadow-lg)';
      }
    });

    // Close menu on nav link click on mobile
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navMenu.style.display = 'none';
        }
      });
    });
  }
}
