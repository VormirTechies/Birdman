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

interface BookingConfirmationProps {
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  numberOfGuests?: number; // Deprecated, kept for backward compatibility
  bookingId: string;
}

export default function BookingConfirmation({
  visitorName,
  bookingDate,
  bookingTime,
  adults,
  children,
  bookingId,
}: BookingConfirmationProps) {

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
              {/* <svg
                width="800px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z"
                  stroke={styles.icon.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L10.8189 13.8189V13.8189C10.9189 13.9189 11.0811 13.9189 11.1811 13.8189V13.8189L15 10"
                  stroke={styles.icon.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg> */}

              <Img
                src={`https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/icon-192.png`}
                alt="Birdman of Chennai Icon"
                width="52"
                height="52"
                style={{ borderRadius: "4px" }}
              ></Img>
            </div>
          </div>

          {/* Heading */}
          <Heading style={styles.heading}>Booking Confirmed</Heading>

          {/* Greeting */}
          <Text style={styles.greeting}>Dear {visitorName},</Text>

          {/* Confirmation Message */}
          <Text style={styles.text}>
            Your booking has been successfully confirmed. We are incredibly
            excited to welcome you to this unique experience and witness the
            rhythmic gathering of 6,000+ parakeets.
          </Text>

          {/* Booking Details Box */}
          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Booking Details</Text>

            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td width="50%" style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(bookingDate)}
                  </Text>

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
                  <Text style={styles.detailValue}>
                    {formatTime(bookingTime)}
                  </Text>

                  <Text style={styles.detailLabel}>Booking ID</Text>
                  <Text style={styles.detailValue}>
                    {bookingId.toUpperCase()}
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* What to Expect */}
          <Section style={styles.sidebarSection}>
            <Text style={styles.sectionHeading}>What to Expect</Text>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                Arrive 10 minutes before your scheduled time
              </li>
              <li style={styles.listItem}>
                The feeding session lasts approximately 30 minutes
              </li>
              <li style={styles.listItem}>
                Please maintain silence to avoid startling the birds
              </li>
              <li style={styles.listItem}>
                Photography is allowed and encouraged!
              </li>
            </ul>
          </Section>

          {/* Important Reminders */}
          <Section style={styles.sidebarSection}>
            <Text style={styles.sectionHeading}>Important Reminders</Text>
            <ul style={styles.list}>
              <li style={styles.listItem}>Wear comfortable clothing</li>
              <li style={styles.listItem}>
                Avoid bright colors that may startle the birds
              </li>
              <li style={styles.listItem}>
                Keep a respectful distance from Mr. Sudarson Sah during feeding
              </li>
              <li style={styles.listItem}>No pets allowed</li>
            </ul>
          </Section>

          {/* Contact Information */}
          <Section style={styles.contactSection}>
            <table width="100%" cellPadding="8" cellSpacing="0">
              <tr>
                <td style={styles.contactItem}>
                  <span style={styles.contactIcon}>
                    <svg
                      fill="green"
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
                        fill="green"
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
                      <title />

                      <g id="Complete">
                        <g id="mail">
                          <g>
                            <polyline
                              fill="none"
                              points="4 8.2 12 14.1 20 8.2"
                              stroke="green"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />

                            <rect
                              fill="none"
                              height="14"
                              rx="2"
                              ry="2"
                              stroke="green"
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

          {/* CTA Buttons */}
          <Section style={styles.buttonContainer}>
            {/* <Link href={`${baseUrl}/admin`} style={styles.primaryButton}>
              View Details / Reschedule
            </Link> */}
            <Link
              href="https://maps.app.goo.gl/G76qA7qZAJ3g44Pu9"
              style={styles.secondaryButton}
            >
              <svg width="20px" height="20px" viewBox="0 0 24 24" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
                  <g transform="scale(1.03, 1.03), translate(3.5, 0)">
                      <path fill="#1a73e8" d="M14.45.78A8.09,8.09,0,0,0,5.8,3.29L9.63,6.51Z" transform="translate(-3.91 -0.4)"/>
                      <path fill="#ea4335" d="M5.8,3.29a8.07,8.07,0,0,0-1.89,5.2,9.06,9.06,0,0,0,.8,3.86L9.63,6.51Z" transform="translate(-3.91 -0.4)"/>
                      <path fill="#4285f4" d="M12,5.4a3.09,3.09,0,0,1,3.1,3.09,3.06,3.06,0,0,1-.74,2l4.82-5.73a8.12,8.12,0,0,0-4.73-4L9.63,6.51A3.07,3.07,0,0,1,12,5.4Z" transform="translate(-3.91 -0.4)"/>
                      <path fill="#fbbc04" d="M12,11.59a3.1,3.1,0,0,1-3.1-3.1,3.07,3.07,0,0,1,.73-2L4.71,12.35A28.67,28.67,0,0,0,8.38,17.6l6-7.11A3.07,3.07,0,0,1,12,11.59Z" transform="translate(-3.91 -0.4)"/>
                      <path fill="#34a853" d="M14.25,19.54c2.7-4.22,5.84-6.14,5.84-11a8.1,8.1,0,0,0-.91-3.73L8.38,17.6c.46.6.92,1.24,1.37,1.94C11.4,22.08,10.94,23.6,12,23.6S12.6,22.08,14.25,19.54Z" transform="translate(-3.91 -0.4)"/>
                  </g>
              </svg>

              View on Google Maps
            </Link>
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
    backgroundColor: "#FFFFFF",
    borderTop: "2px solid #FF8C00",
    borderRadius: "12px",
    padding: "24px",
    width: "95%",
  },
  detailsHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1A1A2E",
    margin: "0 0 16px",
  },
  detailColumn: {
    verticalAlign: "top" as const,
  },
  detailLabel: {
    fontSize: "12px",
    color: "#8B6914",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },
  detailValue: {
    fontSize: "15px",
    color: "#1A1A2E",
    fontWeight: "500",
    margin: "0 0 16px",
  },
  sidebarSection: {
    borderLeft: "3px solid #00A36C",
    padding: "0 0 0 20px",
    margin: "24px 20px",
  },
  sectionHeading: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1A1A2E",
    margin: "0 0 12px",
  },
  list: {
    margin: 0,
    padding: 0,
    listStylePosition: "inside" as const,
  },
  listItem: {
    fontSize: "14px",
    color: "#4A5568",
    lineHeight: "1.6",
    margin: "8px 0",
  },
  contactSection: {
    backgroundColor: "#F0F4F0",
    borderRadius: "8px",
    padding: "16px",
    width: "95%",
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
  buttonContainer: {
    textAlign: "center" as const,
    margin: "32px 20px",
    width:'95%',
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
    margin: "8px",
  },
  secondaryButton: {
    display: "flex",
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
  footer: {
    textAlign: "center" as const,
    padding: "32px 20px",
    borderTop: "1px solid #E5E7EB",
    margin: "24px 0 0",
  },
  brandName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#8B4513",
    margin: "0 0 12px",
  },
  footerLinks: {
    fontSize: "13px",
    color: "#4A5568",
    margin: "0 0 16px",
  },
  footerLink: {
    color: "#4A5568",
    textDecoration: "none",
  },
  copyright: {
    fontSize: "12px",
    color: "#6B7280",
    margin: 0,
  },
};
