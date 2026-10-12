document.addEventListener('DOMContentLoaded', () => {

    // 1. Remove Loader
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1000);

    // 2. Navbar & Back to Top
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (window.scrollY > 500) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 3. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // 4. Dark/Light Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // 5. Scroll Reveal Animations
    const reveals = document.querySelectorAll('.reveal');
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });

    // 6. Animated Counters
    const counters = document.querySelectorAll('.counter');
    const counterOptions = { threshold: 1, rootMargin: "0px" };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = +entry.target.getAttribute('data-target');
                const count = +entry.target.innerText;
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

    // 7. Portfolio Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

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

    // 8. Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-lightbox');

    galleryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const img = item.querySelector('img');
            lightbox.style.display = 'block';
            lightboxImg.src = img.src;
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


// 9. Booking Form
const form = document.getElementById('booking-form');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');

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

        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            // Frontend is hosted on GitHub Pages; the API runs on the VPS over HTTPS.
            // When a domain is bought, change the address here and in admin.js.
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
                if (confirm("Would you like to download your Pending Invoice now?")) {
                    downloadInvoice(data.booking);
                }
            }

        } catch (error) {
            console.error('Booking error:', error);

            alert(
                error.message ||
                'Unable to send your inquiry. Please try again.'
            );

        } finally {
            submitButton.disabled = false;

            submitButton.textContent =
                form.classList.contains('studio-contact-form')
                    ? 'Transmit Brief'
                    : 'Send Inquiry';
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
        return "Thank you for outlining yo?Your message has been routed directly to our creative desk. Alternatively, you may connect immediately via phone line at +254 759 701803.";
    }
    
    
    
});

function downloadInvoice(booking) {
    const invoiceHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hensil Studio Invoice #${booking.id}</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #111; background: #fff; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
        .invoice-details { margin-top: 20px; display: flex; justify-content: space-between; }
        table { width: 100%; margin-top: 30px; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f9f9f9; }
        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
        .status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.paid { background: #d4edda; color: #155724; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <div class="logo">HENSIL STUDIO</div>
            <div>
                <h2>INVOICE #${booking.id}</h2>
                <p>Date: ${new Date(booking.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
        </div>
        <div class="invoice-details">
            <div>
                <strong>Billed To:</strong><br>
                ${escapeHtml(booking.name)}<br>
                Email: ${escapeHtml(booking.email)}<br>
                Phone: ${escapeHtml(booking.phone || 'N/A')}
            </div>
            <div>
                <strong>Payment Status:</strong><br>
                <span class="status ${booking.payment_status || 'pending'}">${booking.payment_status || 'pending'}</span>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Service / Description</th>
                    <th>Date</th>
                    <th>Amount (Ksh)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${escapeHtml(booking.service)}<br><small>${escapeHtml(booking.message || '')}</small></td>
                    <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td>Ksh ${Number(booking.amount || 3800).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
        <div class="total">
            Total Due: Ksh ${Number(booking.amount || 3800).toLocaleString()}
        </div>
        <div style="margin-top: 30px; font-size: 14px;">
            <p><strong>Payment Instructions:</strong></p>
            <p>50% non-refundable retainer required to confirm booking date. Remaining balance due 7 days prior to execution.</p>
        </div>
        <div class="footer">
            <p>Hencil Creative Photography & Media Production Studio &bull; info@hensilstudio.com</p>
        </div>
    </div>
    <script>
        window.print();
    </script>
</body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hensil_Invoice_${booking.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
