import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeechRecognition(
  onSpeechResult: (text: string) => void,
  watchMessage: string
) {
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const previousTextRef = useRef("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceTranscriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
            
          setVoiceTranscript(transcript);
          voiceTranscriptRef.current = transcript;

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) recognitionRef.current.stop();
          }, 4000);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          
          if (voiceTranscriptRef.current) {
            onSpeechResult(previousTextRef.current + (previousTextRef.current ? " " : "") + voiceTranscriptRef.current);
          }
          setShowVoiceModal(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [onSpeechResult]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      previousTextRef.current = watchMessage;
      setVoiceTranscript("");
      voiceTranscriptRef.current = "";
      setShowVoiceModal(true);
      try {
        recognitionRef.current.start();
        setIsListening(true);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) recognitionRef.current.stop();
        }, 4000);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isListening, watchMessage]);

  const cancelListening = useCallback(() => {
    voiceTranscriptRef.current = "";
    setVoiceTranscript("");
    setShowVoiceModal(false);
    if (isListening) {
      recognitionRef.current?.stop();
    }
  }, [isListening]);

  const confirmListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (voiceTranscriptRef.current) {
        onSpeechResult(previousTextRef.current + (previousTextRef.current ? " " : "") + voiceTranscriptRef.current);
      }
      setShowVoiceModal(false);
    }
  }, [isListening, onSpeechResult]);

  const resetVoiceState = useCallback(() => {
    if (isListening || showVoiceModal) {
      voiceTranscriptRef.current = "";
      setVoiceTranscript("");
      setShowVoiceModal(false);
      recognitionRef.current?.stop();
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }
  }, [isListening, showVoiceModal]);

  return {
    isListening,
    showVoiceModal,
    voiceTranscript,
    toggleListening,
    cancelListening,
    confirmListening,
    resetVoiceState
  };
}
