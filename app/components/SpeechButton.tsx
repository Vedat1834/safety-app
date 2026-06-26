"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

export default function SpeechButton({ onResult, className = "" }: { onResult: (text: string) => void; className?: string }) {
    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(false);
    const [recognition, setRecognition] = useState<any>(null);
    const onResultRef = useRef(onResult);

    // Keep onResult callback reference updated without re-running initialization effect
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    // Keep ref in sync to avoid stale closures in recognition callbacks
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true; // Keep listening even when the user pauses
            rec.interimResults = false;
            rec.lang = 'tr-TR';

            rec.onstart = () => {
                setIsListening(true);
            };

            rec.onresult = (event: any) => {
                let newText = "";
                // Loop only through newly finalized results
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        newText += event.results[i][0].transcript + " ";
                    }
                }
                if (newText.trim()) {
                    onResultRef.current(newText.trim());
                }
            };

            rec.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);
                if (event.error === 'no-speech' && isListeningRef.current) {
                    return; // Ignore no-speech error to keep listening
                }
                setIsListening(false);
            };

            rec.onend = () => {
                // If browser stops recognition (due to mobile OS pause detection) but user hasn't clicked Stop, auto-restart!
                if (isListeningRef.current) {
                    setTimeout(() => {
                        if (isListeningRef.current) {
                            try {
                                rec.start();
                            } catch (e) {
                                console.error("Auto-restart failed:", e);
                                setIsListening(false);
                            }
                        }
                    }, 100);
                } else {
                    setIsListening(false);
                }
            };

            setRecognition(rec);

            return () => {
                try {
                    rec.stop();
                } catch (e) {
                    console.error("Cleanup stop failed:", e);
                }
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            alert("Cihazınızda sesle yazma desteklenmiyor. Lütfen Android Chrome veya güncel bir tarayıcı kullanın.");
            return;
        }

        if (isListening) {
            isListeningRef.current = false;
            setIsListening(false);
            try {
                recognition.stop();
            } catch (e) {
                console.error(e);
            }
        } else {
            isListeningRef.current = true;
            setIsListening(true);
            try {
                recognition.start();
            } catch (e) {
                console.error(e);
                setIsListening(false);
            }
        }
    };

    if (!recognition) return null;

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`p-1 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border ${
                isListening 
                    ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                    : 'bg-white text-gray-500 hover:text-yellow-600 border-gray-200 hover:border-[#FFD600]'
            } ${className}`}
            title={isListening ? "Dinleme Açık. Durdurmak için basın" : "Sesle Yaz"}
        >
            <Mic className="size-3" />
            {isListening ? "Durdur" : "Sesle Yaz"}
        </button>
    );
}
