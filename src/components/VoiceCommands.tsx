import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Cloud, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useWebSpeechCommands } from "@/hooks/useWebSpeechCommands";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VoiceCommandsProps {
  onAddMeasurement: (measurement: string) => void;
  onAddPhotoNote: (note: string) => void;
  onMarkIssue: (issue: string) => void;
  onAddToDescription: (text: string) => void;
  onCapturePhoto: () => void;
}

export function VoiceCommands({
  onAddMeasurement,
  onAddPhotoNote,
  onMarkIssue,
  onAddToDescription,
  onCapturePhoto,
}: VoiceCommandsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'cloud' | 'offline'>('offline');
  const [voiceConfirmation, setVoiceConfirmation] = useState(true);

  // Web Speech API (offline mode)
  const webSpeech = useWebSpeechCommands({
    onAddMeasurement,
    onAddPhotoNote,
    onMarkIssue,
    onAddToDescription,
    onCapturePhoto,
    enableVoiceConfirmation: voiceConfirmation,
  });

  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice assistant connected");
      toast({
        title: "Voice Assistant Ready",
        description: "Say commands like 'add measurement' or 'capture photo'",
      });
    },
    onDisconnect: () => {
      console.log("Voice assistant disconnected");
    },
    onError: (error) => {
      console.error("Voice assistant error:", error);
      toast({
        title: "Voice Assistant Error",
        description: typeof error === 'string' ? error : (error as any)?.message || "Failed to connect to voice assistant",
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log("Message from assistant:", message);
    },
    clientTools: {
      addMeasurement: (params: { measurement: string }) => {
        console.log("Adding measurement:", params.measurement);
        onAddMeasurement(params.measurement);
        toast({
          title: "Measurement Added",
          description: params.measurement,
        });
        return "Measurement recorded successfully";
      },
      addPhotoNote: (params: { note: string }) => {
        console.log("Adding photo note:", params.note);
        onAddPhotoNote(params.note);
        toast({
          title: "Photo Note Added",
          description: params.note,
        });
        return "Photo note added successfully";
      },
      markIssue: (params: { issue: string }) => {
        console.log("Marking issue:", params.issue);
        onMarkIssue(params.issue);
        toast({
          title: "Issue Marked",
          description: params.issue,
        });
        return "Issue marked successfully";
      },
      capturePhoto: () => {
        console.log("Capturing photo via voice command");
        onCapturePhoto();
        toast({
          title: "Photo Captured",
          description: "Photo taken via voice command",
        });
        return "Photo captured";
      },
      addNote: (params: { text: string }) => {
        console.log("Adding note:", params.text);
        onAddToDescription(params.text);
        toast({
          title: "Note Added",
          description: params.text,
        });
        return "Note added to description";
      },
    },
    overrides: {
      agent: {
        prompt: {
          prompt: `You are a voice assistant for property walkthrough documentation. 
          
Your job is to help estimators during property walkthroughs by executing commands through voice.

Available commands you can execute:
1. "Add measurement" - Use addMeasurement tool with the measurement details
2. "Add photo note" - Use addPhotoNote tool with the note text
3. "Mark issue" - Use markIssue tool with the issue description
4. "Capture photo" or "Take photo" - Use capturePhoto tool
5. "Add note" - Use addNote tool with the note text

When the user says a command, immediately execute the appropriate tool with the provided information.

Examples:
- User: "Add measurement 10 by 12 feet"
  You: Execute addMeasurement with "10 by 12 feet"
  
- User: "Take a photo"
  You: Execute capturePhoto
  
- User: "Mark issue water damage on ceiling"
  You: Execute markIssue with "water damage on ceiling"

Be concise and only confirm actions. Don't ask clarifying questions unless absolutely necessary.`,
        },
        firstMessage: "Voice commands ready. Say 'add measurement', 'capture photo', 'mark issue', or 'add note' followed by your details.",
        language: "en",
      },
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - clear and professional
      },
    },
  });

  const startVoiceCommands = useCallback(async () => {
    setIsLoading(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from our edge function
      // Note: You'll need to create an agent in ElevenLabs dashboard first
      // For now, using a placeholder - users need to create their agent and replace this ID
      const agentId = "REPLACE_WITH_YOUR_AGENT_ID"; // User needs to create this in ElevenLabs UI
      
      toast({
        title: "Setting up voice assistant...",
        description: "Creating conversational AI session",
      });

      const { data, error } = await supabase.functions.invoke('get-conversation-url', {
        body: { agentId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      console.log("Starting conversation with signed URL");
      
      await conversation.startSession({ 
        signedUrl: data.signedUrl 
      });

      setIsLoading(false);
    } catch (error: any) {
      console.error("Error starting voice commands:", error);
      setIsLoading(false);
      
      if (error.message?.includes("REPLACE_WITH_YOUR_AGENT_ID")) {
        toast({
          title: "Configuration Required",
          description: "Please create an ElevenLabs Conversational AI agent and update the agent ID in the code.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Voice Commands Error",
          description: error.message || "Failed to start voice assistant",
          variant: "destructive",
        });
      }
    }
  }, [conversation, toast, onAddMeasurement, onAddPhotoNote, onMarkIssue, onAddToDescription, onCapturePhoto]);

  const stopVoiceCommands = useCallback(async () => {
    await conversation.endSession();
    toast({
      title: "Voice Assistant Stopped",
      description: "Voice commands disabled",
    });
  }, [conversation, toast]);

  const { status, isSpeaking } = conversation;

  const isActive = mode === 'cloud' ? status === 'connected' : webSpeech.isListening;

  const handleStart = () => {
    if (mode === 'cloud') {
      startVoiceCommands();
    } else {
      webSpeech.startListening();
    }
  };

  const handleStop = () => {
    if (mode === 'cloud') {
      stopVoiceCommands();
    } else {
      webSpeech.stopListening();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Select value={mode} onValueChange={(value: 'cloud' | 'offline') => setMode(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="offline">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Offline Mode
              </div>
            </SelectItem>
            <SelectItem value="cloud">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Cloud AI
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {!isActive ? (
          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="gap-2"
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Enable Voice Commands
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStop}
              variant="destructive"
              className="gap-2"
            >
              <MicOff className="h-4 w-4" />
              Disable Voice Commands
            </Button>
            {mode === 'cloud' && isSpeaking && (
              <Badge variant="default" className="animate-pulse">
                AI Speaking
              </Badge>
            )}
            {mode === 'offline' && webSpeech.isListening && (
              <Badge variant="default" className="animate-pulse">
                {webSpeech.isSpeaking ? 'Speaking' : 'Listening'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {mode === 'offline' && (
        <div className="flex items-center gap-2">
          <Switch
            id="voice-confirmation"
            checked={voiceConfirmation}
            onCheckedChange={setVoiceConfirmation}
            disabled={webSpeech.isListening}
          />
          <Label htmlFor="voice-confirmation" className="text-sm">
            Voice confirmations
          </Label>
        </div>
      )}

      {mode === 'offline' && webSpeech.lastCommand && (
        <div className="text-sm text-muted-foreground">
          Last command: {webSpeech.lastCommand}
        </div>
      )}
    </div>
  );
}
