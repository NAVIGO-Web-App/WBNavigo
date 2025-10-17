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
  UserCredential
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, UserPlus, LogIn, Loader } from "lucide-react";

// Extend Window interface to include Google properties
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            theme: string;
            size: string;
            text: string;
          }) => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential: string;
}

function SignUpPage() {
  const navigate = useNavigate();
  const { user, login, isLoading: authLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/map");
    }
  }, [user, authLoading, navigate]);

  const toggleForm = () => setIsRegistering(!isRegistering);

  // Show loading while checking auth state
  if (authLoading) {
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
  }

  // Don't render the login page if user is authenticated (will redirect)
  if (user) {
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
  }

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('regEmail') as HTMLInputElement).value;
    const password = (form.elements.namedItem('regPassword') as HTMLInputElement).value;
    const name = (form.elements.namedItem('regName') as HTMLInputElement).value;

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;
      
      await setDoc(doc(db, "users", uid), {
        name: name,
        email: email,
        points: 0,
        inventory: [],
        isAdmin: false,
      });
      
      login({
        uid: user.uid,
        displayName: name,
        email: user.email,
        isAdmin: false
      });
      
      toast.success("Signed Up Successfully", {
        position: "top-center",
      });
      navigate("/map");
    } catch (error: any) {
      toast.error("An error occured while signing up " + error.message, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('loginEmail') as HTMLInputElement).value;
    const password = (form.elements.namedItem('loginPassword') as HTMLInputElement).value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user document from Firestore to ensure it exists and get user data
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist (for backward compatibility)
        await setDoc(userDocRef, {
          name: user.displayName || email.split('@')[0],
          email: user.email,
          points: 0,
          inventory: [],
          isAdmin: false,
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : {
        name: user.displayName || email.split('@')[0],
        email: user.email,
        points: 0,
        inventory: [],
        isAdmin: false,
      };
      
      login({
        uid: user.uid,
        displayName: userData.name,
        email: user.email,
        isAdmin: userData.isAdmin || false
      });
      
      toast.success("User logged in successfully", {
        position: "top-center",
      });
      navigate("/map");
    } catch (error: any) {
      console.error("Login error:", error);
      
      // More specific error messages
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/wrong-password' || 
          error.code === 'auth/user-not-found') {
        toast.error("Incorrect email or password", {
          position: "top-center",
        });
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many failed attempts. Please try again later.", {
          position: "top-center",
        });
      } else {
        toast.error("Login failed: " + error.message, {
          position: "top-center",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (response: GoogleCredentialResponse) => {
    setIsLoading(true);
    const credential = GoogleAuthProvider.credential(response.credential);
    try {
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        points: 0,
        inventory: [],
        isAdmin: false,
      }, { merge: true });
      
      login({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        isAdmin: false
      });
      
      toast.success(`Welcome ${user.displayName}`, {
        position: "top-center",
      });
      navigate("/map");
    } catch (error: any) {
      toast.error("Google sign-in failed: " + error.message, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only initialize Google Sign-In if user is not authenticated
    if (user) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    let intervalId: NodeJS.Timeout;

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: "58284097478-u3nc9o5bkoj5bkj7ls1me897sik55at0.apps.googleusercontent.com",
          callback: handleGoogleLogin,
        });

        const googleLoginBtn = document.getElementById("googleLoginBtn");
        const googleRegisterBtn = document.getElementById("googleRegisterBtn");

        if (googleLoginBtn) {
          window.google.accounts.id.renderButton(
            googleLoginBtn,
            { theme: "filled_blue", size: "large", text: "signin_with" }
          );
        }

        if (googleRegisterBtn) {
          window.google.accounts.id.renderButton(
            googleRegisterBtn,
            { theme: "filled_blue", size: "large", text: "signup_with" }
          );
        }

        return true;
      }
      return false;
    };

    if (!initializeGoogleSignIn()) {
      intervalId = setInterval(() => {
        if (initializeGoogleSignIn()) {
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Clean up the script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [user]); // Only re-run if user changes

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center">
                {isRegistering ? (
                  <UserPlus className="w-8 h-8 text-primary-foreground" />
                ) : (
                  <LogIn className="w-8 h-8 text-primary-foreground" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isRegistering ? "Join NAVIGO" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground">
              {isRegistering
                ? "Create your account to start exploring campus"
                : "Sign in to continue your adventure"}
            </p>
          </div>

          {/* Form Card */}
          <Card className="bg-gradient-card shadow-card-custom border-border/50">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">
                {isRegistering ? "Create Account" : "Sign In"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRegistering ? (
                <form id="registerForm" onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      id="regName"
                      name="regName"
                      placeholder="Your name"
                      className="w-full"
                      required
                      disabled={isLoading}
                    />
                    <Input
                      type="email"
                      id="regEmail"
                      name="regEmail"
                      placeholder="Email address"
                      className="w-full"
                      required
                      disabled={isLoading}
                    />
                    <Input
                      type="password"
                      id="regPassword"
                      name="regPassword"
                      placeholder="Create password"
                      className="w-full"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
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
                    <div id="googleRegisterBtn" className="w-full flex justify-center"></div>
                  </div>
                </form>
              ) : (
                <form id="loginForm" onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      id="loginEmail"
                      name="loginEmail"
                      placeholder="Email address"
                      className="w-full"
                      required
                      disabled={isLoading}
                    />
                    <Input
                      type="password"
                      id="loginPassword"
                      name="loginPassword"
                      placeholder="Password"
                      className="w-full"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
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
                    <div id="googleLoginBtn" className="w-full flex justify-center"></div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Toggle Form */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={toggleForm}
              className="text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {isRegistering 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Sign Up"}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} NAVIGO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default SignUpPage;