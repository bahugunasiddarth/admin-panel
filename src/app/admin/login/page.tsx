import { LoginForm } from '@/components/admin/login-form';

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://i.ibb.co/DPXDysSd/Gemini-Generated-Image-1fyr8u1fyr8u1fyr.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <LoginForm />
    </div>
  );
}
