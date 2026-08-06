import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loginSchema } from '../../utils/validation';
import type { LoginInput } from '../../utils/validation';
import { useLogin } from '../../hooks/useAuth';

import AuthLayout from '../../components/auth/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthFooter from '../../components/auth/AuthFooter';
import InputField from '../../components/auth/InputField';
import PasswordInput from '../../components/auth/PasswordInput';
import RememberMe from '../../components/auth/RememberMe';
import AuthButton from '../../components/auth/AuthButton';
import loginIllustration from '../../assets/auth/illustrations/login.png';

export const Login: React.FC = () => {
  const { mutate: login, isPending, error, isError } = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Pre-fill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('natcart_remember_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <AuthLayout
      illustrationSrc={loginIllustration}
      promoTitle="The Ultimate Tech Marketplace"
      promoDesc="Discover high-performance components, developer laptops, and modular devices curated for tech enthusiasts."
    >
      <div className="flex-1 flex flex-col justify-center my-auto w-full">
        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in to continue shopping the latest technology products."
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
          <InputField
            id="email"
            type="email"
            label="Email Address"
            icon={Mail}
            error={errors.email?.message || (isError ? 'Please check your email address.' : undefined)}
            {...register('email')}
          />

          <PasswordInput
            id="password"
            label="Password"
            error={errors.password?.message || (isError ? ((error as any)?.message || 'Incorrect email or password. Please try again.') : undefined)}
            {...register('password')}
          />

          <div className="flex items-center justify-between my-2">
            <RememberMe
              id="rememberMe"
              {...register('rememberMe')}
            />
            <Link
              to="/auth/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <AuthButton type="submit" isLoading={isPending}>
            Sign In
          </AuthButton>
        </form>

        <div className="text-center mt-3 text-xs font-semibold text-slate-500">
          New to NatCart?{' '}
          <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 transition-colors">
            Create an account
          </Link>
        </div>
      </div>

      <AuthFooter />
    </AuthLayout>
  );
};

export default Login;
