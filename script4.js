document.addEventListener('DOMContentLoaded', () => {
    // Mobile Notification System
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        const mobileNotif = document.createElement('div');
        mobileNotif.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-[100] flex items-center justify-between animate-bounce';
        mobileNotif.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-mobile-alt mr-3 text-xl"></i>
                <span class="text-sm">Gunakan mode incognito/private jika tidak bisa membuka buku.</span>
            </div>
            <button id="closeNotif" class="ml-4 text-white hover:text-blue-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(mobileNotif);
        document.getElementById('closeNotif').addEventListener('click', () => {
            mobileNotif.style.display = 'none';
        });
        setTimeout(() => {
            mobileNotif.style.opacity = '0';
            setTimeout(() => mobileNotif.style.display = 'none', 500);
        }, 10000);
    }

    // Navbar active state on scroll
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');
    const stickyNav = document.querySelector('.sticky-nav');
    let stickyNavHeight = stickyNav ? stickyNav.offsetHeight : 0;

    function updateActiveNavLink() {
        let currentActiveSectionId = '';
        const scrollPosition = window.scrollY + stickyNavHeight + 100; // Tambah buffer

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentActiveSectionId = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentActiveSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNavLink);
    window.addEventListener('resize', updateActiveNavLink);

    // Load data dari data.json
    fetch('data.json')
        .then(response => response.json())
        .then(ebooksData => {
            const originalEbooks = [...ebooksData];
            let allEbooks = [...ebooksData];
            let displayedEbooks = [];

            const searchInput = document.getElementById('searchInput');
            const searchButton = document.getElementById('searchButton');
            const filterCategory = document.getElementById('filterCategory');
            const filterYear = document.getElementById('filterYear');
            const ebookListEl = document.getElementById('ebookList');
            const noResults = document.getElementById('noResults');
            const homeSectionBooksContainer = document.querySelector('#home-section .story-cards');
            const ebookModal = document.getElementById('ebookModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalDescription = document.getElementById('modalDescription');
            const modalDownloadLink = document.getElementById('modalDownloadLink');
            const modalReadLink = document.getElementById('modalReadLink');
            const closeButton = document.querySelector('.close-button');
            const loadMoreButton = document.getElementById('loadMoreButton');
            const sortButton = document.getElementById('sortButton');
            const backToTopBtn = document.getElementById('backToTopBtn');

            let currentPage = 1;
            const ebooksPerPage = 8;
            const popularBooksCount = 6;

            // --- Fungsi untuk Menampilkan Buku ---
            function displayBooksInList(booksToRender) {
                ebookListEl.innerHTML = ''; // Clear existing content
                
                const startIndex = (currentPage - 1) * ebooksPerPage;
                const endIndex = startIndex + ebooksPerPage;
                const booksForCurrentPage = booksToRender.slice(startIndex, endIndex);

                if (booksForCurrentPage.length === 0 && currentPage === 1) {
                    noResults.classList.remove('hidden');
                } else {
                    noResults.classList.add('hidden');
                    booksForCurrentPage.forEach(ebook => {
                        const ebookCard = document.createElement('div');
                        const cardColor = ebook.color || 'bg-blue-50';
                        ebookCard.className = `ebook-card ${cardColor} rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col`;
                        ebookCard.innerHTML = `
                        <div class="p-5 flex-grow">
                            <div class="flex justify-between items-start mb-3">
                                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                                    ebook.category === 'Cerita' ? 'bg-yellow-200 text-yellow-800' : 
                                    ebook.category === 'Pelajaran' ? 'bg-blue-200 text-blue-800' : 
                                    ebook.category === 'Puisi' ? 'bg-green-200 text-green-800' : 
                                    'bg-pink-200 text-pink-800'
                                }">
                                    ${ebook.category}
                                </span>
                                <span class="text-xs text-gray-500">${ebook.year}</span>
                            </div>
                            <h3 class="text-lg font-bold mb-2 text-gray-800 leading-tight">${ebook.title}</h3>
                            <p class="text-sm text-gray-600 mb-4">${ebook.description.substring(0, 80)}...</p>
                        </div>
                        <div class="flex gap-2 p-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
                            <button class="read-more-btn flex-1 text-center bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition duration-300 ease-in-out text-sm"
                                data-ebook-id="${ebook.id}">
                                <i class="fas fa-book-reader mr-1"></i>Detail
                            </button>
                            <a href="${ebook.drive_link}" class="flex-1 text-center bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-md transition duration-300 ease-in-out text-sm"
                                download>
                                <i class="fas fa-download mr-1"></i>Download
                            </a>
                        </div>`;
                        ebookListEl.appendChild(ebookCard);
                    });
                }
                updateLoadMoreButtonVisibility(booksToRender);
            }

            function displayPopularBooks() {
                const popular = [...originalEbooks]
                    .sort((a, b) => parseInt(b.year) - parseInt(a.year) || a.title.localeCompare(b.title))
                    .slice(0, popularBooksCount);
                
                homeSectionBooksContainer.innerHTML = popular.map(book => `
                    <div class="story-card bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 w-56 sm:w-60 md:w-64 transform hover:scale-105 transition-transform duration-300 cursor-pointer" data-ebook-id="${book.id}">
                        <div class="h-36 ${book.color} flex items-center justify-center">
                            <i class="fas fa-book-open text-4xl text-gray-600"></i>
                        </div>
                        <div class="p-4">
                            <h3 class="font-bold text-md text-gray-800 truncate">${book.title}</h3>
                            <p class="text-gray-600 text-xs mt-1 truncate">${book.description.substring(0, 50)}...</p>
                            <button class="read-more-btn-story text-xs mt-2 text-blue-600 hover:text-blue-800 font-semibold" data-ebook-id="${book.id}">Lihat Detail <i class="fas fa-arrow-right ml-1"></i></button>
                        </div>
                    </div>`).join('');

                homeSectionBooksContainer.querySelectorAll('.story-card, .read-more-btn-story').forEach(card => {
                    card.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const ebookId = parseInt(card.dataset.ebookId);
                        const selectedEbook = originalEbooks.find(ebook => ebook.id === ebookId);
                        if (selectedEbook) openEbookModal(selectedEbook);
                    });
                });
            }

            // --- Fungsi Filter dan Sortir ---
            function applyFiltersAndSort() {
                const searchTerm = searchInput.value.toLowerCase();
                const selectedCategory = filterCategory.value;
                const selectedYear = filterYear.value;

                displayedEbooks = allEbooks.filter(ebook =>
                    (
                        ebook.title.toLowerCase().includes(searchTerm) ||
                        ebook.description.toLowerCase().includes(searchTerm)
                    ) &&
                    (selectedCategory ? ebook.category === selectedCategory : true) &&
                    (selectedYear ? ebook.year === selectedYear : true)
                );
                
                currentPage = 1;
                displayBooksInList(displayedEbooks);
            }

            let sortAscending = true;
            function handleSort() {
                allEbooks.sort((a, b) => sortAscending ? 
                    a.title.localeCompare(b.title) : 
                    b.title.localeCompare(a.title));
                sortButton.innerHTML = sortAscending ? 
                    '<i class="fas fa-sort-alpha-up"></i> Urutkan' : 
                    '<i class="fas fa-sort-alpha-down"></i> Urutkan';
                sortAscending = !sortAscending;
                applyFiltersAndSort();
            }
            
            // --- Fungsi Utilitas Lain ---
            function updateLoadMoreButtonVisibility(books) {
                const totalDisplayed = currentPage * ebooksPerPage;
                loadMoreButton.style.display = books.length > totalDisplayed ? 'inline-block' : 'none';
            }

            function openEbookModal(ebook) {
                modalTitle.textContent = ebook.title;
                modalDescription.textContent = ebook.description;
                modalDownloadLink.href = ebook.drive_link;
                
                // Perbaikan link baca online
                const fileId = ebook.drive_link.match(/id=([^&]+)/)[1];
                modalReadLink.href = `https://docs.google.com/viewer?url=https://drive.google.com/uc?id=${fileId}`;
                
                ebookModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                
                // Tambahkan event listener untuk scroll dalam modal
                const modalContent = document.querySelector('.modal-content');
                modalContent.addEventListener('scroll', function() {
                    if (this.scrollTop + this.clientHeight >= this.scrollHeight - 10) {
                        this.style.borderBottom = '2px solid #3B82F6';
                    } else {
                        this.style.borderBottom = '1px solid #90CDF4';
                    }
                });
            }

            function closeEbookModal() {
                ebookModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }

            // --- Event Listeners ---
            searchInput.addEventListener('input', applyFiltersAndSort);
            searchButton.addEventListener('click', applyFiltersAndSort);
            filterCategory.addEventListener('change', applyFiltersAndSort);
            filterYear.addEventListener('change', applyFiltersAndSort);
            sortButton.addEventListener('click', handleSort);

            loadMoreButton.addEventListener('click', () => {
                currentPage++;
                displayBooksInList(displayedEbooks);
            });

            closeButton.addEventListener('click', closeEbookModal);
            window.addEventListener('click', (event) => {
                if (event.target === ebookModal) closeEbookModal();
            });
            window.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && ebookModal.style.display === 'block') closeEbookModal();
            });

            ebookListEl.addEventListener('click', (event) => {
                const readMoreButton = event.target.closest('.read-more-btn');
                if (readMoreButton) {
                    const ebookId = parseInt(readMoreButton.dataset.ebookId);
                    const selectedEbook = originalEbooks.find(ebook => ebook.id === ebookId);
                    if (selectedEbook) openEbookModal(selectedEbook);
                }
            });
            
            // Back to Top Button
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    backToTopBtn.style.display = "block";
                } else {
                    backToTopBtn.style.display = "none";
                }
                updateActiveNavLink();
            });
            
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // --- Inisialisasi Tampilan Awal ---
            function initializeApp() {
                displayPopularBooks();
                displayedEbooks = [...allEbooks];
                displayBooksInList(displayedEbooks);
                updateActiveNavLink();
            }

            initializeApp();

        }).catch(error => {
            console.error("Error loading data:", error);
            const noResultsEl = document.getElementById('noResults');
            if(noResultsEl) {
                noResultsEl.classList.remove('hidden');
                noResultsEl.innerHTML = ` 
                    <i class="fas fa-sad-tear text-6xl text-red-400 mb-4"></i>
                    <h3 class="text-2xl font-bold text-red-600">Aduh, Gagal Memuat Buku!</h3>
                    <p class="text-gray-500">Coba refresh halaman atau periksa koneksi internetmu.</p>
                `;
            }
        });
});