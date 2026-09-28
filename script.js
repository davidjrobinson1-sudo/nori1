const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const checkoutMessage = document.querySelector("[data-checkout-message]");

const PAYMENT_LINKS = {
  "obsidian-mirror": "https://buy.stripe.com/cNidRa5Yf8Fc8ld0ZacbC00",
  "arctic-pearl": "https://buy.stripe.com/9B6dRa9araNkatlgY8cbC01",
  "obsidian-matte": "https://buy.stripe.com/3cIbJ2aev8Fc44XeQ0cbC02",
  "rose-quartz": "https://buy.stripe.com/aFa28sgCTg7EgRJeQ0cbC03",
};

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 18);
}

function setCheckoutMessage(message, isError = false) {
  if (!checkoutMessage) return;
  checkoutMessage.textContent = message;
  checkoutMessage.style.color = isError ? "#8f2f24" : "#5a554d";
}

function getSelectedProduct(button) {
  const card = button.closest("[data-product-card]");
  const sizeSelect = card.querySelector("[data-ring-size]");

  return {
    id: card.dataset.productId,
    name: card.dataset.productName,
    size: sizeSelect.value,
  };
}

function getPaymentLink(product) {
  const linkConfig = PAYMENT_LINKS[product.id];

  if (typeof linkConfig === "string") {
    return linkConfig;
  }

  return linkConfig?.[product.size];
}

function buildPaymentUrl(paymentLink, product) {
  const url = new URL(paymentLink);
  url.searchParams.set("client_reference_id", `${product.id}-size-${product.size}`);
  return url.toString();
}

function startCheckout(button) {
  const product = getSelectedProduct(button);
  const paymentLink = getPaymentLink(product);

  if (!paymentLink || paymentLink.includes("REPLACE_")) {
    setCheckoutMessage(
      `Add the Stripe Payment Link for ${product.name} in script.js.`,
      true
    );
    return;
  }

  button.disabled = true;
  button.textContent = "Opening reservation...";
  setCheckoutMessage(`Opening secure reservation for ${product.name}, size ${product.size}.`);
  window.location.href = buildPaymentUrl(paymentLink, product);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll("[data-checkout]").forEach((button) => {
  button.addEventListener("click", () => startCheckout(button));
});
