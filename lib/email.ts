import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NewsletterEmailData {
  to: string;
  name: string;
  subject: string;
  content: string;
  images?: string[];
}

export async function sendNewsletterEmail(data: NewsletterEmailData) {
  try {
    const htmlContent = generateNewsletterHTML(data);

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Burton Latimer Community <newsletter@burtonlatimer.com>',
      to: data.to,
      subject: data.subject,
      html: htmlContent,
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendBulkNewsletterEmails(
  recipients: { email: string; name: string }[],
  subject: string,
  content: string,
  images: string[] = []
) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Send emails in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const promises = batch.map(async (recipient) => {
      const result = await sendNewsletterEmail({
        to: recipient.email,
        name: recipient.name,
        subject,
        content,
        images,
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${recipient.email}: ${result.error}`);
      }
    });

    await Promise.all(promises);
    
    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

function generateNewsletterHTML(data: NewsletterEmailData): string {
  const { name, content, images = [] } = data;

  // Convert markdown-style formatting to HTML
  const htmlContent = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\*(.+?)\*/g, '<em>$1</em>') // *italic*
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #D4AF37;">$1</a>') // [text](url)
    .replace(/^# (.+)$/gm, '<h2 style="color: #000000; font-size: 24px; margin: 20px 0 10px;">$1</h2>') // # Heading
    .replace(/^## (.+)$/gm, '<h3 style="color: #000000; font-size: 20px; margin: 15px 0 8px;">$1</h3>') // ## Heading
    .replace(/\n\n/g, '</p><p style="margin: 10px 0; line-height: 1.6;">') // Paragraphs
    .replace(/\n/g, '<br>'); // Line breaks

  const imagesHTML = images.length > 0
    ? `
      <div style="margin: 20px 0;">
        ${images.map(img => `
          <img src="${img}" alt="Newsletter image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />
        `).join('')}
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: bold;">
                    Burton Latimer Community
                  </h1>
                  <p style="margin: 10px 0 0; color: #ffffff; font-size: 14px;">
                    Your Community Newsletter
                  </p>
                </td>
              </tr>
              
              <!-- Greeting -->
              <tr>
                <td style="padding: 30px 40px 20px;">
                  <p style="margin: 0; font-size: 16px; color: #333333;">
                    Hello ${name},
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <div style="color: #333333; font-size: 15px; line-height: 1.6;">
                    <p style="margin: 10px 0; line-height: 1.6;">
                      ${htmlContent}
                    </p>
                  </div>
                  ${imagesHTML}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-align: center;">
                    Burton Latimer Community Platform
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                    You're receiving this because you opted in to receive community updates.
                  </p>
                  <p style="margin: 10px 0 0; font-size: 12px; color: #999999; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://burtonlatimer.com'}/profile" style="color: #D4AF37; text-decoration: none;">
                      Manage your preferences
                    </a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Test email function
export async function sendTestEmail(to: string) {
  return sendNewsletterEmail({
    to,
    name: 'Test User',
    subject: 'Test Email - Burton Latimer Community',
    content: 'This is a test email to verify your email configuration is working correctly.\n\n**Bold text** and *italic text* work!\n\n# This is a heading\n\nLinks work too: [Visit our site](https://burtonlatimer.com)',
    images: [],
  });
}
