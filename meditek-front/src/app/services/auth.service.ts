// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://meditek-backend.onrender.com';

    constructor(
        private http: HttpClient,
        private auth: Auth
    ) { }

    loginWithGoogle(): Observable<LoginResponse> {
        const provider = new GoogleAuthProvider();
        return from(signInWithPopup(this.auth, provider)).pipe(
            switchMap(async (credential) => {
                const idToken = await credential.user.getIdToken();
                return idToken;
            }),
            switchMap((idToken) =>
                this.http.post<LoginResponse>(
                    `${this.apiUrl}/auth/google`,
                    { idToken }
                )
            )
        );
    }

    registerPatient(data: any): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register-patient`, data);
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.auth.signOut();
    }

    saveUserData(loginResponse: LoginResponse): void {
        if (loginResponse.token && loginResponse.user) {
            localStorage.setItem('token', loginResponse.token);
            localStorage.setItem('user', JSON.stringify(loginResponse.user));
        }
    }
}