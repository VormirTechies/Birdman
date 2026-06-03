import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Img,
  Link,
} from "@react-email/components";

interface VipWelcomeProps {
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  bookingId: string;
  totalVisits: number; // Lifetime visit count (including this one)
  manageUrl?: string;
}

export default function VipWelcome({
  visitorName,
  bookingDate,
  bookingTime,
  adults,
  children,
  bookingId,
  totalVisits = 2,
  manageUrl,
}: VipWelcomeProps) {
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* VIP Gold Banner */}
          <Section style={styles.vipBanner}>
            <Text style={styles.vipBannerText}>★ &nbsp;VIP VISITOR &nbsp;★</Text>
          </Section>

          {/* Hero Image */}
          <Img
            src="https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/009.jpeg"
            alt="Parakeets at Birdman of Chennai"
            width="540"
            height="300"
            style={styles.heroImage}
          />

          {/* Icon */}
          <div style={styles.iconWrapper}>
            <div style={styles.icon}>
              <Img
                src="https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/icon-192.png"
                alt="Birdman of Chennai Icon"
                width="52"
                height="52"
                style={{ borderRadius: "4px" }}
              />
            </div>
          </div>

          {/* Heading */}
          <Heading style={styles.heading}>Welcome Back!</Heading>

          {/* Greeting */}
          <Text style={styles.greeting}>Dear {visitorName},</Text>

          {/* VIP Message */}
          <Text style={styles.text}>
            This is your{" "}
            <strong style={{ color: "#FF8C00" }}>{ordinal(totalVisits)} visit</strong>{" "}
            to Birdman of Chennai — and we couldn&apos;t be more delighted to
            welcome you back. Your continued support and love for our feathered
            family means the world to us.
          </Text>

          <Text style={styles.text}>
            As a cherished VIP guest, you have a special place in the hearts of
            Mr. Sudarson Sah and the 6,000 parakeets who await your return.
            Your booking is confirmed and we look forward to sharing this
            magical moment with you once again.
          </Text>

          {/* Booking Details Box */}
          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Your Booking</Text>

            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td width="50%" style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(bookingDate)}</Text>

                  <Text style={styles.detailLabel}>Guests</Text>
                  <Text style={styles.detailValue}>
                    {adults} Adult{adults !== 1 ? "s" : ""}
                    {children > 0
                      ? `, ${children} Child${children !== 1 ? "ren" : ""}`
                      : ""}
                  </Text>
                </td>
                <td width="50%" style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{formatTime(bookingTime)}</Text>

                  <Text style={styles.detailLabel}>Booking ID</Text>
                  <Text style={styles.detailValue}>{bookingId.toUpperCase()}</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Visit Count Badge */}
          <Section style={styles.visitBadge}>
            <Text style={styles.visitBadgeText}>
              🏆 &nbsp;{ordinal(totalVisits)} Visit to the Flock
            </Text>
          </Section>

          {/* Reminders */}
          <Section style={styles.sidebarSection}>
            <Text style={styles.sectionHeading}>A Few Reminders</Text>
            <ul style={styles.list}>
              <li style={styles.listItem}>Arrive 10 minutes before your scheduled time</li>
              <li style={styles.listItem}>The feeding session lasts approximately 30 minutes</li>
              <li style={styles.listItem}>Please maintain silence to avoid startling the birds</li>
              <li style={styles.listItem}>Photography is welcome — you know the drill!</li>
            </ul>
          </Section>

          {/* Contact Information */}
          <Section style={styles.contactSection}>
            <table width="100%" cellPadding="8" cellSpacing="0">
              <tr>
                <td style={styles.contactItem}>
                  <span style={styles.contactIcon}>
                    <svg fill="green" width="20px" height="20px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.114-0.011c-6.559 0-12.114 5.587-12.114 12.204 0 6.93 6.439 14.017 10.77 18.998 0.017 0.020 0.717 0.797 1.579 0.797h0.076c0.863 0 1.558-0.777 1.575-0.797 4.064-4.672 10-12.377 10-18.998 0-6.618-4.333-12.204-11.886-12.204zM16.515 29.849c-0.035 0.035-0.086 0.074-0.131 0.107-0.046-0.032-0.096-0.072-0.133-0.107l-0.523-0.602c-4.106-4.71-9.729-11.161-9.729-17.055 0-5.532 4.632-10.205 10.114-10.205 6.829 0 9.886 5.125 9.886 10.205 0 4.474-3.192 10.416-9.485 17.657zM16.035 6.044c-3.313 0-6 2.686-6 6s2.687 6 6 6 6-2.687 6-6-2.686-6-6-6zM16.035 16.044c-2.206 0-4.046-1.838-4.046-4.044s1.794-4 4-4c2.207 0 4 1.794 4 4 0.001 2.206-1.747 4.044-3.954 4.044z" />
                    </svg>
                  </span>
                  <Text style={styles.contactText}>
                    Birdman of Chennai 2, Iyya Mudali St, Adikesavarpuram,
                    Chintadripet, Chennai, Tamil Nadu 600002
                  </Text>
                </td>
              </tr>
              <tr>
                <td style={styles.contactItem}>
                  <span style={styles.contactIcon}>
                    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5562 12.9062L16.1007 13.359C16.1007 13.359 15.0181 14.4355 12.0631 11.4972C9.10812 8.55901 10.1907 7.48257 10.1907 7.48257L10.4775 7.19738C11.1841 6.49484 11.2507 5.36691 10.6342 4.54348L9.37326 2.85908C8.61028 1.83992 7.13596 1.70529 6.26145 2.57483L4.69185 4.13552C4.25823 4.56668 3.96765 5.12559 4.00289 5.74561C4.09304 7.33182 4.81071 10.7447 8.81536 14.7266C13.0621 18.9492 17.0468 19.117 18.6763 18.9651C19.1917 18.9171 19.6399 18.6546 20.0011 18.2954L21.4217 16.883C22.3806 15.9295 22.1102 14.2949 20.8833 13.628L18.9728 12.5894C18.1672 12.1515 17.1858 12.2801 16.5562 12.9062Z" fill="green" />
                    </svg>
                  </span>
                  <Text style={styles.contactText}>+91 98765 43210</Text>
                </td>
              </tr>
              <tr>
                <td style={styles.contactItem}>
                  <span style={styles.contactIcon}>
                    <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <g id="Complete">
                        <g id="mail">
                          <g>
                            <polyline fill="none" points="4 8.2 12 14.1 20 8.2" stroke="green" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <rect fill="none" height="14" rx="2" ry="2" stroke="green" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="6.5" />
                          </g>
                        </g>
                      </g>
                    </svg>
                  </span>
                  <Text style={styles.contactText}>visits@birdmanofchennai.com</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* CTA */}
          <Section style={styles.buttonContainer}>
            {manageUrl && (
              <Link href={manageUrl} style={styles.primaryButton}>
                Manage Booking
              </Link>
            )}
            <Link href="https://maps.app.goo.gl/G76qA7qZAJ3g44Pu9" style={styles.secondaryButton}>
              View on Google Maps
            </Link>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.brandName}>Birdman of Chennai</Text>
            <Text style={styles.copyright}>
              © {new Date().getFullYear()} Birdman of Chennai. All rights reserved.
            </Text>
            <Text style={styles.footerAddress}>
              2, Iyya Mudali St, Chintadripet, Chennai 600002
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 || 12;
  return `${display}:${minutes} ${ampm}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: '#F5F0E8',
    fontFamily: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    margin: 0,
    padding: '20px 0',
  } as React.CSSProperties,
  container: {
    maxWidth: '540px',
    margin: '0 auto',
    backgroundColor: '#FEFDF5',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  vipBanner: {
    backgroundColor: '#FF8C00',
    padding: '10px 0',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  vipBannerText: {
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '3px',
    margin: 0,
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  heroImage: {
    width: '100%',
    display: 'block',
    objectFit: 'cover' as const,
  } as React.CSSProperties,
  iconWrapper: {
    textAlign: 'center' as const,
    marginTop: '-28px',
    position: 'relative' as const,
    zIndex: 1,
  } as React.CSSProperties,
  icon: {
    display: 'inline-block',
    backgroundColor: '#FEFDF5',
    borderRadius: '50%',
    padding: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  } as React.CSSProperties,
  heading: {
    color: '#FF8C00',
    fontSize: '26px',
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '16px 24px 4px',
    letterSpacing: '-0.5px',
  } as React.CSSProperties,
  greeting: {
    color: '#212121',
    fontSize: '16px',
    fontWeight: '600',
    margin: '16px 24px 0',
  } as React.CSSProperties,
  text: {
    color: '#3D3D3D',
    fontSize: '15px',
    lineHeight: '1.7',
    margin: '12px 24px',
  } as React.CSSProperties,
  detailsBox: {
    backgroundColor: '#FFF8EC',
    border: '1px solid #FF8C00',
    borderRadius: '4px',
    margin: '20px 24px',
    padding: '16px 20px',
  } as React.CSSProperties,
  detailsHeading: {
    color: '#FF8C00',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 12px 0',
  } as React.CSSProperties,
  detailColumn: {
    verticalAlign: 'top',
    paddingRight: '12px',
  } as React.CSSProperties,
  detailLabel: {
    color: '#888888',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    margin: '0 0 2px 0',
  } as React.CSSProperties,
  detailValue: {
    color: '#212121',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  } as React.CSSProperties,
  visitBadge: {
    backgroundColor: '#FFF8EC',
    border: '1px solid #FF8C00',
    borderRadius: '4px',
    margin: '0 24px 20px',
    padding: '12px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  visitBadgeText: {
    color: '#FF8C00',
    fontSize: '15px',
    fontWeight: '700',
    margin: 0,
  } as React.CSSProperties,
  sidebarSection: {
    margin: '0 24px 16px',
  } as React.CSSProperties,
  sectionHeading: {
    color: '#2E7D32',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px 0',
    borderBottom: '1px solid #E8E0D0',
    paddingBottom: '6px',
  } as React.CSSProperties,
  list: {
    margin: '0',
    paddingLeft: '20px',
    color: '#3D3D3D',
  } as React.CSSProperties,
  listItem: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#3D3D3D',
    marginBottom: '4px',
  } as React.CSSProperties,
  contactSection: {
    backgroundColor: '#F5F0E8',
    margin: '16px 0',
    padding: '12px 24px',
    borderTop: '1px solid #E8E0D0',
    borderBottom: '1px solid #E8E0D0',
  } as React.CSSProperties,
  contactItem: {
    verticalAlign: 'middle',
    paddingBottom: '8px',
  } as React.CSSProperties,
  contactIcon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: '8px',
  } as React.CSSProperties,
  contactText: {
    display: 'inline',
    fontSize: '13px',
    color: '#3D3D3D',
    verticalAlign: 'middle',
    margin: 0,
  } as React.CSSProperties,
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '20px 24px',
  } as React.CSSProperties,
  primaryButton: {
    display: 'inline-block',
    backgroundColor: '#00A36C',
    color: '#FFFFFF',
    padding: '12px 20px',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    margin: '8px',
  } as React.CSSProperties,
  secondaryButton: {
    display: 'inline-block',
    backgroundColor: 'transparent',
    color: '#2E7D32',
    border: '1.5px solid #2E7D32',
    borderRadius: '4px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  } as React.CSSProperties,
  footer: {
    backgroundColor: '#2E7D32',
    padding: '20px 24px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  brandName: {
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  copyright: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '12px',
    margin: '0 0 4px 0',
  } as React.CSSProperties,
  footerAddress: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    margin: 0,
  } as React.CSSProperties,
};
