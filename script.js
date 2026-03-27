document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    const isSolid = navbar && navbar.classList.contains('navbar-solid');
    
    if (navbar) {
        if (isSolid) {
            navbar.classList.add('scrolled');
        }
        
        window.addEventListener('scroll', () => {
            if (isSolid) return; // Do not toggle for solid navbars
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

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
        const originalCards = Array.from(track.children);
        originalCards.forEach(c => {
            const clone = c.cloneNode(true);
            clone.addEventListener('click', (e) => {
                const tr = clone.closest('.models-horizontal');
                if(tr && tr.classList.contains('dragging-now')) {
                    e.preventDefault();
                    return;
                }
                if(typeof openModalForModel === 'function') {
                    openModalForModel(clone.getAttribute('data-model'));
                }
            });
            track.appendChild(clone);
        });
        
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

        setTimeout(resetTransform, 50);
        window.addEventListener('resize', resetTransform);
        track.style.cursor = 'grab';

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
            if (Math.abs(walk) > 5) {
                if (e.cancelable) e.preventDefault();
                track.classList.add('dragging-now');
            }
            
            currentTranslate = walk;
            track.style.transform = `translateX(${baseTranslate() + currentTranslate}px)`;
        };

        const shiftCards = (count, startOffset = 0) => {
            if (isAnimating || count === 0) return;
            isAnimating = true;
            
            const cardWidth = getCardWidth();

            if (count > 0) {
                track.style.transition = 'none';
                for (let i = 0; i < count; i++) {
                    track.prepend(track.lastElementChild);
                }
                const dragVisual = baseTranslate() - (count * cardWidth) + startOffset;
                track.style.transform = `translateX(${dragVisual}px)`;
                
                void track.offsetWidth;
                
                track.style.transition = 'transform 0.4s ease-in-out';
                track.style.transform = `translateX(${baseTranslate()}px)`;
            } else {
                const targetTranslate = baseTranslate() + (count * cardWidth);
                track.style.transition = 'transform 0.4s ease-in-out';
                track.style.transform = `translateX(${targetTranslate}px)`;
            }
            
            currentTranslate = 0;

            setTimeout(() => {
                track.style.transition = 'none';
                if (count < 0) {
                    for (let i = 0; i < -count; i++) {
                        track.appendChild(track.firstElementChild);
                    }
                    track.style.transform = `translateX(${baseTranslate()}px)`;
                }
                
                setTimeout(() => {
                    isAnimating = false;
                }, 50);
            }, 400);
        };

        const dragEnd = () => {
            if (!isDrag || isAnimating) return;
            isDrag = false;
            track.style.cursor = 'grab';
            
            const cardWidth = getCardWidth();
            const count = Math.round(currentTranslate / cardWidth);

            if (count === 0) {
                track.style.transition = 'transform 0.4s ease-in-out';
                track.style.transform = `translateX(${baseTranslate()}px)`;
                currentTranslate = 0;
            } else {
                shiftCards(count, currentTranslate);
            }
            
            setTimeout(() => {
                track.classList.remove('dragging-now');
            }, 300);
        };

        track.addEventListener('mousedown', dragStart);
        track.addEventListener('mousemove', dragMove);
        track.addEventListener('mouseup', dragEnd);
        track.addEventListener('mouseleave', dragEnd);
        
        track.addEventListener('touchstart', dragStart, {passive: false});
        track.addEventListener('touchmove', dragMove, {passive: false});
        track.addEventListener('touchend', dragEnd);

        btnNext.addEventListener('click', () => {
            shiftCards(-1, 0);
        });

        btnPrev.addEventListener('click', () => {
            shiftCards(1, 0);
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
        slider.style.scrollSnapType = 'none';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    const snapToNearestAlbum = () => {
        const card = document.querySelector('.album-slide');
        if (!card) return;
        const cardWidth = card.offsetWidth + 20;
        const index = Math.round(slider.scrollLeft / cardWidth);
        slider.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    };

    slider.addEventListener('mouseleave', () => {
        if (!isDown) return;
        isDown = false;
        slider.style.cursor = 'grab';
        snapToNearestAlbum();
    });

    slider.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        slider.style.cursor = 'grab';
        snapToNearestAlbum();
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
        reservationForm.addEventListener('submit', (e) => {
            // 驗證個資同意勾選
            const privacyAgreed = document.getElementById('privacyAgreed');
            if (privacyAgreed && !privacyAgreed.checked) {
                e.preventDefault();
                alert('請先閱讀並勾選「我已閱讀並同意 隱私權政策」以進行預約，感謝您的配合。');
                return;
            }

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
            const index = Math.round(albumCarousel.scrollLeft / slideWidth);
            albumCarousel.scrollTo({ left: Math.max(0, (index - 1) * slideWidth), behavior: 'smooth' });
        });
        albumNextBtn.addEventListener('click', () => {
            const slideWidth = document.querySelector('.album-slide').offsetWidth + 20;
            const index = Math.round(albumCarousel.scrollLeft / slideWidth);
            albumCarousel.scrollTo({ left: (index + 1) * slideWidth, behavior: 'smooth' });
        });
    }

    // Shorts Scroll Logic
    const shortsCarousel = document.getElementById('shortsCarousel');
    const shortPrevBtn = document.getElementById('shortPrev');
    const shortNextBtn = document.getElementById('shortNext');
    if (shortsCarousel && shortPrevBtn && shortNextBtn) {
        shortPrevBtn.addEventListener('click', () => {
            const shortWidth = document.querySelector('.short-card').offsetWidth + 24; // 24px gap
            const index = Math.round(shortsCarousel.scrollLeft / shortWidth);
            shortsCarousel.scrollTo({ left: Math.max(0, (index - 1) * shortWidth), behavior: 'smooth' });
        });
        shortNextBtn.addEventListener('click', () => {
            const shortWidth = document.querySelector('.short-card').offsetWidth + 24;
            const index = Math.round(shortsCarousel.scrollLeft / shortWidth);
            shortsCarousel.scrollTo({ left: (index + 1) * shortWidth, behavior: 'smooth' });
        });
    }

    // Shorts Drag Logic
    if (shortsCarousel) {
        let isDownShorts = false;
        let startXShorts;
        let scrollLeftShorts;
        let isDraggingShorts = false; // differentiate click and drag

        shortsCarousel.style.cursor = 'grab';

        shortsCarousel.addEventListener('mousedown', (e) => {
            isDownShorts = true;
            isDraggingShorts = false;
            shortsCarousel.style.cursor = 'grabbing';
            shortsCarousel.style.scrollSnapType = 'none';
            startXShorts = e.pageX - shortsCarousel.offsetLeft;
            scrollLeftShorts = shortsCarousel.scrollLeft;
            // Disable iframe pointer events during drag so parent can track the mouse
            shortsCarousel.querySelectorAll('iframe').forEach(ifr => ifr.style.pointerEvents = 'none');
        });

        const snapToNearestShorts = () => {
            const card = document.querySelector('.short-card');
            if (!card) return;
            const cardWidth = card.offsetWidth + 24;
            const index = Math.round(shortsCarousel.scrollLeft / cardWidth);
            shortsCarousel.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
        };

        const endDragShorts = () => {
            if (!isDownShorts) return;
            isDownShorts = false;
            shortsCarousel.style.cursor = 'grab';
            shortsCarousel.querySelectorAll('iframe').forEach(ifr => ifr.style.pointerEvents = 'auto');
            snapToNearestShorts();
            
            // Allow clicks shortly after drag finishes if it was just a tiny movement,
            // but keep isDraggingShorts true briefly, otherwise Facade might trigger immediately.
            setTimeout(() => {
                isDraggingShorts = false;
            }, 50);
        };

        shortsCarousel.addEventListener('mouseleave', endDragShorts);
        shortsCarousel.addEventListener('mouseup', endDragShorts);

        shortsCarousel.addEventListener('mousemove', (e) => {
            if (!isDownShorts) return;
            e.preventDefault();
            const x = e.pageX - shortsCarousel.offsetLeft;
            const walk = (x - startXShorts) * 2;
            if (Math.abs(walk) > 5) isDraggingShorts = true; // threshold to trigger drag
            shortsCarousel.scrollLeft = scrollLeftShorts - walk;
        });

        // Shorts Facade Loading Logic - apply to carousel
        const initializeFacade = (container) => {
            const shortCards = container.querySelectorAll('.short-card[data-video-id]');
            shortCards.forEach(card => {
                card.addEventListener('click', function(e) {
                    // Prevent loading if we are currently dragging
                    if (isDraggingShorts) {
                        e.stopPropagation();
                        return;
                    }
                    
                    const videoId = this.getAttribute('data-video-id');
                    if (!videoId) return;
                    
                    this.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                    this.removeAttribute('data-video-id');
                });
            });
        };
        initializeFacade(shortsCarousel);
    } else {
        // If not in carousel (e.g. videos.html grid page where dragging is disabled)
        const container = document.querySelector('.videos-grid');
        if(container) {
            const shortCards = container.querySelectorAll('.short-card[data-video-id]');
            shortCards.forEach(card => {
                card.addEventListener('click', function(e) {
                    const videoId = this.getAttribute('data-video-id');
                    if (!videoId) return;
                    this.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                    this.removeAttribute('data-video-id');
                });
            });
        }
    }

});

// Car Models Specs Data and Modal Logic
const carSpecsData = {
    rav4: {
        name: 'RAV4',
        officialUrl: 'https://www.toyota.com.tw/showroom/RAV4/',
        trims: [
            {
                name: 'HYBRID 豪華', price: '104萬',
                specs: { displacement: '2,487', hp: '186/6,000', combinedHp: '229', fuel: '24.0' },
                features: ['TSS 4.0智動駕駛輔助系統', 'TOYOTA Connect 智能聯網系統', '輪圈(17吋五幅式鋁圈)', '頭燈(LED Bi-Beam頭燈組(附自動水平調整))', '後視鏡(電動收折(附電熱除霧/迎賓燈))', '前座椅材質/型式(抗磨布質)', '儀錶板(12.3吋全彩數位式)', '空調系統(S-FLOW智慧型雙區獨立恆溫)', '後座出風口', '前座音響主機(10.5 吋觸控式)', 'Apple CarPlay/Android Auto(無線)/(無線)', 'PKSB防碰撞輔助系統', 'BSM盲點偵測警示系統', 'RCTA後方車側警示系統', 'RVC倒車影像輔助系統']
            },
            {
                name: 'HYBRID 尊爵', price: '117萬',
                specs: { displacement: '2,487', hp: '186/6,000', combinedHp: '229', fuel: '24.0' },
                features: ['後視鏡(電動收折(附停車收折/電熱除霧/迎賓燈))', '前座椅材質/型式(豪華皮質)', '前霧燈(LED)', '電動尾門(附遙控功能/防夾功能)', '前座椅電動調整(駕駛座:八向調整(附電動腰靠))', '後座椅材質/型式(豪華皮質)', '方向盤型式(三幅式真皮)', '排檔桿頭材質(真皮)', 'FCTA前方橫向來車警示系統', 'DMC駕駛疲勞監測系統', 'PVM環景影像輔助系統(附底盤透視)']
            },
            {
                name: 'HYBRID 尊爵+', price: '122萬',
                specs: { displacement: '2,487', hp: '186/6,000', combinedHp: '229', fuel: '24.0' },
                features: ['輪圈(18吋雙肋五幅式鋁圈)', '前座音響主機(12.9 吋觸控式)', '電源/USB(前座12V/行李廂12V/Type-C USB*5)', '行李廂遮物簾', '衛星導航系統', '間歇式雨刷(附雨滴感應功能)', '車內後視鏡(自動防眩)', 'Qi 無線充電座']
            },
            {
                name: 'HYBRID 旗艦', price: '130萬',
                specs: { displacement: '2,487', hp: '186/6,000', combinedHp: '229', fuel: '24.0' },
                features: ['輪圈(18吋雙肋五幅式雙色切削鋁圈)', '前座椅材質/型式(高級皮質)', '日行燈(LED 雙刃光條式)', '電動尾門(足踢感應式附遙控功能/防夾功能)', '天窗', '車頂架', '前座椅電動調整(駕駛座:八向調整(附電動腰靠/兩組記憶功能) 副駕駛座:八向調整)', '前座椅舒適功能(加熱/通風)', '後座椅材質/型式(高級皮質)', '後座椅舒適功能(加熱)', 'HUD抬頭顯示器', '氣氛燈(前座)', '車內後視鏡(E-Mirror電子式)', 'DVR行車紀錄器(前向/後向 (附 APP 智慧操控))', 'Easy Access', 'Qi 無線充電座 (2組)']
            }
        ]
    },
    corolla_cross: {
        name: 'Corolla Cross',
        officialUrl: 'https://www.toyota.com.tw/showroom/COROLLA_CROSS/',
        trims: [
            {
                name: '豪華汽油', price: '80.9萬',
                specs: { displacement: '1,798', hp: '140/6,400', combinedHp: '-', fuel: '14.3' },
                features: ['輪圈(17吋十幅式鋁圈)', '頭燈(LED Bi-Beam(附手動水平調整))', '尾燈(LED)', 'EPB電子駐車煞車系統', 'Auto Hold自動定車煞車系統', '前座音響主機(Drive+ Link 9吋 Wi-Fi 觸控式)', 'Apple CarPlay/Android Auto(無線) / (無線)', '儀錶板(雙環式附4.2吋全彩MID)', 'TSS 2.0智動駕駛輔助系統', 'ACC主動式車距維持定速系統(全速域/Stop&Go)', 'PCS預警式防護系統(預警式防護警示/煞車力道輔助/主動煞車輔助 (附行人/自行車手偵測))', 'RVC倒車影像輔助系統']
            },
            {
                name: '豪華(選)', price: '83.9萬',
                specs: { displacement: '1,798', hp: '140/6,400', combinedHp: '-', fuel: '14.3' },
                features: ['BSM盲點偵測警示系統', 'RCTA後方車側警示系統', 'PVM環景影像輔助系統']
            },
            {
                name: '尊爵汽油', price: '88.9萬',
                specs: { displacement: '1,798', hp: '140/6,400', combinedHp: '-', fuel: '14.3' },
                features: ['尾燈(LED光條式)', '儀錶板(12.3吋全彩數位式)']
            },
            {
                name: 'HYBRID 豪華', price: '84.9萬',
                specs: { displacement: '1,798', hp: '98/5,200', combinedHp: '122', fuel: '23.5' },
                features: ['輪圈(17吋十幅式鋁圈)', '頭燈(LED Bi-Beam(附手動水平調整))', '尾燈(LED)', 'EPB電子駐車煞車系統', 'Auto Hold自動定車煞車系統', '前座音響主機(Drive+ Link 9吋 Wi-Fi 觸控式)', 'Apple CarPlay/Android Auto(無線) / (無線)', '儀錶板(7吋全彩數位式)', 'TSS 2.0智動駕駛輔助系統', 'ACC主動式車距維持定速系統(全速域/Stop&Go)', 'PCS預警式防護系統(預警式防護警示/煞車力道輔助/主動煞車輔助 (附行人/自行車手偵測))', 'RVC倒車影像輔助系統']
            },
            {
                name: 'HYBRID 豪華(選)', price: '87.9萬',
                specs: { displacement: '1,798', hp: '98/5,200', combinedHp: '122', fuel: '23.5' },
                features: ['BSM盲點偵測警示系統', 'RCTA後方車側警示系統', 'PVM環景影像輔助系統']
            },
            {
                name: 'HYBRID 尊爵', price: '91.9萬',
                specs: { displacement: '1,798', hp: '98/5,200', combinedHp: '122', fuel: '23.5' },
                features: ['尾燈(LED光條式)', '儀錶板(12.3吋全彩數位式)']
            },
            {
                name: 'HYBRID 旗艦', price: '98.9萬',
                specs: { displacement: '1,798', hp: '98/5,200', combinedHp: '122', fuel: '23.5' },
                features: ['輪圈(18吋雙色切削鋁圈)', '頭燈(LED Bi-Beam(附序列式方向燈與手動水平調整))', '尾燈(LED光條式/旗艦專屬設計)', '前霧燈(LED)', '電動尾門', '前座椅電動調整(駕駛座: 八向調整)', '方向盤型式(三幅式真皮)', '排檔桿頭材質(皮質)', '氣氛燈(前座)', '行李廂遮物簾', '間歇式雨刷(附雨滴感應功能)', '車內後視鏡(自動防眩)']
            }
        ]
    },
    yaris_cross: {
        name: 'Yaris Cross',
        officialUrl: 'https://www.toyota.com.tw/showroom/YARIS_CROSS/',
        trims: [
            {
                name: '享樂版汽油', price: '69.5萬',
                specs: { displacement: '1,496', hp: '106/6,000', combinedHp: '-', fuel: '17.5' },
                features: ['輪圈(17吋鋁圈)', '頭燈(LED Bi-Beam(附手動水平調整))', '尾燈(LED光條式)', '後座椅調整(6/4分離椅背收折 / 2段式椅背傾斜調整)', '前座音響主機(Drive+ Link 9吋觸控式)', 'Apple CarPlay/Android Auto(有線/有線)', 'Push Start引擎啟閉系統', 'EPB電子駐車煞車系統', 'Auto Hold自動定車煞車系統', 'ACC主動式車距維持定速系統(全速域/Stop&Go)', 'PCS預警式防護系統(預警式防護警示/煞車力道輔助/主動煞車輔助 (附行人/自行車手/摩托車手偵測))', '車道行駛輔助系統(車道偏離警示/車道偏離修正輔助/車道行駛輔助)', 'AHB智慧型遠光燈自動切換系統', '踏板誤踩抑制系統(車輛前方)', '前車駛離提醒']
            },
            {
                name: '酷動版汽油', price: '73.5萬',
                specs: { displacement: '1,496', hp: '106/6,000', combinedHp: '-', fuel: '17.5' },
                features: ['輪圈(17吋雙色切削鋁圈)', '後視鏡(電動收折(附停車收折))', '方向盤控制鍵(音響/MID/電話/聲控/ACC/車道行駛輔助/駕駛模式)', '後座出風口', 'Smart Entry車門啟閉系統', '駕駛模式(NORMAL/POWER/ECO)', '倒車輔助雷達(2具)']
            },
            {
                name: '潮玩版汽油', price: '79.5萬',
                specs: { displacement: '1,496', hp: '106/6,000', combinedHp: '-', fuel: '17.5' },
                features: ['頭燈(LED Bi-Beam(附手動水平調整/鍍鉻飾條))', '前霧燈(LED)', '後視鏡(電動收折(附停車收折/迎賓燈))', '電動尾門(足踢感應式附遙控功能/防夾功能)', '車頂架', '外觀套件(銀色擾流底板、銀色車側飾條)', '前座椅材質/型式(豪華皮質)', '後座椅材質/型式(豪華皮質)', '方向盤調整(四向手動)', '儀錶板(7吋全彩數位式)', '氣氛燈(前座)', '杯架(前座中央/前座車門/後座中央/後座車門)', '空調系統(智慧型恆溫空調)', 'BSM盲點偵測警示系統', 'RCTA後方車側警示系統']
            }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('specsModal');
    if(!modal) return;
    const closeBtn = document.getElementById('closeSpecsModal');
    const modalTitle = document.getElementById('modalModelTitle');
    const modalTabs = document.getElementById('modalTabs');
    const modalSpecsBody = document.getElementById('modalSpecsBody');
    const modelCards = document.querySelectorAll('.model-h-card[data-model]');

    const renderTrimData = (trim, officialUrl) => {
        let featuresHtml = trim.features.map(f => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${f}</li>`).join('');
        
        modalSpecsBody.innerHTML = `
            <div class="trim-price-display">
                <div class="trim-price-info">
                    <span class="trim-label">建議售價</span>
                    <h3 class="trim-price">${trim.price}</h3>
                </div>
                <!-- Action Buttons on the right -->
                <div class="modal-price-actions">
                    <a href="https://line.me/ti/p/~k541293" target="_blank" class="btn-modal btn-modal-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.1 9.5c0-4.1-4.1-7.5-9.1-7.5S2.9 5.4 2.9 9.5c0 3.7 3.3 6.8 7.7 7.4.3 0 .7.2.8.5l.3 1.8c.1.5.3.6.7.4s2.1-1.3 2.9-2.3c3.5-1.1 5.9-4.1 5.9-7.8z"/></svg>
                        立即 LINE 預約
                    </a>
                    <a href="${officialUrl}" target="_blank" class="btn-modal btn-modal-outline">
                        官方詳細規格
                    </a>
                </div>
            </div>
            
            <div class="specs-grid">
                <div class="spec-item"><span>排氣量(c.c.)</span><strong>${trim.specs.displacement}</strong></div>
                <div class="spec-item"><span>最大馬力(ps/rpm)</span><strong>${trim.specs.hp}</strong></div>
                <div class="spec-item"><span>最大綜效馬力(ps)</span><strong>${trim.specs.combinedHp}</strong></div>
                <div class="spec-item"><span>平均油耗(km/l)</span><strong>${trim.specs.fuel}</strong></div>
            </div>

            <div class="features-list">
                <h4>重點規配</h4>
                <ul>
                    ${featuresHtml}
                </ul>
            </div>
            
            <div style="margin-top: 24px; font-size: 0.82rem; color: #999; text-align: left; line-height: 1.6;">
                * 本網站所載車輛圖片、規格與價格僅供參考，實際內容以官方公告及現場銷售為準。車輛配備、顏色及規格可能因車型、年份或市場調整而有所不同。
            </div>
        `;
    };

    const openModalForModel = (modelKey) => {
        const data = carSpecsData[modelKey];
        if(!data) return;
        
        modalTitle.innerText = data.name;
        
        const catToggle = document.getElementById('modalCategoryToggle');
        if(catToggle) {
            catToggle.innerHTML = '';
            catToggle.style.display = 'none';
        }
        modalTabs.innerHTML = '';
        
        const categories = { '汽油': [], 'HYBRID': [] };

        data.trims.forEach(trim => {
            const isHybrid = trim.name.toUpperCase().includes('HYBRID');
            const catKey = isHybrid ? 'HYBRID' : '汽油';
            
            let displayName = trim.name;
            if(data.name === 'Corolla Cross' || data.name === 'RAV4') {
                displayName = displayName.replace(/汽油/g, '').replace(/HYBRID/g, '').trim();
            }

            categories[catKey].push({ ...trim, displayName });
        });

        const activeCats = Object.keys(categories).filter(k => categories[k].length > 0);

        if(activeCats.length > 1 && catToggle) {
            catToggle.style.display = 'flex';

            const renderTabsForCategory = (catName) => {
                modalTabs.innerHTML = '';
                categories[catName].forEach((trimObj, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'spec-tab-btn' + (index === 0 ? ' active' : '');
                    btn.innerText = trimObj.displayName || trimObj.name;
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.spec-tab-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        renderTrimData(trimObj, data.officialUrl);
                    });
                    modalTabs.appendChild(btn);
                });
                if(categories[catName].length > 0) renderTrimData(categories[catName][0], data.officialUrl);
            };

            activeCats.forEach((catName, index) => {
                const btn = document.createElement('button');
                btn.className = 'cat-btn' + (index === 0 ? ' active' : '');
                btn.innerText = catName;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderTabsForCategory(catName);
                });
                catToggle.appendChild(btn);
            });
            renderTabsForCategory(activeCats[0]);
        } else {
            data.trims.forEach((trim, index) => {
                const btn = document.createElement('button');
                btn.className = 'spec-tab-btn' + (index === 0 ? ' active' : '');
                btn.innerText = trim.name;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.spec-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderTrimData(trim, data.officialUrl);
                });
                modalTabs.appendChild(btn);
            });
            if(data.trims.length > 0) renderTrimData(data.trims[0], data.officialUrl);
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    modelCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const track = card.closest('.models-horizontal');
            if(track && track.classList.contains('dragging-now')) {
                e.preventDefault();
                return;
            }
            openModalForModel(card.getAttribute('data-model'));
        });
    });

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Optional: Close other items when opening one
            faqItems.forEach(otherItem => otherItem.classList.remove('active'));
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // --- Sticky Contact Toggle ---
    const stickyContainer = document.querySelector('.sticky-contact');
    const stickyMain = document.querySelector('.sticky-main');
    
    if (stickyMain && stickyContainer) {
        stickyMain.addEventListener('click', (e) => {
            e.stopPropagation();
            stickyContainer.classList.toggle('active');
        });

        // Close sticky menu when clicking outside
        document.addEventListener('click', () => {
            stickyContainer.classList.remove('active');
        });
    }

    // --- Floating Widgets Scroll-Follow Animation ---
    const widgetsGroup = document.querySelector('.floating-widgets-group');
    if (widgetsGroup) {
        let lastScrollY = window.scrollY;
        let currentY = 0;
        let targetY = 0;

        const updateAnimation = () => {
            // Decay targetY back to 0 (spring origin)
            targetY *= 0.92; // The closer to 1, the longer the float time
            
            // Lerp currentY towards targetY for buttery smooth motion
            currentY += (targetY - currentY) * 0.1; // Spring stiffness

            // Apply transform (only update if displacement is visible to save CPU)
            const isMobile = window.innerWidth <= 600;
            const baseTranslate = isMobile ? '0px' : '-50%';

            if (Math.abs(currentY) > 0.5 || Math.abs(targetY) > 0.5) {
                // Subtle scale effect when displaced
                const scale = 1 - Math.min(Math.abs(currentY) / 1000, 0.05);
                widgetsGroup.style.transform = `translateY(calc(${baseTranslate} + ${currentY}px)) scale(${scale})`;
            } else {
                widgetsGroup.style.transform = `translateY(${baseTranslate}) scale(1)`;
            }
            
            requestAnimationFrame(updateAnimation);
        };

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY;
            
            // Apply drag: scroll down (positive delta) -> targetY goes up (negative offset)
            targetY += delta * -0.5;
            
            // Cap the maximum displacement
            targetY = Math.min(Math.max(targetY, -120), 120);
            
            lastScrollY = currentScrollY;
        }, { passive: true });

        // Start the physics loop
        requestAnimationFrame(updateAnimation);
    }

    // --- Loan Calculator Logic ---
    const loanModal = document.getElementById('loanModal');
    const openLoanBtn = document.getElementById('openLoanBtn');
    const closeLoanModal = document.getElementById('closeLoanModal');
    const btnCalculate = document.getElementById('btnCalculate');
    const loanResultBody = document.getElementById('loanResult');

    if (openLoanBtn && loanModal) {
        openLoanBtn.addEventListener('click', () => {
            loanModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeModalFunc = () => {
            loanModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (closeLoanModal) closeLoanModal.addEventListener('click', closeModalFunc);
        loanModal.addEventListener('click', (e) => {
            if (e.target === loanModal) closeModalFunc();
        });
    }

    if (btnCalculate) {
        btnCalculate.addEventListener('click', () => {
            const priceVal = parseFloat(document.getElementById('loanPrice').value);
            const downVal = parseFloat(document.getElementById('loanDownPayment').value);
            const months = parseInt(document.getElementById('loanMonths').value);
            const annualRate = parseFloat(document.getElementById('loanRate').value);

            const principal = (priceVal - downVal) * 10000;
            
            if (principal <= 0) {
                alert('頭期款不能大於或等於車價喔！');
                return;
            }

            const monthlyRate = annualRate / 12 / 100;
            let monthlyPayment;

            if (monthlyRate === 0) {
                monthlyPayment = principal / months;
            } else {
                monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            }

            const totalRepayment = monthlyPayment * months;
            const totalInterest = totalRepayment - principal;

            document.getElementById('monthlyPayment').innerText = Math.round(monthlyPayment).toLocaleString();
            document.getElementById('totalLoanAmount').innerText = (principal / 10000).toFixed(1) + ' 萬';
            document.getElementById('totalInterest').innerText = Math.round(totalInterest).toLocaleString() + ' 元';

            if (loanResultBody) loanResultBody.style.display = 'block';
        });
    }

    // --- Privacy Modal Logic ---
    const privacyModal = document.getElementById('privacyModal');
    const openPrivacyBtn = document.getElementById('openPrivacyBtn');
    const openPrivacyBtnFooter = document.querySelector('.openPrivacyBtnFooter');
    const closePrivacyModal = document.getElementById('closePrivacyModal');

    if (privacyModal) {
        const openPrivacy = (e) => {
            if (e) e.preventDefault();
            privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closePrivacy = () => {
            privacyModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', openPrivacy);
        if (openPrivacyBtnFooter) openPrivacyBtnFooter.addEventListener('click', openPrivacy);
        if (closePrivacyModal) closePrivacyModal.addEventListener('click', closePrivacy);
        
        privacyModal.addEventListener('click', (e) => {
            if (e.target === privacyModal) closePrivacy();
        });
    }
});
