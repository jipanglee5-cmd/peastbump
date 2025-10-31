// 간단한 카트 카운터 (데모용)
document.addEventListener("DOMContentLoaded", () => {
  const cart = document.querySelector(".cart");
  let count = 0;

  document.querySelectorAll(".product").forEach(product => {
    product.style.cursor = "pointer";
    product.addEventListener("click", () => {
      count++;
      cart.textContent = `🛍️ ${count}`;
      alert("장바구니에 추가되었습니다!");
    });
  });
});