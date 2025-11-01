
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useLoading } from '@/hooks/use-loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PasswordStrength from '@/components/password-strength';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type AuthFormProps = {
  defaultTab?: 'login' | 'signup';
  onSuccess?: () => void;
};

export default function AuthForm({ defaultTab = 'login', onSuccess }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setIsLoading } = useLoading();
  const [password, setPassword] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    setShowResendVerification(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      if (!userCredential.user.emailVerified) {
         toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email before logging in.",
        });
        setShowResendVerification(true);
        setLoading(false);
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back! You are now logged in.",
      });
      setIsLoading(true);
      onSuccess?.();
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(userCredential.user, { displayName: values.name });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: values.name,
        email: values.email,
        role: 'user',
        createdAt: new Date(),
      });

      await sendEmailVerification(userCredential.user);
      toast({
        title: "Account Created! Please Verify Your Email.",
        description: "A verification link has been sent to your email. Please check your inbox or spam folder.",
        duration: 9000,
      });
      onSuccess?.();
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: 'user',
        createdAt: new Date(),
      }, { merge: true });

      toast({
        title: "Sign In Successful",
        description: "Welcome! You have successfully signed in with Google.",
      });
      setIsLoading(true);
      onSuccess?.();
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

  async function handlePasswordReset() {
    const email = loginForm.getValues("email");
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox (and spam folder) for a link to reset your password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    const email = loginForm.getValues("email");
     if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to resend the verification link.",
      });
      return;
    }
    setLoading(true);
    try {
      // To resend verification, we need a user object.
      // We don't have one if login fails. So, we can't call sendEmailVerification on a non-existent user.
      // The workaround is to inform the user to sign up again or check their spam.
      // A better UX would involve a backend to handle this, but for client-only, this is a limitation.
      // However, the current firebaseUser is available on failed login if email is not verified, so let's try to use that.
      const user = auth.currentUser;
      if (user && user.email === email && !user.emailVerified) {
        await sendEmailVerification(user);
        toast({
            title: "Verification Email Sent",
            description: "A new verification link has been sent to your email address.",
        });
      } else {
         toast({
            title: "Action required",
            description: "Please attempt to log in first to identify your account.",
        });
      }
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Resend",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="w-full max-w-sm">
        <div className="text-center mb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-blue">
                <Image src="/favicon.ico" alt="Jasa Essentials Logo" width={32} height={32} />
            </div>
            <h2 className="font-headline text-2xl mt-4">Jasa Essentials</h2>
        </div>
        <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                 <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 pt-4">
                        <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="m@example.com" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div className="relative">
                                <FormControl>
                                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} disabled={loading} />
                                </FormControl>
                                <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                onClick={() => setShowPassword((prev) => !prev)}
                                >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="text-sm flex justify-between items-center">
                            <Button type="button" variant="link" className="p-0 font-normal" onClick={handlePasswordReset} disabled={loading}>
                                Forgot Password?
                            </Button>
                             {showResendVerification && (
                                <Button type="button" variant="link" className="p-0 font-normal" onClick={handleResendVerification} disabled={loading}>
                                Resend Verification
                                </Button>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="signup">
                <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4 pt-4">
                    <FormField
                    control={signupForm.control}
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
                    control={signupForm.control}
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
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                            <FormControl>
                            <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} onChange={(e) => {
                                field.onChange(e);
                                setPassword(e.target.value);
                            }} disabled={loading}/>
                            </FormControl>
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowPassword((prev) => !prev)}
                            >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <PasswordStrength password={password} />
                    <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>
                </Form>
            </TabsContent>
        </Tabs>

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
    </div>
  );
}
