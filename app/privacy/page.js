import LegalShell from '@/components/site/legal-shell';

export const metadata = {
  title: 'Privacy Policy | Vaulter',
  description: 'How Vaulter collects, uses, and protects your information.'
};

const infoCollected = [
  {
    label: 'a. Information You Provide',
    paragraphs: ['We may collect information you provide directly, such as:'],
    list: [
      'name',
      'email address',
      'account credentials or authentication identifiers',
      'billing information, if applicable',
      'support requests and communications',
      'workspace, configuration, or integration settings',
    ],
  },
  {
    label: 'b. Usage Information',
    paragraphs: ['We may automatically collect certain information about how you use the Service, including:'],
    list: [
      'IP address',
      'browser type and device information',
      'operating system',
      'pages viewed and interactions',
      'timestamps and referring URLs',
      'diagnostics, crash logs, and performance data',
    ],
  },
  {
    label: 'c. Integration and Technical Data',
    paragraphs: [
      'If you connect third-party services or developer tools, we may process technical metadata necessary to support those integrations.',
    ],
  },
  {
    label: 'd. Sensitive Data',
    paragraphs: [
      'Vaulter is built to reduce unnecessary access to sensitive secrets and credentials. However, depending on how you use the Service, we may process encrypted or protected configuration-related information required to operate the product.',
    ],
  },
];

const sections = [
  {
    title: '1. Information We Collect',
    blocks: infoCollected,
  },
  {
    title: '2. How We Use Information',
    paragraphs: ['We use information to:'],
    list: [
      'provide, maintain, and improve the Service',
      'authenticate users and secure accounts',
      'support product features and integrations',
      'respond to inquiries and provide support',
      'monitor reliability, performance, and abuse',
      'detect, investigate, and prevent fraud or security incidents',
      'comply with legal obligations',
      'communicate important service or policy updates',
    ],
  },
  {
    title: '3. Legal Bases for Processing',
    paragraphs: ['Where required by law, we process personal data on one or more of the following bases:'],
    list: ['performance of a contract', 'legitimate interests', 'consent', 'compliance with legal obligations'],
  },
  {
    title: '4. How We Share Information',
    paragraphs: [
      'We do not sell your personal information.',
      'We may share information with:',
    ],
    list: [
      'service providers that help us operate the Service, such as hosting, analytics, authentication, support, and infrastructure vendors',
      'professional advisors, such as lawyers, auditors, or insurers',
      'law enforcement or regulators when required by law',
      'successors in connection with a merger, acquisition, financing, or sale of assets',
    ],
    closing: 'We share only as reasonably necessary for these purposes.',
  },
  {
    title: '5. Data Retention',
    paragraphs: [
      'We retain information for as long as needed to provide the Service, comply with legal obligations, resolve disputes, enforce agreements, and maintain legitimate business records.',
      'Retention periods may vary depending on the type of data and the purpose for which it was collected.',
    ],
  },
  {
    title: '6. Security',
    paragraphs: [
      'We use reasonable security measures designed to protect information from unauthorized access, alteration, disclosure, or destruction. These measures may include encryption, access controls, logging, monitoring, and secure infrastructure practices.',
      'No system is perfectly secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    title: '7. Cookies and Similar Technologies',
    paragraphs: ['We may use cookies and similar technologies to:'],
    list: ['keep you signed in', 'remember preferences', 'understand usage patterns', 'improve performance and user experience'],
    closing: 'You can usually manage cookies through your browser settings. Disabling cookies may affect Service functionality.',
  },
  {
    title: '8. International Data Transfers',
    paragraphs: ['Your information may be processed in countries other than your own. Where required, we take steps designed to ensure appropriate safeguards for international transfers.'],
  },
  {
    title: '9. Your Rights',
    paragraphs: ['Depending on your location, you may have rights to:'],
    list: [
      'access your personal information',
      'correct inaccurate information',
      'request deletion',
      'object to or restrict certain processing',
      'request data portability',
      'withdraw consent where processing is based on consent',
    ],
    closing: 'To exercise these rights, contact us at privacy@vaulter.in.',
  },
  {
    title: '10. Third-Party Services',
    paragraphs: ['The Service may contain links to or integrations with third-party websites, platforms, or tools. Their privacy practices are governed by their own policies, not this Privacy Policy.'],
  },
  {
    title: '11. Children’s Privacy',
    paragraphs: ['The Service is not directed to children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact us and we will take appropriate steps.'],
  },
  {
    title: '12. Changes to This Privacy Policy',
    paragraphs: ['We may update this Privacy Policy from time to time. If we make material changes, we will update the “Last updated” date and, where appropriate, provide additional notice.'],
  },
];

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="How Vaulter collects, uses, and protects your information."
      lastUpdated="13 March 2026"
    >
      <section className="vaulter-surface p-8 md:p-10">
        <div className="space-y-6 text-base leading-8 text-purple-100 md:text-lg">
          <p>
            Vaulter (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) values your privacy. This Privacy Policy explains how we collect, use,
            disclose, and protect information when you access or use our website, applications, CLI, MCP integrations,
            and related services (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p>By using the Service, you acknowledge the practices described in this Privacy Policy.</p>
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

          {section.blocks ? (
            <div className="mt-8 space-y-8">
              {section.blocks.map((block) => (
                <div key={block.label}>
                  <h3 className="text-lg font-semibold text-white">{block.label}</h3>
                  {block.paragraphs ? (
                    <div className="mt-3 space-y-3 text-base leading-8 text-purple-100">
                      {block.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}
                  {block.list ? (
                    <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-8 text-purple-100">
                      {block.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
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
