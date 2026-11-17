import nodemailer from 'nodemailer';
import path from 'node:path';
import { getObjectBuffer } from './r2.ts';
import type { ContactMessage, QuoteRequest } from './types.ts';

const RECIPIENT_EMAIL = process.env.QUOTE_RECIPIENT_EMAIL || 'commercial4ever@gmail.com';

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  const port = Number(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendQuoteNotification(quote: QuoteRequest): Promise<{ sent: boolean; note: string }> {
  if (!isSmtpConfigured()) {
    return {
      sent: false,
      note: 'Service SMTP non configuré sur le serveur. Utilisez l\'envoi direct via votre messagerie.',
    };
  }

  try {
    const transporter = createTransporter();
    const linesText =
      quote.products.length > 0
        ? quote.products
            .map((p) => `- ${p.code || 'Sans réf.'} | ${p.name} | Quantité : ${p.quantity}`)
            .join('\n')
        : 'Aucun article du catalogue sélectionné.';

    const body = [
      `Nouvelle demande de devis — ${quote.reference}`,
      `Date : ${new Date(quote.createdAt).toLocaleString('fr-FR')}`,
      '',
      '--- COORDONNÉES ---',
      `Nom et prénom : ${quote.fullName}`,
      `Entreprise / Organisation : ${quote.company || 'Non précisé'}`,
      `E-mail : ${quote.email}`,
      `Téléphone / WhatsApp : ${quote.phone}`,
      '',
      '--- PROJET ---',
      `Service ou catégorie : ${quote.serviceOrCategory || 'Non précisé'}`,
      `Dimensions : ${quote.dimensions || 'Non précisées'}`,
      `Matière souhaitée : ${quote.desiredMaterial || 'Non précisée'}`,
      `Type de personnalisation : ${quote.customizationType || 'Non précisé'}`,
      `Date souhaitée : ${quote.desiredDate || 'Non précisée'}`,
      '',
      '--- ARTICLES SÉLECTIONNÉS ---',
      linesText,
      '',
      '--- DESCRIPTION DU PROJET ---',
      quote.description || 'Aucune description complémentaire.',
    ].join('\n');

    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (quote.attachmentKey) {
      const loaded = await getObjectBuffer(quote.attachmentKey, 'private', quote.attachmentDriver);
      if (loaded) {
        attachments.push({
          filename: quote.attachmentName || path.basename(quote.attachmentKey),
          content: loaded.buffer,
        });
      }
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: RECIPIENT_EMAIL,
      replyTo: quote.email,
      subject: `[4EVER Devis ${quote.reference}] ${quote.fullName}${quote.company ? ` — ${quote.company}` : ''}`,
      text: body,
      attachments,
    });

    return {
      sent: true,
      note: `Demande transmise par e-mail à ${RECIPIENT_EMAIL}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur SMTP inconnue';
    return {
      sent: false,
      note: `Échec d'envoi SMTP (${message}).`,
    };
  }
}

export async function sendContactNotification(contact: ContactMessage): Promise<{ sent: boolean; note: string }> {
  if (!isSmtpConfigured()) {
    return {
      sent: false,
      note: 'Service SMTP non configuré sur le serveur.',
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: RECIPIENT_EMAIL,
      replyTo: contact.email,
      subject: `[4EVER Contact] ${contact.subject || 'Nouveau message'} — ${contact.fullName}`,
      text: [
        `Nouveau message depuis le site 4EVER Madagascar`,
        `Nom : ${contact.fullName}`,
        `E-mail : ${contact.email}`,
        `Téléphone / WhatsApp : ${contact.phone || 'Non précisé'}`,
        '',
        contact.message,
      ].join('\n'),
    });
    return { sent: true, note: `Message transmis à ${RECIPIENT_EMAIL}.` };
  } catch (err) {
    return {
      sent: false,
      note: err instanceof Error ? err.message : 'Erreur SMTP inconnue.',
    };
  }
}
