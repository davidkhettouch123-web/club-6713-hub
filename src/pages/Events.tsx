import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Here you would insert the event request into your database
      // For now, we'll just show a success message
      toast({
        title: "Event request submitted!",
        description: "We'll review your request and get back to you soon.",
      });

      setShowRequestForm(false);
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventTime("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Events</h1>
            <p className="text-sm text-muted-foreground">View and host club events</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-8 bg-card border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Event Calendar</h2>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border border-border"
              />
            </div>
            {date && (
              <p className="text-center mt-4 text-muted-foreground">
                Selected: {format(date, "PPP")}
              </p>
            )}
          </Card>

          {!showRequestForm ? (
            <Button
              onClick={() => setShowRequestForm(true)}
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
            >
              Request to Host an Event
            </Button>
          ) : (
            <Card className="p-8 bg-card border-border">
              <h2 className="text-2xl font-bold text-foreground mb-6">Request Event Hosting</h2>
              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">Event Title</Label>
                  <Input
                    id="title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                    className="bg-input border-border text-foreground"
                    placeholder="Enter event title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Event Description</Label>
                  <Textarea
                    id="description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    required
                    className="bg-input border-border text-foreground min-h-[100px]"
                    placeholder="Describe your event"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-foreground">Event Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-foreground">Event Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                  >
                    Submit Request
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Events;
