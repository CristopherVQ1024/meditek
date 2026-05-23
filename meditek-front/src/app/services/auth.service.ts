// auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: {
        id: number;
        email: string;
        name: string;
        role: string;
        dni?: string;
        doctorId?: number;
        patientId?: number;
    };
    isFirstLogin?: boolean;
    requiresRegistration?: boolean;
    needsProfileCompletion?: boolean;
    redirectTo?: string;
    firebaseData?: {
        uid: string;
        email: string;
        name: string;
    };
    message?: string;
}

const TOKEN_KEY = 'meditek_token';
const USER_KEY = 'meditek_user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://meditek-backend.onrender.com/api';

    currentUser = signal<LoginResponse['user'] | null>(this.loadUser());

    constructor(
        private http: HttpClient,
        private auth: Auth,
        private router: Router
    ) { }

    loginWithGoogle(): Observable<LoginResponse> {
        const provider = new GoogleAuthProvider();
        return from(signInWithPopup(this.auth, provider)).pipe(
            switchMap(async (credential) => credential.user.getIdToken()),
            switchMap((idToken) =>
                this.http.post<LoginResponse>(`${this.apiUrl}/auth/google`, { idToken })
            ),
            tap((res) => this.saveUserData(res)) 
        );
    }

    registerPatient(data: any): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register-patient`, data);
    }

    saveUserData(res: LoginResponse): void {
        if (res.token && res.user) {
            localStorage.setItem(TOKEN_KEY, res.token);
            localStorage.setItem(USER_KEY, JSON.stringify(res.user));
            this.currentUser.set(res.user);
        }
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getRole(): string | null {
        return this.currentUser()?.role ?? null;
    }

    logout(): void {
        localStorage.clear();  
        this.currentUser.set(null);
        this.auth.signOut();
        this.router.navigate(['/login']);
    }

    private loadUser(): LoginResponse['user'] | null {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    }
}