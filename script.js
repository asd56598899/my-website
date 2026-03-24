document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Scroll Reveal Animation with Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });
    
    // Initial trigger for elements already in view (like Heros)
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if(rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 100);

    // Mobile Hamburger Menu Logic
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            navbar.classList.toggle('menu-open');
            
            // Prevent body scrolling when menu is open
            if (navLinks.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking any link
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                navbar.classList.remove('menu-open');
                document.body.style.overflow = '';
            });
        });
    }
});

// 動態載入成交相簿照片
document.addEventListener('DOMContentLoaded', () => {
    // 建立照片全螢幕檢視 Lightbox
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.innerHTML = `
        <span class="lightbox-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </span>
        <img class="lightbox-content" id="lightbox-img">
    `;
    document.body.appendChild(lightbox);

    // 點擊背景或關閉按鈕時關閉 Lightbox
    lightbox.addEventListener('click', (e) => {
        if (e.target !== document.getElementById('lightbox-img')) {
            lightbox.classList.remove('show');
        }
    });

    const carouselTrack = document.querySelector('.album-carousel');
    const gridContainer = document.querySelector('.album-grid');
    
    if (!carouselTrack && !gridContainer) return;
    
    // 清除預設的佔位圖
    if (carouselTrack) carouselTrack.innerHTML = '';
    if (gridContainer) gridContainer.innerHTML = '';

    let i = 1;
    let failedAttempts = 0;
    const maxFailedAttempts = 3; // 容許連續失敗3次就停止尋找，避免無窮迴圈

    function tryLoadImage() {
        if (failedAttempts >= maxFailedAttempts) {
            // 如果連第一張都沒有，顯示提示
            if (i <= maxFailedAttempts + 1) {
                const emptyMsg = '<div style="padding:20px; color:#666;">尚未上傳照片。請將相片存為 1.jpg, 2.jpg... 並放入 assets/album/ 資料夾中。</div>';
                if (carouselTrack) carouselTrack.innerHTML = emptyMsg;
                if (gridContainer) gridContainer.innerHTML = emptyMsg;
            }
            return;
        }

        const imgSrc = `assets/album/${i}.jpg`;
        const img = new Image();
        
        img.onload = function() {
            failedAttempts = 0; // 成功載入則重置失敗次數
            
            // 加入首頁輪播圖 (最多顯示前8張)
            if (carouselTrack && i <= 8) {
                const slide = document.createElement('div');
                slide.className = 'album-slide';
                slide.innerHTML = `<img src="${imgSrc}" draggable="false" style="width:100%; height:100%; object-fit:cover; border-radius:12px; cursor:pointer; -webkit-user-drag:none;" alt="成交相片 ${i}">`;
                
                // 綁定點擊事件
                slide.querySelector('img').addEventListener('click', () => {
                    document.getElementById('lightbox-img').src = imgSrc;
                    lightbox.classList.add('show');
                });
                
                carouselTrack.appendChild(slide);
            }
            
            // 加入展開頁面網格
            if (gridContainer) {
                const item = document.createElement('div');
                item.className = 'album-item';
                item.innerHTML = `<img src="${imgSrc}" draggable="false" style="width:100%; height:100%; object-fit:cover; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); cursor:pointer; -webkit-user-drag:none;" alt="成交相片 ${i}">`;
                
                // 綁定點擊事件
                item.querySelector('img').addEventListener('click', () => {
                    document.getElementById('lightbox-img').src = imgSrc;
                    lightbox.classList.add('show');
                });
                
                gridContainer.appendChild(item);
            }
            
            i++;
            tryLoadImage(); // 繼續載入下一張
        };
        
        img.onerror = function() {
            failedAttempts++;
            i++;
            tryLoadImage(); // 容錯跳號繼續找
        };
        
        img.src = imgSrc;
    }
    
    tryLoadImage();
});

// 車款無限輪播邏輯
document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.models-horizontal');
    const btnPrev = document.querySelector('.model-prev');
    const btnNext = document.querySelector('.model-next');

    if (track && btnPrev && btnNext) {
        let isAnimating = false;
        let isDrag = false;
        let startX = 0;
        let currentTranslate = 0;
        
        // --- 無縫輪迴準備 ---
        // 複製現有卡片，這樣拖移時畫面之外才會有實體可以自然顯示，不會「突然變出來」
        const originalCards = Array.from(track.children);
        originalCards.forEach(c => track.appendChild(c.cloneNode(true)));
        
        // 為了讓第一張卡片有「前一張」可以往右拉，我們先把最後一張搬到最前面
        track.prepend(track.lastElementChild);
        
        const getCardWidth = () => {
            const card = track.firstElementChild;
            const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
            return card.getBoundingClientRect().width + gap;
        };

        const baseTranslate = () => -getCardWidth();

        const resetTransform = () => {
            track.style.transition = 'none';
            track.style.transform = `translateX(${baseTranslate()}px)`;
        };

        // 初始化位置
        setTimeout(resetTransform, 50);
        window.addEventListener('resize', resetTransform);
        track.style.cursor = 'grab';

        // === 拖曳相關邏輯 ===
        const dragStart = (e) => {
            if (isAnimating) return;
            isDrag = true;
            track.style.cursor = 'grabbing';
            track.style.transition = 'none';
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        };

        const dragMove = (e) => {
            if (!isDrag || isAnimating) return;
            const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            const walk = currentX - startX;
            if (Math.abs(walk) > 5) e.preventDefault();
            
            currentTranslate = walk;
            track.style.transform = `translateX(${baseTranslate() + currentTranslate}px)`;
        };

        const dragEnd = () => {
            if (!isDrag || isAnimating) return;
            isDrag = false;
            track.style.cursor = 'grab';
            
            if (currentTranslate < -60) {
                btnNext.click();
            } else if (currentTranslate > 60) {
                btnPrev.click();
            } else {
                track.style.transition = 'transform 0.4s ease-in-out';
                track.style.transform = `translateX(${baseTranslate()}px)`;
                currentTranslate = 0;
            }
        };

        track.addEventListener('mousedown', dragStart);
        track.addEventListener('mousemove', dragMove);
        track.addEventListener('mouseup', dragEnd);
        track.addEventListener('mouseleave', dragEnd);
        
        track.addEventListener('touchstart', dragStart, {passive: true});
        track.addEventListener('touchmove', dragMove, {passive: false});
        track.addEventListener('touchend', dragEnd);

        // === 按鈕點擊邏輯 ===
        btnNext.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;
            
            const cardWidth = getCardWidth();
            const targetTranslate = baseTranslate() - cardWidth;
            
            track.style.transition = 'transform 0.4s ease-in-out';
            track.style.transform = `translateX(${targetTranslate}px)`;
            
            currentTranslate = 0;

            setTimeout(() => {
                track.style.transition = 'none';
                track.appendChild(track.firstElementChild);
                track.style.transform = `translateX(${baseTranslate()}px)`;
                
                setTimeout(() => {
                    isAnimating = false;
                }, 50);
            }, 400);
        });

        btnPrev.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;
            
            const cardWidth = getCardWidth();
            
            track.prepend(track.lastElementChild);
            track.style.transition = 'none';
            
            // 將 DOM 位移的視覺落差與拖曳位置結合，保持滑動連續不突兀
            const startTrans = baseTranslate() + currentTranslate - cardWidth;
            track.style.transform = `translateX(${startTrans}px)`;
            
            void track.offsetWidth;
            
            track.style.transition = 'transform 0.4s ease-in-out';
            track.style.transform = `translateX(${baseTranslate()}px)`;
            
            currentTranslate = 0;

            setTimeout(() => {
                isAnimating = false;
            }, 400);
        });
    }
});

// 成交相簿拖曳功能
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.album-carousel');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;

    slider.style.cursor = 'grab';

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); // 阻止選取圖片等預設行為
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5; // 滑動速度
        if (Math.abs(walk) > 5) isDragging = true; // 判定為拖曳而非點擊
        slider.scrollLeft = scrollLeft - walk;
    });

    // 攔截拖曳時產生的點擊事件 (避免觸發 Lightbox)
    slider.addEventListener('click', (e) => {
        if (isDragging) {
            e.stopPropagation();
            isDragging = false;
        }
    }, true);
});

// 預約諮詢表單邏輯
// 預約諮詢表單邏輯
document.addEventListener('DOMContentLoaded', () => {
    const lineCheckModern = document.getElementById('lineCheckModern');
    const lineIdBoxModern = document.getElementById('lineIdBoxModern');
    const lineIdInputModern = document.getElementById('lineIdInputModern');
    const reservationForm = document.getElementById('reservationForm');

    if (lineCheckModern && lineIdBoxModern && lineIdInputModern) {
        lineCheckModern.addEventListener('change', (e) => {
            if (e.target.checked) {
                lineIdBoxModern.classList.add('active');
                lineIdInputModern.disabled = false;
                lineIdInputModern.focus();
            } else {
                lineIdBoxModern.classList.remove('active');
                lineIdInputModern.disabled = true;
                lineIdInputModern.value = '';
            }
        });
    }

    if (reservationForm) {
        // 放行預設的 HTML 表單送出 (POST to FormSubmit)
        // 這樣可以避免本地測試 (file://) 遇到的 CORS 問題
        // 也能確保第一次送出必定觸發 FormSubmit 的認證引導頁面
        reservationForm.addEventListener('submit', () => {
            const submitBtn = reservationForm.querySelector('.submit-btn');
            if (submitBtn) {
                // 送出後改變按鈕狀態，避免重複點擊
                submitBtn.innerText = '正在導向 FormSubmit 傳送中...';
                submitBtn.style.opacity = '0.7';
                
                // 設定一小段時間後禁用按鈕（不立刻禁用是因為部分瀏覽器禁用後就不會送出表單）
                setTimeout(() => {
                    submitBtn.disabled = true;
                }, 50);
            }
        });
    }
    // Album Scroll Logic
    const albumCarousel = document.getElementById('albumCarousel');
    const albumPrevBtn = document.getElementById('albumPrev');
    const albumNextBtn = document.getElementById('albumNext');
    if (albumCarousel && albumPrevBtn && albumNextBtn) {
        albumPrevBtn.addEventListener('click', () => {
            const slideWidth = document.querySelector('.album-slide').offsetWidth + 20;
            albumCarousel.scrollBy({ left: -slideWidth, behavior: 'smooth' });
        });
        albumNextBtn.addEventListener('click', () => {
            const slideWidth = document.querySelector('.album-slide').offsetWidth + 20;
            albumCarousel.scrollBy({ left: slideWidth, behavior: 'smooth' });
        });
    }

});
