import LegalPage from '../components/LegalPage.jsx';

export default function ReturnPolicy() {
  return (
    <LegalPage title="Return Policy">
      <p className="page-body">
        We want you to love your quilt. If something is not right, review the guidelines below before
        starting a return or exchange. This policy applies to purchases made through the Bear River
        Quilting website unless otherwise noted at checkout.
      </p>

      <section>
        <h2>Return window</h2>
        <p className="page-body">
          Eligible items may be returned within <strong>30 days of delivery</strong> for a refund or
          store credit. To qualify, the return must be initiated within that window and received at
          our studio within a reasonable time afterward.
        </p>
      </section>

      <section>
        <h2>Condition requirements</h2>
        <ul>
          <li>Items must be unused, unwashed, and free of odors, stains, or pet hair</li>
          <li>Original packaging and care tags should be included when possible</li>
          <li>Proof of purchase (order number or email) is required</li>
        </ul>
        <p className="page-body">
          We reserve the right to refuse returns that do not meet these conditions or to issue a
          partial refund when an item shows signs of use.
        </p>
      </section>

      <section>
        <h2>Non-returnable items</h2>
        <ul>
          <li>Custom, made-to-order, or personalized quilts and commissions</li>
          <li>Final-sale or clearance items marked as non-returnable at purchase</li>
          <li>Gift cards or digital products</li>
        </ul>
      </section>

      <section>
        <h2>How to start a return</h2>
        <ol>
          <li>
            Email <a href="mailto:returns@bearriverquilting.com">returns@bearriverquilting.com</a>{' '}
            with your order number and reason for the return.
          </li>
          <li>We will confirm eligibility and provide return instructions and, if applicable, a return address.</li>
          <li>Pack the quilt securely to prevent damage in transit. We recommend a box and protective wrap.</li>
          <li>Ship the item using a trackable service and keep your receipt until the return is processed.</li>
        </ol>
      </section>

      <section>
        <h2>Refunds</h2>
        <p className="page-body">
          After we inspect the returned item, approved refunds are issued to the original payment
          method within <strong>5–10 business days</strong>. Shipping charges from your original order
          are non-refundable unless the return is due to our error or a defective product.
        </p>
      </section>

      <section>
        <h2>Exchanges</h2>
        <p className="page-body">
          Need a different size or collection? Contact us before shipping. Exchanges depend on
          availability; if the replacement is unavailable, we will offer a refund or store credit.
        </p>
      </section>

      <section>
        <h2>Return shipping</h2>
        <p className="page-body">
          Unless the return is our fault, customers are responsible for return shipping costs. We are
          not responsible for packages lost or damaged on the way back to us—please use adequate
          insurance and tracking.
        </p>
      </section>

      <section>
        <h2>Damaged or incorrect items</h2>
        <p className="page-body">
          If your quilt arrives damaged, defective, or not as described, contact us within{' '}
          <strong>7 days of delivery</strong> with photos of the issue and packaging. We will arrange
          a repair, replacement, or full refund including standard outbound shipping where appropriate.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p className="page-body">
          For help with a return or exchange, email{' '}
          <a href="mailto:returns@bearriverquilting.com">returns@bearriverquilting.com</a> or visit
          your <a href="/account">account</a> page to look up recent orders.
        </p>
      </section>
    </LegalPage>
  );
}
