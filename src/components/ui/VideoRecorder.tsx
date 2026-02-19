import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Video, Square, RotateCcw, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoRecorderProps {
  onSave: (content: string, videoBlob: Blob) => Promise<void>;
  orderId: string;
}

export function VideoRecorder({ onSave, orderId }: VideoRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      setIsRecording(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Reset recording
  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedUrl('');
    setContent('');
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  }, [recordedUrl]);

  // Save comment with video
  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!recordedBlob) {
      toast({
        title: "Video Required",
        description: "Please record a video before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Starting save process...');
      console.log('Content:', content);
      console.log('Video blob size:', recordedBlob.size);
      
      // Upload video to Supabase Storage and save comment
      await onSave(content, recordedBlob);
      
      toast({
        title: "Success",
        description: "Comment and video saved successfully!",
      });
      
      resetRecording();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: `Failed to save comment and video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [stopCamera, recordedUrl]);

  return (
    <div className="space-y-4">{/* Camera Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
        />
        
        {/* Camera Controls */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={startCamera} size="lg">
              <Camera className="h-5 w-5 mr-2" />
              Start Camera
            </Button>
          </div>
        )}
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Recording...
          </div>
        )}
      </div>

      {/* Recording Controls */}
      {isCameraActive && (
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button onClick={startRecording} variant="destructive" size="lg">
              <Video className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" size="lg">
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}
          
          <Button onClick={stopCamera} variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Stop Camera
          </Button>
        </div>
      )}

      {/* Recorded Video Preview */}
      {recordedUrl && (
        <div className="space-y-2">
          <Label>Recorded Video:</Label>
          <video
            src={recordedUrl}
            controls
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button onClick={resetRecording} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Record Again
          </Button>
        </div>
      )}

      {/* Comment Input */}
      <div className="space-y-2">
        <Label htmlFor="comment">Comment:</Label>
        <Textarea
          id="comment"
          placeholder="Enter your comment about this order..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </div>

      {/* Save Button */}
      {recordedBlob && content.trim() && (
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          <Upload className="h-5 w-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save Comment & Video'}
        </Button>
      )}
    </div>
  );
}
