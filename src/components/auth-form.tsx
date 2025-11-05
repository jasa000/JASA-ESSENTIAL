

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
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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

// Function to generate a random 6-character alphanumeric string
const generateShortId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default function AuthForm({ defaultTab = 'login', onSuccess }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

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
        setResendEmail(values.email);
        setShowResendVerification(true);
        setLoading(false);
        await signOut(auth);
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back! You are now logged in.",
      });
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

      const shortId = generateShortId();

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        shortId: shortId,
        name: values.name,
        email: values.email,
        roles: ['user'],
        createdAt: new Date(),
      });

      await sendEmailVerification(userCredential.user);
      
      await signOut(auth);

      toast({
        title: "Account Created! Please Verify Your Email.",
        description: "A verification link has been sent to your email. Please check your inbox or spam folder before logging in.",
        duration: 9000,
      });
      
      // Switch to login tab after successful registration
      setActiveTab('login');
      signupForm.reset();

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
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const shortId = generateShortId();
        await setDoc(userDocRef, {
          uid: user.uid,
          shortId: shortId,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          roles: ['user'],
          createdAt: new Date(),
        });
      } else {
        // If user exists, check if they have a shortId. If not, create and update.
        const userData = userDoc.data();
        if (!userData.shortId) {
            const shortId = generateShortId();
            await updateDoc(userDocRef, { shortId: shortId });
        }
      }


      toast({
        title: "Sign In Successful",
        description: "Welcome! You have successfully signed in with Google.",
      });
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
    if (!resendEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please try to log in first to identify your account.",
      });
      return;
    }
    setLoading(true);
    try {
      // This is a bit of a trick. We can't create a user object, but we can send a password reset
      // which also works for confirming the email exists and lets the user get back in.
      // A more robust solution would involve a backend function.
      // For this implementation, we will re-use the password reset function,
      // as it serves the purpose of sending an email to the user.
      await sendPasswordResetEmail(auth, resendEmail);
       toast({
          title: "Email Sent",
          description: "An email has been sent. Please follow the instructions in it. This may be a password reset link which you can use to set a new password and log in.",
          duration: 9000,
      });
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
    <div className="w-full max-w-sm rounded-lg border bg-background/90 p-6 shadow-lg backdrop-blur-sm">
        <div className="text-center mb-6">
            <h2 className="font-headline text-2xl mt-4">Jasa Essentials</h2>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} >
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

    
