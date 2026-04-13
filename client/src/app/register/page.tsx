import RegisterForm from "@/components/RegisterForm";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Create Account — FitTrack" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">FitTrack</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
