import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Minus,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { SERVICES_LIST, type BootstrapData, type QuoteProductLine } from '../types.ts';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { useQuoteSelection } from '../context/QuoteSelectionContext.tsx';

interface QuotePageProps {
  data: BootstrapData;
}

interface QuoteSubmitResult {
  reference: string;
  emailSent: boolean;
  emailDeliveryNote: string;
  recipientEmail: string;
  mailtoHref: string;
}

export function QuotePage({ data }: QuotePageProps) {
  const [searchParams] = useSearchParams();
  const { items, updateQuantity, removeItem, addItem, clearSelection } = useQuoteSelection();

  const initialService = searchParams.get('service') || '';
  const initialProject = searchParams.get('projet') || '';

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceOrCategory, setServiceOrCategory] = useState(initialService);
  const [dimensions, setDimensions] = useState('');
  const [desiredMaterial, setDesiredMaterial] = useState('');
  const [customizationType, setCustomizationType] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [description, setDescription] = useState(
    initialProject ? `Projet inspiré de la réalisation : ${initialProject}\n` : '',
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const [manualCode, setManualCode] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuoteSubmitResult | null>(null);

  useEffect(() => {
    if (initialService) setServiceOrCategory(initialService);
  }, [initialService]);

  const serviceOptions = [
    ...SERVICES_LIST.map((s) => s.title),
    ...data.categories.map((c) => c.name),
  ];

  const handleAddManualLine = () => {
    if (!manualName.trim() && !manualCode.trim()) return;
    addItem(
      {
        code: manualCode.trim() || 'SUR-MESURE',
        name: manualName.trim() || `Article ${manualCode.trim()}`,
      },
      manualQty,
    );
    setManualCode('');
    setManualName('');
    setManualQty(1);
  };

  const buildMailtoLink = (
    ref: string,
    selectedLines: QuoteProductLine[],
  ): string => {
    const recipient = 'commercial4ever@gmail.com';
    const subject = `[4EVER Devis ${ref}] ${fullName}${company ? ` — ${company}` : ''}`;
    const linesText =
      selectedLines.length > 0
        ? selectedLines
            .map((p) => `- Réf. ${p.code} | ${p.name} | Quantité : ${p.quantity}`)
            .join('\n')
        : 'Aucun article spécifique sélectionné.';
    const body = [
      `Référence dossier : ${ref}`,
      '',
      'COORDONNÉES',
      `Nom et prénom : ${fullName}`,
      `Entreprise / Organisation : ${company || 'Non précisé'}`,
      `E-mail : ${email}`,
      `Téléphone / WhatsApp : ${phone}`,
      '',
      'PROJET',
      `Service ou catégorie : ${serviceOrCategory || 'Non précisé'}`,
      `Dimensions : ${dimensions || 'Non précisées'}`,
      `Matière souhaitée : ${desiredMaterial || 'Non précisée'}`,
      `Type de personnalisation : ${customizationType || 'Non précisé'}`,
      `Date souhaitée : ${desiredDate || 'Non précisée'}`,
      '',
      'PRODUITS SÉLECTIONNÉS',
      linesText,
      '',
      'DESCRIPTION DU PROJET',
      description || 'Aucune précision complémentaire.',
    ].join('\n');

    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Veuillez renseigner votre nom complet, adresse e-mail et téléphone / WhatsApp.');
      return;
    }

    if (attachment && attachment.size > 10 * 1024 * 1024) {
      setError('Le fichier joint dépasse la limite autorisée de 10 Mo.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('company', company.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('serviceOrCategory', serviceOrCategory);
      formData.append('products', JSON.stringify(items));
      formData.append('dimensions', dimensions.trim());
      formData.append('desiredMaterial', desiredMaterial.trim());
      formData.append('customizationType', customizationType.trim());
      formData.append('desiredDate', desiredDate);
      formData.append('description', description.trim());
      formData.append('website', honeypot);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        body: formData,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        reference?: string;
        emailSent?: boolean;
        emailDeliveryNote?: string;
        recipientEmail?: string;
      };

      if (!res.ok || !json.ok) {
        setError(json.error || 'Une erreur est survenue lors de l\'envoi de la demande.');
        return;
      }

      const reference = json.reference || 'DEV-4EVER';
      const mailtoHref = buildMailtoLink(reference, items);

      setResult({
        reference,
        emailSent: Boolean(json.emailSent),
        emailDeliveryNote: json.emailDeliveryNote || '',
        recipientEmail: json.recipientEmail || 'commercial4ever@gmail.com',
        mailtoHref,
      });

      if (json.emailSent) {
        clearSelection();
      }
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[75vh]">
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-white/10">
        <StudioBackdrop variant="emerald" showPattern />
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-24">
          <div className="max-w-3xl space-y-4">
            <p className="type-kicker text-[#ED6F2C]">
              Devis B2B &amp; sur mesure
            </p>
            <h1 className="type-hero text-white">
              Demander un devis
            </h1>
            <p className="type-intro text-[#E4DDD2]/85 max-w-2xl">
              Décrivez votre projet ou validez votre sélection d&apos;articles. Aucune création de compte n&apos;est requise.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-[1120px] mx-auto px-5 sm:px-8 lg:px-10 py-14 lg:py-20">
        {result ? (
          <div className="bg-[#E4DDD2]/30 rounded-2xl border border-[#073D37]/12 p-8 sm:p-10 space-y-6">
            {result.emailSent ? (
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 shrink-0" />
                <div>
                  <h2 className="font-display font-bold text-2xl text-[#073D37]">
                    Votre demande de devis a bien été transmise
                  </h2>
                  <p className="text-sm text-[#172824]/80 mt-2 leading-relaxed">
                    Référence de suivi :{' '}
                    <span className="font-display tabular-nums font-semibold text-[#073D37]">{result.reference}</span>.
                    Votre dossier complet a été envoyé par e-mail à{' '}
                    <span className="font-semibold">{result.recipientEmail}</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-[#ED6F2C] shrink-0" />
                  <div>
                    <h2 className="font-display font-bold text-2xl text-[#073D37]">
                      Dossier enregistré ({result.reference}) — Finalisez l&apos;envoi par e-mail
                    </h2>
                    <p className="text-sm text-[#172824]/80 mt-2 leading-relaxed">
                      Votre demande a été enregistrée dans notre système d&apos;administration, mais l&apos;envoi automatique SMTP n&apos;est pas encore actif sur le serveur ({result.emailDeliveryNote}). Cliquez ci-dessous pour transmettre immédiatement le message prérempli vers{' '}
                      <span className="font-semibold">{result.recipientEmail}</span> depuis votre messagerie.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href={result.mailtoHref}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Envoyer via ma messagerie ({result.recipientEmail})</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      clearSelection();
                      setResult(null);
                    }}
                    className="px-5 py-3 rounded-md border border-[#073D37]/20 text-sm font-medium text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Nouvelle demande
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#073D37]/10 flex flex-wrap gap-4 text-sm">
              <Link to="/catalogue" className="font-semibold text-[#073D37] hover:text-[#ED6F2C]">
                Retour au catalogue
              </Link>
              <Link to="/" className="text-[#172824]/70 hover:text-[#073D37]">
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Antispam honeypot */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website-field">Site web</label>
              <input
                id="website-field"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {error && (
              <div
                className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Coordonnées */}
            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8 space-y-6">
              <h2 className="font-display font-bold text-xl text-[#073D37] border-b border-[#073D37]/10 pb-3">
                1. Vos coordonnées
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="quote-name" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Nom et prénom *
                  </label>
                  <input
                    id="quote-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex. : Rakoto Jean"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>
                <div>
                  <label htmlFor="quote-company" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Entreprise ou organisation (facultatif)
                  </label>
                  <input
                    id="quote-company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Raison sociale ou association"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>
                <div>
                  <label htmlFor="quote-email" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Adresse e-mail *
                  </label>
                  <input
                    id="quote-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@entreprise.mg"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>
                <div>
                  <label htmlFor="quote-phone" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Numéro de téléphone / WhatsApp *
                  </label>
                  <input
                    id="quote-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex. : 038 32 664 11"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>
              </div>
            </div>

            {/* Produits sélectionnés */}
            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#073D37]/10 pb-3">
                <h2 className="font-display font-bold text-xl text-[#073D37]">
                  2. Produits sélectionnés ({items.length})
                </h2>
                <Link
                  to="/catalogue"
                  className="text-xs font-semibold text-[#ED6F2C] hover:underline"
                >
                  + Ajouter depuis le catalogue
                </Link>
              </div>

              {items.length > 0 ? (
                <div className="divide-y divide-[#073D37]/10">
                  {items.map((item) => (
                    <div
                      key={`${item.code}-${item.name}`}
                      className="py-3 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-display tabular-nums text-xs font-semibold text-[#073D37]/70">
                          Réf. {item.code}
                        </span>
                        <p className="font-display font-semibold text-sm text-[#073D37]">
                          {item.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center border border-[#073D37]/20 rounded-md">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.code, item.name, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.code, item.name, Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-14 h-8 text-center font-display tabular-nums text-xs font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.code, item.name, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.code, item.name)}
                          className="p-2 text-[#172824]/50 hover:text-red-700 cursor-pointer"
                          aria-label={`Supprimer ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#172824]/70">
                  Aucun article du catalogue n&apos;est encore sélectionné. Vous pouvez ajouter une référence manuellement ci-dessous ou décrire directement votre projet sur mesure.
                </p>
              )}

              {/* Add manual reference */}
              <div className="pt-4 border-t border-[#073D37]/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-[#073D37]/75 mb-1">
                    Référence (catalogue PDF)
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ex. : 4E-104"
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs font-display"
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-[#073D37]/75 mb-1">
                    Nom de l&apos;article ou objet souhaité
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Ex. : Coffret cadeau bois gravé"
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#073D37]/75 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualQty}
                    onChange={(e) => setManualQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs font-display tabular-nums"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddManualLine}
                    className="w-full py-2 px-3 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] transition-colors cursor-pointer"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Détails du projet */}
            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8 space-y-5">
              <h2 className="font-display font-bold text-xl text-[#073D37] border-b border-[#073D37]/10 pb-3">
                3. Détails techniques du projet
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="quote-service" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Service ou catégorie souhaité
                  </label>
                  <select
                    id="quote-service"
                    value={serviceOrCategory}
                    onChange={(e) => setServiceOrCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  >
                    <option value="">Sélectionner un service ou une catégorie</option>
                    {serviceOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="Projet mixte / Sur mesure">Projet mixte / Sur mesure</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="quote-dimensions" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Dimensions (si applicables)
                  </label>
                  <input
                    id="quote-dimensions"
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="Ex. : 30 × 20 × 10 cm, A4, XL..."
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>

                <div>
                  <label htmlFor="quote-material" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Matière souhaitée
                  </label>
                  <input
                    id="quote-material"
                    type="text"
                    value={desiredMaterial}
                    onChange={(e) => setDesiredMaterial(e.target.value)}
                    placeholder="Ex. : Bois massif, acrylique, coton, inox, carton rigide..."
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>

                <div>
                  <label htmlFor="quote-custom" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Type de personnalisation
                  </label>
                  <input
                    id="quote-custom"
                    type="text"
                    value={customizationType}
                    onChange={(e) => setCustomizationType(e.target.value)}
                    placeholder="Ex. : Gravure laser, UV-DTF, DTF textile, broderie, sublimation..."
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>

                <div>
                  <label htmlFor="quote-date" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Date souhaitée
                  </label>
                  <input
                    id="quote-date"
                    type="date"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>

                <div>
                  <label htmlFor="quote-file" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                    Joindre un logo, visuel ou document (max. 10 Mo)
                  </label>
                  <label
                    htmlFor="quote-file"
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-md border border-dashed border-[#073D37]/30 bg-[#FAF8F5] text-xs text-[#073D37] cursor-pointer hover:border-[#ED6F2C]"
                  >
                    <Upload className="w-4 h-4 text-[#ED6F2C] shrink-0" />
                    <span className="truncate">
                      {attachment ? attachment.name : 'PDF, PNG, JPG, SVG, AI, EPS ou ZIP'}
                    </span>
                  </label>
                  <input
                    id="quote-file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.svg,.ai,.eps,.zip"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="quote-desc" className="block text-xs font-semibold text-[#073D37] mb-1.5">
                  Description du projet
                </label>
                <textarea
                  id="quote-desc"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Précisez vos contraintes, usages, couleurs, finitions souhaitées ou questions..."
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-[#172824]/65">
                  Destinataire : commercial4ever@gmail.com · Réponse sous étude technique
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-7 py-3.5 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
