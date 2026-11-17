import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import type { SiteSettings } from '../types.ts';
import { ShowroomMap } from '../components/ShowroomMap.tsx';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { SocialLinks } from '../components/SocialLinks.tsx';

interface ContactPageProps {
  settings: SiteSettings;
}

export function ContactPage({ settings }: ContactPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<{
    sent: boolean;
    note: string;
    mailtoHref: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setError('Veuillez renseigner votre nom, adresse e-mail et message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          subject,
          message,
          website: honeypot,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        emailSent?: boolean;
        note?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error || 'Erreur lors de l\'envoi du message.');
        return;
      }

      const mailtoHref = `mailto:commercial4ever@gmail.com?subject=${encodeURIComponent(
        `[4EVER Contact] ${subject || 'Message site web'} — ${fullName}`,
      )}&body=${encodeURIComponent(
        `Nom : ${fullName}\nE-mail : ${email}\nTéléphone : ${phone || 'Non précisé'}\n\n${message}`,
      )}`;

      setStatus({
        sent: Boolean(json.emailSent),
        note: json.note || '',
        mailtoHref,
      });

      if (json.emailSent) {
        setFullName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-white/10">
        <StudioBackdrop variant="emerald" showPattern />
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24">
          <div className="max-w-3xl space-y-4">
            <p className="type-kicker text-[#ED6F2C]">
              Contact &amp; Showroom
            </p>
            <h1 className="type-hero text-white">
              4EVER Madagascar
            </h1>
            <p className="type-intro text-[#E4DDD2]/85 max-w-2xl">
              Échangez directement avec notre équipe ou rendez-nous visite au showroom d&apos;Ampandrana à Antananarivo.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Official Coordinates & Direct Action Buttons */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#073D37]/12 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="type-h3 text-[#073D37]">
                  Coordonnées officielles
                </h2>
                <p className="text-xs text-[#172824]/65 mt-1">
                  4EVER Madagascar · modern handcraft
                </p>
              </div>

              <div className="space-y-4 text-sm text-[#172824]/85">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#ED6F2C] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-semibold text-[#073D37]">Adresse</p>
                    <p>Showroom 4EVER — Ampandrana, Antananarivo, Madagascar</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#ED6F2C] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-semibold text-[#073D37]">Téléphone / WhatsApp</p>
                    <p className="tabular-nums font-medium">038 32 664 11</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#ED6F2C] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-semibold text-[#073D37]">E-mail</p>
                    <p className="break-all">commercial4ever@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#073D37]/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="tel:+261383266411"
                  className="font-display inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] transition-colors whitespace-nowrap"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appeler</span>
                </a>

                <a
                  href="https://wa.me/261383266411"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href="mailto:commercial4ever@gmail.com"
                  className="font-display inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#073D37]/25 text-[#073D37] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" />
                  <span>E-mail</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#073D37]/10 space-y-2.5">
                <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[#073D37]">
                  Réseaux sociaux officiels
                </p>
                <SocialLinks
                  socialLinks={settings.socialLinks}
                  tone="dark"
                  size="sm"
                  showLabels
                />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8">
              <h2 className="font-display font-bold text-xl text-[#073D37] mb-5">
                Envoyer un message
              </h2>

              {status ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#073D37]/15 flex items-start gap-3">
                    {status.sent ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#ED6F2C] shrink-0 mt-0.5" />
                    )}
                    <div className="text-sm text-[#172824]/85">
                      <p className="font-semibold text-[#073D37]">
                        {status.sent
                          ? 'Message transmis avec succès à commercial4ever@gmail.com.'
                          : 'Message enregistré — finalisez l\'envoi via votre messagerie'}
                      </p>
                      {!status.sent && (
                        <p className="text-xs mt-1 text-[#172824]/70">{status.note}</p>
                      )}
                    </div>
                  </div>
                  {!status.sent && (
                    <a
                      href={status.mailtoHref}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f]"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Ouvrir dans ma messagerie</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setStatus(null)}
                    className="block text-xs font-semibold text-[#073D37] underline cursor-pointer"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      tabIndex={-1}
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="c-name" className="block text-xs font-semibold text-[#073D37] mb-1">
                        Nom et prénom *
                      </label>
                      <input
                        id="c-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-email" className="block text-xs font-semibold text-[#073D37] mb-1">
                        Adresse e-mail *
                      </label>
                      <input
                        id="c-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="c-phone" className="block text-xs font-semibold text-[#073D37] mb-1">
                        Téléphone / WhatsApp
                      </label>
                      <input
                        id="c-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-subject" className="block text-xs font-semibold text-[#073D37] mb-1">
                        Objet
                      </label>
                      <input
                        id="c-subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Renseignement, rendez-vous showroom..."
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-message" className="block text-xs font-semibold text-[#073D37] mb-1">
                      Message *
                    </label>
                    <textarea
                      id="c-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submitting ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Google Maps Showroom Section */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-2xl text-[#073D37]">
            Localisation du Showroom 4EVER
          </h2>
          <ShowroomMap />
        </div>
      </section>
    </div>
  );
}
