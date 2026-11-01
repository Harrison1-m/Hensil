document.addEventListener('DOMContentLoaded', () => {

    // 1. Remove Loader
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 300);
    }

    // 2. Scroll Reveal Animations (Ensure 100% visibility immediately)
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        reveals.forEach(reveal => {
            reveal.classList.add('active');
        });
    }

    // 3. Navbar & Back to Top
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('back-to-top');

    if (navbar || backToTop) {
        window.addEventListener('scroll', () => {
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }

            if (backToTop) {
                if (window.scrollY > 500) {
                    backToTop.classList.add('show');
                } else {
                    backToTop.classList.remove('show');
                }
            }
        });
    }

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 4. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 5. Dark/Light Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            if (icon) {
                if (document.body.classList.contains('light-mode')) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
        });
    }

    // 6. Animated Counters
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const counterOptions = { threshold: 1, rootMargin: "0px" };

        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = +entry.target.getAttribute('data-target');
                    const speed = 200; // Lower is faster
                    const inc = target / speed;

                    const updateCount = () => {
                        const current = +entry.target.innerText;
                        if (current < target) {
                            entry.target.innerText = Math.ceil(current + inc);
                            setTimeout(updateCount, 10);
                        } else {
                            entry.target.innerText = target + "+";
                        }
                    };
                    updateCount();
                    observer.unobserve(entry.target);
                }
            });
        }, counterOptions);

        counters.forEach(counter => counterObserver.observe(counter));
    }

    // 7. Portfolio Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterBtns.length > 0 && galleryItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class
                filterBtns.forEach(button => button.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.classList.contains(filterValue)) {
                        item.style.display = 'block';
                        setTimeout(() => item.style.opacity = '1', 10);
                    } else {
                        item.style.opacity = '0';
                        setTimeout(() => item.style.display = 'none', 300);
                    }
                });
            });
        });
    }

    // 8. Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-lightbox');

    if (lightbox && lightboxImg && closeBtn && galleryItems.length > 0) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img) {
                    lightbox.style.display = 'block';
                    lightboxImg.src = img.src;
                }
            });
        });

        closeBtn.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                lightbox.style.display = 'none';
            }
        });
    }

    // 9. Booking Form
    const form = document.getElementById('booking-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton ? submitButton.textContent : 'Send Inquiry';

            const name = form.elements.name?.value.trim();
            const email = form.elements.email?.value.trim();
            const phone = form.elements.phone?.value.trim();
            const service = form.elements.service?.value;
            const date = form.elements.date?.value;
            const message = form.elements.message?.value.trim();
            const budget = form.elements.budget?.value;

            const finalMessage = budget
                ? `${message}\n\nEstimated Budget: ${budget}`
                : message;

            const bookingData = {
                name,
                email,
                phone,
                service,
                date,
                message: finalMessage
            };

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Sending...';
            }

            try {
                // Frontend is hosted on GitHub Pages; the API runs on the VPS over HTTPS.
                const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? 'http://localhost:5000/api'
                    : 'https://178.162.254.195/api';

                const response = await fetch(
                    `${API_URL}/contact`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(bookingData)
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || 'Failed to send inquiry.'
                    );
                }

                alert(data.message);
                form.reset();

                if (data.booking) {
                    if (confirm("Booking submitted successfully! Would you like to view and download your official studio invoice now?")) {
                        window.open(`${API_URL}/invoices/${data.booking.id}`, '_blank');
                    }
                }

            } catch (error) {
                console.error('Booking error:', error);

                alert(
                    error.message ||
                    'Unable to send your inquiry. Please try again.'
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }

    // =========================================
    // CONCIERGE CHATBOT SIMPLE LOGIC
    // =========================================
    const chatTrigger = document.getElementById('chat-trigger');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatTrigger && chatWindow && chatClose && chatForm && chatInput && chatMessages) {
        // Open/Close Functionality
        chatTrigger.addEventListener('click', () => {
            chatWindow.classList.toggle('open');
            if (chatWindow.classList.contains('open')) {
                chatInput.focus();
            }
        });

        chatClose.addEventListener('click', () => {
            chatWindow.classList.remove('open');
        });

        // Form submission & Automated Smart Responses
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userText = chatInput.value.trim();
            if (!userText) return;

            // Render User Message
            appendMessage(userText, 'user-msg');
            chatInput.value = '';

            // Simulate Studio Response Delay
            setTimeout(() => {
                const botReply = generateStudioReply(userText);
                appendMessage(botReply, 'system-msg');
            }, 800);
        });

        function appendMessage(text, className) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', className);
            messageDiv.innerHTML = `<p>${text}</p>`;
            chatMessages.appendChild(messageDiv);
            
            // Auto Scroll to Bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function generateStudioReply(input) {
            const query = input.toLowerCase();
            
            if (query.includes('book') || query.includes('session') || query.includes('schedule') || query.includes('hire')) {
                return "To secure a date, please fill out our structural brief on the <strong>Contact page</strong> or let us know your preferred month right here.";
            }
            if (query.includes('price') || query.includes('cost') || query.includes('investment') || query.includes('rate')) {
                return "Our primary configurations range from $500 for the Essential set to $2,500 for comprehensive Full-Day productions. Detailed matrices can be parsed on our <strong>Pricing page</strong>.";
            }
            if (query.includes('portfolio') || query.includes('gallery') || query.includes('work') || query.includes('photos')) {
                return "You can review our curated archives broken down by Wedding, Portrait, and Editorial sectors seamlessly on our dedicated <strong>Portfolio page</strong>.";
            }
            if (query.includes('location') || query.includes('where') || query.includes('studio') || query.includes('travel')) {
                return "Our physical workspace is located at Machakos, Kenya. However, we accept international commissions and assignments globally.";
            }
            
            // Default automated fall-back
            return "Thank you for outlining your requirements. Your message has been routed directly to our creative desk. Alternatively, you may connect immediately via phone line at +254 759 701803.";
        }
    }
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =========================================
// PAID SECURE MEDIA GALLERY & M-PESA LOGIC
// =========================================

let mediaCursor = null;
let currentCategory = 'all';
let isLoadingMedia = false;
let hasMoreMedia = true;
let activeCheckoutId = null;
let selectedMediaForPayment = null;

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://178.162.254.195/api';

document.addEventListener('DOMContentLoaded', () => {
    const mediaGrid = document.getElementById('media-grid');
    if (mediaGrid) {
        loadMediaBatch();

        // Infinite Scroll via IntersectionObserver
        const sentinel = document.getElementById('scroll-sentinel');
        if (sentinel) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !isLoadingMedia && hasMoreMedia) {
                    loadMediaBatch();
                }
            }, { threshold: 0.1 });
            observer.observe(sentinel);
        }
    }
});

async function loadMediaBatch() {
    if (isLoadingMedia || !hasMoreMedia) return;
    isLoadingMedia = true;

    const mediaGrid = document.getElementById('media-grid');
    const sentinel = document.getElementById('scroll-sentinel');

    try {
        let url = `${API_BASE_URL}/media?limit=12`;
        if (mediaCursor) url += `&cursor=${encodeURIComponent(mediaCursor)}`;
        if (currentCategory && currentCategory !== 'all') url += `&category=${encodeURIComponent(currentCategory)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (mediaGrid.querySelector('.loading')) {
            mediaGrid.innerHTML = '';
        }

        const assets = data.data || [];
        mediaCursor = data.nextCursor;
        hasMoreMedia = data.hasMore;

        if (assets.length === 0 && mediaGrid.children.length === 0) {
            mediaGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">No media assets found in this category.</div>`;
            isLoadingMedia = false;
            return;
        }

        assets.forEach(asset => {
            const card = document.createElement('div');
            card.className = `gallery-item ${asset.category}`;
            card.style.cssText = 'background: #1b1b1b; border: 1px solid #333; border-radius: 10px; overflow: hidden; position: relative; display: flex; flex-direction: column;';

            let mediaPreviewHtml = '';
            if (asset.type === 'video') {
                mediaPreviewHtml = `
                    <div style="position: relative; width: 100%; height: 260px; background: #000; overflow: hidden;">
                        <video src="${API_BASE_URL}/media/download/${asset.id}?token=preview" autoplay muted loop playsinline style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;"></video>
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #c9a227;"><i class="fas fa-video"></i> Teaser</div>
                    </div>
                `;
            } else {
                // Image with Drag-to-Peek Watermark
                mediaPreviewHtml = `
                    <div class="watermark-container" style="position: relative; width: 100%; height: 260px; background: #000; overflow: hidden; user-select: none;">
                        <img loading="lazy" decoding="async" src="${API_BASE_URL}/media/download/${asset.id}?token=preview" alt="${escapeHtml(asset.title)}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                        ${asset.is_locked ? `
                            <div class="draggable-logo" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; background: rgba(201, 162, 39, 0.85); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: grab; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: transform 0.3s ease; z-index: 10;" title="Drag to peek under logo">
                                <img src="frontend/assets/favicon.png" alt="Hensil Logo" style="width: 40px; height: 40px; pointer-events: none;">
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            card.innerHTML = `
                ${mediaPreviewHtml}
                <div style="padding: 15px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
                    <div>
                        <div style="font-size: 11px; color: #c9a227; text-transform: uppercase; margin-bottom: 4px;">${escapeHtml(asset.category)}</div>
                        <h4 style="font-size: 16px; margin-bottom: 8px; color: #fff;">${escapeHtml(asset.title)}</h4>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid #2d2d2d; padding-top: 12px;">
                        <span style="font-weight: 700; color: ${asset.is_locked ? '#52d98b' : '#64c5ff'};">${asset.is_locked ? 'KES ' + parseFloat(asset.price).toLocaleString() : 'Free Download'}</span>
                        ${asset.is_locked ? `
                            <button onclick='openMpesaModal(${JSON.stringify(asset)})' style="background: #c9a227; color: #111; padding: 7px 14px; border-radius: 5px; font-weight: 600; font-size: 13px; cursor: pointer; border: none;"><i class="fas fa-lock-open"></i> Unlock</button>
                        ` : `
                            <a href="${API_BASE_URL}/media/download/${asset.id}" target="_blank" style="background: #246b45; color: #fff; padding: 7px 14px; border-radius: 5px; font-weight: 600; font-size: 13px; text-decoration: none;"><i class="fas fa-download"></i> Download</a>
                        `}
                    </div>
                </div>
            `;

            mediaGrid.appendChild(card);
            initDragToPeek(card.querySelector('.draggable-logo'));
        });

        if (!hasMoreMedia && sentinel) {
            sentinel.innerHTML = `<span style="color: #666; font-size: 13px;">— End of Archive —</span>`;
        }
    } catch (err) {
        console.error('Error loading media batch:', err);
    } finally {
        isLoadingMedia = false;
    }
}

function filterCategory(category) {
    currentCategory = category;
    mediaCursor = null;
    hasMoreMedia = true;
    const mediaGrid = document.getElementById('media-grid');
    mediaGrid.innerHTML = `<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 40px;">Loading category...</div>`;
    loadMediaBatch();
}

// Drag-to-Peek Logo Watermark Mechanics
function initDragToPeek(logo) {
    if (!logo) return;
    let isDragging = false;
    let startX, startY;

    logo.addEventListener('mousedown', dragStart);
    logo.addEventListener('touchstart', dragStart, { passive: true });

    function dragStart(e) {
        isDragging = true;
        logo.style.transition = 'none';
        logo.style.cursor = 'grabbing';
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        startX = clientX - logo.offsetLeft;
        startY = clientY - logo.offsetTop;

        document.addEventListener('mousemove', dragging);
        document.addEventListener('touchmove', dragging, { passive: true });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    }

    function dragging(e) {
        if (!isDragging) return;
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        const x = clientX - startX;
        const y = clientY - startY;
        logo.style.transform = `translate(${x - logo.parentElement.offsetWidth / 2 + 35}px, ${y - logo.parentElement.offsetHeight / 2 + 35}px)`;
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        logo.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        logo.style.transform = 'translate(-50%, -50%)';
        logo.style.cursor = 'grab';

        document.removeEventListener('mousemove', dragging);
        document.removeEventListener('touchmove', dragging);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
    }
}

// M-Pesa Modal & Payment Flow
function openMpesaModal(asset) {
    selectedMediaForPayment = asset;
    document.getElementById('modal-item-title').textContent = asset.title;
    document.getElementById('modal-price-display').textContent = `KES ${parseFloat(asset.price).toLocaleString()}`;
    document.getElementById('mpesa-form').style.display = 'block';
    document.getElementById('mpesa-status-area').style.display = 'none';
    document.getElementById('mpesa-modal').style.display = 'flex';
}

function closeMpesaModal() {
    document.getElementById('mpesa-modal').style.display = 'none';
    if (activeCheckoutId) {
        clearInterval(activeCheckoutId);
        activeCheckoutId = null;
    }
}

async function initiateMpesaPayment(e) {
    e.preventDefault();
    const phone = document.getElementById('mpesa-phone').value.trim();
    if (!phone || !selectedMediaForPayment) return;

    const submitBtn = document.getElementById('mpesa-submit-btn');
    submitBtn.textContent = 'Initiating STK Push...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/payment/stk-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaId: selectedMediaForPayment.id, phone })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to initiate M-Pesa payment');

        const checkoutId = data.checkoutRequestId;
        document.getElementById('mpesa-form').style.display = 'none';
        document.getElementById('mpesa-status-area').style.display = 'block';

        // Poll payment status every 2 seconds
        activeCheckoutId = setInterval(async () => {
            try {
                const statusRes = await fetch(`${API_BASE_URL}/payment/status/${checkoutId}`);
                const statusData = await statusRes.json();

                if (statusData.status === 'completed') {
                    clearInterval(activeCheckoutId);
                    activeCheckoutId = null;

                    // Save token to IndexedDB / localStorage for device licensing
                    localStorage.setItem(`hensil_license_${selectedMediaForPayment.id}`, statusData.token);

                    document.getElementById('mpesa-status-text').innerHTML = `<span style="color: #52d98b; font-weight: 700;">Payment Confirmed! Unlocking asset...</span>`;
                    
                    setTimeout(() => {
                        closeMpesaModal();
                        window.open(`${API_BASE_URL}/media/download/${selectedMediaForPayment.id}?token=${encodeURIComponent(statusData.token)}`, '_blank');
                        location.reload();
                    }, 1500);
                } else if (statusData.status === 'failed') {
                    clearInterval(activeCheckoutId);
                    activeCheckoutId = null;
                    document.getElementById('mpesa-status-text').innerHTML = `<span style="color: #ff7777;">Payment failed or cancelled. Please try again.</span>`;
                    submitBtn.textContent = 'Pay with M-Pesa STK Push';
                    submitBtn.disabled = false;
                    document.getElementById('mpesa-form').style.display = 'block';
                }
            } catch (pollErr) {
                console.error('Polling error:', pollErr);
            }
        }, 2000);

    } catch (err) {
        console.error('M-Pesa payment error:', err);
        alert('Payment error: ' + err.message);
        submitBtn.textContent = 'Pay with M-Pesa STK Push';
        submitBtn.disabled = false;
    }
}

