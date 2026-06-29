/* ══════════════════════════════════════════════════════════════════════
   animations.js — "quiet luxury" motion driver (additive, reversible)

   Vanilla JS + IntersectionObserver. No dependencies, native scrolling.
   Pairs with css/animations.css. Removing both file references from
   index.html fully reverts the site.

   Strategy: when motion is allowed, stand down the legacy `.js-motion`
   reveal (which this layer replaces) and run our own under `html.lux`.
   All hover/cart/header micro-interactions in style.css are NOT gated on
   `.js-motion`, so they are preserved untouched.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var html = document.documentElement;

  /* Respect reduced-motion / no matchMedia: do nothing, show final states.
     (Legacy motion is already disabled in that case too.) */
  if(!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Take over from the legacy level-6 reveal and enable our own layer.
     Removing js-motion only disables hero/scroll-reveal CSS that we replace;
     every other effect in style.css keeps working. */
  html.classList.remove('js-motion');
  html.classList.add('lux');

  var EASE = 'cubic-bezier(0.16,1,0.3,1)';

  /* single observer: adds .lux-in once, then unobserves */
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ e.target.classList.add('lux-in'); io.unobserve(e.target); }
        });
      }, { threshold:.12, rootMargin:'0px 0px -8% 0px' })
    : null;

  function reveal(el, delay){
    if(!el) return;
    el.classList.add('lux-reveal');
    if(delay) el.style.transitionDelay = delay.toFixed(2)+'s';
    if(io) io.observe(el); else el.classList.add('lux-in');
  }
  function wipe(el, delay){
    if(!el) return;
    el.classList.add('lux-wipe');
    if(delay) el.style.transitionDelay = delay.toFixed(2)+'s';
    if(io) io.observe(el); else el.classList.add('lux-in');
  }
  function each(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }


  /* ─────────── 1 · HERO headline split ─────────── */
  function splitHero(){
    var h = document.querySelector('.hero-title');
    if(!h || h.querySelector('.a-w')) return;
    var nodes = Array.prototype.slice.call(h.childNodes), w = 0;
    h.textContent = '';
    nodes.forEach(function(n){
      if(n.nodeType === 3){                                   // text node
        n.textContent.split(/(\s+)/).forEach(function(tok){
          if(tok === '') return;
          if(/^\s+$/.test(tok)){ h.appendChild(document.createTextNode(tok)); return; }
          var outer = document.createElement('span'); outer.className = 'a-w';
          var inner = document.createElement('span'); inner.className = 'a-wi';
          inner.textContent = tok;
          inner.style.transitionDelay = (0.55 + w * 0.12).toFixed(2)+'s';
          outer.appendChild(inner); h.appendChild(outer); w++;
        });
      } else if(n.nodeName === 'BR'){ h.appendChild(document.createElement('br')); }
      else { h.appendChild(n); }
    });
  }


  /* ─────────── 2 · scroll reveals (staggered groups) ─────────── */
  function initReveals(){
    each('.features .feature').forEach(function(el,i){ reveal(el, i*0.08); });
    each('.insta-grid a').forEach(function(el,i){ reveal(el, i*0.08); });
    each('.foot-col').forEach(function(el,i){ reveal(el, i*0.08); });
    each('.sec-head').forEach(function(el){ reveal(el, 0); });
    ['.center-btn','.nl-left','.nl-form'].forEach(function(s){ reveal(document.querySelector(s), 0); });
    hookCards();                                              // product cards (dynamic)
  }

  /* product cards are injected by main.js (and re-injected on Supabase load) */
  function hookCards(){
    var track = document.getElementById('productTrack');
    if(!track) return;
    each('.card', track).forEach(function(el,i){
      if(!el.classList.contains('lux-reveal')) reveal(el, Math.min(i,6)*0.08);
    });
    if('MutationObserver' in window && !track.__luxMO){
      track.__luxMO = new MutationObserver(function(){ hookCards(); });
      track.__luxMO.observe(track, { childList:true });
    }
  }


  /* ─────────── 3 · image unveils (category blocks + brand tiles) ─────────── */
  function initWipes(){
    each('.promo-card').forEach(function(el,i){ wipe(el, i*0.10); });
    each('.brand-card').forEach(function(el,i){ wipe(el, i*0.07); });
  }


  /* ─────────── 6 · seamless marquees ─────────── */
  function buildMarquee(container, items, pxPerSec){
    if(!container || !items.length) return;
    var track = document.createElement('div');
    track.className = 'lux-marquee-track';
    // two identical copies → translateX(-50%) loops seamlessly
    for(var copy=0; copy<2; copy++){
      items.forEach(function(node){ track.appendChild(node.cloneNode(true)); });
    }
    container.classList.add('lux-marquee');
    container.replaceChildren(track);
    // duration from rendered width so every marquee shares one calm speed
    requestAnimationFrame(function(){
      var dist = track.scrollWidth / 2;
      var secs = Math.max(18, Math.round(dist / pxPerSec));
      track.style.setProperty('--lux-mq', secs + 's');
    });
  }

  function initMarquees(){
    // brand-name row
    var strip = document.getElementById('brandStrip');
    if(strip){
      var brands = each('span', strip);
      buildMarquee(strip, brands, 55);
    }
    // promo strip "Authentic Brands · Fast Delivery · Curated With Care"
    var promo = document.querySelector('.announce .left');
    if(promo){
      var phrases = each('span', promo).map(function(s){ return s.textContent.trim(); })
                                       .filter(function(t){ return t; });
      var items = [];
      phrases.forEach(function(t){
        var s = document.createElement('span'); s.textContent = t; items.push(s);
        var sep = document.createElement('span'); sep.className = 'lux-sep'; sep.textContent = '·'; items.push(sep);
      });
      buildMarquee(promo, items, 38);
    }
  }


  /* ─────────── 7 · sticky nav after the hero ─────────── */
  function initNav(){
    var hero = document.querySelector('.hero');
    var header = document.querySelector('header');
    if(!hero) return;
    var onScroll = function(){
      var trigger = hero.offsetHeight - (header ? header.offsetHeight : 80);
      document.body.classList.toggle('nav-solid', window.scrollY > trigger);
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll, { passive:true });
    onScroll();
  }


  /* Safety net: never let a reveal/wipe leave content permanently hidden.
     If anything (a slow frame, a future glitch) prevents the observer from
     firing, force the final visible state shortly after load. */
  function failsafe(){
    each('.lux-reveal:not(.lux-in), .lux-wipe:not(.lux-in)').forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < (window.innerHeight || 0) + 80) el.classList.add('lux-in');
    });
  }


  /* ─────────── boot (each step isolated so one failure can't blank others) ─────────── */
  function safe(fn){ try{ fn(); }catch(e){ /* progressive enhancement only */ } }
  safe(splitHero);
  safe(initReveals);
  safe(initWipes);
  safe(initMarquees);
  safe(initNav);
  // trigger hero entrance after first paint
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ html.classList.add('hero-in'); }); });
  // reveal anything in view that the observer may have missed
  window.addEventListener('load', failsafe);
  window.addEventListener('scroll', failsafe, { passive:true });
  setTimeout(failsafe, 1200);
})();
