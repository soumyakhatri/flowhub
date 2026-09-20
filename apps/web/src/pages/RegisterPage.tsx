import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { errorMessage } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { Alert, Button, Field, TextInput } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="You will land in an empty workspace. Create an organization next."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-tide-800 hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <Alert>{error}</Alert> : null}
        <Field label="Name">
          <TextInput
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}