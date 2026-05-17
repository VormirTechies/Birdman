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

interface BookingReminderProps {
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  numberOfGuests?: number; // Deprecated
}

export default function BookingReminder({
  visitorName,
  bookingDate,
  bookingTime,
}: BookingReminderProps) {

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

          {/* Bell Icon */}
          <div style={styles.iconWrapper}>
            <div style={styles.bellIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
              >
                <path
                  d="M12 2C11.4477 2 11 2.44772 11 3V3.76553C8.93585 4.35254 7.5 6.24899 7.5 8.5V14.25L5.84315 15.9069C5.36808 16.3819 5.69852 17.25 6.34315 17.25H17.6569C18.3015 17.25 18.6319 16.3819 18.1569 15.9069L16.5 14.25V8.5C16.5 6.24899 15.0642 4.35254 13 3.76553V3C13 2.44772 12.5523 2 12 2Z"
                  fill="#FF8C00"
                />
                <path
                  d="M10 18.5C10 19.3284 10.6716 20 11.5 20H12.5C13.3284 20 14 19.3284 14 18.5C14 18.2239 13.7761 18 13.5 18H10.5C10.2239 18 10 18.2239 10 18.5Z"
                  fill="#FF8C00"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <Heading style={styles.heading}>Your visit is today!</Heading>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Hello {visitorName}, we&apos;re looking forward to seeing you. The parakeets
            are waiting.
          </Text>

          {/* Booking Details Box */}
          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Booking Details</Text>

            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td width="50%" style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>DATE</Text>
                  <Text style={styles.detailValue}>
                    TODAY, {formatDateShort(bookingDate)}
                  </Text>
                </td>
                <td width="50%" style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>TIME</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(bookingTime)}
                  </Text>
                </td>
              </tr>
            </table>

            <Text style={styles.detailLabel}>LOCATION</Text>
            <Text style={styles.locationValue}>
              Triplicane High Road, Chennai, Tamil Nadu
            </Text>
          </Section>

          {/* Preparation Tips */}
          <Section style={styles.tipsSection}>
            <Text style={styles.tipsHeading}>Preparation Tips</Text>

            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={styles.tipRow}>
                  <div style={styles.checkIcon}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10" fill="#8B6914" />
                      <path
                        d="M8 12L11 15L16 9"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Arrive Early</Text>
                    <Text style={styles.tipText}>
                      Please arrive 15 minutes before your scheduled time to settle in.
                    </Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.tipRow}>
                  <div style={styles.checkIcon}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10" fill="#8B6914" />
                      <path
                        d="M8 12L11 15L16 9"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div style={styles.tipContent}>
                    <Text style={styles.tipTitle}>What to Bring</Text>
                    <Text style={styles.tipText}>
                      A camera and a quiet demeanor. We will provide the rice for feeding.
                    </Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.tipRow}>
                  <div style={styles.checkIcon}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10" fill="#8B6914" />
                      <path
                        d="M8 12L11 15L16 9"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Parking</Text>
                    <Text style={styles.tipText}>
                      Street parking is limited. We recommend using a ride-sharing service or
                      parking at the nearby public lot.
                    </Text>
                  </div>
                </td>
              </tr>
            </table>
          </Section>

          {/* CTA Button */}
          <Section style={styles.buttonContainer}>
            <Link
              href="https://maps.app.goo.gl/G76qA7qZAJ3g44Pu9"
              style={styles.secondaryButton}
            >
              <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "8px" }}>
                <g transform="scale(1.03, 1.03), translate(3.5, 0)">
                  <path fill="#1a73e8" d="M14.45.78A8.09,8.09,0,0,0,5.8,3.29L9.63,6.51Z" transform="translate(-3.91 -0.4)"/>
                  <path fill="#ea4335" d="M5.8,3.29a8.07,8.07,0,0,0-1.89,5.2,9.06,9.06,0,0,0,.8,3.86L9.63,6.51Z" transform="translate(-3.91 -0.4)"/>
                  <path fill="#4285f4" d="M12,5.4a3.09,3.09,0,0,1,3.1,3.09,3.06,3.06,0,0,1-.74,2l4.82-5.73a8.12,8.12,0,0,0-4.73-4L9.63,6.51A3.07,3.07,0,0,1,12,5.4Z" transform="translate(-3.91 -0.4)"/>
                  <path fill="#fbbc04" d="M12,11.59a3.1,3.1,0,0,1-3.1-3.1,3.07,3.07,0,0,1,.73-2L4.71,12.35A28.67,28.67,0,0,0,8.38,17.6l6-7.11A3.07,3.07,0,0,1,12,11.59Z" transform="translate(-3.91 -0.4)"/>
                  <path fill="#34a853" d="M14.25,19.54c2.7-4.22,5.84-6.14,5.84-11a8.1,8.1,0,0,0-.91-3.73L8.38,17.6c.46.6.92,1.24,1.37,1.94C11.4,22.08,10.94,23.6,12,23.6S12.6,22.08,14.25,19.54Z" transform="translate(-3.91 -0.4)"/>
                </g>
              </svg>
              Get Directions
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
                    visits@birdmanofchennai.com
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

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
  bellIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    backgroundColor: "#FFF4E6",
    borderRadius: "50%",
    margin: "0 auto",
  },
  heading: {
    color: "#1A1A2E",
    fontSize: "28px",
    fontWeight: "700",
    textAlign: "center" as const,
    margin: "0 0 12px",
    padding: "0 20px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#8B6914",
    textAlign: "center" as const,
    lineHeight: "1.6",
    margin: "0 0 32px",
    padding: "0 20px",
  },
  detailsBox: {
    backgroundColor: "#FFFFFF",
    borderTop: "2px solid #FF8C00",
    borderRadius: "12px",
    padding: "24px",
    margin: "0 20px 24px",
    width: "92%",
  },
  detailsHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#00A36C",
    margin: "0 0 16px",
  },
  detailColumn: {
    verticalAlign: "top" as const,
    paddingRight: "8px",
  },
  detailLabel: {
    fontSize: "11px",
    color: "#8B6914",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },
  detailValue: {
    fontSize: "15px",
    color: "#1A1A2E",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  locationValue: {
    fontSize: "14px",
    color: "#4A5568",
    fontWeight: "400",
    margin: "0",
    lineHeight: "1.5",
  },
  tipsSection: {
    borderLeft: "3px solid #8B6914",
    padding: "0 0 0 20px",
    margin: "24px 20px",
    width: "92%",
  },
  tipsHeading: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1A1A2E",
    margin: "0 0 16px",
  },
  tipRow: {
    display: "flex",
    alignItems: "flex-start",
    padding: "12px 0",
  },
  checkIcon: {
    marginRight: "12px",
    flexShrink: 0,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1A1A2E",
    margin: "0 0 4px",
  },
  tipText: {
    fontSize: "13px",
    color: "#4A5568",
    lineHeight: "1.5",
    margin: "0",
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "32px 20px",
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A36C",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    padding: "14px 28px",
    borderRadius: "8px",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap:'8px',
    backgroundColor: "transparent",
    color: "#00A36C",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    padding: "12px 26px",
    borderRadius: "8px",
    border: "2px solid #00A36C",
    width : "fit-content",
    margin: "0 auto",
  },

  contactSection: {
    backgroundColor: "#F0F4F0",
    borderRadius: "8px",
    padding: "16px",
    margin: "0 20px 24px",
    width: "92%",
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