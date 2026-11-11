import { Link } from 'react-router-dom';

const LEGAL_DOCUMENT_METADATA = Object.freeze({
  version: '1.0',
  lastUpdated: '[date]',
});

export const LEGAL_DOCUMENT_VERSION = LEGAL_DOCUMENT_METADATA.version;
export const LEGAL_LAST_UPDATED = LEGAL_DOCUMENT_METADATA.lastUpdated;

const privacySections = [
  {
    heading: 'Who we are',
    content: (
      <p>
        AgriHerd is an agricultural management and marketplace platform operated by
        {' '}[operator or organisation name], [address, Lesotho]. For questions or
        requests about your personal data, contact [privacy contact email]. In this
        policy, “we” and “us” mean the AgriHerd operator.
      </p>
    ),
  },
  {
    heading: 'What this policy covers',
    content: (
      <p>
        This policy explains what personal data we collect when you use AgriHerd as
        a farmer, a buyer or an administrator, why we collect it, how we protect it,
        and what rights you have.
      </p>
    ),
  },
  {
    heading: 'Data we collect',
    content: (
      <ul>
        <li><strong>Account data:</strong> full name, email address and/or phone number, and your password (stored only as a secure hash, never in plain text).</li>
        <li><strong>Farmer data:</strong> farm name, location and size, and the livestock, health, vaccination, crop, planting, harvest, task, inventory and financial records you enter.</li>
        <li><strong>Marketplace data:</strong> product listings, shopping cart contents, orders, delivery or collection details, and payment status.</li>
        <li><strong>Disease scanner data:</strong> crop images you upload or capture, disease predictions, confidence scores and scan dates.</li>
        <li><strong>Notifications and preferences:</strong> messages sent to you and the notification settings you choose.</li>
        <li><strong>Technical and security data:</strong> sign-in times, audit records of important actions, IP address, and a sign-in token stored in your browser [confirm: local storage or secure cookie].</li>
        <li><strong>Consent records:</strong> which version of this policy and the Terms you accepted and when.</li>
      </ul>
    ),
  },
  {
    heading: 'Why we use your data',
    content: (
      <>
        <ul>
          <li>To create and secure your account and sign you in (necessary to provide the service).</li>
          <li>To provide farm management, marketplace, ordering and payment-status features you request.</li>
          <li>To analyse crop images and show disease predictions.</li>
          <li>To send notifications about tasks, stock, orders and system announcements.</li>
          <li>To keep the platform safe, prevent misuse and keep audit records.</li>
          <li>To meet legal obligations such as financial record keeping.</li>
        </ul>
        <p>We do not sell your personal data and we do not use it for advertising. We do not collect real card numbers or card security codes. Card and mobile-money payments in AgriHerd are demonstrations and no real money is transferred.</p>
      </>
    ),
  },
  {
    heading: 'Who can see your data',
    content: (
      <ul>
        <li><strong>Farmers</strong> see only their own farm records and orders for their products.</li>
        <li><strong>Buyers</strong> see only their own cart, orders and profile. Marketplace listings show the product, farm name and general location; phone numbers and email addresses are not shown publicly.</li>
        <li><strong>Administrators</strong> manage accounts, settings and security. They can see account information and audit records. They cannot read passwords and do not have access to private farm records or financial records.</li>
      </ul>
    ),
  },
  {
    heading: 'Service providers who process data for us',
    content: (
      <p>
        We use [Supabase] (database and file storage, region [region]), [Render]
        (application and AI-service hosting, region [region]), [email provider]
        (password-reset emails), and a public blockchain test network. These
        providers process data to provide their services to us. Where data is stored
        outside Lesotho, we rely on [safeguards, to be confirmed].
      </p>
    ),
  },
  {
    heading: 'Blockchain',
    content: (
      <p>
        AgriHerd may store a cryptographic fingerprint (a hash) of a harvest or
        sales record, with a record type and reference, on a public blockchain test
        network. The hash is computed from non-personal fields with a random secret
        value kept in our database. The blockchain does not contain names, contact
        details, addresses, images or prices linked to a person. A blockchain entry
        cannot be edited or deleted. If the related record is deleted and the secret
        value removed, the remaining hash can no longer be linked to you.
      </p>
    ),
  },
  {
    heading: 'How long we keep data',
    content: (
      <ul>
        <li>Account and profile data: while your account is active and for [period] after closure.</li>
        <li>Farm and marketplace records: while your account is active and for the period required by law for financial and order records ([period]).</li>
        <li>Disease scan images and results: until you delete them or close your account, and for no longer than [period].</li>
        <li>Audit records: [period].</li>
      </ul>
    ),
  },
  {
    heading: 'How we protect your data',
    content: (
      <p>
        Passwords are hashed. Access is restricted by role and record ownership on
        the server. Connections use HTTPS. The database service key is kept only on
        the server. Important actions are written to an audit log. No system is
        completely secure; where required by law, we will notify affected users and
        the relevant authority if a breach occurs.
      </p>
    ),
  },
  {
    heading: 'Your rights',
    content: (
      <p>
        Subject to applicable law, you may ask us to give you access to your data,
        correct or delete it, restrict or object to its use, or give you a portable
        copy. You may withdraw consent at any time without affecting earlier
        processing. Contact [privacy contact email]. We will respond within [30
        days]. You may also complain to the data-protection authority in your country.
      </p>
    ),
  },
  {
    heading: 'Children',
    content: (
      <p>
        AgriHerd is not intended for people under [18]. We do not knowingly collect
        data from children.
      </p>
    ),
  },
  {
    heading: 'Changes to this policy',
    content: (
      <p>
        We may update this policy. We will change the version and date above and,
        for important changes, notify you in the application.
      </p>
    ),
  },
  {
    heading: 'Contact',
    content: (
      <p>[Operator name], [address], [privacy contact email], [phone].</p>
    ),
  },
];

const termsSections = [
  {
    heading: 'Acceptance',
    content: (
      <p>
        By creating an account or using AgriHerd you agree to these Terms and to our
        <Link to="/privacy"> Privacy Policy</Link>. If you do not agree, do not use
        the service.
      </p>
    ),
  },
  {
    heading: 'About AgriHerd',
    content: (
      <p>
        AgriHerd helps farmers manage farms, livestock, crops, inventory and
        finances, and provides a marketplace where farmers sell agricultural
        products to buyers. [AgriHerd is currently a prototype / pilot service and
        may change or be unavailable at times.]
      </p>
    ),
  },
  {
    heading: 'Accounts and roles',
    content: (
      <p>
        There are three kinds of account: farmer, buyer and administrator. Farmers
        and buyers may register; administrator accounts cannot be created through
        registration. Give accurate information, keep your password confidential,
        and tell us if you suspect unauthorised use. You are responsible for
        activity under your account. New farmer accounts may require administrator
        approval.
      </p>
    ),
  },
  {
    heading: 'Acceptable use',
    content: (
      <p>
        You must not break the law, upload harmful or misleading content, attempt to
        access another user’s data, interfere with the service or its security,
        scrape or overload it, or use it to sell prohibited, unsafe or fraudulent
        goods.
      </p>
    ),
  },
  {
    heading: 'Farmer records',
    content: (
      <p>
        The records you enter belong to you. You are responsible for their accuracy
        and for decisions you make using them. AgriHerd reports and dashboards are
        calculated from the information you provide.
      </p>
    ),
  },
  {
    heading: 'Marketplace',
    content: (
      <ul>
        <li>Farmers are responsible for the accuracy of listings, prices, quantities, quality and delivery or collection.</li>
        <li>Orders are agreements between the buyer and farmer. AgriHerd provides the platform but is not a party to the sale [confirm].</li>
        <li>Orders move through the statuses shown in the application. Stock is reserved when an order is placed and restored if an order is rejected or cancelled.</li>
        <li>Administrators may deactivate listings that break these Terms and will record the reason.</li>
      </ul>
    ),
  },
  {
    heading: 'Payments',
    content: (
      <p>
        Cash on delivery or collection is settled directly between buyer and
        farmer. Card and mobile-money options in AgriHerd are demonstration
        payments: no real money is transferred, and they must not be treated as
        proof of real payment.
      </p>
    ),
  },
  {
    heading: 'AI disease scanner',
    content: (
      <p>
        The scanner gives automated predictions with a confidence score. They are
        decision-support information only, not a professional diagnosis, and
        results can be wrong or incomplete. Confirm important findings with a
        qualified agricultural adviser before acting.
      </p>
    ),
  },
  {
    heading: 'Blockchain verification',
    content: (
      <p>
        AgriHerd may record a hash of selected records on a public test network to
        support verification. Test networks have no monetary value and may be reset
        or become unavailable. A blockchain entry shows that a record existed in a
        given form at a given time; it does not guarantee that the record is accurate.
      </p>
    ),
  },
  {
    heading: 'Your content and our rights',
    content: (
      <p>
        You keep ownership of the content you submit. You give us permission to
        store and process it to provide the service. AgriHerd, its software, design
        and branding belong to [operator] or its licensors.
      </p>
    ),
  },
  {
    heading: 'Availability',
    content: (
      <p>
        We try to keep AgriHerd available but do not guarantee uninterrupted or
        error-free operation. We may perform maintenance and change or remove
        features.
      </p>
    ),
  },
  {
    heading: 'Suspension and termination',
    content: (
      <p>
        We may suspend or deactivate an account that breaks these Terms or
        threatens security. You may stop using AgriHerd and ask us to close your
        account at any time. Records we must keep by law, and audit records, may be
        retained.
      </p>
    ),
  },
  {
    heading: 'Limitation of liability',
    content: (
      <p>
        To the extent the law allows, AgriHerd is provided “as is”, and [operator]
        is not liable for indirect or consequential loss, losses from decisions
        based on predictions or reports, or disputes between buyers and farmers.
        Nothing in these Terms limits liability that cannot be limited by law.
      </p>
    ),
  },
  {
    heading: 'Changes',
    content: (
      <p>
        We may update these Terms. We will change the version and date and notify
        you of important changes in the application. Continued use after a change
        means you accept it.
      </p>
    ),
  },
  {
    heading: 'Governing law and contact',
    content: (
      <p>
        These Terms are governed by the laws of [Lesotho]. Contact: [operator name],
        [address], [email].
      </p>
    ),
  },
];

const LegalPage = ({ documentType }) => {
  const isPrivacy = documentType === 'privacy';
  const sections = isPrivacy ? privacySections : termsSections;
  const title = isPrivacy ? 'AgriHerd Privacy Policy' : 'AgriHerd Terms of Service';

  return (
    <main className="legal-page">
      <article className="legal-card">
        <header className="legal-header">
          <Link to="/" className="legal-brand">AgriHerd</Link>
          <h1>{title}</h1>
          <p>Version {LEGAL_DOCUMENT_VERSION} · Last updated: {LEGAL_LAST_UPDATED}</p>
          <p className="legal-draft-notice" role="note">
            Draft for review: replace every bracketed placeholder and have this
            document reviewed by a qualified adviser before publication. This is
            not legal advice.
          </p>
        </header>

        <nav className="legal-toc" aria-label="Table of contents">
          <h2>Contents</h2>
          <ol>
            {sections.map((section, index) => {
              const sectionId = `${documentType}-${index + 1}`;
              return (
                <li key={sectionId}>
                  <a href={`#${sectionId}`}>{section.heading}</a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="legal-content">
          {sections.map((section, index) => (
            <section id={`${documentType}-${index + 1}`} key={section.heading}>
              <h2>{index + 1}. {section.heading}</h2>
              {section.content}
            </section>
          ))}
        </div>

        <footer className="legal-page-footer">
          <Link to={isPrivacy ? '/terms' : '/privacy'}>
            Read the {isPrivacy ? 'Terms of Service' : 'Privacy Policy'}
          </Link>
          <Link to="/register">Back to registration</Link>
          <Link to="/">Back to home</Link>
        </footer>
      </article>
    </main>
  );
};

export const PrivacyPage = () => <LegalPage documentType="privacy" />;
export const TermsPage = () => <LegalPage documentType="terms" />;
