import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  status: string;
  created_by: string;
  google_calendar_id: string | null;
}

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
    } else {
      setCurrentUserId(session.user.id);
    }
  };

  const fetchEvents = async () => {
    try {
      // Fetch all approved events
      const { data: approvedEvents, error: approvedError } = await supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .order("event_date", { ascending: true });

      if (approvedError) throw approvedError;

      // Fetch current user's events
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userEvents, error: userError } = await supabase
          .from("events")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        if (userError) throw userError;
        setMyEvents(userEvents || []);
      }

      setEvents(approvedEvents || []);
    } catch (error: any) {
      toast({
        title: "Error fetching events",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("events")
        .insert({
          title: eventTitle,
          description: eventDescription,
          event_date: eventDate,
          event_time: eventTime,
          created_by: user.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Event request submitted!",
        description: "Your event is pending approval.",
      });

      setShowRequestForm(false);
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventTime("");
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "Your event request has been removed.",
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getEventsForSelectedDate = () => {
    if (!date) return [];
    const selectedDate = format(date, "yyyy-MM-dd");
    return events.filter((event) => event.event_date === selectedDate);
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
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
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
                <div className="mt-6 space-y-2">
                  <p className="text-center font-semibold text-foreground">
                    {format(date, "PPP")}
                  </p>
                  <div className="space-y-2">
                    {getEventsForSelectedDate().length > 0 ? (
                      getEventsForSelectedDate().map((event) => (
                        <div
                          key={event.id}
                          className="p-3 bg-muted rounded-lg border border-border"
                        >
                          <p className="font-semibold text-foreground">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.event_time}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        No events scheduled
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* My Event Requests */}
            <Card className="p-8 bg-card border-border">
              <h2 className="text-2xl font-bold text-foreground mb-6">My Event Requests</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {myEvents.length > 0 ? (
                  myEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 bg-muted rounded-lg border border-border space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{event.title}</p>
                            {getStatusIcon(event.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(parseISO(event.event_date), "PPP")} at {event.event_time}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 capitalize">
                            Status: {event.status}
                          </p>
                        </div>
                        {event.status === "pending" && (
                          <Button
                            onClick={() => handleDeleteEvent(event.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No event requests yet
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Request Event Button/Form */}
          {!showRequestForm ? (
            <Button
              onClick={() => setShowRequestForm(true)}
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
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

          {/* Upcoming Events List */}
          <Card className="p-8 bg-card border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Approved Events</h2>
            <div className="space-y-3">
              {events.length > 0 ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-muted rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(parseISO(event.event_date), "PPP")} at {event.event_time}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming events scheduled
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Events;
