import { sendPasswordResetCode } from "@/lib/brevo";

export async function GET() {
  try {
    const result = await sendPasswordResetCode(
      "YOUR_EMAIL@example.com",
      "583214"
    );

    console.log("Brevo result:", result);

    return Response.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error: any) {
    console.error("========== BREVO ERROR ==========");
    console.error("Message:", error?.message);
    console.error("=================================");

    return Response.json(
      {
        success: false,
        message: error?.message || "Failed to send test email",
      },
      { status: 500 }
    );
  }
}