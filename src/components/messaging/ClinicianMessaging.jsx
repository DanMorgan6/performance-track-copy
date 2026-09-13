import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Send, MessageSquare, Lock, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function ClinicianMessaging({ patient, patientId }) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef(null);

  const messagingEnabled = patient?.messaging_enabled ?? false;

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', patientId],
    queryFn: () => base44.entities.Message.filter({ patient_id: patientId }, 'created_date'),
    enabled: !!patientId && messagingEnabled,
    refetchInterval: 10000, // Poll every 10s
  });

  // Mark unread patient messages as read
  useEffect(() => {
    if (!messagingEnabled) return;
    const unread = messages.filter(m => m.sender_role === 'patient' && !m.read_by_clinician);
    unread.forEach(m => base44.entities.Message.update(m.id, { read_by_clinician: true }));
  }, [messages, messagingEnabled]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMessagingMutation = useMutation({
    mutationFn: (enabled) => base44.entities.Patient.update(patientId, { messaging_enabled: enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient', patientId] }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const user = await base44.auth.me();
      return base44.entities.Message.create({
        patient_id: patientId,
        clinic_id: patient.clinic_id,
        sender_role: 'clinician',
        sender_name: user.full_name,
        content,
        read_by_clinician: true,
        read_by_patient: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', patientId] });
      setNewMessage('');
    },
  });

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    sendMessageMutation.mutate(trimmed);
  };

  const unreadCount = messages.filter(m => m.sender_role === 'patient' && !m.read_by_clinician).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-semibold text-slate-800">Patient Messaging</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3" /> Secure in-app messaging
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{messagingEnabled ? 'Enabled' : 'Disabled'}</span>
          <button
            onClick={() => toggleMessagingMutation.mutate(!messagingEnabled)}
            disabled={toggleMessagingMutation.isPending}
            className="text-slate-400 hover:text-purple-600 transition-colors"
            title={messagingEnabled ? 'Disable messaging for this patient' : 'Enable messaging for this patient'}
          >
            {messagingEnabled
              ? <ToggleRight className="w-8 h-8 text-purple-600" />
              : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {!messagingEnabled ? (
        <div className="p-10 text-center text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-slate-600 mb-1">Messaging is disabled</p>
          <p className="text-xs text-slate-400 mb-4">Toggle on to enable secure messaging with {patient?.full_name}</p>
          <Button
            onClick={() => toggleMessagingMutation.mutate(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            size="sm"
          >
            Enable Messaging
          </Button>
        </div>
      ) : (
        <>
          {/* Message thread */}
          <div className="h-80 overflow-y-auto p-5 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">
                No messages yet. Start the conversation.
              </div>
            )}
            {messages.map((msg) => {
              const isClinician = msg.sender_role === 'clinician';
              return (
                <div key={msg.id} className={cn("flex", isClinician ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    isClinician
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  )}>
                    <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={cn("text-[10px] mt-1 opacity-60", isClinician ? "text-right" : "text-left")}>
                      {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 flex gap-3 items-end">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Type a message... (Enter to send)"
              className="rounded-xl resize-none min-h-[44px] max-h-28 flex-1"
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
        </>
      )}
    </div>
  );
}