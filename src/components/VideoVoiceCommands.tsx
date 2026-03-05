import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceCommand {
  timestamp: number;
  command: string;
  type: 'room' | 'damage' | 'measurement' | 'note';
  value: string;
}

interface VideoVoiceCommandsProps {
  isRecording: boolean;
  onCommandDetected: (command: VoiceCommand) => void;
}

export const VideoVoiceCommands = ({ isRecording, onCommandDetected }: VideoVoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const recognitionRef = useRef<any>(null);

  const ROOM_KEYWORDS = ['kitchen', 'bathroom', 'bedroom', 'living room', 'dining room', 'basement', 'garage', 'hallway', 'office', 'laundry room'];
  const DAMAGE_KEYWORDS = ['damage', 'crack', 'leak', 'stain', 'broken', 'worn', 'damaged', 'water damage', 'mold'];
  const MEASUREMENT_PATTERN = /(\d+\.?\d*)\s*(feet|foot|ft|inches|inch|in|meters|meter|m)/i;

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Voice commands not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setRecognizedText(finalTranscript);
        parseCommand(finalTranscript.trim());
      } else {
        setRecognizedText(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isRecording && isListening) {
        recognition.start(); // Restart if still recording
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording && recognitionRef.current) {
      startListening();
    } else {
      stopListening();
    }
  }, [isRecording]);

  const parseCommand = (text: string) => {
    const lowerText = text.toLowerCase();
    const timestamp = Date.now();

    // Check for room tag
    for (const room of ROOM_KEYWORDS) {
      if (lowerText.includes(room)) {
        const command: VoiceCommand = {
          timestamp,
          command: text,
          type: 'room',
          value: room
        };
        addCommand(command);
        toast.success(`Room tagged: ${room}`);
        return;
      }
    }

    // Check for damage note
    for (const damageWord of DAMAGE_KEYWORDS) {
      if (lowerText.includes(damageWord)) {
        const command: VoiceCommand = {
          timestamp,
          command: text,
          type: 'damage',
          value: text
        };
        addCommand(command);
        toast.success("Damage noted");
        return;
      }
    }

    // Check for measurement
    const measurementMatch = text.match(MEASUREMENT_PATTERN);
    if (measurementMatch) {
      const [, value, unit] = measurementMatch;
      const command: VoiceCommand = {
        timestamp,
        command: text,
        type: 'measurement',
        value: `${value} ${unit}`
      };
      addCommand(command);
      toast.success(`Measurement: ${value} ${unit}`);
      return;
    }

    // Generic note
    if (lowerText.includes('note') || lowerText.length > 10) {
      const command: VoiceCommand = {
        timestamp,
        command: text,
        type: 'note',
        value: text
      };
      addCommand(command);
      toast.success("Note added");
    }
  };

  const addCommand = (command: VoiceCommand) => {
    setCommands(prev => [...prev, command]);
    onCommandDetected(command);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Voice commands active");
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  if (!isRecording) return null;

  return (
    <Card className="p-4 bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isListening ? (
            <Mic className="h-4 w-4 text-primary animate-pulse" />
          ) : (
            <MicOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Label className="text-sm font-semibold">
            Voice Commands {isListening && "(Listening)"}
          </Label>
        </div>
        {isListening && <Volume2 className="h-4 w-4 text-primary animate-pulse" />}
      </div>

      {recognizedText && (
        <div className="mb-3 p-2 bg-muted rounded text-sm">
          <Label className="text-xs text-muted-foreground">Recognized:</Label>
          <p className="text-sm">{recognizedText}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">Available Commands:</Label>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">Say room name to tag</Badge>
          <Badge variant="outline" className="text-xs">Say "damage" + description</Badge>
          <Badge variant="outline" className="text-xs">Say measurements (e.g., "10 feet")</Badge>
          <Badge variant="outline" className="text-xs">Say "note" + your note</Badge>
        </div>
      </div>

      {commands.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Detected Commands ({commands.length}):
          </Label>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {commands.slice(-5).reverse().map((cmd, idx) => (
              <div key={idx} className="text-xs p-1.5 bg-muted rounded">
                <Badge variant={
                  cmd.type === 'room' ? 'default' :
                  cmd.type === 'damage' ? 'destructive' :
                  cmd.type === 'measurement' ? 'secondary' : 'outline'
                } className="text-xs mr-2">
                  {cmd.type}
                </Badge>
                <span>{cmd.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
