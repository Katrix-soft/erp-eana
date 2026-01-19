
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatRoom, ChatMessage, SendMessageDto } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { FileUploadService } from '../../core/services/file-upload.service';
import { Subscription, forkJoin, of, lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface PendingFile {
    file: File;
    previewUrl: SafeUrl;
    rawPreviewUrl: string; // Store raw string for internal use
    uploading: boolean;
}

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
    @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

    rooms: ChatRoom[] = [];
    selectedRoom: ChatRoom | null = null;
    messages: ChatMessage[] = [];
    newMessage = '';
    loading = false;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'connecting';

    // File Uploads
    pendingFiles: PendingFile[] = [];
    zoomedImage: string | null = null;

    // Typing
    typingUsers: { userId: number; userName?: string; }[] = [];
    private typingTimeout: any;

    private messageSubscription?: Subscription;
    private typingSubscription?: Subscription;
    userId: number = 0;

    // Colors cache
    private userColors = new Map<number, string>();

    // UI State
    sidebarOpen = false; // Mobile
    isSidebarCollapsed = false; // Desktop

    constructor(
        private chatService: ChatService,
        public authService: AuthService,
        private fileUploadService: FileUploadService,
        private cd: ChangeDetectorRef,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user) {
            this.userId = user.id || 0;
            this.connectAndSetup();
        }
    }

    connectAndSetup(): void {
        this.connectionStatus = 'connecting';
        this.chatService.connectWebSocket();

        // Monitor connection (mocking since service doesn't expose status observable yet)
        setTimeout(() => {
            this.connectionStatus = 'connected'; // Optimistic update
            this.cd.detectChanges();
        }, 1000);

        this.subscribeToMessages();
        this.loadRooms();
    }

    ngOnDestroy(): void {
        this.messageSubscription?.unsubscribe();
        this.typingSubscription?.unsubscribe();
        this.chatService.disconnectWebSocket();
    }

    loadRooms(): void {
        this.loading = true;
        this.chatService.getRooms({ activa: true }).subscribe({
            next: (rooms) => {
                this.rooms = rooms;
                this.loading = false;

                // Auto-select first room if none selected
                if (!this.selectedRoom && rooms.length > 0) {
                    this.selectRoom(rooms[0]);
                }
                this.cd.detectChanges();
            },
            error: (error) => {
                console.error('Error cargando salas:', error);
                this.loading = false;
                this.connectionStatus = 'disconnected';
                this.cd.detectChanges();
            }
        });
    }

    selectRoom(room: ChatRoom): void {
        if (this.selectedRoom?.id === room.id) return;

        if (this.selectedRoom) {
            this.chatService.leaveRoomWebSocket(this.selectedRoom.id);
        }

        this.selectedRoom = room;
        this.messages = [];
        this.loadMessages(room.id);
        this.chatService.joinRoomWebSocket(room.id);

        // Reset inputs
        this.newMessage = '';
        this.pendingFiles = [];
    }

    loadMessages(roomId: number): void {
        this.chatService.getRoomMessages(roomId, 50).subscribe({
            next: (messages) => {
                this.messages = messages.reverse();
                setTimeout(() => this.scrollToBottom(), 100);
            },
            error: (error) => {
                console.error('Error cargando mensajes:', error);
            }
        });
    }

    subscribeToMessages(): void {
        this.messageSubscription = this.chatService.messages$.subscribe({
            next: (message) => {
                if (this.selectedRoom && message.roomId === this.selectedRoom.id) {
                    // Check if we have a pending message that matches
                    const pendingIndex = this.messages.findIndex(m => m.pending && m.userId === message.userId && m.mensaje === message.mensaje);

                    if (pendingIndex !== -1) {
                        // Replace pending with real
                        this.messages[pendingIndex] = message;
                    } else {
                        // Add new
                        this.messages.push(message);
                    }
                    setTimeout(() => this.scrollToBottom(), 100);

                    // Remove from typing if exists
                    this.typingUsers = this.typingUsers.filter(u => u.userId !== message.userId);
                }
            }
        });

        this.typingSubscription = this.chatService.typing$.subscribe({
            next: (data) => {
                if (this.selectedRoom && data.roomId === this.selectedRoom.id && data.userId !== this.userId) {
                    if (data.isTyping) {
                        if (!this.typingUsers.find(u => u.userId === data.userId)) {
                            this.typingUsers.push({ userId: data.userId, userName: data.userName });
                        }
                    } else {
                        this.typingUsers = this.typingUsers.filter(u => u.userId !== data.userId);
                    }
                    this.cd.detectChanges();
                }
            }
        });
    }

    async sendMessage(): Promise<void> {
        console.count('ChatComponent.sendMessage');
        if (!this.selectedRoom || (!this.newMessage.trim() && this.pendingFiles.length === 0)) {
            console.warn('Cannot send: Room not selected or empty message');
            return;
        }

        const messageContent = this.newMessage;
        const currentFiles = [...this.pendingFiles];
        const uploadedUrls: string[] = [];

        // Optimistic UI for immediate feedback
        const optimisticMessage: ChatMessage = {
            id: Date.now() * -1, // Unique temp ID
            roomId: this.selectedRoom.id,
            userId: this.userId,
            mensaje: messageContent,
            imagenes: currentFiles.map(f => f.rawPreviewUrl),
            createdAt: new Date().toISOString(),
            user: {
                id: this.userId,
                email: this.authService.userValue?.email || '',
                personal: this.authService.userValue?.personal
            },
            pending: true
        };

        // Clear inputs immediately
        this.newMessage = '';
        this.pendingFiles = [];
        this.onInput();

        this.messages.push(optimisticMessage);
        this.scrollToBottom();

        try {
            // Upload files if any
            if (currentFiles.length > 0) {
                console.log(`Starting upload for ${currentFiles.length} files...`);
                for (const pf of currentFiles) {
                    try {
                        const res = await lastValueFrom(this.fileUploadService.uploadFile(pf.file));
                        if (res && res.url) {
                            console.log('File uploaded successfully:', res.url);
                            uploadedUrls.push(res.url);
                        }
                    } catch (uploadErr) {
                        console.error('Individual file upload failed:', uploadErr);
                    }
                }
                console.log('All uploads completed. Total URLs:', uploadedUrls.length);
            }

            const dto: SendMessageDto = {
                mensaje: messageContent,
                imagenes: uploadedUrls.length > 0 ? uploadedUrls : []
            };

            console.log('Sending message via WebSocket...', dto);
            this.chatService.sendMessageWebSocket(this.selectedRoom.id, dto);

        } catch (err) {
            console.error('Fatal error in sendMessage flow:', err);
            // Optional: Mark optimistic message as failed
            optimisticMessage.pending = false;
            optimisticMessage.mensaje += ' (FALLÓ EL ENVÍO)';
        }
    }

    // --- Inputs & Files ---

    onEnterKey(event: any): void {
        if (!event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    onInput(): void {
        const textarea = this.messageInput?.nativeElement;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;

            if (!this.newMessage) {
                textarea.style.height = '24px'; // Min height
            }
        }

        // Send typing indicator
        if (this.selectedRoom) {
            this.chatService.sendTyping(this.selectedRoom.id, true);

            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                if (this.selectedRoom) {
                    this.chatService.sendTyping(this.selectedRoom.id, false);
                }
            }, 2000);
        }
    }

    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const objectUrl = URL.createObjectURL(file);
                const previewUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
                this.pendingFiles.push({
                    file: file,
                    previewUrl: previewUrl,
                    rawPreviewUrl: objectUrl,
                    uploading: false
                });
            }
        }
        // Reset input value so change event fires again for same file
        event.target.value = '';
    }

    removePendingFile(index: number): void {
        this.pendingFiles.splice(index, 1);
    }

    isImage(pendingFile: PendingFile): boolean {
        return pendingFile.file.type.startsWith('image/');
    }

    openImageModal(url: string): void {
        this.zoomedImage = url;
    }

    closeImageModal(): void {
        this.zoomedImage = null;
    }

    // --- Helpers for Display ---

    scrollToBottom(): void {
        if (this.scrollContainer) {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        }
    }

    getAuthorName(message: ChatMessage): string {
        if (message.user.personal) {
            return `${message.user.personal.nombre} ${message.user.personal.apellido}`;
        }
        return message.user.email.split('@')[0];
    }

    getAuthorInitial(message: ChatMessage): string {
        return this.getAuthorName(message).charAt(0).toUpperCase();
    }

    isSameUser(index: number): boolean {
        if (index === 0) return false;
        const currentMsg = this.messages[index];
        const prevMsg = this.messages[index - 1];

        // Group if same user AND less than 5 minutes difference
        const timeDiff = new Date(currentMsg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
        return currentMsg.userId === prevMsg.userId && timeDiff < 5 * 60 * 1000;
    }

    shouldShowSeparator(index: number): boolean {
        if (index === 0) return true;
        const currentMsg = this.messages[index];
        const prevMsg = this.messages[index - 1];

        const currentDate = new Date(currentMsg.createdAt).toLocaleDateString();
        const prevDate = new Date(prevMsg.createdAt).toLocaleDateString();

        return currentDate !== prevDate;
    }

    getUserColor(userId: number): string {
        if (!this.userColors.has(userId)) {
            const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
            const hash = userId * 12345; // Simple hash
            this.userColors.set(userId, colors[hash % colors.length]);
        }
        return this.userColors.get(userId)!;
    }

    get currentUserEmailPrefix(): string {
        return this.authService.userValue?.email?.split('@')[0] || 'Usuario';
    }

    get currentUserInitial(): string {
        return (this.authService.userValue?.email || 'U').charAt(0).toUpperCase();
    }

    getTypingText(): string {
        if (this.typingUsers.length === 1) {
            return this.typingUsers[0].userName || 'Alguien';
        } else if (this.typingUsers.length === 2) {
            const name1 = this.typingUsers[0].userName || 'Alguien';
            const name2 = this.typingUsers[1].userName || 'Alguien';
            return `${name1} y ${name2}`;
        } else if (this.typingUsers.length > 2) {
            return 'Varios usuarios';
        }
        return '';
    }
    isUrlImage(url: string): boolean {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    isUrlVideo(url: string): boolean {
        return /\.(mp4|webm|ogg|mov)$/i.test(url);
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    toggleDesktopSidebar(): void {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
}
