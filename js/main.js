(function(){
  /* ════════ CONFIG ════════ */
  var WA_NUMBER     = '994000000000';  // ← TODO: client's WhatsApp number, digits only (no +, no leading 0)
  var SUPABASE_URL  = 'https://mmahlwopdblmcpdeaeml.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYWhsd29wZGJsbWNwZGVhZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTg3NzUsImV4cCI6MjA5ODA3NDc3NX0.ENf-NcCt9JCN71_rqmL2jKSZBCw8S9r5mpvK9j3yYTo';
  var STORE_KEY = 'jc_products';
  var CART_KEY  = 'jc_cart';

  var sb = (window.supabase && SUPABASE_URL) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON) : null;

  /* default catalogue — admin panel edits this same store */
  var SEED = [
    { id:'p1', name:'Pocket Blush', brand:'Rhode', price:55, badge:'New', category:'Beauty',
      img:'https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3c8?auto=format&fit=crop&w=600&q=80' },
    { id:'p2', name:'Glazing Fluid', brand:'Rhode', price:60, badge:'New', category:'Beauty',
      img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
    { id:'p3', name:'Lip Butter Balm', brand:'Summer Fridays', price:45, badge:'New', category:'Beauty',
      img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
    { id:'p4', name:'Revealer Concealer', brand:'Kosas', price:65, badge:'New', category:'Beauty',
      img:'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
    { id:'p5', name:'SOS Daily Rescue Spray', brand:'Tower 28', price:60, badge:'New', category:'Beauty',
      img:'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80' },
    { id:'p6', name:'Airlift Legging', brand:'Alo', price:120, badge:'New', category:'Fashion',
      img:'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=600&q=80' }
  ];

  function load(){
    try{ var s = JSON.parse(localStorage.getItem(STORE_KEY)); if(Array.isArray(s)) return s; }catch(e){}
    return SEED.slice();
  }
  var products = load();   // instant paint from cache/seed; replaced by live data below

  /* pull the live catalogue from Supabase */
  function fetchProducts(){
    if(!sb) return;
    sb.from('products').select('*').order('created_at',{ascending:false}).then(function(res){
      if(res.error){ console.warn('Supabase:', res.error.message); return; }
      if(res.data){
        products = res.data;
        renderProducts(); renderCart();
        try{ localStorage.setItem(STORE_KEY, JSON.stringify(products)); }catch(e){}
      }
    });
  }

  /* ── render products ── */
  var track = document.getElementById('productTrack');
  function money(n){ return Number(n).toLocaleString('en-US') + ' AZN'; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function renderProducts(){
    if(!products.length){ track.innerHTML = '<p style="color:var(--dim);padding:2rem;">No products yet. Add some in the Admin panel.</p>'; return; }
    track.innerHTML = products.map(function(p){
      var sold = p.badge && p.badge.toLowerCase().indexOf('sold')>-1;
      return '<article class="card'+(sold?' sold':'')+'">'+
        '<div class="card-frame">'+
          (p.badge ? '<span class="card-badge'+(sold?' sold':'')+'">'+esc(p.badge)+'</span>' : '')+
          '<img src="'+esc(p.img)+'" alt="'+esc(p.name)+'" loading="lazy">'+
          '<button class="wish" aria-label="Wishlist"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.3-9.3-8.5C1 9 2.5 5.5 6 5.5c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.5 0 5 3.5 3.3 7C19 16.7 12 21 12 21Z"/></svg></button>'+
          (sold?'':'<button class="quick-add" data-id="'+esc(p.id)+'">Add to Cart</button>')+
        '</div>'+
        '<div class="card-brand">'+esc(p.brand||'')+'</div>'+
        '<div class="card-name">'+esc(p.name)+'</div>'+
        '<div class="card-price">'+money(p.price)+'</div>'+
      '</article>';
    }).join('');
  }
  renderProducts();
  fetchProducts();

  /* wishlist toggle + add to cart (delegated) */
  track.addEventListener('click', function(e){
    var w = e.target.closest('.wish');
    if(w){ w.classList.toggle('active'); return; }
    var a = e.target.closest('.quick-add');
    if(a){ addToCart(a.getAttribute('data-id')); }
  });

  /* ── cart ── */
  var cart = {};
  try{ cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; }catch(e){}
  function saveCart(){ try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }catch(e){} }

  var cartCount = document.getElementById('cartCount');
  var cartBody  = document.getElementById('cartBody');
  var cartTotal = document.getElementById('cartTotal');

  function findP(id){ for(var i=0;i<products.length;i++) if(products[i].id===id) return products[i]; return null; }

  function addToCart(id){
    cart[id] = (cart[id]||0) + 1; saveCart(); renderCart(); openCart();
    var p = findP(id); showToast((p?p.name:'Item')+' added to cart');
  }
  function renderCart(){
    var ids = Object.keys(cart).filter(function(id){ return cart[id]>0 && findP(id); });
    var count = ids.reduce(function(s,id){ return s+cart[id]; },0);
    cartCount.textContent = count;
    cartCount.style.display = count? 'grid':'none';
    if(!ids.length){ cartBody.innerHTML = '<div class="cart-empty">Your cart is empty.</div>'; cartTotal.textContent='0 AZN'; return; }
    var total = 0;
    cartBody.innerHTML = ids.map(function(id){
      var p = findP(id), q = cart[id]; total += p.price*q;
      return '<div class="cart-item">'+
        '<img src="'+esc(p.img)+'" alt="">'+
        '<div style="flex:1">'+
          '<div class="ci-brand">'+esc(p.brand||'')+'</div>'+
          '<div class="ci-name">'+esc(p.name)+'</div>'+
          '<div class="ci-price">'+money(p.price)+'</div>'+
          '<div class="ci-qty"><button data-dec="'+esc(id)+'">−</button><span>'+q+'</span><button data-inc="'+esc(id)+'">+</button>'+
          '<button class="ci-remove" data-rem="'+esc(id)+'">Remove</button></div>'+
        '</div></div>';
    }).join('');
    cartTotal.textContent = money(total);
  }
  cartBody.addEventListener('click', function(e){
    var t=e.target;
    if(t.dataset.inc){ cart[t.dataset.inc]++; }
    else if(t.dataset.dec){ cart[t.dataset.dec]=Math.max(0,cart[t.dataset.dec]-1); if(!cart[t.dataset.dec]) delete cart[t.dataset.dec]; }
    else if(t.dataset.rem){ delete cart[t.dataset.rem]; }
    else return;
    saveCart(); renderCart();
  });
  renderCart();

  /* drawer */
  var overlay=document.getElementById('overlay'), drawer=document.getElementById('drawer');
  function openCart(){ overlay.classList.add('open'); drawer.classList.add('open'); }
  function closeCart(){ overlay.classList.remove('open'); drawer.classList.remove('open'); }
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('drawerClose').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);

  /* whatsapp checkout */
  document.getElementById('checkoutBtn').addEventListener('click', function(){
    var ids = Object.keys(cart).filter(function(id){ return cart[id]>0 && findP(id); });
    if(!ids.length){ showToast('Your cart is empty'); return; }
    var total=0;
    var lines = ids.map(function(id){ var p=findP(id),q=cart[id]; total+=p.price*q;
      return '• '+p.name+' ('+p.brand+') ×'+q+' — '+money(p.price*q); });
    var msg = 'Hello Jasmine Concept! I would like to order:\n\n'+lines.join('\n')+'\n\nTotal: '+money(total);
    window.open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(msg), '_blank');
  });

  /* carousel arrows */
  function scrollAmt(){ var c=track.querySelector('.card'); return c? c.getBoundingClientRect().width+22 : 260; }
  document.getElementById('prevBtn').addEventListener('click', function(){ track.scrollBy({left:-scrollAmt()*2,behavior:'smooth'}); });
  document.getElementById('nextBtn').addEventListener('click', function(){ track.scrollBy({left:scrollAmt()*2,behavior:'smooth'}); });

  /* mobile menu */
  var mm=document.getElementById('mobileMenu');
  document.getElementById('menuBtn').addEventListener('click', function(){ mm.classList.add('open'); });
  document.getElementById('mmClose').addEventListener('click', function(){ mm.classList.remove('open'); });
  mm.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ mm.classList.remove('open'); }); });

  /* newsletter */
  document.getElementById('nlForm').addEventListener('submit', function(e){ e.preventDefault(); this.reset(); showToast('Thank you for subscribing ◆'); });

  /* toast */
  var toast=document.getElementById('toast'), tTimer;
  function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); clearTimeout(tTimer); tTimer=setTimeout(function(){ toast.classList.remove('show'); },2600); }

  /* re-render if admin changes catalogue in another tab */
  window.addEventListener('storage', function(e){ if(e.key===STORE_KEY){ products=load(); renderProducts(); renderCart(); } });
})();


/* ═══════════════ MOTION DRIVER (level 6) — independent of store logic ═══════════════ */
(function(){
  var html=document.documentElement;
  if(!html.classList.contains('js-motion')) return;   // reduced motion / unsupported → static

  /* hero entrance after first frame */
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ html.classList.add('ready'); }); });

  /* scroll reveal */
  var io;
  if('IntersectionObserver' in window){
    io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{ threshold:.12, rootMargin:'0px 0px -7% 0px' });
  }
  function observe(){
    if(!io){ return; }
    document.querySelectorAll('.sec-head, .feature, .promo-card, .brand-card, .insta-grid a, .foot-col, .center-btn, .nl-left, .nl-form, .track .card')
      .forEach(function(el){ if(el.__io) return; el.__io=1; io.observe(el); });
  }
  observe();
  /* products render async from Supabase — re-scan when the track updates */
  var track=document.getElementById('productTrack');
  if(track && 'MutationObserver' in window){ new MutationObserver(observe).observe(track,{childList:true}); }

  /* header shadow on scroll */
  var header=document.querySelector('header');
  if(header){ var hs=function(){ header.classList.toggle('scrolled', window.scrollY>20); }; addEventListener('scroll',hs,{passive:true}); hs(); }

  /* cart count pop when it changes */
  var cc=document.getElementById('cartCount');
  if(cc && 'MutationObserver' in window){
    var last=cc.textContent;
    new MutationObserver(function(){
      if(cc.textContent!==last){ last=cc.textContent; cc.classList.remove('pop'); void cc.offsetWidth; cc.classList.add('pop'); }
    }).observe(cc,{ childList:true, characterData:true, subtree:true });
  }
})();
