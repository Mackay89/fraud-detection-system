import { useState } from "react";

const BANKS = {
  "🌍 Africa": [
    "Absa Bank", "First National Bank (FNB)", "Standard Bank SA", "Nedbank",
    "Capitec Bank", "African Bank", "Investec", "Discovery Bank",
    "Equity Bank Kenya", "KCB Bank Kenya", "Zenith Bank Nigeria",
    "GTBank Nigeria", "Access Bank Nigeria", "First Bank Nigeria",
    "Ecobank", "Stanbic IBTC", "UBA (United Bank for Africa)",
    "Attijariwafa Bank Morocco", "CIB Egypt", "Banque Misr Egypt",
  ],
  "🌎 Americas": [
    "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank",
    "Goldman Sachs", "Morgan Stanley", "US Bancorp", "Truist Financial",
    "PNC Financial", "Capital One", "TD Bank USA", "HSBC USA",
    "Royal Bank of Canada", "TD Canada Trust", "Scotiabank Canada",
    "BMO Bank of Montreal", "CIBC", "Banco Bradesco Brazil",
    "Itaú Unibanco Brazil", "Banco do Brasil", "Santander Brazil",
    "BBVA Mexico", "Banorte Mexico",
  ],
  "🌍 Europe": [
    "HSBC UK", "Barclays", "Lloyds Bank", "NatWest", "Santander UK",
    "Deutsche Bank", "Commerzbank", "BNP Paribas", "Société Générale",
    "Crédit Agricole", "ING Group", "ABN AMRO", "Rabobank",
    "UniCredit", "Intesa Sanpaolo", "BBVA Spain", "CaixaBank",
    "UBS Switzerland", "Credit Suisse", "Nordea", "SEB Sweden",
    "DNB Norway", "Danske Bank", "Revolut", "N26",
  ],
  "🌏 Asia & Pacific": [
    "Industrial & Commercial Bank of China (ICBC)", "China Construction Bank",
    "Agricultural Bank of China", "Bank of China", "HSBC Hong Kong",
    "DBS Bank Singapore", "OCBC Bank", "UOB Singapore",
    "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank India",
    "Mitsubishi UFJ Financial (MUFG)", "Sumitomo Mitsui", "Mizuho Bank",
    "KB Financial Korea", "Shinhan Bank", "Woori Bank",
    "Commonwealth Bank Australia", "ANZ", "Westpac", "NAB Australia",
    "Maybank Malaysia", "CIMB Group",
  ],
  "🌏 Middle East": [
    "Emirates NBD", "First Abu Dhabi Bank", "Abu Dhabi Commercial Bank",
    "Qatar National Bank", "Al Rajhi Bank Saudi Arabia",
    "National Commercial Bank Saudi Arabia", "Kuwait Finance House",
    "Bank Melli Iran", "Bank Hapoalim Israel", "Arab Bank Jordan",
  ],
};

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, Amex" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", desc: "Direct from your bank" },
  { id: "paypal", label: "PayPal", icon: "🅿️", desc: "Pay with your PayPal account" },
  { id: "applepay", label: "Apple Pay", icon: "🍎", desc: "Touch ID / Face ID checkout" },
  { id: "googlepay", label: "Google Pay", icon: "🔵", desc: "Fast Google Wallet checkout" },
  { id: "crypto", label: "Cryptocurrency", icon: "₿", desc: "BTC, ETH, USDC" },
];

const CRYPTO_OPTIONS = ["Bitcoin (BTC)", "Ethereum (ETH)", "USDC", "USDT", "Litecoin (LTC)", "Solana (SOL)"];

const STEPS = ["Shipping", "Payment", "Review"];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", postalCode: "", country: "South Africa",
    shippingMethod: "standard",
  });
  const [payment, setPayment] = useState({
    method: "",
    cardNumber: "", cardName: "", expiry: "", cvv: "",
    bankRegion: "", bankName: "", accountNumber: "", accountHolder: "",
    crypto: "",
  });
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(false);

  const subtotal = 99.98;
  const shippingCost = shipping.shippingMethod === "express" ? 19.99 : shipping.shippingMethod === "overnight" ? 34.99 : 9.99;
  const tax = 10.00;
  const total = subtotal + shippingCost + tax;

  const validateShipping = () => {
    const e = {};
    if (!shipping.firstName.trim()) e.firstName = "Required";
    if (!shipping.lastName.trim()) e.lastName = "Required";
    if (!shipping.email.trim()) e.email = "Required";
    if (!shipping.phone.trim()) e.phone = "Required";
    if (!shipping.address.trim()) e.address = "Required";
    if (!shipping.city.trim()) e.city = "Required";
    if (!shipping.postalCode.trim()) e.postalCode = "Required";
    if (!shipping.country.trim()) e.country = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e = {};
    if (!payment.method) { e.method = "Select a payment method"; }
    else if (payment.method === "card") {
      if (!payment.cardNumber.trim()) e.cardNumber = "Required";
      if (!payment.cardName.trim()) e.cardName = "Required";
      if (!payment.expiry.trim()) e.expiry = "Required";
      if (!payment.cvv.trim()) e.cvv = "Required";
    } else if (payment.method === "bank") {
      if (!payment.bankName) e.bankName = "Select a bank";
      if (!payment.accountHolder.trim()) e.accountHolder = "Required";
      if (!payment.accountNumber.trim()) e.accountNumber = "Required";
    } else if (payment.method === "crypto") {
      if (!payment.crypto) e.crypto = "Select a cryptocurrency";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleShippingNext = () => { if (validateShipping()) { setErrors({}); setStep(1); } };
  const handlePaymentNext = () => { if (validatePayment()) { setErrors({}); setStep(2); } };
  const handlePlaceOrder = () => setPlaced(true);

  const upd = (setter) => (e) => setter(p => ({ ...p, [e.target.name]: e.target.value }));

  if (placed) {
    return (
      <div style={styles.page}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Order Placed!</h2>
          <p style={styles.successSub}>Thank you for your purchase. You'll receive a confirmation email shortly.</p>
          <div style={styles.successDetail}>
            <div style={styles.successRow}><span>Order Total</span><span style={{color:"#f0c040",fontWeight:700}}>${total.toFixed(2)}</span></div>
            <div style={styles.successRow}><span>Shipping to</span><span>{shipping.city}, {shipping.country}</span></div>
            <div style={styles.successRow}><span>Payment via</span><span style={{textTransform:"capitalize"}}>{PAYMENT_METHODS.find(m=>m.id===payment.method)?.label}</span></div>
          </div>
          <button style={styles.primaryBtn} onClick={() => { setPlaced(false); setStep(0); }}>Back to Shop</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Checkout</h1>

      {/* Stepper */}
      <div style={styles.stepper}>
        {STEPS.map((s, i) => (
          <div key={s} style={styles.stepWrap}>
            <div style={{ ...styles.stepDot, ...(i === step ? styles.stepActive : i < step ? styles.stepDone : {}) }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{ ...styles.stepLabel, ...(i === step ? { color: "#f0c040" } : {}) }}>{s}</span>
            {i < STEPS.length - 1 && <div style={{ ...styles.stepLine, ...(i < step ? { background: "#f0c040" } : {}) }} />}
          </div>
        ))}
      </div>

      <div style={styles.layout}>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>

          {/* STEP 0: SHIPPING */}
          {step === 0 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📦 Shipping Details</h2>
              <div style={styles.row2}>
                <Field label="First Name" name="firstName" value={shipping.firstName} onChange={upd(setShipping)} error={errors.firstName} />
                <Field label="Last Name" name="lastName" value={shipping.lastName} onChange={upd(setShipping)} error={errors.lastName} />
              </div>
              <div style={styles.row2}>
                <Field label="Email Address" name="email" type="email" value={shipping.email} onChange={upd(setShipping)} error={errors.email} />
                <Field label="Phone Number" name="phone" value={shipping.phone} onChange={upd(setShipping)} error={errors.phone} />
              </div>
              <Field label="Street Address" name="address" value={shipping.address} onChange={upd(setShipping)} error={errors.address} />
              <div style={styles.row2}>
                <Field label="City" name="city" value={shipping.city} onChange={upd(setShipping)} error={errors.city} />
                <Field label="State / Province" name="state" value={shipping.state} onChange={upd(setShipping)} />
              </div>
              <div style={styles.row2}>
                <Field label="Postal Code" name="postalCode" value={shipping.postalCode} onChange={upd(setShipping)} error={errors.postalCode} />
                <Field label="Country" name="country" value={shipping.country} onChange={upd(setShipping)} error={errors.country} />
              </div>

              <h3 style={styles.subTitle}>🚚 Shipping Method</h3>
              <div style={styles.shippingOptions}>
                {[
                  { id: "standard", label: "Standard Delivery", days: "5–7 business days", price: "$9.99" },
                  { id: "express", label: "Express Delivery", days: "2–3 business days", price: "$19.99" },
                  { id: "overnight", label: "Overnight Delivery", days: "Next business day", price: "$34.99" },
                ].map(opt => (
                  <div key={opt.id}
                    style={{ ...styles.shippingOption, ...(shipping.shippingMethod === opt.id ? styles.shippingSelected : {}) }}
                    onClick={() => setShipping(p => ({ ...p, shippingMethod: opt.id }))}
                  >
                    <div>
                      <div style={styles.shippingLabel}>{opt.label}</div>
                      <div style={styles.shippingDays}>{opt.days}</div>
                    </div>
                    <div style={styles.shippingPrice}>{opt.price}</div>
                  </div>
                ))}
              </div>

              {Object.keys(errors).length > 0 && <p style={styles.errMsg}>⚠️ Please fill in all required fields</p>}
              <button style={styles.primaryBtn} onClick={handleShippingNext}>Continue to Payment →</button>
            </div>
          )}

          {/* STEP 1: PAYMENT */}
          {step === 1 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>💳 Payment Method</h2>
              {errors.method && <p style={styles.errMsg}>⚠️ {errors.method}</p>}

              <div style={styles.paymentGrid}>
                {PAYMENT_METHODS.map(m => (
                  <div key={m.id}
                    style={{ ...styles.paymentOption, ...(payment.method === m.id ? styles.paymentSelected : {}) }}
                    onClick={() => { setPayment(p => ({ ...p, method: m.id })); setErrors({}); }}
                  >
                    <span style={styles.payIcon}>{m.icon}</span>
                    <div>
                      <div style={styles.payLabel}>{m.label}</div>
                      <div style={styles.payDesc}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card fields */}
              {payment.method === "card" && (
                <div style={styles.payFields}>
                  <h3 style={styles.subTitle}>Card Details</h3>
                  <Field label="Cardholder Name" name="cardName" value={payment.cardName} onChange={upd(setPayment)} error={errors.cardName} />
                  <Field label="Card Number" name="cardNumber" placeholder="1234 5678 9012 3456" value={payment.cardNumber} onChange={upd(setPayment)} error={errors.cardNumber} />
                  <div style={styles.row2}>
                    <Field label="Expiry (MM/YY)" name="expiry" placeholder="MM/YY" value={payment.expiry} onChange={upd(setPayment)} error={errors.expiry} />
                    <Field label="CVV" name="cvv" placeholder="•••" value={payment.cvv} onChange={upd(setPayment)} error={errors.cvv} />
                  </div>
                  <p style={styles.secureNote}>🔒 Your card details are encrypted and secure</p>
                </div>
              )}

              {/* Bank Transfer fields */}
              {payment.method === "bank" && (
                <div style={styles.payFields}>
                  <h3 style={styles.subTitle}>Bank Transfer Details</h3>
                  <div style={styles.fieldWrap}>
                    <label style={styles.label}>Select Region</label>
                    <select style={styles.select} name="bankRegion" value={payment.bankRegion}
                      onChange={e => setPayment(p => ({ ...p, bankRegion: e.target.value, bankName: "" }))}>
                      <option value="">-- Select Region --</option>
                      {Object.keys(BANKS).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  {payment.bankRegion && (
                    <div style={styles.fieldWrap}>
                      <label style={styles.label}>Select Bank</label>
                      <select style={styles.select} name="bankName" value={payment.bankName} onChange={upd(setPayment)}>
                        <option value="">-- Select Bank --</option>
                        {BANKS[payment.bankRegion].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      {errors.bankName && <span style={styles.errField}>{errors.bankName}</span>}
                    </div>
                  )}
                  <Field label="Account Holder Name" name="accountHolder" value={payment.accountHolder} onChange={upd(setPayment)} error={errors.accountHolder} />
                  <Field label="Account Number / IBAN" name="accountNumber" value={payment.accountNumber} onChange={upd(setPayment)} error={errors.accountNumber} />
                  <p style={styles.secureNote}>🏦 Transfer will be verified within 1–2 business days</p>
                </div>
              )}

              {/* PayPal */}
              {payment.method === "paypal" && (
                <div style={styles.payFields}>
                  <div style={styles.redirectBox}>
                    <span style={{fontSize:40}}>🅿️</span>
                    <p style={{margin:"8px 0 0",color:"#aaa"}}>You'll be redirected to PayPal to complete your payment securely.</p>
                  </div>
                </div>
              )}

              {/* Apple Pay */}
              {payment.method === "applepay" && (
                <div style={styles.payFields}>
                  <div style={styles.redirectBox}>
                    <span style={{fontSize:40}}>🍎</span>
                    <p style={{margin:"8px 0 0",color:"#aaa"}}>Use Touch ID or Face ID to authenticate your Apple Pay payment.</p>
                  </div>
                </div>
              )}

              {/* Google Pay */}
              {payment.method === "googlepay" && (
                <div style={styles.payFields}>
                  <div style={styles.redirectBox}>
                    <span style={{fontSize:40}}>🔵</span>
                    <p style={{margin:"8px 0 0",color:"#aaa"}}>You'll complete your payment securely via Google Wallet.</p>
                  </div>
                </div>
              )}

              {/* Crypto */}
              {payment.method === "crypto" && (
                <div style={styles.payFields}>
                  <h3 style={styles.subTitle}>Select Cryptocurrency</h3>
                  <div style={styles.cryptoGrid}>
                    {CRYPTO_OPTIONS.map(c => (
                      <div key={c}
                        style={{ ...styles.cryptoOption, ...(payment.crypto === c ? styles.cryptoSelected : {}) }}
                        onClick={() => setPayment(p => ({ ...p, crypto: c }))}
                      >{c}</div>
                    ))}
                  </div>
                  {errors.crypto && <span style={styles.errField}>{errors.crypto}</span>}
                  {payment.crypto && (
                    <div style={styles.cryptoAddress}>
                      <p style={{color:"#aaa",marginBottom:6}}>Send <strong style={{color:"#f0c040"}}>${total.toFixed(2)}</strong> worth of {payment.crypto} to:</p>
                      <code style={styles.walletAddr}>0x3a9f...d82c1B4e (demo address)</code>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.btnRow}>
                <button style={styles.backBtn} onClick={() => setStep(0)}>← Back</button>
                <button style={styles.primaryBtn} onClick={handlePaymentNext}>Review Order →</button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW */}
          {step === 2 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🔍 Review Your Order</h2>

              <div style={styles.reviewSection}>
                <div style={styles.reviewHeader}>
                  <span>📦 Shipping</span>
                  <button style={styles.editBtn} onClick={() => setStep(0)}>Edit</button>
                </div>
                <div style={styles.reviewBody}>
                  <p>{shipping.firstName} {shipping.lastName}</p>
                  <p>{shipping.email} · {shipping.phone}</p>
                  <p>{shipping.address}</p>
                  <p>{shipping.city}{shipping.state ? `, ${shipping.state}` : ""} {shipping.postalCode}</p>
                  <p>{shipping.country}</p>
                  <p style={{color:"#f0c040",marginTop:6}}>
                    {shipping.shippingMethod === "standard" ? "🚚 Standard Delivery (5–7 days) · $9.99"
                      : shipping.shippingMethod === "express" ? "⚡ Express Delivery (2–3 days) · $19.99"
                      : "🌙 Overnight Delivery (Next day) · $34.99"}
                  </p>
                </div>
              </div>

              <div style={styles.reviewSection}>
                <div style={styles.reviewHeader}>
                  <span>💳 Payment</span>
                  <button style={styles.editBtn} onClick={() => setStep(1)}>Edit</button>
                </div>
                <div style={styles.reviewBody}>
                  {payment.method === "card" && <p>💳 {payment.cardName} · **** **** **** {payment.cardNumber.slice(-4)}</p>}
                  {payment.method === "bank" && <p>🏦 {payment.bankName} · {payment.accountHolder}</p>}
                  {payment.method === "paypal" && <p>🅿️ PayPal</p>}
                  {payment.method === "applepay" && <p>🍎 Apple Pay</p>}
                  {payment.method === "googlepay" && <p>🔵 Google Pay</p>}
                  {payment.method === "crypto" && <p>₿ {payment.crypto}</p>}
                </div>
              </div>

              <button style={{ ...styles.primaryBtn, fontSize: 18, padding: "16px" }} onClick={handlePlaceOrder}>
                ✅ Place Order · ${total.toFixed(2)}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: SUMMARY */}
        <div style={styles.summaryPanel}>
          <div style={styles.summaryCard}>
            <h2 style={styles.summaryTitle}>Summary</h2>
            <div style={styles.summaryRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div style={styles.summaryRow}>
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div style={styles.divider} />
            <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span style={{ color: "#f0c040", fontSize: 22 }}>${total.toFixed(2)}</span>
            </div>
            <div style={styles.secureTag}>🔒 Secure & Encrypted Checkout</div>
          </div>

          <div style={styles.trustBadges}>
            <div style={styles.badge}>✅ SSL Protected</div>
            <div style={styles.badge}>🔄 Free Returns</div>
            <div style={styles.badge}>📦 Fast Shipping</div>
            <div style={styles.badge}>🏆 Buyer Guarantee</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = "text", placeholder }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input
        style={{ ...styles.input, ...(error ? styles.inputErr : {}) }}
        type={type} name={name} value={value}
        onChange={onChange} placeholder={placeholder || label}
      />
      {error && <span style={styles.errField}>{error}</span>}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#111", color: "#eee", fontFamily: "'Segoe UI', sans-serif", padding: "32px 24px" },
  pageTitle: { textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 24, letterSpacing: 1 },
  stepper: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 36, gap: 0 },
  stepWrap: { display: "flex", alignItems: "center", gap: 8 },
  stepDot: { width: 36, height: 36, borderRadius: "50%", background: "#222", border: "2px solid #444", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#888", transition: "all .3s" },
  stepActive: { background: "#f0c040", border: "2px solid #f0c040", color: "#111" },
  stepDone: { background: "#2a7a2a", border: "2px solid #4caf50", color: "#fff" },
  stepLabel: { fontSize: 13, color: "#888", whiteSpace: "nowrap" },
  stepLine: { width: 60, height: 2, background: "#333", margin: "0 8px", transition: "background .3s" },
  layout: { display: "flex", gap: 28, maxWidth: 1100, margin: "0 auto", alignItems: "flex-start", flexWrap: "wrap" },
  leftPanel: { flex: "1 1 560px" },
  card: { background: "#1a1a1a", borderRadius: 16, padding: 28, border: "1px solid #2a2a2a" },
  cardTitle: { fontSize: 22, fontWeight: 700, marginBottom: 20, borderBottom: "1px solid #2a2a2a", paddingBottom: 12 },
  subTitle: { fontSize: 16, fontWeight: 600, margin: "20px 0 12px", color: "#ccc" },
  row2: { display: "flex", gap: 16 },
  fieldWrap: { flex: 1, marginBottom: 14 },
  label: { display: "block", fontSize: 12, color: "#aaa", marginBottom: 6, fontWeight: 500, letterSpacing: .5, textTransform: "uppercase" },
  input: { width: "100%", background: "#111", border: "1px solid #333", borderRadius: 8, padding: "12px 14px", color: "#eee", fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border .2s" },
  inputErr: { border: "1px solid #e05555" },
  select: { width: "100%", background: "#111", border: "1px solid #333", borderRadius: 8, padding: "12px 14px", color: "#eee", fontSize: 15, outline: "none", boxSizing: "border-box" },
  errField: { fontSize: 11, color: "#e05555", marginTop: 4, display: "block" },
  errMsg: { color: "#e05555", fontSize: 13, marginBottom: 12 },
  shippingOptions: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  shippingOption: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", border: "1px solid #333", borderRadius: 10, padding: "14px 18px", cursor: "pointer", transition: "all .2s" },
  shippingSelected: { border: "1px solid #f0c040", background: "#1e1a00" },
  shippingLabel: { fontWeight: 600, fontSize: 15 },
  shippingDays: { fontSize: 12, color: "#888", marginTop: 3 },
  shippingPrice: { fontWeight: 700, color: "#f0c040", fontSize: 16 },
  paymentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  paymentOption: { display: "flex", alignItems: "center", gap: 12, background: "#111", border: "1px solid #333", borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all .2s" },
  paymentSelected: { border: "1px solid #f0c040", background: "#1e1a00" },
  payIcon: { fontSize: 28 },
  payLabel: { fontWeight: 600, fontSize: 14 },
  payDesc: { fontSize: 11, color: "#888", marginTop: 2 },
  payFields: { background: "#111", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid #2a2a2a" },
  redirectBox: { textAlign: "center", padding: "24px 0" },
  cryptoGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  cryptoOption: { padding: "8px 14px", borderRadius: 8, border: "1px solid #333", background: "#1a1a1a", cursor: "pointer", fontSize: 13, transition: "all .2s" },
  cryptoSelected: { border: "1px solid #f0c040", background: "#1e1a00", color: "#f0c040" },
  cryptoAddress: { background: "#0a0a0a", borderRadius: 8, padding: 14, marginTop: 10 },
  walletAddr: { fontSize: 13, color: "#f0c040", wordBreak: "break-all" },
  secureNote: { fontSize: 12, color: "#666", marginTop: 10, textAlign: "center" },
  btnRow: { display: "flex", gap: 12, marginTop: 8 },
  primaryBtn: { flex: 1, background: "#f0c040", color: "#111", fontWeight: 700, fontSize: 15, padding: "14px", borderRadius: 10, border: "none", cursor: "pointer", letterSpacing: .5, transition: "opacity .2s" },
  backBtn: { background: "#222", color: "#eee", fontWeight: 600, fontSize: 15, padding: "14px 20px", borderRadius: 10, border: "1px solid #333", cursor: "pointer" },
  reviewSection: { background: "#111", borderRadius: 12, padding: 18, marginBottom: 16, border: "1px solid #2a2a2a" },
  reviewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, marginBottom: 10, fontSize: 15 },
  reviewBody: { fontSize: 14, color: "#bbb", lineHeight: 1.7 },
  editBtn: { background: "transparent", color: "#f0c040", border: "1px solid #f0c04066", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12 },
  summaryPanel: { flex: "0 0 280px", position: "sticky", top: 20 },
  summaryCard: { background: "#1a1a1a", borderRadius: 16, padding: 24, border: "1px solid #2a2a2a", marginBottom: 16 },
  summaryTitle: { fontSize: 20, fontWeight: 800, marginBottom: 20, fontFamily: "Georgia, serif" },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 15, color: "#ccc" },
  divider: { borderTop: "1px solid #2a2a2a", margin: "14px 0" },
  secureTag: { fontSize: 11, color: "#666", textAlign: "center", marginTop: 16 },
  trustBadges: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  badge: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 8px", fontSize: 12, textAlign: "center", color: "#aaa" },
  successBox: { maxWidth: 480, margin: "80px auto", background: "#1a1a1a", borderRadius: 20, padding: 40, border: "1px solid #2a2a2a", textAlign: "center" },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: 800, marginBottom: 8 },
  successSub: { color: "#aaa", marginBottom: 24 },
  successDetail: { background: "#111", borderRadius: 12, padding: 16, marginBottom: 24 },
  successRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222", fontSize: 14, color: "#ccc" },
};
