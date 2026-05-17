/**
 * Booking Cancellation Email Template
 * Sent to visitors when admin blocks dates via settings page
 */

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
} from '@react-email/components';

interface BookingCancellationProps {
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  numberOfGuests?: number; // Deprecated
  bookingId: string;
}

export default function BookingCancellation({
  visitorName,
  bookingDate,
  bookingTime,
  bookingId,
}: BookingCancellationProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://birdmanofchennai.com";

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Hero Image */}
          <Img
            src={`https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/009.jpeg`}
            alt="Parakeets at Birdman of Chennai"
            width="540"
            height="300"
            style={styles.heroImage}
          />

          {/* Calendar X Icon */}
          <div style={styles.iconWrapper}>
            <div style={styles.cancelIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="#6B7280"
                  strokeWidth="2"
                />
                <path
                  d="M8 2V6M16 2V6"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 10H21"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M9 14L15 20M15 14L9 20"
                  stroke="#DC2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <Heading style={styles.heading}>Booking Cancelled</Heading>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Notice of cancellation for your upcoming visit.
          </Text>

          {/* Greeting */}
          <Text style={styles.greeting}>Dear {visitorName},</Text>

          {/* Message */}
          <Text style={styles.text}>
            We regret to inform you that your booking has been cancelled. We
            understand this might be disappointing, but we hope to welcome you
            another time to witness the rhythm of urban nature.
          </Text>

          {/* Cancelled Details Box */}
          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>CANCELLED DETAILS</Text>

            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={styles.detailRow}>
                  <div style={styles.detailIcon}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 2V6M16 2V6"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M3 10H21"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Original Date</Text>
                    <Text style={styles.detailValue}>{formatDate(bookingDate)}</Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.detailRow}>
                  <div style={styles.detailIcon}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 6V12L16 14"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Original Time</Text>
                    <Text style={styles.detailValue}>{formatTime(bookingTime)}</Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.detailRow}>
                  <div style={styles.detailIcon}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 17L17 7M7 7L7 17L17 17"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Booking ID</Text>
                    <Text style={styles.detailValue}>{bookingId.toUpperCase()}</Text>
                  </div>
                </td>
              </tr>
            </table>
          </Section>

          {/* Rebook Message */}
          <Text style={styles.rebookText}>
            We&apos;d love to welcome you another time. Please feel free to book a new
            time slot when you are ready.
          </Text>

          {/* CTA Button */}
          <Section style={styles.buttonContainer}>
            <Link
              href={`${baseUrl}/book`}
              style={styles.primaryButton}
            >
              Book New Visit
            </Link>
          </Section>

          {/* Contact Information */}
          <Section style={styles.contactSection}>
            <table width="100%" cellPadding="8" cellSpacing="0">
              <tr>
                <td style={styles.contactItem}>
                  <span style={styles.contactIcon}>
                    <svg
                      fill="#00A36C"
                      width="20px"
                      height="20px"
                      viewBox="0 0 32 32"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M16.114-0.011c-6.559 0-12.114 5.587-12.114 12.204 0 6.93 6.439 14.017 10.77 18.998 0.017 0.020 0.717 0.797 1.579 0.797h0.076c0.863 0 1.558-0.777 1.575-0.797 4.064-4.672 10-12.377 10-18.998 0-6.618-4.333-12.204-11.886-12.204zM16.515 29.849c-0.035 0.035-0.086 0.074-0.131 0.107-0.046-0.032-0.096-0.072-0.133-0.107l-0.523-0.602c-4.106-4.71-9.729-11.161-9.729-17.055 0-5.532 4.632-10.205 10.114-10.205 6.829 0 9.886 5.125 9.886 10.205 0 4.474-3.192 10.416-9.485 17.657zM16.035 6.044c-3.313 0-6 2.686-6 6s2.687 6 6 6 6-2.687 6-6-2.686-6-6-6zM16.035 16.044c-2.206 0-4.046-1.838-4.046-4.044s1.794-4 4-4c2.207 0 4 1.794 4 4 0.001 2.206-1.747 4.044-3.954 4.044z"></path>
                    </svg>
                  </span>
                  <Text style={styles.contactText}>
                    Birdman of Chennai, 2 Iyya Mudali St, Adikesavarpuram,
                    Chintadripet, Chennai, Tamil Nadu 600002
                  </Text>
                </td>
              </tr>
              <tr>
                <td style={styles.contactItem}>
                  <span style={styles.contactIcon}>
                    <svg
                      width="20px"
                      height="20px"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.5562 12.9062L16.1007 13.359C16.1007 13.359 15.0181 14.4355 12.0631 11.4972C9.10812 8.55901 10.1907 7.48257 10.1907 7.48257L10.4775 7.19738C11.1841 6.49484 11.2507 5.36691 10.6342 4.54348L9.37326 2.85908C8.61028 1.83992 7.13596 1.70529 6.26145 2.57483L4.69185 4.13552C4.25823 4.56668 3.96765 5.12559 4.00289 5.74561C4.09304 7.33182 4.81071 10.7447 8.81536 14.7266C13.0621 18.9492 17.0468 19.117 18.6763 18.9651C19.1917 18.9171 19.6399 18.6546 20.0011 18.2954L21.4217 16.883C22.3806 15.9295 22.1102 14.2949 20.8833 13.628L18.9728 12.5894C18.1672 12.1515 17.1858 12.2801 16.5562 12.9062Z"
                        fill="#00A36C"
                      />
                    </svg>
                  </span>
                  <Text style={styles.contactText}>+91 98765 43210</Text>
                </td>
              </tr>
              <tr>
                <td style={styles.contactItem}>
                  <span style={styles.contactIcon}>
                    <svg
                      width="20px"
                      height="20px"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="Complete">
                        <g id="mail">
                          <g>
                            <polyline
                              fill="none"
                              points="4 8.2 12 14.1 20 8.2"
                              stroke="#00A36C"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                            <rect
                              fill="none"
                              height="14"
                              rx="2"
                              ry="2"
                              stroke="#00A36C"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              width="18"
                              x="3"
                              y="6.5"
                            />
                          </g>
                        </g>
                      </g>
                    </svg>
                  </span>
                  <Text style={styles.contactText}>
                    admin@birdmanofchennai.com
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.brandName}>Birdman of Chennai</Text>
            <Text style={styles.copyright}>
              © 2026 Birdman of Chennai. Capturing the rhythm of urban nature.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeString: string): string {
  // Convert 24-hour format (HH:MM:SS) to 12-hour format
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

const styles = {
  body: {
    backgroundColor: "#EEEBE5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: "#FEFDF5",
    margin: "0 auto",
    padding: "0",
    maxWidth: "540px",
  },
  heroImage: {
    width: "100%",
    display: "block",
    margin: 0,
    padding: 0,
  },
  iconWrapper: {
    textAlign: "center" as const,
    margin: "24px 0 16px",
  },
  cancelIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    backgroundColor: "#F3F4F6",
    borderRadius: "50%",
    margin: "0 auto",
  },
  heading: {
    color: "#6B7280",
    fontSize: "28px",
    fontWeight: "700",
    textAlign: "center" as const,
    margin: "0 0 12px",
    padding: "0 20px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#8B6914",
    textAlign: "center" as const,
    margin: "0 0 24px",
    padding: "0 20px",
  },
  greeting: {
    fontSize: "16px",
    color: "#1A1A2E",
    margin: "0 0 12px",
    padding: "0 20px",
  },
  text: {
    fontSize: "15px",
    color: "#4A5568",
    lineHeight: "1.6",
    margin: "0 0 24px",
    padding: "0 20px",
  },
  detailsBox: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    padding: "24px",
    margin: "0 20px 24px",
    width: "92%",
  },
  detailsHeading: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 16px",
  },
  detailRow: {
    display: "flex",
    alignItems: "flex-start",
    padding: "12px 0",
  },
  detailIcon: {
    marginRight: "12px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: "11px",
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },
  detailValue: {
    fontSize: "14px",
    color: "#4B5563",
    fontWeight: "400",
    margin: "0",
    textDecoration: "line-through",
  },
  rebookText: {
    fontSize: "15px",
    color: "#4A5568",
    lineHeight: "1.6",
    textAlign: "center" as const,
    margin: "0 0 24px",
    padding: "0 20px",
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "0 20px 32px",
  },
  primaryButton: {
    display: "inline-block",
    backgroundColor: "#00A36C",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    padding: "14px 28px",
    borderRadius: "8px",
  },
  contactSection: {
    backgroundColor: "#F0F4F0",
    borderRadius: "8px",
    padding: "16px",
    margin: "0 20px 24px",
    width: "92%"
  },
  contactItem: {
    display: "flex",
    alignItems: "flex-start",
  },
  contactIcon: {
    fontSize: "18px",
    marginRight: "12px",
    color: "#00A36C",
  },
  contactText: {
    fontSize: "13px",
    color: "#1A1A2E",
    margin: 0,
    lineHeight: "1.5",
  },
  footer: {
    textAlign: "center" as const,
    padding: "32px 20px",
    borderTop: "1px solid #E5E7EB",
    margin: "0",
  },
  brandName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#8B4513",
    margin: "0 0 16px",
  },
  footerLink: {
    fontSize: "13px",
    color: "#4A5568",
    textDecoration: "none",
  },
  copyright: {
    fontSize: "12px",
    color: "#6B7280",
    margin: "16px 0 0",
  },
};
