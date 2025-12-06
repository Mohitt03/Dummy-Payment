async function pay(productId) {
  const res = await fetch("/payment/create-checkout-session", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ productId })
  });

  const data = await res.json();
  window.location.href = data.url;
}
