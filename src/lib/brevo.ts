export async function sendPasswordResetCode(
  email: string,
  code: string
) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL!,
        name: process.env.BREVO_SENDER_NAME || "SplitZ",
      },

      to: [
        {
          email,
        },
      ],

      subject: "Your SplitZ password reset code",

      htmlContent: `
        <div style="
          font-family: Arial, sans-serif;
          background: #101317;
          padding: 40px;
        ">
          <div style="
            max-width: 500px;
            margin: auto;
            background: #181c21;
            padding: 30px;
            border-radius: 16px;
          ">

            <h1 style="color:#F4F7FA;">
              Split<span style="color:#3B82F6;">Z</span>
            </h1>

            <p style="color:#AAB2BD;">
              We received a request to reset your SplitZ password.
            </p>

            <p style="color:#AAB2BD;">
              Your verification code is:
            </p>

            <div style="
              font-size:32px;
              font-weight:bold;
              letter-spacing:8px;
              color:#3B82F6;
              padding:20px 0;
            ">
              ${code}
            </div>

            <p style="color:#AAB2BD;">
              This code will expire in <strong>10 minutes</strong>.
            </p>

            <p style="color:#777;">
              If you didn't request a password reset, you can safely ignore
              this email.
            </p>

          </div>
        </div>
      `,

      textContent: `Your SplitZ password reset code is ${code}. This code expires in 10 minutes.`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Brevo API error:", data);

    throw new Error(
      data?.message || `Brevo request failed with status ${response.status}`
    );
  }

  return data;
}