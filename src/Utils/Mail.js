const Mailgen = require("mailgen");
const nodemailer = require("nodemailer");
const {
  APP_URL,
  MAILTRAP_SMTP_HOST,
  MAILTRAP_SMTP_PORT,
  MAILTRAP_SMTP_USER,
  MAILTRAP_SMTP_PASS,
} = require("../Config/serverConfig");

const sendEmail = async (options) => {
  // Initialize mailgen instance with default theme and brand configuration
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Converse",
      link: APP_URL,
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  // Generate an HTML email with the provided contents
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  // Create a nodemailer transporter instance which is responsible to send a mail
  const transporter = nodemailer.createTransport({
    host: MAILTRAP_SMTP_HOST,
    port: MAILTRAP_SMTP_PORT,
    auth: {
      user: MAILTRAP_SMTP_USER,
      pass: MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.converse@gmail.com", // We can name this anything. The mail will go to your Mailtrap inbox
    to: options.email, // receiver's mail
    subject: options.subject, // mail subject
    text: emailTextual, // mailgen content textual variant
    html: emailHtml, // mailgen content html variant
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log(
      "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    console.log("Error: ", error);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our app! We're very excited to have you on board.",
      action: {
        instructions:
          "To verify your email please click on the following button:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

module.exports = {
  sendEmail,
  emailVerificationMailgenContent,
};
