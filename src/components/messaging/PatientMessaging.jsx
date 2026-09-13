import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Send, MessageSquare, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function PatientMessaging({ patient, user }) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef(null);

  const messagingEnabled = patient?.messaging_enabled ?? false;

  const { data: messages = [] } = useQuery({
    queryKey: ['my-messages', patient?.id],
    queryFn: () => base44.entities.Message.filter({ patient_id: patient.id }, 'created_date'),
    enabled: !!patient?.id && messagingEnabled,
    refetchInterval: 10000,
  });

  // Mark unread clinician messages as read by patient
  useEffect(() => {
    if (!messagingEnabled) return;
    const unread = messages.filter(m => m.sender_role === 'clinician' && !m.read_by_patient);
    unread.forEach(m => base44.entities.Message.update(m.id, { read_by_patient: true }));
  }, [messages, messagingEnabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      patient_id: patient.id,
      clinic_id: patient.clinic_id,
      sender_role: 'patient',
      sender_name: user?.full_name || 'Patient',
      content,
      read_by_clinician: false,
      read_by_patient: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-messages', patient?.id] });
      setNewMessage('');
    },
  });

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    sendMessageMutation.mutate(trimmed);
  };

  const unreadCount = messages.filter(m => m.sender_role === 'clinician' && !m.read_by_patient).length;

  if (!messagingEnabled) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="text-sm font-medium text-slate-600 mb-1">Messaging not available</p>
        <p className="text-xs text-slate-400">Your clinician hasn't enabled messaging yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white">
        <MessageSquare className="w-5 h-5 text-purple-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Messages</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Secure & private
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Thread */}
      <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8 text-sm">
            Send your clinician a message — they'll respond as soon as they can.
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_role === 'patient';
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5",
                isMe
                  ? "bg-purple-600 text-white rounded-br-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
              )}>
                {!isMe && <p className="text-xs font-semibold mb-1 text-purple-700">{msg.sender_name}</p>}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={cn("text-[10px] mt-1 opacity-60", isMe ? "text-right" : "text-left")}>
                  {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 flex gap-2 items-end">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder="Ask your clinician a question..."
          className="rounded-xl resize-none flex-1 min-h-[44px] max-h-24"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 w-11 p-0 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}