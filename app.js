// app.js (프론트엔드)
// 간단한 상품 데이터 (실제 운영시엔 백엔드/DB에서 받아옵니다)
const PRODUCTS = [
  { id: "bk-01", name: "슬릭 레더 카드지갑", price: 29000, img: "https://images.unsplash.com/photo-1523381216748-2db2f5f6b3a4?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=1c4b1d2b" },
  { id: "bk-02", name: "미니 캔버스 토트", price: 49000, img: "https://images.unsplash.com/photo-1555529771-65f6a1f2fbe2?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=4f5048d9" },
  { id: "bk-03", name: "심플 메탈 이어링", price: 22000, img: "https://images.unsplash.com/photo-1616596877764-7c60c6b9f640?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3f5b6af8" },
  { id: "bk-04", name: "울 니트 비니", price: 18000, img: "https://images.unsplash.com/photo-1602810316027-7f8a3b3f5b4b?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=8f3bdc1f" },
];

// currency formatter (KRW)
const fmt = (v) => v.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW' });

let cart = {}; // {id: {product, qty}}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupCartUI();
  document.getElementById('year').textContent = new Date().getFullYear();
});

function renderProducts(){
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  PRODUCTS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="product-thumb"><img src="${p.img}" alt="${p.name}" loading="lazy"/></div>
      <div>
        <p class="product-title">${p.name}</p>
        <div class="meta">
          <div class="product-price">${fmt(p.price)}</div>
          <button class="btn add" data-id="${p.id}">담기</button>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });

  grid.querySelectorAll('.add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      addToCart(id);
    });
  });
}

function addToCart(id){
  const product = PRODUCTS.find(p=>p.id===id);
  if(!product) return;
  cart[id] = cart[id] || { product, qty:0 };
  cart[id].qty += 1;
  updateCartCount();
  openCart();
  renderCartItems();
}

function updateCartCount(){
  const count = Object.values(cart).reduce((s,i)=>s+i.qty,0);
  document.getElementById('cart-count').textContent = count;
}

function setupCartUI(){
  const cartButton = document.getElementById('cart-button');
  const cartModal = document.getElementById('cart-modal');
  const closeCart = document.getElementById('close-cart');
  cartButton.addEventListener('click', openCart);
  closeCart.addEventListener('click', closeCartModal);
  document.getElementById('clear-cart').addEventListener('click', () => {
    cart = {};
    renderCartItems();
    updateCartCount();
  });

  document.getElementById('checkout-btn').addEventListener('click', async () => {
    // 기본 유효성
    const form = document.getElementById('checkout-form');
    if(!form.reportValidity()) return;

    const name = form.elements['name'].value;
    const phone = form.elements['phone'].value;
    const address = form.elements['address'].value;

    if(Object.keys(cart).length === 0){
      alert('장바구니가 비어있습니다.');
      return;
    }

    // 주문 요약 데이터 생성
    const line_items = Object.values(cart).map(item => ({
      price_data: {
        currency: 'krw',
        unit_amount: item.product.price,
        product_data: { name: item.product.name }
      },
      quantity: item.qty
    }));

    // POST to your server to create a Stripe Checkout session
    // 서버가 없으면 아래 요청을 구현/호스팅 해야 실제 결제가 가능합니다.
    try{
      const resp = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          customer: { name, phone, address },
          line_items
        })
      });
      if(!resp.ok) throw new Error('서버 에러');
      const data = await resp.json();
      // 서버가 반환한 세션 URL로 리디렉션
      if(data.url){
        window.location = data.url;
      } else {
        alert('결제 세션 생성에 실패했습니다.');
        console.error(data);
      }
    }catch(err){
      console.error(err);
      alert('결제 연결에 실패했습니다. (서버가 필요합니다)');
    }
  });
}

function openCart(){
  const modal = document.getElementById('cart-modal');
  modal.setAttribute('aria-hidden','false');
  renderCartItems();
}
function closeCartModal(){
  const modal = document.getElementById('cart-modal');
  modal.setAttribute('aria-hidden','true');
}

function renderCartItems(){
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  let subtotal = 0;
  Object.values(cart).forEach(entry => {
    const { product, qty } = entry;
    subtotal += product.price * qty;
    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div class="thumb"><img src="${product.img}" alt="" style="max-width:100%;max-height:100%;object-fit:cover"/></div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${product.name}</strong>
          <span>${fmt(product.price * qty)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
          <div class="qty">
            <button class="dec" data-id="${product.id}">−</button>
            <span>${qty}</span>
            <button class="inc" data-id="${product.id}">＋</button>
          </div>
          <button class="btn remove" data-id="${product.id}">삭제</button>
        </div>
      </div>
    `;
    container.appendChild(item);
  });

  document.querySelectorAll('.inc').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id;
      cart[id].qty += 1;
      renderCartItems(); updateCartCount();
    });
  });
  document.querySelectorAll('.dec').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id;
      cart[id].qty -= 1;
      if(cart[id].qty <= 0) delete cart[id];
      renderCartItems(); updateCartCount();
    });
  });
  document.querySelectorAll('.remove').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id;
      delete cart[id];
      renderCartItems(); updateCartCount();
    });
  });

  document.getElementById('subtotal').textContent = fmt(subtotal);
  const shipping = subtotal > 50000 ? 0 : 3000;
  document.getElementById('shipping').textContent = fmt(shipping);
  document.getElementById('total').textContent = fmt(subtotal + shipping);
}