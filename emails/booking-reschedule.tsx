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

interface BookingRescheduleProps {
  visitorName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  adults: number;
  children: number;
  numberOfGuests?: number; // Deprecated
  bookingId: string;
}

export default function BookingReschedule({
  visitorName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  adults,
  children,
  bookingId,
}: BookingRescheduleProps) {
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

          {/* Icon */}
          <div style={styles.iconWrapper}>
            <div style={styles.icon}>
              <Img
                src={`https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/icon-192.png`}
                alt="Birdman of Chennai Icon"
                width="52"
                height="52"
                style={{ borderRadius: "4px" }}
              />
            </div>
          </div>

          {/* Heading */}
          <Heading style={styles.heading}>Booking Rescheduled</Heading>
          
          <Text style={styles.subtitle}>
            Your visit details have been successfully updated.
          </Text>

          {/* Greeting */}
          <Text style={styles.greeting}>Hello {visitorName},</Text>

          {/* Message */}
          <Text style={styles.text}>
            We are writing to confirm that your booking to visit the Birdman of
            Chennai has been rescheduled as requested. Please review your
            updated itinerary below.
          </Text>

          {/* Comparison Box */}
          <Section style={styles.comparisonContainer}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                {/* Previous Booking */}
                <td width="48%" style={styles.comparisonColumn}>
                  <Section style={styles.oldDetailsBox}>
                    <div style={styles.oldIconWrapper}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ display: "block" }}
                      >
                        <path
                          d="M4 12C4 7.58172 7.58172 4 12 4C14.5264 4 16.7792 5.17108 18.2454 7"
                          stroke="#9CA3AF"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M20 12C20 16.4183 16.4183 20 12 20C9.47362 20 7.22075 18.8289 5.75463 17"
                          stroke="#9CA3AF"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16 7H20V3"
                          stroke="#9CA3AF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 17H4V21"
                          stroke="#9CA3AF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <Text style={styles.oldDetailsHeading}>PREVIOUS BOOKING</Text>
                    
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.oldDetailValue}>
                      {formatDate(oldDate)}
                    </Text>

                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.oldDetailValue}>
                      {formatTime(oldTime)}
                    </Text>
                  </Section>
                </td>

                <td width="4%"></td>

                {/* New Booking */}
                <td width="48%" style={styles.comparisonColumn}>
                  <Section style={styles.newDetailsBox}>
                    <div style={styles.newIconWrapper}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ display: "block" }}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="#00A36C"
                          strokeWidth="2"
                        />
                        <path
                          d="M8 12L11 15L16 9"
                          stroke="#00A36C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <Text style={styles.newDetailsHeading}>NEW BOOKING</Text>
                    
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.newDetailValue}>
                      {formatDate(newDate)}
                    </Text>

                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.newDetailValue}>
                      {formatTime(newTime)}
                    </Text>
                  </Section>
                </td>
              </tr>
            </table>
          </Section>

          {/* Additional Details */}
          <Section style={styles.additionalDetails}>
            <table width="90%" cellPadding="0" cellSpacing="0">
              <tr>
                <td width="50%" style={{ paddingRight: "8px" }}>
                  <Text style={styles.detailLabel}>Guests</Text>
                  <Text style={styles.detailValue}>
                    {adults} Adult{adults !== 1 ? "s" : ""}
                    {children > 0
                      ? `, ${children} Child${children !== 1 ? "ren" : ""}`
                      : ""}
                  </Text>
                </td>
                <td width="50%" style={{ paddingLeft: "8px" }}>
                  <Text style={styles.detailLabel}>Booking ID</Text>
                  <Text style={styles.detailValue}>
                    {bookingId.toUpperCase()}
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* CTA Button */}
          <Section style={styles.buttonContainer}>
            <Link
              href={`${baseUrl}/admin`}
              style={styles.primaryButton}
            >
              View Updated Booking
            </Link>
          </Section>

          {/* Footer Text */}
          <Text style={styles.footerText}>
            If you need to make further changes, please try to do so at least 24 hours
            in advance. Thank you for supporting the parakeets.
          </Text>

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
                    Birdman of Chennai 2, Iyya Mudali St, Adikesavarpuram,
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
  icon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "58px",
    height: "58px",
    color: "#00A36C",
    borderRadius: "50%",
    margin: "0 auto",
  },
  heading: {
    color: "#8B4513",
    fontSize: "28px",
    fontWeight: "700",
    textAlign: "center" as const,
    margin: "0 0 12px",
    padding: "0 20px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#6B7280",
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
  comparisonContainer: {
    padding: "0 20px",
    margin: "0 0 32px",
  },
  comparisonColumn: {
    verticalAlign: "top" as const,
  },
  oldDetailsBox: {
    backgroundColor: "#F3F4F6",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center" as const,
  },
  oldIconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 12px",
  },
  oldDetailsHeading: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 16px",
  },
  newDetailsBox: {
    backgroundColor: "#ECFDF5",
    border: "1px solid #00A36C",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center" as const,
  },
  newIconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 12px",
  },
  newDetailsHeading: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#00A36C",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 16px",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#8B6914",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    margin: "12px 0 4px",
    letterSpacing: "0.5px",
  },
  oldDetailValue: {
    fontSize: "15px",
    color: "#6B7280",
    fontWeight: "500",
    margin: "0 0 8px",
    textDecoration: "line-through",
  },
  newDetailValue: {
    fontSize: "15px",
    color: "#1A1A2E",
    fontWeight: "600",
    margin: "0 0 8px",
  },
  additionalDetails: {
    backgroundColor: "#FFFFFF",
    borderTop: "2px solid #FF8C00",
    borderRadius: "12px",
    padding: "24px",
    margin: "0 20px 32px",
    width: "92%"
  },
  detailValue: {
    fontSize: "15px",
    color: "#1A1A2E",
    fontWeight: "500",
    margin: "0",
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
  footerText: {
    fontSize: "14px",
    color: "#6B7280",
    lineHeight: "1.6",
    textAlign: "center" as const,
    margin: "0 0 32px",
    padding: "0 20px",
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
