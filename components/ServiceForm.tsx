"use client";
import { useMemo, useState } from "react";

type Props = { users: any[]; products: any[]; plans: any[]; currencies: any[]; coupons: any[]; billingAgreements: any[]; initial?: any };

export default function ServiceForm({ users, products, plans, currencies, coupons, billingAgreements, initial = {} }: Props) {
  const [productId, setProductId] = useState(String(initial.product_id ?? ""));
  const [planId, setPlanId] = useState(String(initial.plan_id ?? ""));
  const [price, setPrice] = useState(String(initial.price ?? ""));
  const [currency, setCurrency] = useState(String(initial.currency ?? "EUR"));
  const [status, setStatus] = useState(String(initial.status ?? "PENDING"));
  const [quantity, setQuantity] = useState(String(initial.quantity ?? "1"));
  const [expiresAt, setExpiresAt] = useState(initial.expires_at ? new Date(initial.expires_at).toISOString().slice(0, 16) : "");
  const [couponId, setCouponId] = useState(String(initial.coupon_id ?? ""));
  const [billingAgreementId, setBillingAgreementId] = useState(String(initial.billing_agreement_id ?? ""));
  const [planOptions, setPlanOptions] = useState<any[]>(plans.filter((p) => String(p.product_id) === productId));

  const selectedProduct = useMemo(() => products.find((p) => String(p.id) === productId), [products, productId]);

  function changeProduct(value: string) {
    setProductId(value);
    setPlanId("");
    const options = plans.filter((p) => String(p.product_id) === value);
    setPlanOptions(options);
    if (options.length) {
      const first = options[0];
      setPlanId(String(first.id));
      setPrice(String(first.price ?? selectedProduct?.price ?? "0"));
    } else {
      const product = products.find((p) => String(p.id) === value);
      setPrice(String(product?.price ?? "0"));
    }
  }

  function changePlan(value: string) {
    setPlanId(value);
    const plan = plans.find((p) => String(p.id) === value);
    if (plan) setPrice(String(plan.price ?? "0"));
  }

  return (
    <form className="form service-form" action={initial.id ? `/api/admin/services/${initial.id}` : "/api/admin/services"} method="post">
      <div className="service-form-grid">
        <label>Product<span className="required">*</span>
          <select className="input" name="productId" value={productId} onChange={(e) => changeProduct(e.target.value)} required>
            <option value="">Select the product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>Plan
          <select className="input" name="planId" value={planId} onChange={(e) => changePlan(e.target.value)}>
            <option value="">Select the plan</option>
            {planOptions.map((p) => <option key={p.id} value={p.id}>{p.name}{p.price != null ? ` — ${Number(p.price).toFixed(2)}` : ""}</option>)}
          </select>
        </label>

        <label>User<span className="required">*</span>
          <select className="input" name="userId" defaultValue={String(initial.user_id ?? "")} required>
            <option value="">Sélectionnez une option</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
          </select>
        </label>
        <label>Status<span className="required">*</span>
          <select className="input" name="status" value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="PENDING">Pending</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="TERMINATED">Terminated</option>
          </select>
        </label>

        <label>Quantity<span className="required">*</span>
          <input className="input" name="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </label>
        <label>Expires At
          <input className="input" name="expiresAt" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </label>

        <label>Coupon
          <select className="input" name="couponId" value={couponId} onChange={(e) => setCouponId(e.target.value)}>
            <option value="">Select the coupon</option>
            {coupons.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.discount_type === "PERCENT" ? `${c.discount_value}%` : `${c.discount_value}`}</option>)}
          </select>
        </label>
        <label>Currency code<span className="required">*</span>
          <select className="input" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required>
            {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </label>

        <label>Price<span className="required">*</span>
          <span className="input-prefix"><span>{currencies.find((c) => c.code === currency)?.symbol ?? "€"}</span><input name="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></span>
        </label>
        <label>Billing Agreement
          <select className="input" name="billingAgreementId" value={billingAgreementId} onChange={(e) => setBillingAgreementId(e.target.value)}>
            <option value="">Select the billing agreement</option>
            {billingAgreements.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>

        <label>Subscription ID <span className="muted inline-note">(deprecated)</span>
          <input className="input" name="subscriptionId" defaultValue={initial.subscription_id ?? ""} placeholder="Enter the subscription ID" />
        </label>
      </div>

      <div className="form-actions service-actions">
        <button className="btn primary">{initial.id ? "Enregistrer" : "Créer"}</button>
        {!initial.id && <button className="btn" type="submit" name="createAnother" value="1">Créer &amp; Ajouter un autre</button>}
        <a className="btn" href="/admin/services">Annuler</a>
      </div>
    </form>
  );
}
