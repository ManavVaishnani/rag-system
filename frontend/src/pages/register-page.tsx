import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getPasswordStrength } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import type { RegisterFormValues } from '@/types';
import { registerSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const passwordValue = form.watch('password');
  const passwordStrength = getPasswordStrength(passwordValue);

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      await register({ email: values.email, password: values.password });
      navigate('/chat');
      form.reset();
    } catch {
      // Error is handled by store
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your details to get started"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <div className="mt-1 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        passwordStrength === 'weak'
                          ? 'w-1/3 bg-destructive'
                          : passwordStrength === 'medium'
                            ? 'w-2/3 bg-yellow-400'
                            : passwordStrength === 'strong'
                              ? 'w-full bg-emerald-500'
                              : 'w-0'
                      }`}
                    />
                  </div>
                  {passwordStrength !== 'empty' && (
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength === 'weak' && 'Weak password'}
                      {passwordStrength === 'medium' && 'Medium strength'}
                      {passwordStrength === 'strong' && 'Strong password'}
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || form.formState.isSubmitting}
          >
            {isLoading || form.formState.isSubmitting
              ? 'Creating account...'
              : 'Create account'}
          </Button>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
