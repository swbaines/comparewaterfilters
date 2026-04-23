import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageMeta from "@/components/PageMeta";
import { getEffectiveLeadPrices } from "@/lib/leadPricing";

export default function TermsPage() {
  const [prices, setPrices] = useState<{ owner_lead: number; rental_lead: number }>({ owner_lead: 85, rental_lead: 50 });

  useEffect(() => {
    getEffectiveLeadPrices().then(setPrices).catch(() => {});
  }, []);

  return (
    <>
      <PageMeta
        title="Terms and Conditions"
        description="Read the Terms and Conditions for using the Compare Water Filters platform, including customer and vendor obligations."
        path="/terms"
      />
      <div className="container max-w-[800px] py-12 px-4">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link>
        </Button>

        <article className="prose prose-slate max-w-none dark:prose-invert">
          <h1>COMPARE WATER FILTERS — PLATFORM TERMS AND CONDITIONS</h1>
          <p><strong>Last updated: April 2026</strong><br /><strong>Version: 1.0</strong></p>

          <p>These Terms and Conditions ("Terms") govern your use of the Compare Water Filters platform, website, and services operated by Compare Water Filters Pty Ltd (ACN: 697 405 093 | ABN: 32 697 405 093) ("Compare Water Filters", "we", "us", "our"), accessible at comparewaterfilters.com.au ("Platform").</p>
          <p>By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.</p>

          <hr />

          <h2>PART A — GENERAL TERMS (ALL USERS)</h2>

          <h3>1. About the Platform</h3>
          <p>1.1 Compare Water Filters is an independent online comparison and lead generation platform that connects Australian homeowners and residents ("Customers") with licensed water filtration businesses ("Vendors").</p>
          <p>1.2 We are not a water filtration installer, supplier, or manufacturer. We do not install, sell, or service water filtration systems. We do not employ or contract Vendors.</p>
          <p>1.3 We provide general information, system recommendations, and water quality data to assist Customers in making informed decisions. This information does not constitute professional advice.</p>
          <p>1.4 All transactions, contracts, and arrangements for the supply and installation of water filtration systems are made directly between Customers and Vendors. Compare Water Filters is not a party to those arrangements.</p>

          <h3>2. Eligibility</h3>
          <p>2.1 You must be at least 18 years of age to use the Platform.</p>
          <p>2.2 You must be located in Australia.</p>
          <p>2.3 By using the Platform, you represent and warrant that you meet these eligibility requirements.</p>

          <h3>3. Account Registration</h3>
          <p>3.1 Certain features of the Platform require you to create an account. You must provide accurate, current, and complete information when registering.</p>
          <p>3.2 You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>
          <p>3.3 You must notify us immediately at hello@comparewaterfilters.com.au if you become aware of any unauthorised use of your account.</p>
          <p>3.4 We reserve the right to suspend or terminate any account that we reasonably believe has been used in breach of these Terms.</p>

          <h3>4. Acceptable Use</h3>
          <p>4.1 You must not use the Platform to:</p>
          <ol type="a">
            <li>provide false, misleading, or deceptive information;</li>
            <li>impersonate any person or entity;</li>
            <li>engage in any unlawful activity;</li>
            <li>attempt to gain unauthorised access to any part of the Platform or its systems;</li>
            <li>transmit any virus, malware, or other harmful code;</li>
            <li>scrape, copy, or harvest data from the Platform without our written consent;</li>
            <li>use the Platform for any purpose other than its intended use;</li>
            <li>harass, threaten, or intimidate any other user.</li>
          </ol>
          <p>4.2 We reserve the right to suspend or terminate your access to the Platform if we reasonably believe you have breached these Terms.</p>

          <h3>5. Intellectual Property</h3>
          <p>5.1 All content on the Platform, including but not limited to text, graphics, logos, images, data, and software, is owned by or licensed to Compare Water Filters and is protected by Australian and international intellectual property laws.</p>
          <p>5.2 You may not reproduce, distribute, modify, or create derivative works of any Platform content without our prior written consent.</p>
          <p>5.3 You retain ownership of any content you submit to the Platform. By submitting content, you grant us a non-exclusive, royalty-free, worldwide licence to use, display, and reproduce that content for the purposes of operating the Platform.</p>

          <h3>6. Disclaimers</h3>
          <p>6.1 <strong>General guidance only.</strong> Information provided on the Platform, including system recommendations, water quality data, and pricing ranges, is for general informational purposes only. It does not constitute professional advice. You should obtain independent professional advice before making any purchase or installation decision.</p>
          <p>6.2 <strong>No guarantee of results.</strong> We do not guarantee that any recommendation made through the Platform will be suitable for your specific circumstances, water quality, property, or requirements.</p>
          <p>6.3 <strong>Water quality data.</strong> Water quality information displayed on the Platform is sourced from publicly available government reports and water authority publications. It represents typical averages for supply zones and may not reflect current conditions at your specific property. We make no warranty as to its accuracy, completeness, or currency.</p>
          <p>6.4 <strong>Pricing information.</strong> Price ranges displayed on the Platform are indicative only and based on general market research. Actual prices will vary depending on your location, property configuration, chosen system, and installer.</p>
          <p>6.5 <strong>Third party content.</strong> The Platform may contain links to third party websites or resources. We do not endorse, control, or accept responsibility for any third party content.</p>
          <p>6.6 <strong>Platform availability.</strong> We do not warrant that the Platform will be available at all times, error-free, or free from interruption. We may suspend, modify, or discontinue the Platform at any time without notice.</p>

          <h3>7. Limitation of Liability</h3>
          <p>7.1 To the maximum extent permitted by law, Compare Water Filters excludes all liability for any loss, damage, cost, or expense (whether direct, indirect, incidental, special, consequential, or otherwise) arising from:</p>
          <ol type="a">
            <li>your use of or reliance on the Platform or any information provided through it;</li>
            <li>any act or omission of a Vendor;</li>
            <li>any transaction or arrangement entered into between a Customer and a Vendor;</li>
            <li>any interruption, suspension, or unavailability of the Platform;</li>
            <li>any unauthorised access to or use of your account.</li>
          </ol>
          <p>7.2 Where liability cannot be excluded by law, our total aggregate liability to you is limited to the greater of AUD $100 or the total amount you have paid to us in the 12 months preceding the claim.</p>
          <p>7.3 Nothing in these Terms excludes, restricts, or modifies any right or remedy you may have under the Australian Consumer Law that cannot be excluded, restricted, or modified by contract.</p>

          <h3>8. Australian Consumer Law</h3>
          <p>8.1 Our goods and services come with guarantees that cannot be excluded under the Australian Consumer Law. For major failures with the service, you are entitled to cancel your service contract with us and to a refund for the unused portion, or to compensation for its reduced value. You are also entitled to be compensated for any other reasonably foreseeable loss or damage. If the failure does not amount to a major failure, you are entitled to have problems with the service rectified in a reasonable time and, if this is not done, to cancel your contract and obtain a refund for the unused portion of the contract.</p>

          <h3>9. Privacy</h3>
          <p>9.1 Our collection, use, and disclosure of your personal information is governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
          <p>9.2 By using the Platform, you consent to the collection and use of your personal information in accordance with our Privacy Policy.</p>

          <h3>10. Governing Law</h3>
          <p>10.1 These Terms are governed by the laws of Victoria, Australia.</p>
          <p>10.2 Any dispute arising from these Terms will be subject to the exclusive jurisdiction of the courts of Victoria, Australia.</p>

          <h3>11. Changes to These Terms</h3>
          <p>11.1 We may update these Terms at any time. We will notify registered users of material changes by email or by displaying a notice on the Platform.</p>
          <p>11.2 Your continued use of the Platform after any changes constitutes your acceptance of the updated Terms.</p>

          <h3>12. Contact Us</h3>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p>
            Compare Water Filters Pty Ltd<br />
            Email: hello@comparewaterfilters.com.au<br />
            Website: comparewaterfilters.com.au
          </p>

          <hr />

          <h2>PART B — CUSTOMER TERMS</h2>

          <h3>13. Using the Platform as a Customer</h3>
          <p>13.1 Customers may use the Platform to:</p>
          <ol type="a">
            <li>complete a water filter recommendation quiz;</li>
            <li>receive system recommendations based on their responses;</li>
            <li>view information about water quality in their area;</li>
            <li>browse Vendor profiles and request quotes.</li>
          </ol>
          <p>13.2 Use of the Platform for Customers is free of charge.</p>

          <h3>14. Quote Requests</h3>
          <p>14.1 When you submit a quote request through the Platform, your contact details and quiz responses will be shared with the Vendor(s) you select.</p>
          <p>14.2 Submitting a quote request does not create any obligation to proceed with a purchase or installation.</p>
          <p>14.3 Vendors are independent businesses. We do not control their availability, pricing, response times, or conduct. We make no guarantee that a Vendor will respond to your request within any particular timeframe.</p>
          <p>14.4 Any quote, contract, or arrangement you enter into with a Vendor is directly between you and that Vendor. We are not a party to that arrangement and accept no responsibility for the Vendor's performance.</p>

          <h3>15. Customer Obligations</h3>
          <p>15.1 You must provide accurate and complete information when completing the quiz and submitting quote requests.</p>
          <p>15.2 You must not submit multiple quote requests for the same property using different contact details.</p>
          <p>15.3 You must deal with Vendors honestly and in good faith.</p>

          <h3>16. Complaints About Vendors</h3>
          <p>16.1 If you have a complaint about a Vendor found through the Platform, please contact us at hello@comparewaterfilters.com.au.</p>
          <p>16.2 We will endeavour to investigate and assist in resolving legitimate complaints but cannot guarantee any particular outcome.</p>
          <p>16.3 We reserve the right to remove Vendors from the Platform where we receive substantiated complaints about conduct, licensing, or quality of work.</p>
          <p>16.4 For disputes about workmanship, pricing, or contractual matters, you may also contact your state consumer protection agency or the relevant licensing authority.</p>

          <hr />

          <h2>PART C — VENDOR TERMS</h2>

          <h3>17. Vendor Registration and Approval</h3>
          <p>17.1 To become a Vendor on the Platform, you must complete the registration process and provide accurate information including your business name, ABN, state plumbing licence number, and public liability insurance details.</p>
          <p>17.2 Registration does not guarantee approval. We reserve the right to approve or reject any Vendor application at our absolute discretion without being required to provide reasons.</p>
          <p>17.3 We may verify your ABN at abn.business.gov.au and may contact your relevant state licensing authority to verify your licence. Providing false or misleading information is grounds for immediate termination.</p>
          <p>17.4 Your profile will be set to "pending" upon registration and will only be made live once approved by our team.</p>

          <h3>18. Vendor Obligations</h3>
          <p>18.1 By registering as a Vendor, you represent, warrant, and undertake that:</p>
          <ol type="a">
            <li>you hold a current, valid plumbing licence issued by the relevant authority in each state in which you operate;</li>
            <li>you hold current public liability insurance with a minimum cover appropriate for your business;</li>
            <li>all information provided in your profile is accurate, current, and not misleading;</li>
            <li>all installations will be carried out by appropriately licensed tradespeople in accordance with applicable laws and standards;</li>
            <li>you will respond to quote requests in a professional and timely manner;</li>
            <li>you will deal honestly and fairly with Customers at all times;</li>
            <li>you will not engage in misleading or deceptive conduct in connection with your services;</li>
            <li>you will maintain all required licences and insurance throughout your time on the Platform and notify us immediately if any lapse.</li>
          </ol>

          <p>18.2 You must not:</p>
          <ol type="a">
            <li>use Customer contact details obtained through the Platform for any purpose other than responding to quote requests;</li>
            <li>contact Customers through channels other than those provided through the Platform without their explicit consent;</li>
            <li>solicit referrals, reviews, or endorsements from Customers in exchange for discounts or incentives;</li>
            <li>represent yourself as endorsed or recommended by Compare Water Filters;</li>
            <li>offer or accept payment for the placement or ranking of your profile.</li>
          </ol>

          <h3>19. Lead Fees and Billing</h3>
          <p>19.1 You will be charged a lead fee for each valid quote request submitted by a Customer and matched to your profile ("Lead").</p>
          <p>19.2 The lead fee is determined by the Customer's ownership status as follows:</p>
          <ol type="a">
            <li>Owner-occupier (Customer owns their property): <strong>AUD ${prices.owner_lead} per Lead</strong></li>
            <li>Renter (Customer is renting): <strong>AUD ${prices.rental_lead} per Lead</strong></li>
          </ol>
          <p>19.3 Lead fees are subject to change. Updated pricing applies to all Leads received after the change is published on this page.</p>
          <p>19.4 A Lead is deemed valid when it contains a Customer's verified name, email address, and mobile phone number submitted through the Platform.</p>
          <p>19.5 Invoices are issued on the 1st of each month for all Leads received in the prior calendar month. Payment is due within 14 days of the invoice date.</p>
          <p>19.6 We may charge your nominated payment method automatically on the invoice due date if you have a card on file.</p>
          <p>19.7 Invoices not paid within 30 days of the due date may result in:</p>
          <ol type="a">
            <li>your profile being hidden from Customer results;</li>
            <li>suspension of your account;</li>
            <li>referral of the outstanding amount to a debt collection agency.</li>
          </ol>
          <p>19.8 All amounts are in Australian dollars and inclusive of GST where applicable.</p>

          <h3>20. Lead Disputes</h3>
          <p>20.1 You may dispute a Lead as invalid within 14 days of the invoice date by contacting hello@comparewaterfilters.com.au with the Lead details and the reason for dispute.</p>
          <p>20.2 A Lead may be considered invalid if:</p>
          <ol type="a">
            <li>the Customer's contact details are demonstrably false or non-functional;</li>
            <li>the Lead is a clear duplicate of a Lead already charged in the same billing period for the same Customer and property.</li>
          </ol>
          <p>20.3 We will investigate disputes in good faith and respond within 5 business days. Our determination is final.</p>
          <p>20.4 We are under no obligation to provide a refund or credit for Leads where the Customer did not proceed, was unresponsive, or chose a different vendor.</p>

          <h3>21. Profile and Content</h3>
          <p>21.1 You are responsible for all content in your Vendor profile, including descriptions, certifications, pricing ranges, and highlights.</p>
          <p>21.2 All profile content must be accurate, current, and compliant with Australian Consumer Law. You must not make false, misleading, or deceptive claims.</p>
          <p>21.3 We reserve the right to edit, remove, or reject any profile content that we determine to be inaccurate, misleading, or in breach of these Terms.</p>
          <p>21.4 You grant us a non-exclusive, royalty-free licence to display your profile content, logo, and business name on the Platform for the purposes of promoting your services to Customers.</p>

          <h3>22. Suspension and Termination</h3>
          <p>22.1 We may suspend or terminate your Vendor account at any time if:</p>
          <ol type="a">
            <li>you breach any provision of these Terms;</li>
            <li>you provide false or misleading information;</li>
            <li>your licence or insurance lapses;</li>
            <li>we receive substantiated complaints from Customers about your conduct or workmanship;</li>
            <li>you fail to pay outstanding invoices;</li>
            <li>we reasonably believe your continued presence on the Platform poses a risk to Customers or to our reputation.</li>
          </ol>
          <p>22.2 You may terminate your account at any time by contacting hello@comparewaterfilters.com.au. Termination does not extinguish any outstanding payment obligations.</p>
          <p>22.3 Upon termination, your profile will be removed from the Platform. We will retain your account data in accordance with our Privacy Policy and applicable law.</p>

          <h3>23. Indemnity</h3>
          <p>23.1 You indemnify and hold harmless Compare Water Filters, its officers, employees, and agents from and against any claim, loss, damage, liability, cost, or expense (including legal fees) arising from:</p>
          <ol type="a">
            <li>your breach of these Terms;</li>
            <li>any act or omission in connection with your services to Customers;</li>
            <li>any claim by a Customer relating to work you have performed;</li>
            <li>any false or misleading information provided by you.</li>
          </ol>

          <h3>24. GST</h3>
          <p>24.1 Where applicable, lead fees are subject to GST. Tax invoices will be provided for all amounts charged.</p>
          <p>24.2 You are responsible for your own tax obligations in connection with revenue received through the Platform.</p>

          <hr />

          <p className="text-sm text-muted-foreground italic">These Terms and Conditions were last updated in April 2026. Compare Water Filters Pty Ltd reserves the right to update these Terms at any time. Vendors will be notified of material changes with at least 30 days notice.</p>
          <p className="text-sm text-muted-foreground italic">These Terms should be reviewed by a qualified Australian lawyer before being relied upon for legal purposes.</p>
        </article>
      </div>
    </>
  );
}
