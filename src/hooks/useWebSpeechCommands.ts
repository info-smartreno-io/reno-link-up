import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface WebSpeechCommandsProps {
  onAddMeasurement: (measurement: string) => void;
  onAddPhotoNote: (note: string) => void;
  onMarkIssue: (issue: string) => void;
  onAddToDescription: (text: string) => void;
  onCapturePhoto: () => void;
  enableVoiceConfirmation?: boolean;
}

export function useWebSpeechCommands({
  onAddMeasurement,
  onAddPhotoNote,
  onMarkIssue,
  onAddToDescription,
  onCapturePhoto,
  enableVoiceConfirmation = true,
}: WebSpeechCommandsProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!enableVoiceConfirmation || !('speechSynthesis' in window)) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    
    utterance.onstart = () => {
      console.log('Voice confirmation started:', text);
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('Voice confirmation ended');
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [enableVoiceConfirmation]);

  const parseCommand = useCallback((transcript: string) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('Processing speech:', lowerTranscript);

    // Capture photo commands
    if (lowerTranscript.includes('capture photo') || 
        lowerTranscript.includes('take photo') ||
        lowerTranscript.includes('take picture') ||
        lowerTranscript.includes('capture picture')) {
      console.log('Executing: capture photo');
      onCapturePhoto();
      setLastCommand('Photo captured');
      speak('Photo captured');
      toast({
        title: 'Photo Captured',
        description: 'Photo taken via voice command',
      });
      return true;
    }

    // Add measurement commands
    if (lowerTranscript.includes('add measurement') || lowerTranscript.includes('measurement')) {
      const measurementMatch = lowerTranscript.match(/(?:add measurement|measurement)\s+(.+)/i);
      if (measurementMatch && measurementMatch[1]) {
        const measurement = measurementMatch[1].trim();
        console.log('Executing: add measurement -', measurement);
        onAddMeasurement(measurement);
        setLastCommand(`Measurement: ${measurement}`);
        speak(`Measurement added: ${measurement}`);
        toast({
          title: 'Measurement Added',
          description: measurement,
        });
        return true;
      }
    }

    // Add photo note commands
    if (lowerTranscript.includes('add photo note') || lowerTranscript.includes('photo note')) {
      const noteMatch = lowerTranscript.match(/(?:add photo note|photo note)\s+(.+)/i);
      if (noteMatch && noteMatch[1]) {
        const note = noteMatch[1].trim();
        console.log('Executing: add photo note -', note);
        onAddPhotoNote(note);
        setLastCommand(`Photo note: ${note}`);
        speak('Photo note added');
        toast({
          title: 'Photo Note Added',
          description: note,
        });
        return true;
      }
    }

    // Mark issue commands
    if (lowerTranscript.includes('mark issue') || lowerTranscript.includes('issue')) {
      const issueMatch = lowerTranscript.match(/(?:mark issue|issue)\s+(.+)/i);
      if (issueMatch && issueMatch[1]) {
        const issue = issueMatch[1].trim();
        console.log('Executing: mark issue -', issue);
        onMarkIssue(issue);
        setLastCommand(`Issue: ${issue}`);
        speak('Issue marked');
        toast({
          title: 'Issue Marked',
          description: issue,
        });
        return true;
      }
    }

    // Add note commands
    if (lowerTranscript.includes('add note') || lowerTranscript.includes('note')) {
      const noteMatch = lowerTranscript.match(/(?:add note|note)\s+(.+)/i);
      if (noteMatch && noteMatch[1]) {
        const note = noteMatch[1].trim();
        console.log('Executing: add note -', note);
        onAddToDescription(note);
        setLastCommand(`Note: ${note}`);
        speak('Note added');
        toast({
          title: 'Note Added',
          description: note,
        });
        return true;
      }
    }

    return false;
  }, [onAddMeasurement, onAddPhotoNote, onMarkIssue, onAddToDescription, onCapturePhoto, toast, speak]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser',
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      toast({
        title: 'Listening',
        description: 'Say commands like "add measurement", "capture photo", or "mark issue"',
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      console.log('Speech recognized:', transcript);
      parseCommand(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
        return;
      }
      
      if (event.error !== 'aborted') {
        toast({
          title: 'Recognition Error',
          description: event.error === 'not-allowed' 
            ? 'Microphone access denied' 
            : `Error: ${event.error}`,
          variant: 'destructive',
        });
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      if (isListening) {
        console.log('Restarting recognition...');
        recognition.start();
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: 'Error',
        description: 'Failed to start speech recognition',
        variant: 'destructive',
      });
    }
  }, [toast, parseCommand, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setLastCommand('');
      
      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      
      toast({
        title: 'Stopped Listening',
        description: 'Voice commands disabled',
      });
    }
  }, [toast]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    lastCommand,
    startListening,
    stopListening,
  };
}
