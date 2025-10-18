import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth, db } from "../firebase";
import Header from "@/components/Header";
import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserPlus, LogIn, Loader } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleCredentialResponse {
  credential: string;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { user, login, isLoading: authLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // --- Google sign-in handler (declared before effects/returns to keep hook order stable)
  const handleGoogleLogin = async (response: GoogleCredentialResponse) => {
    setIsLoading(true);
    const credential = GoogleAuthProvider.credential(response.credential);
    try {
      const result = await signInWithCredential(auth, credential);
      const u = result.user;

      await setDoc(
        doc(db, "users", u.uid),
        { name: u.displayName, email: u.email, points: 0, inventory: [], isAdmin: false },
        { merge: true }
      );

      login({ uid: u.uid, displayName: u.displayName, email: u.email, isAdmin: false });
      toast.success(`Welcome ${u.displayName}`, { position: "top-center" });
      navigate("/map");
    } catch (err: any) {
      toast.error("Google sign-in failed: " + (err?.message || err), { position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Initialize Google SDK (placed before early returns)
  useEffect(() => {
    if (user) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    let intervalId: any;

    const init = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: "58284097478-u3nc9o5bkoj5bkj7ls1me897sik55at0.apps.googleusercontent.com",
          callback: handleGoogleLogin,
        });

        const loginBtn = document.getElementById("googleLoginBtn");
        const registerBtn = document.getElementById("googleRegisterBtn");
        if (loginBtn)
          window.google.accounts.id.renderButton(loginBtn, { theme: "filled_blue", size: "large", text: "signin_with" });
        if (registerBtn)
          window.google.accounts.id.renderButton(registerBtn, { theme: "filled_blue", size: "large", text: "signup_with" });

        return true;
      }
      return false;
    };

    if (!init()) {
      intervalId = setInterval(() => {
        if (init()) clearInterval(intervalId);
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [user]);

  // --- Redirect effect
  useEffect(() => {
    if (user && !authLoading) navigate("/map");
  }, [user, authLoading, navigate]);

  const toggleForm = () => setIsRegistering((s) => !s);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("regEmail") as HTMLInputElement).value;
    const password = (form.elements.namedItem("regPassword") as HTMLInputElement).value;
    const name = (form.elements.namedItem("regName") as HTMLInputElement).value;

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const u = userCredential.user;
      // Create the user document first
      await setDoc(doc(db, "users", u.uid), { 
        name, 
        email, 
        points: 0, 
        inventory: [], 
        isAdmin: false 
      });
      // Sign out the user to prevent auto-login
      await auth.signOut();
      toast.success("Account created successfully. Please sign in.", { position: "top-center" });
      // Switch to login form
      setIsRegistering(false);
    } catch (err: any) {
      toast.error("An error occurred while signing up: " + (err?.message || err), { position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("loginEmail") as HTMLInputElement).value;
    const password = (form.elements.namedItem("loginPassword") as HTMLInputElement).value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const u = userCredential.user;
      const userDocRef = doc(db, "users", u.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists())
        await setDoc(userDocRef, { name: u.displayName || email.split("@")[0], email: u.email, points: 0, inventory: [], isAdmin: false });

      const userData = userDoc.exists()
        ? userDoc.data()
        : { name: u.displayName || email.split("@")[0], email: u.email, points: 0, inventory: [], isAdmin: false };

      login({ uid: u.uid, displayName: (userData as any).name, email: u.email, isAdmin: (userData as any).isAdmin || false });
      toast.success("User logged in successfully", { position: "top-center" });
      navigate("/map");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found")
        toast.error("Incorrect email or password", { position: "top-center" });
      else if (err.code === "auth/too-many-requests")
        toast.error("Too many failed attempts. Please try again later.", { position: "top-center" });
      else toast.error("Login failed: " + (err?.message || err), { position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Loading state UI
  if (authLoading)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </main>
      </div>
    );

  // --- Redirect state UI  
  if (user)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting to map...</p>
          </div>
        </main>
      </div>
    );

  // --- Main UI
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center">
                {isRegistering ? <UserPlus className="w-8 h-8 text-primary-foreground" /> : <LogIn className="w-8 h-8 text-primary-foreground" />}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{isRegistering ? "Join NAVIGO" : "Welcome Back"}</h1>
            <p className="text-muted-foreground">{isRegistering ? "Create your account to start exploring campus" : "Sign in to continue your adventure"}</p>
          </div>

          <Card className="bg-gradient-card shadow-card-custom border-border/50">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{isRegistering ? "Create Account" : "Sign In"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRegistering ? (
                <form id="registerForm" onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Input type="text" id="regName" name="regName" placeholder="Your name" className="w-full" required disabled={isLoading} />
                    <Input type="email" id="regEmail" name="regEmail" placeholder="Email" className="w-full" required disabled={isLoading} />
                    <Input type="password" id="regPassword" name="regPassword" placeholder="Create password" className="w-full" required disabled={isLoading} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div id="googleRegisterBtn" className="w-full flex justify-center" />
                  </div>
                </form>
              ) : (
                <form id="loginForm" onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input type="email" id="loginEmail" name="loginEmail" placeholder="Email address" className="w-full" required disabled={isLoading} />
                    <Input type="password" id="loginPassword" name="loginPassword" placeholder="Password" className="w-full" required disabled={isLoading} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div id="googleLoginBtn" className="w-full flex justify-center" />
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="ghost" onClick={toggleForm} className="text-muted-foreground hover:text-foreground" disabled={isLoading}>
              {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-6 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} NAVIGO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}