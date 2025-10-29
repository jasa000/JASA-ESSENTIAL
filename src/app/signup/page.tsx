
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PenSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import PasswordStrength from '@/components/password-strength';

const emailSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(userCredential.user, { displayName: values.name });
      await sendEmailVerification(userCredential.user);
      toast({
        title: "Account Created! Please Verify Your Email.",
        description: "A verification link has been sent to your email. Please check your inbox or spam folder to continue.",
        duration: 9000,
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Sign Up Successful",
        description: "Welcome! You have successfully signed up with Google.",
      });
      router.push('/');
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
             <Link href="/" className="mx-auto flex w-fit items-center gap-2">
              <PenSquare className="h-8 w-8" style={{color: '#7EC8E3'}} />
            </Link>
            <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
            <CardDescription>Join Jasa Essentials to start your creative journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} disabled={loading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="m@example.com" {...field} disabled={loading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} onChange={(e) => {
                          field.onChange(e);
                          setPassword(e.target.value);
                        }} disabled={loading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <PasswordStrength password={password} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account with Email'}
                </Button>
              </form>
            </Form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
               <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.22s2.46-5.22 5.49-5.22c1.39 0 2.53.52 3.4 1.48l2.34-2.34C18.4 2.8 15.98 2 12.48 2 7.43 2 3.23 6.09 3.23 11s4.2 9 9.25 9c2.76 0 4.92-1 6.48-2.62 1.62-1.62 2.2-4.14 2.2-6.32 0-.6-.05-1.16-.16-1.7z"></path></svg>
              Google
            </Button>

            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline hover:text-primary">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
