import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'meditek';
  menuOpen = false;
  showNavbarFooter = true;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.checkVisibility();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkVisibility();
    });
  }

  checkVisibility(): void {
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    const currentUrl = this.router.url;
    const isHomeRoute = currentUrl === '/home' || currentUrl === '/';

    this.showNavbarFooter = !isLoggedIn || (isLoggedIn && isHomeRoute);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}