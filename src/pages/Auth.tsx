
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/");
      }
    };
    
    checkUser();
    
    // Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigate("/");
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <header className="p-4 bg-slate-900 text-white">
          <h1 className="text-xl font-bold">Code Snippet Explorer</h1>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6">Welcome to Code Snippet Explorer</h2>
            <AuthForm />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
