import { writeFile, readFile } from "node:fs/promises";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SITE_SCRIPT = new URL("./script.js", import.meta.url);
const OUTPUT_CSV = new URL("./stripe-payment-links.csv", import.meta.url);

const PRODUCTS = [
  { id: "obsidian-mirror", name: "Obsidian Mirror" },
  { id: "obsidian-matte", name: "Obsidian Matte" },
  { id: "arctic-pearl", name: "Arctic Pearl" },
  { id: "rose-quartz", name: "Rose Quartz" },
];

const SIZES = ["6", "7", "8", "9", "10", "11", "12"];
const PRICE_PENCE = 8500;
const CURRENCY = "gbp";

if (!SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY. Set it in your terminal, then run this script again.");
  process.exit(1);
}

if (!SECRET_KEY.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY should start with sk_test_ or sk_live_.");
  process.exit(1);
}

function authHeader() {
  return `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`;
}

function formBody(params) {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    body.append(key, String(value));
  }

  return body;
}

async function stripeRequest(path, params) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe request failed for ${path}`);
  }

  return data;
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function buildPaymentLinksMap(rows) {
  const grouped = new Map();

  for (const row of rows) {
    if (!grouped.has(row.product_id)) {
      grouped.set(row.product_id, new Map());
    }

    grouped.get(row.product_id).set(row.size, row.stripe_payment_link);
  }

  const lines = ["const PAYMENT_LINKS = {"];

  for (const product of PRODUCTS) {
    lines.push(`  "${product.id}": {`);

    for (const size of SIZES) {
      const link = grouped.get(product.id)?.get(size);
      lines.push(`    ${size}: "${link}",`);
    }

    lines.push("  },");
  }

  lines.push("};");
  return lines.join("\n");
}

async function updateSiteScript(rows) {
  const script = await readFile(SITE_SCRIPT, "utf8");
  const nextMap = buildPaymentLinksMap(rows);
  const updated = script.replace(/const PAYMENT_LINKS = \{[\s\S]*?\n\};/, nextMap);

  if (updated === script) {
    throw new Error("Could not find PAYMENT_LINKS map in script.js.");
  }

  await writeFile(SITE_SCRIPT, updated, "utf8");
}

async function main() {
  const rows = [];

  for (const product of PRODUCTS) {
    for (const size of SIZES) {
      const fullName = `NORI ${product.name} - Size ${size}`;
      console.log(`Creating ${fullName}`);

      const stripeProduct = await stripeRequest("/products", {
        name: fullName,
        description: `NORI NFC payment ring in ${product.name}, size ${size}`,
        "metadata[product_id]": product.id,
        "metadata[ring_finish]": product.name,
        "metadata[ring_size]": size,
      });

      const price = await stripeRequest("/prices", {
        currency: CURRENCY,
        unit_amount: PRICE_PENCE,
        product: stripeProduct.id,
        "metadata[product_id]": product.id,
        "metadata[ring_finish]": product.name,
        "metadata[ring_size]": size,
      });

      const paymentLink = await stripeRequest("/payment_links", {
        "line_items[0][price]": price.id,
        "line_items[0][quantity]": 1,
        "metadata[product_id]": product.id,
        "metadata[ring_finish]": product.name,
        "metadata[ring_size]": size,
      });

      rows.push({
        product_id: product.id,
        product_name: product.name,
        size,
        stripe_product_id: stripeProduct.id,
        stripe_price_id: price.id,
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link: paymentLink.url,
      });
    }
  }

  const csv = [
    "product_id,product_name,size,stripe_product_id,stripe_price_id,stripe_payment_link_id,stripe_payment_link",
    ...rows.map((row) =>
      [
        row.product_id,
        row.product_name,
        row.size,
        row.stripe_product_id,
        row.stripe_price_id,
        row.stripe_payment_link_id,
        row.stripe_payment_link,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ].join("\n");

  await writeFile(OUTPUT_CSV, `${csv}\n`, "utf8");
  await updateSiteScript(rows);

  console.log("\nDone. Created 28 Stripe Payment Links.");
  console.log("Updated stripe-payment-links.csv and script.js.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
