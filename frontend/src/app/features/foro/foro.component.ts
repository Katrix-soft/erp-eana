import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ForoService, ForoPost, CreateForoPostDto } from '../../core/services/foro.service';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-foro',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './foro.component.html',
    styleUrls: ['./foro.component.css']
})
export class ForoComponent implements OnInit {
    posts: ForoPost[] = [];
    selectedPost: ForoPost | null = null;
    showNewPostModal = false;
    loading = false;

    newPost: CreateForoPostDto = {
        titulo: '',
        contenido: '',
    };

    newComment = '';

    filters = {
        resuelto: undefined as boolean | undefined,
        sector: undefined as string | undefined,
    };

    constructor(
        private foroService: ForoService,
        private authService: AuthService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadPosts();
    }

    page = 1; // página actual
    limit = 20; // tamaño de página (coincide con backend)
    noMore = false; // indica si ya no hay más posts

    // Carga posts con paginación. Si `reset` es true, reinicia la lista.
    loadPosts(reset: boolean = false): void {
        if (reset) {
            this.page = 1;
            this.posts = [];
            this.noMore = false;
        }
        this.loading = true;
        const filters = {
            ...this.filters,
            page: this.page,
            limit: this.limit,
        };
        console.log('Cargando posts con filtros:', filters);

        this.foroService.getPosts(filters)
            .pipe(finalize(() => {
                this.loading = false;
                this.cd.detectChanges(); // Forzar actualización de vista
            }))
            .subscribe({
                next: (posts) => {
                    console.log('Posts recibidos:', posts);
                    const newPosts = posts || [];
                    this.posts = [...this.posts, ...newPosts];

                    if (newPosts.length < this.limit) {
                        this.noMore = true;
                    } else {
                        this.page++;
                    }
                    this.cd.detectChanges();
                },
                error: (error) => {
                    console.error('Error cargando posts:', error);
                },
            });
    }

    // llamado desde la UI al pulsar "Cargar más"
    loadMore(): void {
        if (this.loading || this.noMore) return;
        this.loadPosts();
    }

    openNewPostModal(): void {
        this.showNewPostModal = true;
    }

    closeNewPostModal(): void {
        this.showNewPostModal = false;
        this.newPost = {
            titulo: '',
            contenido: '',
        };
    }

    createPost(): void {
        if (!this.newPost.titulo || !this.newPost.contenido) {
            return;
        }

        this.loading = true;

        // Ensure no extra properties like 'resuelto' are sent if they are undefined
        const postData: CreateForoPostDto = {
            titulo: this.newPost.titulo,
            contenido: this.newPost.contenido,
            sector: this.newPost.sector,
            imagenes: this.newPost.imagenes
        };

        this.foroService.createPost(postData).subscribe({
            next: (post) => {
                this.posts.unshift(post);
                this.closeNewPostModal();
                this.loading = false;
                alert('¡Post publicado con éxito!');
                this.cd.detectChanges();
            },
            error: (error) => {
                console.error('Error creando post:', error);
                this.loading = false;
                const msg = error.error?.message || 'Error al publicar. Verifica que el título tenga al menos 3 letras y el contenido 10.';
                alert(msg);
            }
        });
    }

    viewPost(post: ForoPost): void {
        this.foroService.getPost(post.id).subscribe({
            next: (fullPost) => {
                this.selectedPost = fullPost;
            },
            error: (error) => {
                console.error('Error cargando post:', error);
            }
        });
    }

    closePostDetail(): void {
        this.selectedPost = null;
    }

    addComment(): void {
        if (!this.selectedPost || !this.newComment.trim()) {
            return;
        }

        this.foroService.createComment(this.selectedPost.id, {
            contenido: this.newComment
        }).subscribe({
            next: (comment) => {
                if (this.selectedPost) {
                    if (!this.selectedPost.comentarios) {
                        this.selectedPost.comentarios = [];
                    }
                    this.selectedPost.comentarios.push(comment);
                    this.newComment = '';
                }
            },
            error: (error) => {
                console.error('Error agregando comentario:', error);
            }
        });
    }

    markAsResolved(post: ForoPost): void {
        this.foroService.updatePost(post.id, { resuelto: true }).subscribe({
            next: (updatedPost) => {
                const index = this.posts.findIndex(p => p.id === post.id);
                if (index !== -1) {
                    this.posts[index] = updatedPost;
                }
                if (this.selectedPost && this.selectedPost.id === post.id) {
                    this.selectedPost.resuelto = true;
                }
            },
            error: (error) => {
                console.error('Error marcando como resuelto:', error);
            }
        });
    }

    getAuthorName(post: ForoPost): string {
        if (post.autor.personal) {
            return `${post.autor.personal.nombre} ${post.autor.personal.apellido}`;
        }
        return post.autor.email;
    }

    applyFilters(): void {
        this.loadPosts(true);
    }

    deletePost(post: ForoPost): void {
        if (!confirm('¿Estás seguro de que deseas eliminar este post? Esta acción no se puede deshacer.')) {
            return;
        }

        this.foroService.deletePost(post.id).subscribe({
            next: () => {
                this.posts = this.posts.filter(p => p.id !== post.id);
                this.closePostDetail();
                alert('Post eliminado correctamente');
            },
            error: (error) => {
                console.error('Error eliminando post:', error);
                alert('No se pudo eliminar el post.');
            }
        });
    }

    canManagePost(post: ForoPost): boolean {
        const user = this.authService.userValue;
        if (!user) return false;
        return user.role === 'ADMIN' || post.autorId === user.id;
    }
}
