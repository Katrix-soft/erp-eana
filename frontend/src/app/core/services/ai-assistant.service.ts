
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AiAssistantService {
    private openChatSubject = new Subject<string | undefined>();
    openChat$ = this.openChatSubject.asObservable();

    constructor() { }

    /**
     * Abre la ventana de chat de IA
     */
    open() {
        this.openChatSubject.next(undefined);
    }

    /**
     * Abre la ventana de chat de IA y envía un prompt automáticamente
     * @param prompt El mensaje o contexto técnico para la IA
     */
    openWithPrompt(prompt: string) {
        this.openChatSubject.next(prompt);
    }
}
