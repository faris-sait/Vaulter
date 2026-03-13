import LegalShell from '@/components/site/legal-shell';

export const metadata = {
  title: 'Terms of Service | Vaulter',
  description: 'The rules and conditions for using Vaulter.'
};

const sections = [
  {
    title: '1. Who We Are',
    paragraphs: ['Vaulter is a platform for managing secrets, keys, credentials, and related workflows across developer tools and environments.'],
  },
  {
    title: '2. Eligibility',
    paragraphs: ['You must be legally capable of entering into a binding agreement to use the Service. If you use Vaulter on behalf of a company or organization, you represent that you have authority to bind that entity to these Terms.'],
  },
  {
    title: '3. Your Account',
    paragraphs: ['You may need to create an account to access some features.', 'You agree to:'],
    list: [
      'provide accurate and complete information',
      'keep your login credentials secure',
      'promptly notify us of unauthorized access or suspected misuse',
      'remain responsible for activity under your account',
    ],
  },
  {
    title: '4. Acceptable Use',
    paragraphs: ['You may use the Service only in compliance with applicable law and these Terms.', 'You may not:'],
    list: [
      'use the Service for unlawful, harmful, or fraudulent purposes',
      'attempt to gain unauthorized access to systems, data, or accounts',
      'interfere with or disrupt the Service or its infrastructure',
      'probe, scan, or test vulnerabilities without authorization',
      'reverse engineer, copy, or exploit the Service except as permitted by law',
      'use the Service to store, transmit, or manage material in violation of law or third-party rights',
    ],
  },
  {
    title: '5. Your Content and Data',
    paragraphs: [
      'You retain ownership of the data, secrets, credentials, configurations, and other materials you submit to the Service (“Your Data”).',
      'You grant Vaulter the limited rights necessary to host, process, transmit, and display Your Data solely to operate, secure, and improve the Service.',
      'You are responsible for:',
    ],
    list: [
      'ensuring you have the right to use and store Your Data',
      'configuring access controls appropriately',
      'managing the confidentiality of your credentials and environments',
    ],
  },
  {
    title: '6. Security',
    paragraphs: ['We use reasonable administrative, technical, and organizational measures designed to protect the Service and customer data. However, no method of storage or transmission is completely secure, and we cannot guarantee absolute security.'],
  },
  {
    title: '7. Third-Party Services',
    paragraphs: [
      'The Service may interoperate with third-party tools, cloud providers, authentication providers, developer platforms, or integrations. Your use of those third-party services is governed by their own terms and policies, not these Terms.',
      'We are not responsible for third-party services, content, availability, or security practices.',
    ],
  },
  {
    title: '8. Availability and Changes',
    paragraphs: [
      'We may update, modify, suspend, or discontinue parts of the Service from time to time. We do not guarantee uninterrupted or error-free operation.',
      'We may also add or remove features at our discretion.',
    ],
  },
  {
    title: '9. Fees and Billing',
    paragraphs: [
      'Certain features may require payment. You agree to pay applicable fees in accordance with the pricing and billing terms presented to you at the time of purchase.',
      'Unless otherwise stated:',
    ],
    list: ['fees are non-refundable', 'subscriptions renew automatically until canceled', 'you are responsible for applicable taxes'],
  },
  {
    title: '10. Intellectual Property',
    paragraphs: ['The Service, including its software, design, branding, logos, text, interfaces, and related materials, is owned by Vaulter or its licensors and is protected by intellectual property laws.', 'Except for the limited right to use the Service under these Terms, no rights are granted to you.'],
  },
  {
    title: '11. Feedback',
    paragraphs: ['If you provide suggestions, ideas, or feedback about the Service, we may use them without restriction or obligation to you.'],
  },
  {
    title: '12. Termination',
    paragraphs: ['You may stop using the Service at any time.', 'We may suspend or terminate your access if:'],
    list: [
      'you violate these Terms',
      'your use creates risk for the Service or other users',
      'we are required to do so by law',
      'your account remains inactive or unpaid for an extended period, where applicable',
    ],
    closing: 'Upon termination, your right to use the Service ends immediately.',
  },
  {
    title: '13. Disclaimers',
    paragraphs: ['The Service is provided on an “as is” and “as available” basis to the fullest extent permitted by law. Vaulter disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted availability.'],
  },
  {
    title: '14. Limitation of Liability',
    paragraphs: ['To the fullest extent permitted by law, Vaulter and its affiliates, officers, employees, and licensors will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenues, data, goodwill, or business opportunities arising out of or related to your use of the Service.', 'Our total liability for any claim arising out of or relating to the Service will not exceed the amount you paid us, if any, for the Service during the 12 months before the event giving rise to the claim.'],
  },
  {
    title: '15. Indemnification',
    paragraphs: ['You agree to defend, indemnify, and hold harmless Vaulter and its affiliates from and against claims, liabilities, damages, losses, and expenses arising from:'],
    list: ['your use of the Service', 'your violation of these Terms', 'your violation of applicable law or third-party rights', 'Your Data'],
  },
  {
    title: '16. Governing Law',
    paragraphs: ['These Terms are governed by the laws of Supreme Court of India, excluding conflict of law rules.'],
  },
  {
    title: '17. Changes to These Terms',
    paragraphs: ['We may update these Terms from time to time. If we make material changes, we will update the “Last updated” date and, where appropriate, provide additional notice.', 'Your continued use of the Service after the updated Terms take effect means you accept them.'],
  },
];

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      subtitle="The rules and conditions for using Vaulter."
      lastUpdated="13 March 2026"
    >
      <section className="vaulter-surface p-8 md:p-10">
        <div className="space-y-6 text-base leading-8 text-purple-100 md:text-lg">
          <p>
            Welcome to Vaulter. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Vaulter website,
            applications, CLI, MCP integrations, and related services (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p>By accessing or using Vaulter, you agree to these Terms. If you do not agree, do not use the Service.</p>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="vaulter-subtle-surface p-8 md:p-10">
          <h2 className="font-display text-3xl font-bold tracking-[-0.05em] text-white md:text-4xl">{section.title}</h2>

          {section.paragraphs ? (
            <div className="mt-6 space-y-4 text-base leading-8 text-purple-100">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          {section.list ? (
            <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-8 text-purple-100">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {section.closing ? <p className="mt-6 text-base leading-8 text-purple-100">{section.closing}</p> : null}
        </section>
      ))}
    </LegalShell>
  );
}
