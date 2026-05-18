import LegalPage from '../components/LegalPage.jsx';

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="page-body">
        Bear River Quilting (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This
        policy explains what information we collect when you visit our website, place an order, or
        contact us, and how we use and protect that information.
      </p>

      <section>
        <h2>Information we collect</h2>
        <p className="page-body">
          We may collect information you provide directly, including:
        </p>
        <ul>
          <li>Name, email address, phone number, and shipping or billing address</li>
          <li>Order details, including products purchased and payment confirmation data</li>
          <li>Messages you send through contact forms or customer support</li>
          <li>Account or order lookup information when you use our customer order tools</li>
        </ul>
        <p className="page-body">
          We also collect limited technical data automatically, such as browser type, device
          information, IP address, and pages visited, to operate and improve the site.
        </p>
      </section>

      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>Process and fulfill orders, including shipping and delivery updates</li>
          <li>Respond to questions and provide customer support</li>
          <li>Send transactional emails related to your purchase (for example, order confirmation)</li>
          <li>Improve our website, products, and shopping experience</li>
          <li>Detect fraud, abuse, or security issues</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p className="page-body">
          We use cookies and similar technologies where needed to keep you signed in to admin areas,
          remember cart contents in your browser, and understand how visitors use the site. You can
          control cookies through your browser settings; disabling them may limit some features such
          as the shopping cart.
        </p>
      </section>

      <section>
        <h2>Sharing your information</h2>
        <p className="page-body">
          We do not sell your personal information. We may share data with service providers who
          help us run the business—for example, payment processors, email delivery, shipping
          carriers, and hosting—only as needed to perform those services and subject to appropriate
          safeguards.
        </p>
      </section>

      <section>
        <h2>Data retention and security</h2>
        <p className="page-body">
          We retain order and account records as long as needed for business, tax, and legal
          purposes. We use reasonable administrative and technical measures to protect your data,
          but no online transmission is completely secure.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p className="page-body">
          Depending on where you live, you may have rights to access, correct, or delete certain
          personal information, or to opt out of specific processing. To make a request, contact us
          using the details below. We will respond within a reasonable time.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p className="page-body">
          Our site is not directed to children under 13, and we do not knowingly collect personal
          information from children.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p className="page-body">
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top
          reflects the latest revision. Continued use of the site after changes constitutes acceptance
          of the updated policy.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p className="page-body">
          Questions about privacy? Email us at{' '}
          <a href="mailto:privacy@bearriverquilting.com">privacy@bearriverquilting.com</a> or write to
          Bear River Quilting, Customer Care, Bear River, UT.
        </p>
      </section>
    </LegalPage>
  );
}
