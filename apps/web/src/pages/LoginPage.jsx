import { useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { Alert, Button, Field, TextInput } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return <AuthLayout
    title="Sign in"
    subtitle="Use the email and password for your FlowHub account."
    footer={<>
          New to FlowHub?{" "}
          <Link className="font-medium text-tide-800 hover:underline" to="/register">
            Create an account
          </Link>
        </>}
  >
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <Alert>{error}</Alert> : null}
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
    autoComplete="current-password"
    required
    value={password}
    onChange={(event) => setPassword(event.target.value)}
  />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>;
}
export {
  LoginPage
};
