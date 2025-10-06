import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Dumbbell, DoorOpen, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Events",
      description: "View calendar and host events",
      icon: Calendar,
      path: "/events",
    },
    {
      title: "Personal Training",
      description: "Book your training sessions",
      icon: Dumbbell,
      path: "/personal-training",
    },
    {
      title: "Room Booking",
      description: "Reserve club rooms",
      icon: DoorOpen,
      path: "/room-booking",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-primary">6713</h1>
            <p className="text-sm text-muted-foreground">Members Dashboard</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {menuItems.map((item) => (
            <Card
              key={item.title}
              onClick={() => navigate(item.path)}
              className="p-8 cursor-pointer bg-card border-border hover:border-primary transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-muted group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{item.title}</h2>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
