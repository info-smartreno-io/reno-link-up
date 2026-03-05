import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, Mic, Square, Loader2, Play, Pause } from "lucide-react";
import { VideoVoiceCommands } from "./VideoVoiceCommands";

interface VoiceCommand {
  timestamp: number;
  command: string;
  type: 'room' | 'damage' | 'measurement' | 'note';
  value: string;
}

interface VideoRecorderProps {
  walkthroughId: string;
  onVideoSaved?: () => void;
}

export const VideoRecorder = ({ walkthroughId, onVideoSaved }: VideoRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [videoNotes, setVideoNotes] = useState("");
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [roomTags, setRoomTags] = useState<string[]>([]);
  const [damageNotes, setDamageNotes] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordedChunks(chunks);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      toast.success("Recording stopped");
    }
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    setVoiceCommands(prev => [...prev, command]);

    switch (command.type) {
      case 'room':
        if (!roomTags.includes(command.value)) {
          setRoomTags(prev => [...prev, command.value]);
        }
        break;
      case 'damage':
        setDamageNotes(prev => [...prev, command.value]);
        break;
      case 'measurement':
        setMeasurements(prev => [...prev, command.value]);
        break;
      case 'note':
        setVideoNotes(prev => prev ? `${prev}\n${command.value}` : command.value);
        break;
    }
  };

  const transcribeAudio = async () => {
    if (recordedChunks.length === 0) {
      toast.error("No recording to transcribe");
      return;
    }

    setIsTranscribing(true);

    try {
      const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          setTranscription(data.text);
          setVideoNotes(data.text);
          toast.success("Audio transcribed successfully!");
        } else {
          throw new Error("No transcription returned");
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const saveVideo = async () => {
    if (!recordedVideoUrl || recordedChunks.length === 0) {
      toast.error("No video to save");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: walkthrough, error: walkthroughError } = await supabase
        .from('walkthroughs')
        .select('walkthrough_number')
        .eq('id', walkthroughId)
        .single();

      if (walkthroughError) throw walkthroughError;

      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const fileName = `video-${Date.now()}.webm`;
      const filePath = `${walkthrough.walkthrough_number}/${fileName}`;

      // Compile all notes
      const compiledNotes = [
        videoNotes,
        transcription,
        roomTags.length > 0 ? `Rooms: ${roomTags.join(', ')}` : '',
        damageNotes.length > 0 ? `Damage: ${damageNotes.join('; ')}` : '',
        measurements.length > 0 ? `Measurements: ${measurements.join(', ')}` : ''
      ].filter(Boolean).join('\n\n');

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('walkthrough-photos')
        .upload(filePath, videoBlob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('walkthrough_photos')
        .insert({
          walkthrough_id: walkthroughId,
          user_id: user.id,
          file_path: filePath,
          file_name: fileName,
          category: roomTags.length > 0 ? roomTags[0] : 'video',
          notes: compiledNotes || null
        });

      if (dbError) throw dbError;

      toast.success("Video saved successfully!");
      
      // Reset state
      setRecordedVideoUrl(null);
      setRecordedChunks([]);
      setTranscription("");
      setVideoNotes("");
      setVoiceCommands([]);
      setRoomTags([]);
      setDamageNotes([]);
      setMeasurements([]);
      
      onVideoSaved?.();
    } catch (error) {
      console.error("Error saving video:", error);
      toast.error("Failed to save video");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Video Walkthrough with Voice Commands</h3>
      </div>

      {/* Voice Commands Component */}
      <VideoVoiceCommands 
        isRecording={isRecording} 
        onCommandDetected={handleVoiceCommand}
      />

      {/* Video Preview */}
      <Card className="p-4 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isRecording}
          controls={!isRecording && !!recordedVideoUrl}
          src={recordedVideoUrl || undefined}
          className="w-full h-auto max-h-96 rounded-lg"
        />
      </Card>

      {/* Recording Controls */}
      <div className="flex gap-2 justify-center">
        {!isRecording && !recordedVideoUrl && (
          <Button onClick={startRecording} className="gap-2">
            <Video className="h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button onClick={stopRecording} variant="destructive" className="gap-2">
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {recordedVideoUrl && !isRecording && (
          <>
            <Button onClick={transcribeAudio} disabled={isTranscribing} variant="outline" className="gap-2">
              {isTranscribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Transcribe Audio
                </>
              )}
            </Button>

            <Button onClick={startRecording} variant="outline" className="gap-2">
              <Video className="h-4 w-4" />
              Record New
            </Button>
          </>
        )}
      </div>

      {/* Transcription and Notes */}
      {recordedVideoUrl && (
        <Card className="p-4 flex flex-col gap-3">
          {/* Command Summary */}
          {(roomTags.length > 0 || damageNotes.length > 0 || measurements.length > 0) && (
            <div className="flex flex-col gap-2 pb-3 border-b">
              <Label className="text-sm font-semibold">Voice Command Summary</Label>
              
              {roomTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <Label className="text-xs text-muted-foreground w-full">Rooms:</Label>
                  {roomTags.map((room, idx) => (
                    <Badge key={idx} variant="default">{room}</Badge>
                  ))}
                </div>
              )}

              {measurements.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <Label className="text-xs text-muted-foreground w-full">Measurements:</Label>
                  {measurements.map((measurement, idx) => (
                    <Badge key={idx} variant="secondary">{measurement}</Badge>
                  ))}
                </div>
              )}

              {damageNotes.length > 0 && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Damage Notes:</Label>
                  {damageNotes.map((note, idx) => (
                    <div key={idx} className="text-xs p-1.5 bg-destructive/10 rounded">
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Video Notes {transcription && "(Auto-transcribed)"}</Label>
            <Textarea
              value={videoNotes}
              onChange={(e) => setVideoNotes(e.target.value)}
              placeholder="Add notes about this video or use the transcribe button to auto-generate from audio..."
              rows={4}
              className="resize-none"
            />
          </div>

          <Button onClick={saveVideo} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Video to Walkthrough"
            )}
          </Button>
        </Card>
      )}
    </div>
  );
};
