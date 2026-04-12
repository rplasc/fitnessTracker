import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Create Account — FitTrack" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
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
          <p className="text-zinc-400 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
