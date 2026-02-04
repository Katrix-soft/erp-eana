
import { Component, inject, OnInit, signal, OnDestroy, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MessageSquare, X, Send, Bot, User, Sparkles, Maximize2, Minimize2, Eraser, Paperclip, FileText, Image as ImageIcon, Trash2, History, Mic, Volume2, Square } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';
import { ToastService } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';

declare var webkitSpeechRecognition: any;

interface ChatAttachment {
  mimeType: string;
  data?: string;
  filename: string;
  previewUrl?: any;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: ChatAttachment;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      <!-- Chat Window -->
      <div *ngIf="isOpen()" 
        class="glass-effect rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border border-white/10"
        [ngClass]="isExpanded ? 'w-[90vw] h-[80vh] md:w-[600px] md:h-[700px]' : 'w-[350px] h-[calc(100vh-140px)] max-h-[600px]'">
        
        <!-- Header -->
        <div class="bg-slate-900/95 backdrop-blur-md p-3 flex justify-between items-center border-b border-white/5 shrink-0 cursor-pointer h-14"
             (click)="toggleExpand()">
          <div class="flex items-center gap-3">
            <div class="p-1.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-lg shadow-blue-500/20">
              <lucide-icon [name]="Bot" [size]="18" class="text-white"></lucide-icon>
            </div>
            <div>
              <h3 class="text-white font-bold text-sm leading-none">Asistente EANA</h3>
              <span class="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full animate-pulse transition-colors"
                      [ngClass]="isOnline() ? 'bg-emerald-500' : 'bg-red-500'"></span>
                {{ isOnline() ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
            <button (click)="toggleAutoSpeak()" class="p-2 rounded-lg transition-all" 
                   [ngClass]="autoSpeakEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                   title="Lectura automática">
              <lucide-icon [name]="Volume2" [size]="16"></lucide-icon>
            </button>
            <button (click)="loadHistory()" class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Recargar historial">
              <lucide-icon [name]="History" [size]="16"></lucide-icon>
            </button>
            <button (click)="clearChat()" class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Limpiar sesión">
              <lucide-icon [name]="Eraser" [size]="16"></lucide-icon>
            </button>
            <button (click)="toggleExpand()" class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" [title]="isExpanded ? 'Minimizar' : 'Expandir'">
              <lucide-icon [name]="isExpanded ? Minimize2 : Maximize2" [size]="16"></lucide-icon>
            </button>
            <button (click)="toggleChat()" class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Cerrar">
              <lucide-icon [name]="X" [size]="18"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-950/60 scroll-smooth" #scrollContainer>
          
          <div *ngIf="messages().length === 0 && !loadingHistory" class="h-full flex flex-col items-center justify-center text-center p-6 opacity-50">
            <lucide-icon [name]="Bot" [size]="48" class="text-slate-600 mb-4"></lucide-icon>
            <p class="text-slate-400 text-sm">Historial sincronizado.</p>
          </div>

          <div *ngIf="loadingHistory" class="flex justify-center py-10">
             <lucide-icon [name]="Sparkles" [size]="24" class="text-blue-500 animate-spin"></lucide-icon>
          </div>

          <div *ngFor="let msg of messages()" 
            class="flex flex-col gap-1 animate-fade-in"
            [ngClass]="msg.role === 'user' ? 'items-end' : 'items-start'">
            
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-2">
              {{ msg.role === 'user' ? 'Tú' : 'EANA AI' }}
              <button *ngIf="msg.role === 'assistant'" (click)="speak(msg.content)" class="hover:text-blue-400 transition-colors" title="Leer en voz alta">
                 <lucide-icon [name]="Volume2" [size]="10"></lucide-icon>
              </button>
            </span>

            <div [ngClass]="msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-white/5'"
              class="max-w-[85%] p-3.5 text-sm shadow-lg relative group overflow-hidden">
              
              <div *ngIf="msg.attachment" class="mb-3 p-2 bg-black/20 rounded-lg border border-white/10 flex items-center gap-3">
                <div class="p-2 bg-white/10 rounded-lg">
                   <lucide-icon [name]="msg.attachment.mimeType.includes('image') ? ImageIcon : FileText" [size]="20"></lucide-icon>
                </div>
                <div class="overflow-hidden flex-1">
                  <p class="text-xs font-bold truncate max-w-[150px]">{{ msg.attachment.filename }}</p>
                  <a *ngIf="msg.attachment.previewUrl" [href]="msg.attachment.previewUrl" target="_blank" class="text-[10px] text-blue-300 hover:text-white underline block mt-1">Ver archivo</a>
                </div>
                <img *ngIf="msg.attachment.mimeType.includes('image')" [src]="getPreviewSource(msg.attachment)" class="w-10 h-10 object-cover rounded ml-auto border border-white/20">
              </div>

              <div class="whitespace-pre-wrap leading-relaxed markdown-content" [innerHTML]="formatMessage(msg.content)"></div>
            </div>
          </div>
          
          <div *ngIf="loading()" class="flex flex-col gap-1 items-start w-full opacity-0 animate-fade-in">
             <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">EANA AI</span>
             <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1.5 items-center w-fit">
               <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
               <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
               <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
          
          <div class="h-2"></div>
        </div>

        <!-- Input Area -->
        <div class="p-3 bg-slate-900 border-t border-white/10 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10">
          
          <!-- Stop Speaking Button (Visible only when speaking) -->
          <button *ngIf="isSpeaking" (click)="stopSpeaking()" 
            class="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-20">
            <lucide-icon [name]="Square" [size]="10"></lucide-icon> Detener Voz
          </button>

          <div *ngIf="pendingAttachment" class="mb-2 p-2 bg-slate-800 rounded-xl border border-blue-500/30 flex items-center gap-3 animate-fade-in relative group">
            <button (click)="removeAttachment()" class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors z-10">
              <lucide-icon [name]="X" [size]="12"></lucide-icon>
            </button>
            <div class="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><lucide-icon [name]="pendingAttachment.mimeType.includes('image') ? ImageIcon : FileText" [size]="16"></lucide-icon></div>
            <p class="text-xs font-bold text-white truncate flex-1">{{ pendingAttachment.filename }}</p>
          </div>

          <form (submit)="sendMessage($event)" class="relative flex items-end gap-2">
            <input type="file" #fileInput class="hidden" (change)="handleFileSelect($event)" accept="image/*,application/pdf">
            
            <button type="button" (click)="fileInput.click()" [disabled]="loading()"
              class="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95 disabled:opacity-50 h-12 w-12 flex items-center justify-center">
              <lucide-icon [name]="Paperclip" [size]="20"></lucide-icon>
            </button>

            <div class="flex-1 relative">
              <input type="text" [(ngModel)]="userInput" name="query"
                [placeholder]="isListening ? 'Escuchando... 🗣️' : 'Escribe o dicta...'"
                [disabled]="loading() || isListening"
                class="w-full h-12 bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 disabled:opacity-50">
              
              <button type="submit" [disabled]="loading() || (!userInput.trim() && !pendingAttachment)"
                class="absolute right-1 top-1 bottom-1 w-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-white transition-all flex items-center justify-center">
                <lucide-icon [name]="Send" [size]="18"></lucide-icon>
              </button>
            </div>

            <!-- Mic Button -->
            <button type="button" (click)="toggleListening()"
               [class]="isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'"
               class="p-3 rounded-xl border border-white/5 transition-all active:scale-95 h-12 w-12 flex items-center justify-center shadow-lg"
               [title]="isListening ? 'Detener dictado' : 'Dictar pregunta'">
               <lucide-icon [name]="Mic" [size]="20"></lucide-icon>
            </button>
          </form>
        </div>
      </div>

      <!-- Trigger Button -->
      <button (click)="toggleChat()" *ngIf="!isOpen()"
        class="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all duration-300 hover:scale-110 flex items-center justify-center group overflow-hidden relative z-50">
        <lucide-icon [name]="MessageSquare" [size]="28" class="relative z-10"></lucide-icon>
        <span class="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center z-20">
            <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
        </span>
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .glass-effect {
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .markdown-content ::ng-deep {
      strong { font-weight: 700; color: #fff; }
      ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
      li { margin-bottom: 0.25rem; }
      p { margin-bottom: 0.5rem; }
      a { color: #60a5fa; text-decoration: underline; }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  `]
})
export class AiAssistantComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  private http: HttpClient = inject(HttpClient);
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  private aiService: AiAssistantService = inject(AiAssistantService);
  private toastService = inject(ToastService);
  private subscription: Subscription = new Subscription();

  isOpen = signal(false);
  isExpanded = false;
  isOnline = signal(true);
  loading = signal(false);
  loadingHistory = false;
  userInput = '';

  pendingAttachment: { mimeType: string, data: string, filename: string, previewUrl?: any } | null = null;

  messages = signal<ChatMessage[]>([]);

  // Voice State
  isListening = false;
  isSpeaking = false;
  autoSpeakEnabled = false;
  private recognition!: any;
  private synthesis!: SpeechSynthesis;

  readonly MessageSquare = MessageSquare;
  readonly X = X;
  readonly Send = Send;
  readonly Bot = Bot;
  readonly User = User;
  readonly Sparkles = Sparkles;
  readonly Maximize2 = Maximize2;
  readonly Minimize2 = Minimize2;
  readonly Eraser = Eraser;
  readonly Paperclip = Paperclip;
  readonly FileText = FileText;
  readonly ImageIcon = ImageIcon;
  readonly Trash2 = Trash2;
  readonly History = History;
  readonly Mic = Mic;
  readonly Volume2 = Volume2;
  readonly Square = Square;

  constructor() {
    // Init Speech APIs (Browser dependent)
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;

      if ('webkitSpeechRecognition' in window) {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'es-ES';
        this.recognition.interimResults = false;

        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.userInput = transcript;
          this.isListening = false;
          // Auto send after dictation? Optional. Let's let user confirm.
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech error', event);
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      }
    }

    effect(() => {
      const msgs = this.messages();
      const isLoading = this.loading();
      setTimeout(() => this.scrollToBottom(), 50);
      setTimeout(() => this.scrollToBottom(), 150);
    });
  }

  ngOnInit() {
    this.loadHistory();

    this.subscription.add(
      this.aiService.openChat$.subscribe(prompt => {
        this.isOpen.set(true);
        if (prompt) {
          this.userInput = prompt;
          this.sendMessage();
        }
        setTimeout(() => this.scrollToBottom(), 300);
      })
    );
  }

  ngAfterViewChecked() { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.stopSpeaking();
  }

  // Voice Methods
  toggleListening() {
    if (!this.recognition) {
      this.toastService.warning('Tu navegador no soporta reconocimiento de voz.');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.userInput = '';
      this.recognition.start();
      this.isListening = true;
      this.stopSpeaking(); // Stop any bot speech if dictating
    }
  }

  toggleAutoSpeak() {
    this.autoSpeakEnabled = !this.autoSpeakEnabled;
    if (!this.autoSpeakEnabled) this.stopSpeaking();
  }

  speak(text: string) {
    if (!this.synthesis) return;
    this.stopSpeaking();

    // Clean markdown slightly specifically for speech
    const cleanText = text.replace(/[*_#`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a good Spanish voice
    const voices = this.synthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google')) || voices.find(v => v.lang.includes('es'));
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => { this.isSpeaking = false; };
    utterance.onerror = () => { this.isSpeaking = false; };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
  }

  loadHistory() {
    this.loadingHistory = true;
    this.http.get<any>('/api/v1/ai-assistant/history').subscribe({
      next: (res) => {
        if (res.success && res.history) {
          if (res.history.length === 0) {
            this.messages.set([{
              role: 'assistant',
              content: `👋 **Asistente Técnico EANA** (con Voz 🔊)\n\nPuedes dictar tus preguntas y yo leeré las respuestas.\n\n📎 **Manuales:** Adjunta PDFs o imágenes usando el clip para consultarlos.`
            }]);
          } else {
            this.messages.set(res.history);
          }
        }
        this.isOnline.set(true);
        this.loadingHistory = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        this.loadingHistory = false;
        this.isOnline.set(false);
        const detail = err.status === 0 ? 'Sin conexión al servidor' : `Error ${err.status}`;
        this.messages.set([{ role: 'assistant', content: `👋 **Asistente EANA**\n⚠️ Offline: ${detail}. \n\nVerifica que el backend esté corriendo.` }]);
      }
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) setTimeout(() => this.scrollToBottom(), 200);
    else this.stopSpeaking(); // Stop speech if closed
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    setTimeout(() => this.scrollToBottom(), 200);
  }

  clearChat() {
    this.stopSpeaking();
    this.messages.set([]);
    this.pendingAttachment = null;
  }

  formatMessage(content: string): SafeHtml {
    let formatted = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
    if (formatted.includes('<li>')) formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    return this.sanitizer.sanitize(1, formatted) || formatted;
  }

  getPreviewSource(attachment: ChatAttachment): any {
    if (attachment.data) return this.sanitizer.bypassSecurityTrustUrl('data:' + attachment.mimeType + ';base64,' + attachment.data);
    if (attachment.previewUrl) return attachment.previewUrl;
    return '';
  }

  handleFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('Máximo 10MB por archivo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64Data = e.target.result.split(',')[1];
      this.pendingAttachment = {
        mimeType: file.type,
        data: base64Data,
        filename: file.name,
        previewUrl: this.sanitizer.bypassSecurityTrustUrl(e.target.result)
      };
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  removeAttachment() {
    this.pendingAttachment = null;
  }

  sendMessage(event?: Event) {
    if (event) event.preventDefault();
    if ((!this.userInput.trim() && !this.pendingAttachment) || this.loading()) return;

    this.stopSpeaking(); // Stop any pending speech

    const query = this.userInput;
    const attachment = this.pendingAttachment ? {
      mimeType: this.pendingAttachment.mimeType,
      data: this.pendingAttachment.data,
      filename: this.pendingAttachment.filename
    } : undefined;

    this.userInput = '';
    this.pendingAttachment = null;

    this.messages.update(prev => [...prev, { role: 'user', content: query, attachment }]);
    this.loading.set(true);
    setTimeout(() => this.scrollToBottom(), 50);

    const payload = { messages: [...this.messages()] };
    this.http.post<any>('/api/v1/ai-assistant/chat', payload).subscribe({
      next: (res) => {
        if (res.success && res.response) {
          const newMsg = { role: 'assistant' as const, content: res.response };
          this.messages.update(prev => [...prev, newMsg]);

          if (this.autoSpeakEnabled) {
            setTimeout(() => this.speak(res.response), 100);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        const detail = err.status === 0 ? 'Sin conexión' : `Error ${err.status}`;
        const errMsg = `⚠️ Error enviando mensaje (${detail}). verifica tu conexión.`;
        this.messages.update(prev => [...prev, { role: 'assistant', content: errMsg }]);
        this.loading.set(false);
        if (this.autoSpeakEnabled) this.speak(errMsg);
      }
    });
  }

  private scrollToBottom() {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
