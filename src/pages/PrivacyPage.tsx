import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageMeta from "@/components/PageMeta";

export default function PrivacyPage() {
  return (
    <>
      <PageMeta
        title="Privacy Policy"
        description="Learn how Compare Water Filters collects, uses, stores, and discloses your personal information in accordance with Australian privacy law."
        path="/privacy"
      />
      <div className="container max-w-[800px] py-12 px-4">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link>
        </Button>

        <article className="prose prose-slate max-w-none dark:prose-invert">
          <h1>COMPARE WATER FILTERS — PRIVACY POLICY</h1>
          <p><strong>Last updated: April 2026</strong><br /><strong>Version: 1.0</strong></p>

          <p>Compare Water Filters Pty Ltd (ACN: 697 405 093 | ABN: 32 697 405 093) ("Compare Water Filters", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and disclose your personal information when you use our platform at comparewaterfilters.com.au ("Platform").</p>
          <p>We are bound by the Privacy Act 1988 (Cth) and the Australian Privacy Principles ("APPs") contained in that Act. This Privacy Policy is written in accordance with those obligations.</p>
          <p>By using the Platform, you consent to the collection, use, and disclosure of your personal information as described in this Privacy Policy.</p>

          <hr />

          <h2>1. What Personal Information We Collect</h2>

          <h3>1.1 Information you provide directly</h3>

          <p><strong>From Customers (homeowners and residents):</strong></p>
          <ul>
            <li>First name</li>
            <li>Email address</li>
            <li>Mobile phone number</li>
            <li>Suburb, postcode, and state</li>
            <li>Property type (house, apartment, townhouse)</li>
            <li>Ownership status (own or rent)</li>
            <li>Household size and number of bathrooms</li>
            <li>Water source (town water, rainwater, bore water etc.)</li>
            <li>Water concerns and priorities</li>
            <li>Budget range</li>
            <li>Any additional notes or information you provide in the quiz</li>
          </ul>

          <p><strong>From Vendors (water filtration businesses):</strong></p>
          <ul>
            <li>Business name and trading name</li>
            <li>Contact name and title</li>
            <li>Business email address</li>
            <li>Phone number</li>
            <li>ABN (Australian Business Number)</li>
            <li>State plumbing licence number</li>
            <li>Public liability insurance details</li>
            <li>Business description, highlights, and profile content</li>
            <li>Service areas and postcode ranges</li>
            <li>System types installed and brands</li>
            <li>Years in business, certifications, and warranty information</li>
            <li>Google Business Profile URL</li>
            <li>Business logo and any uploaded images</li>
            <li>Certification documents uploaded during registration</li>
          </ul>

          <p><strong>From all registered users:</strong></p>
          <ul>
            <li>Email address and password (stored in encrypted form)</li>
            <li>Account preferences and settings</li>
          </ul>

          <h3>1.2 Information we collect automatically</h3>
          <p>When you use the Platform, we automatically collect:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Pages visited and time spent on each page</li>
            <li>Referring URL</li>
            <li>Date and time of visits</li>
            <li>Search queries entered on the Platform</li>
            <li>Interactions with the Platform (clicks, quiz completions, quote requests)</li>
          </ul>

          <h3>1.3 Information from third parties</h3>
          <p>We may receive information about you from third parties including:</p>
          <ul>
            <li>Google Analytics — aggregated usage and behaviour data</li>
            <li>Meta (Facebook) — if you interact with our advertisements or social content</li>
            <li>Stripe — payment processing data for Vendor billing (we do not store full card details)</li>
          </ul>

          <hr />

          <h2>2. How We Use Your Personal Information</h2>

          <h3>2.1 Customers</h3>
          <p>We use your personal information to:</p>
          <ul>
            <li>Generate personalised water filter system recommendations based on your quiz responses</li>
            <li>Match you with Vendors operating in your area who install the systems relevant to your needs</li>
            <li>Share your contact details and quiz responses with Vendors you select to receive a quote from</li>
            <li>Send your recommendations to you by email</li>
            <li>Send follow-up communications related to your quote request</li>
            <li>Improve the accuracy and relevance of our recommendations</li>
            <li>Analyse Platform usage to improve the customer experience</li>
            <li>Comply with our legal obligations</li>
          </ul>

          <h3>2.2 Vendors</h3>
          <p>We use your personal information to:</p>
          <ul>
            <li>Verify your business identity, ABN, and licence details</li>
            <li>Create and display your Vendor profile on the Platform</li>
            <li>Match your profile to relevant Customer quote requests</li>
            <li>Send Customer leads to you</li>
            <li>Issue invoices for lead fees</li>
            <li>Process payments via Stripe</li>
            <li>Communicate with you about your account, billing, and Platform updates</li>
            <li>Analyse Vendor performance and Platform usage</li>
            <li>Comply with our legal obligations</li>
          </ul>

          <h3>2.3 All users</h3>
          <p>We use automatically collected information to:</p>
          <ul>
            <li>Monitor and improve Platform performance and security</li>
            <li>Understand how users interact with the Platform</li>
            <li>Measure the effectiveness of our marketing campaigns</li>
            <li>Detect and prevent fraud and unauthorised access</li>
            <li>Comply with legal obligations</li>
          </ul>

          <hr />

          <h2>3. How We Disclose Your Personal Information</h2>

          <h3>3.1 Sharing Customer information with Vendors</h3>
          <p>When a Customer submits a quote request, we share the following information with the selected Vendor:</p>
          <ul>
            <li>Customer name</li>
            <li>Email address</li>
            <li>Mobile phone number</li>
            <li>Suburb, state, and postcode</li>
            <li>Property type and ownership status</li>
            <li>Household size and water source</li>
            <li>Water concerns, budget, and priorities</li>
            <li>Recommended systems</li>
            <li>Any additional notes provided</li>
          </ul>
          <p>This sharing is the core function of our Platform. By submitting a quote request, you consent to this disclosure.</p>

          <h3>3.2 Service providers</h3>
          <p>We share personal information with third party service providers who assist us in operating the Platform, including:</p>
          <ul>
            <li><strong>Supabase</strong> — database hosting and backend infrastructure (data stored in Australia/USA)</li>
            <li><strong>Stripe</strong> — payment processing for Vendor billing</li>
            <li><strong>Google</strong> — analytics (Google Analytics) and advertising measurement</li>
            <li><strong>Meta (Facebook)</strong> — advertising measurement via Meta Pixel</li>
            <li><strong>Email service providers</strong> — for sending transactional and notification emails</li>
          </ul>
          <p>These service providers are required to handle your information securely and only for the purposes we specify. They are not permitted to use your information for their own purposes.</p>

          <h3>3.3 Legal requirements</h3>
          <p>We may disclose your personal information if required to do so by law, court order, or government authority, or where we reasonably believe disclosure is necessary to:</p>
          <ul>
            <li>Comply with a legal obligation</li>
            <li>Protect the rights, property, or safety of Compare Water Filters, our users, or the public</li>
            <li>Investigate or prevent fraud or illegal activity</li>
          </ul>

          <h3>3.4 Business transfers</h3>
          <p>If Compare Water Filters is involved in a merger, acquisition, or sale of assets, your personal information may be transferred as part of that transaction. We will notify you before your personal information is transferred and becomes subject to a different privacy policy.</p>

          <h3>3.5 What we do not do</h3>
          <p>We do not:</p>
          <ul>
            <li>Sell your personal information to any third party</li>
            <li>Share your information with Vendors you have not selected</li>
            <li>Use your information for purposes unrelated to the operation of the Platform without your consent</li>
            <li>Allow Vendors to use Customer contact details for any purpose other than responding to quote requests made through the Platform</li>
          </ul>

          <hr />

          <h2>4. Cookies and Tracking Technologies</h2>

          <h3>4.1 What we use</h3>
          <p>We use the following cookies and tracking technologies:</p>
          <p><strong>Essential cookies</strong> — required for the Platform to function. These cannot be disabled. They include session cookies that keep you logged in and security tokens.</p>
          <p><strong>Analytics cookies</strong> — Google Analytics collects anonymised data about how users interact with the Platform. This helps us understand which features are most useful. No personally identifiable information is collected by Google Analytics.</p>
          <p><strong>Marketing cookies</strong> — Meta Pixel (Facebook Pixel) allows us to measure the effectiveness of our advertising campaigns. This may involve sharing anonymised event data (such as quiz completions and quote requests) with Meta.</p>

          <h3>4.2 Your choices</h3>
          <p>On your first visit to the Platform, you will be shown a cookie consent notice. You may accept all cookies or choose essential cookies only.</p>
          <p>You can also manage cookies through your browser settings. Note that disabling certain cookies may affect the functionality of the Platform.</p>

          <h3>4.3 Do Not Track</h3>
          <p>Some browsers include a "Do Not Track" feature. We currently do not respond to Do Not Track signals, but we honour cookie preferences set through our cookie consent notice.</p>

          <hr />

          <h2>5. Data Storage and Security</h2>

          <h3>5.1 Where your data is stored</h3>
          <p>Your personal information is stored on servers managed by Supabase, which may be located in Australia or the United States. Supabase maintains industry-standard security practices including encryption at rest and in transit.</p>
          <p>Payment information is processed and stored by Stripe. We do not store full credit card details on our systems.</p>

          <h3>5.2 Security measures</h3>
          <p>We take reasonable steps to protect your personal information from misuse, interference, loss, unauthorised access, modification, or disclosure. These measures include:</p>
          <ul>
            <li>Encryption of data in transit using SSL/TLS</li>
            <li>Encryption of data at rest</li>
            <li>Access controls limiting who can access personal information</li>
            <li>Password hashing and secure authentication</li>
            <li>Regular security monitoring</li>
          </ul>

          <h3>5.3 Data breaches</h3>
          <p>If we become aware of a data breach that is likely to result in serious harm to you, we will notify you and the Office of the Australian Information Commissioner (OAIC) in accordance with the Notifiable Data Breaches scheme under the Privacy Act 1988.</p>

          <hr />

          <h2>6. How Long We Retain Your Information</h2>
          <p>We retain your personal information for as long as necessary to fulfil the purposes for which it was collected, or as required by law.</p>
          <p><strong>Customers:</strong> We retain quiz responses, quote request details, and contact information for 3 years from the date of collection, or until you request deletion.</p>
          <p><strong>Vendors:</strong> We retain account information, profile data, and billing records for 7 years from the date your account is closed, to comply with our financial record-keeping obligations under the Corporations Act 2001.</p>
          <p><strong>Analytics data:</strong> Aggregated, anonymised analytics data may be retained indefinitely.</p>
          <p>When personal information is no longer required, we will delete or de-identify it securely.</p>

          <hr />

          <h2>7. Your Rights and Choices</h2>

          <h3>7.1 Access to your information</h3>
          <p>You have the right to request access to the personal information we hold about you. To make a request, contact us at hello@comparewaterfilters.com.au. We will respond within 30 days.</p>
          <p>We may charge a reasonable fee for providing access in certain circumstances.</p>

          <h3>7.2 Correction of your information</h3>
          <p>If you believe any personal information we hold about you is inaccurate, incomplete, or out of date, you may request that we correct it. We will respond within 30 days.</p>

          <h3>7.3 Deletion of your information</h3>
          <p>You may request that we delete your personal information. We will comply where we are not required by law to retain it. Note that deleting your information will result in the closure of your account.</p>

          <h3>7.4 Opting out of marketing communications</h3>
          <p>You may opt out of receiving marketing emails from us at any time by:</p>
          <ul>
            <li>Clicking the unsubscribe link in any marketing email</li>
            <li>Contacting us at hello@comparewaterfilters.com.au</li>
          </ul>
          <p>Note: opting out of marketing emails will not affect transactional emails related to your account or quote requests.</p>

          <h3>7.5 Withdrawing consent</h3>
          <p>Where we rely on your consent to process your personal information, you may withdraw that consent at any time. Withdrawal of consent will not affect the lawfulness of processing carried out before withdrawal.</p>

          <hr />

          <h2>8. Children's Privacy</h2>
          <p>The Platform is not directed at children under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately at hello@comparewaterfilters.com.au and we will delete it promptly.</p>

          <hr />

          <h2>9. Links to Third Party Websites</h2>
          <p>The Platform may contain links to third party websites. This Privacy Policy does not apply to those websites. We encourage you to read the privacy policy of any third party website you visit.</p>

          <hr />

          <h2>10. Overseas Disclosure</h2>
          <p>Some of our service providers are located overseas, including in the United States. By using the Platform, you consent to the disclosure of your personal information to overseas recipients. We take reasonable steps to ensure overseas recipients handle your information in accordance with the Australian Privacy Principles.</p>

          <hr />

          <h2>11. How to Make a Privacy Complaint</h2>
          <p>If you have a complaint about how we have handled your personal information, please contact our Privacy Officer at:</p>
          <p>
            <strong>Email:</strong> hello@comparewaterfilters.com.au<br />
            <strong>Subject line:</strong> Privacy Complaint
          </p>
          <p>We will acknowledge your complaint within 5 business days and aim to resolve it within 30 days. If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au or by calling 1300 363 992.</p>

          <hr />

          <h2>12. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. We will notify you of material changes by email or by displaying a prominent notice on the Platform. The updated policy will take effect from the date it is published.</p>
          <p>We encourage you to review this Privacy Policy periodically.</p>

          <hr />

          <h2>13. Contact Us</h2>
          <p>For any questions, requests, or concerns regarding this Privacy Policy or our handling of your personal information, please contact us:</p>
          <p>
            <strong>Compare Water Filters Pty Ltd</strong><br />
            <strong>Email:</strong> hello@comparewaterfilters.com.au<br />
            <strong>Website:</strong> comparewaterfilters.com.au<br />
            <strong>ABN:</strong> 32 697 405 093<br />
            <strong>ACN:</strong> 697 405 093
          </p>

          <hr />

          <p className="text-sm text-muted-foreground italic">This Privacy Policy was prepared in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles. It should be reviewed by a qualified Australian privacy lawyer before being relied upon for legal purposes.</p>
        </article>
      </div>
    </>
  );
}
