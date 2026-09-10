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


type ExpenseBalanceItem = {
    name: string;
    amount: number;
};

type ExpenseBalanceEmailData = {
    email: string;
    userName: string;
    groupName: string;
    expenseTitle: string;
    expenseAmount: number;
    payerName: string;

    status:
        | "OWES"
        | "RECEIVES"
        | "SETTLED";

    totalAmount: number;

    payments?: ExpenseBalanceItem[];
};

export async function sendExpenseBalanceEmail({
    email,
    userName,
    groupName,
    expenseTitle,
    expenseAmount,
    payerName,
    status,
    totalAmount,
    payments = [],
}: ExpenseBalanceEmailData) {
    let balanceHeading = "";
    let balanceMessage = "";
    let paymentDetails = "";

    if (status === "OWES") {
        balanceHeading = "YOU OWE";

        balanceMessage = `You currently owe ₹${totalAmount.toFixed(
            2
        )}.`;

        paymentDetails = payments
            .map(
                (payment) =>
                    `<li style="margin-bottom:8px;">
                        Pay <strong style="color:#F4F7FA;">
                            ${payment.name}
                        </strong>
                        — ₹${payment.amount.toFixed(2)}
                    </li>`
            )
            .join("");
    }

    if (status === "RECEIVES") {
        balanceHeading = "YOU WILL RECEIVE";

        balanceMessage = `You will receive ₹${totalAmount.toFixed(
            2
        )}.`;

        paymentDetails = payments
            .map(
                (payment) =>
                    `<li style="margin-bottom:8px;">
                        Receive from <strong style="color:#F4F7FA;">
                            ${payment.name}
                        </strong>
                        — ₹${payment.amount.toFixed(2)}
                    </li>`
            )
            .join("");
    }

    if (status === "SETTLED") {
        balanceHeading = "YOUR BALANCE";

        balanceMessage = "You're all settled up.";
    }

    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",

            headers: {
                "api-key": process.env.BREVO_API_KEY!,
                "Content-Type": "application/json",
                Accept: "application/json",
            },

            body: JSON.stringify({
                sender: {
                    email: process.env.BREVO_SENDER_EMAIL!,
                    name:
                        process.env.BREVO_SENDER_NAME ||
                        "SplitZ",
                },

                to: [
                    {
                        email,
                        name: userName,
                    },
                ],

                subject: `New expense in ${groupName} — SplitZ`,

                htmlContent: `
                    <div style="
                        font-family: Arial, sans-serif;
                        background: #101317;
                        padding: 40px;
                    ">

                        <div style="
                            max-width: 520px;
                            margin: auto;
                            background: #181c21;
                            padding: 30px;
                            border-radius: 16px;
                        ">

                            <h1 style="
                                color:#F4F7FA;
                                margin-top:0;
                            ">
                                Split<span style="
                                    color:#3B82F6;
                                ">Z</span>
                            </h1>

                            <p style="
                                color:#AAB2BD;
                            ">
                                Hi ${userName},
                            </p>

                            <p style="
                                color:#AAB2BD;
                            ">
                                A new expense was added to
                                <strong style="
                                    color:#F4F7FA;
                                ">
                                    ${groupName}
                                </strong>.
                            </p>

                            <div style="
                                margin:24px 0;
                                padding:20px;
                                background:#101317;
                                border:1px solid #343A40;
                                border-radius:12px;
                            ">

                                <p style="
                                    color:#777;
                                    margin:0 0 8px;
                                ">
                                    EXPENSE
                                </p>

                                <p style="
                                    color:#F4F7FA;
                                    font-size:20px;
                                    font-weight:bold;
                                    margin:0;
                                ">
                                    ${expenseTitle}
                                </p>

                                <p style="
                                    color:#AAB2BD;
                                    margin:12px 0 0;
                                ">
                                    Total: ₹${expenseAmount.toFixed(
                                        2
                                    )}
                                </p>

                                <p style="
                                    color:#AAB2BD;
                                    margin:6px 0 0;
                                ">
                                    Paid by: ${payerName}
                                </p>

                            </div>

                            <div style="
                                padding:20px;
                                border-radius:12px;
                                background:#101317;
                                border:1px solid #3B82F6;
                            ">

                                <p style="
                                    color:#3B82F6;
                                    font-size:13px;
                                    margin:0 0 10px;
                                    font-weight:bold;
                                ">
                                    ${balanceHeading}
                                </p>

                                <p style="
                                    color:#F4F7FA;
                                    font-size:19px;
                                    font-weight:bold;
                                    margin:0 0 15px;
                                ">
                                    ${balanceMessage}
                                </p>

                                ${
                                    payments.length > 0
                                        ? `
                                    <ul style="
                                        color:#AAB2BD;
                                        padding-left:20px;
                                        margin:0;
                                    ">
                                        ${paymentDetails}
                                    </ul>
                                    `
                                        : ""
                                }

                            </div>

                            <p style="
                                color:#777;
                                font-size:13px;
                                margin-top:25px;
                            ">
                                Manage your expenses and settlements
                                from SplitZ.
                            </p>

                        </div>
                    </div>
                `,

                textContent: `
Hi ${userName},

A new expense was added to ${groupName}.

Expense: ${expenseTitle}
Total: ₹${expenseAmount.toFixed(2)}
Paid by: ${payerName}

${balanceHeading}
${balanceMessage}

${
    payments.length > 0
        ? payments
              .map(
                  (payment) =>
                      `${payment.name} — ₹${payment.amount.toFixed(
                          2
                      )}`
              )
              .join("\n")
        : ""
}

— SplitZ
                `,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error(
            "Brevo expense email error:",
            data
        );

        throw new Error(
            data?.message ||
                `Brevo request failed with status ${response.status}`
        );
    }

    return data;
}