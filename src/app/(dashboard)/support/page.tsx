'use client';

import { useState } from 'react';
import {
  Search,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  CreditCard,
  Shield,
  HelpCircle,
  Send,
  ChevronDown,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const faqs = [
  {
    question: 'How do I add money to my wallet?',
    answer:
      'You can add money via bank transfer, debit card, or by linking your bank account. Go to Dashboard and click "Add money" to get started.',
  },
  {
    question: 'What are the transaction limits?',
    answer:
      'Daily limits are ₦50,000 for virtual cards and ₦75,000 for physical cards. Monthly limits are ₦500,000 and ₦750,000 respectively. You can request higher limits from Settings.',
  },
  {
    question: 'How long do transfers take?',
    answer:
      'Wallet-to-wallet transfers are instant. Bank transfers typically take 1-2 business days. International transfers may take 3-5 business days depending on the destination.',
  },
  {
    question: 'How do I freeze my card?',
    answer:
      'Go to Cards, select the card you want to freeze, and click "Freeze card" in the Quick controls section. You can unfreeze it anytime from the same location.',
  },
  {
    question: 'What should I do if I suspect fraud?',
    answer:
      'Immediately freeze your card from the Cards page, then contact our support team. We recommend enabling 2FA and changing your password if you suspect unauthorized access.',
  },
  {
    question: 'How do I export my transaction history?',
    answer:
      'Go to the Transactions page and click "Export CSV" in the top right. You can filter transactions before exporting to get specific date ranges or categories.',
  },
];

export default function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const query = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-normal text-gray-800">Support</h1>
        <p className="text-xs text-muted-foreground">
          Get help and browse resources.
        </p>
      </div>

      {/* Search Help Center */}
      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-normal text-gray-700">
            Search help center
          </h2>
          <p className="text-xs text-muted-foreground">
            Find answers to common questions
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for help articles, guides, FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border/40 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* FAQs with Dropdowns */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Frequently asked questions
              </h2>
              <p className="text-xs text-muted-foreground">
                Quick answers to common queries
              </p>
            </div>

            <div className="space-y-2">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-lg border border-border/40"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
                    >
                      <span className="text-sm font-normal text-gray-700">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
                          openFaqIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaqIndex === index && (
                      <div className="border-t border-border/40 bg-muted/20 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No results found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Contact support
              </h2>
              <p className="text-xs text-muted-foreground">
                Send us a message and we&apos;ll respond within 24 hours
              </p>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Category
                </label>
                <select className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20">
                  <option>Select a category</option>
                  <option>Account & Profile</option>
                  <option>Cards & Payments</option>
                  <option>Transactions</option>
                  <option>Security & Privacy</option>
                  <option>Technical Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Please describe your issue in detail..."
                  className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                Send message
              </button>
            </form>
          </div>

          {/* Help Center Categories */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Browse by category
              </h2>
              <p className="text-xs text-muted-foreground">
                Explore help articles and guides
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: FileText, label: 'Getting Started', articles: 12 },
                { icon: CreditCard, label: 'Cards & Payments', articles: 18 },
                { icon: Shield, label: 'Security', articles: 8 },
                { icon: HelpCircle, label: 'Account Help', articles: 15 },
              ].map((category, idx) => {
                const Icon = category.icon;
                return (
                  <button
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-border/40 p-4 text-left transition-colors hover:bg-muted/30"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-normal text-gray-700">
                        {category.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.articles} articles
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Contact */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Quick contact
              </h2>
              <p className="text-xs text-muted-foreground">
                Reach out directly
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="mailto:support@allprowallet.com"
                className="flex items-center gap-3 rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/30"
              >
                <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-sm font-normal text-gray-700">Email</div>
                  <div className="text-xs text-muted-foreground">
                    support@allprowallet.com
                  </div>
                </div>
              </a>

              <a
                href="tel:+2348034567890"
                className="flex items-center gap-3 rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/30"
              >
                <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-sm font-normal text-gray-700">Phone</div>
                  <div className="text-xs text-muted-foreground">
                    +234 803 456 7890
                  </div>
                </div>
              </a>

              <button className="flex w-full items-center gap-3 rounded-lg border border-border/40 p-3 text-left transition-colors hover:bg-muted/30">
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-sm font-normal text-gray-700">
                    Live chat
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Available 9AM - 6PM WAT
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Support Tickets */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Your tickets
                </h2>
                <p className="text-xs text-muted-foreground">
                  Track support requests
                </p>
              </div>
              <button className="text-xs font-medium text-primary hover:text-primary/80">
                View all
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: '#T-1234',
                  subject: 'Card not working',
                  status: 'open',
                  updated: '2 hours ago',
                },
                {
                  id: '#T-1189',
                  subject: 'Transaction inquiry',
                  status: 'resolved',
                  updated: '3 days ago',
                },
              ].map((ticket, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/40 p-3"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-normal text-gray-700">
                        {ticket.subject}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {ticket.id}
                      </div>
                    </div>
                    {ticket.status === 'open' ? (
                      <Clock className="h-4 w-4 text-orange-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        ticket.status === 'open'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {ticket.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ticket.updated}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
