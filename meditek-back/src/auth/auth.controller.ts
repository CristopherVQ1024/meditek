// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public() 
    @Post('google')
    @HttpCode(HttpStatus.OK)
    async googleLogin(@Body('idToken') idToken: string) {
        return this.authService.googleLogin(idToken);
    }
}