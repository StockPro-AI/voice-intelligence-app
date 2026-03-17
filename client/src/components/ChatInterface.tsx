import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, Volume2, Pause, Play } from "lucide-react";
import { Streamdown } from "streamdown";
import { useTTS } from "@/hooks/useTTS";


interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  message: string;
  createdAt?: Date;
}

interface ChatInterfaceProps {
  noteId: number;
  noteName?: string;
}

export function ChatInterface({ noteId, noteName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, pause, resume, stop, isPlaying, isPaused } = useTTS();

  // Fetch chat history
  const { data: chatHistory, isLoading: isLoadingHistory } =
    trpc.chat.getChatHistory.useQuery({ noteId });

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (response) => {
      const assistantMsg = typeof response.assistantMessage === "string" ? response.assistantMessage : JSON.stringify(response.assistantMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "user" as const,
          message: response.userMessage,
          createdAt: response.timestamp,
        },
        {
          role: "assistant" as const,
          message: assistantMsg,
          createdAt: response.timestamp,
        },
      ]);
      setInput("");
      setIsLoading(false);
      console.log("Message sent successfully");
    },
    onError: (error) => {
      setIsLoading(false);
      console.error("Failed to send message:", error);
    },
  });

  // Delete chat history mutation
  const deleteChatMutation = trpc.chat.deleteChatHistory.useMutation({
    onSuccess: () => {
      setMessages([]);
      console.log("Chat history cleared");
    },
    onError: (error) => {
      console.error("Failed to clear chat history:", error);
    },
  });

  // Initialize messages from chat history
  useEffect(() => {
    if (chatHistory) {
      const formattedMessages: ChatMessage[] = chatHistory.map((h) => ({
        id: h.id,
        role: h.role as "user" | "assistant",
        message: typeof h.message === "string" ? h.message : JSON.stringify(h.message),
        createdAt: h.createdAt,
      }));
      setMessages(formattedMessages);
    }
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    const messageText = input;
    sendMessageMutation.mutate({
      noteId,
      message: messageText,
    });
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      deleteChatMutation.mutate({ noteId });
    }
  };

  const handleSpeak = (messageId: number, text: string) => {
    if (isPlaying && playingMessageId === messageId) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      stop();
      setPlayingMessageId(messageId);
      speak(text);
    }
  };

  const handleStop = () => {
    stop();
    setPlayingMessageId(null);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ask your Note</h2>
          {noteName && (
            <p className="text-sm text-muted-foreground">{noteName}</p>
          )}
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            disabled={deleteChatMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/30">
        <div className="space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start by asking a question about this note.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } gap-2`}
              >
                {msg.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSpeak(idx, msg.message)}
                    className="self-end mb-2"
                  >
                    {isPlaying && playingMessageId === idx ? (
                      isPaused ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Card
                  className={`max-w-xs lg:max-w-md px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.message}</Streamdown>
                  ) : (
                    <p className="text-sm">{msg.message}</p>
                  )}
                  {msg.createdAt && (
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  )}
                </Card>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          placeholder="Ask a question about this note..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isLoadingHistory}
          className="flex-1"
        />
        {isPlaying && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleStop}
          >
            <Pause className="w-4 h-4" />
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
