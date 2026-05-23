// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient} from '@angular/common/http';

// Interfaces
interface Specialty {
  id: number;
  name: string;
  icon: string;
  description: string;
  doctors: Doctor[];
}

interface Doctor {
  id: number;
  specialtyId: number;
  specialtyName: string;
  userId: number;
  user: { 
    id: number;
    name: string;
    email: string;
    phone: string;
    dni: string;
    age: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  createdAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeTab: string = 'specialties';

  specialties: Specialty[] = [];
  doctors: Doctor[] = [];
  products: Product[] = [];

  showSpecialtyModal: boolean = false;
  showDoctorModal: boolean = false;
  showProductModal: boolean = false;

  editingSpecialty: Specialty | null = null;
  editingDoctor: Doctor | null = null;
  editingProduct: Product | null = null;

  specialtyForm = { name: '', icon: '', description: '' };
  doctorForm = {
    name: '',
    email: '',
    phone: '',
    specialtyId: null as number | null,
    dni: '',
    age: null as number | null
  };
  productForm = { name: '', price: null as number | null, stock: null as number | null, description: '' };

  totalDoctors: number = 0;
  totalProducts: number = 0;
  totalStock: number = 0;
  totalValue: number = 0;
  adminName: string = 'Administrador';

  availableIcons = ['🏥', '❤️', '👶', '🧠', '🦷', '👁️', '🩺', '💊', '🔬', '🩻', '⚕️', '🏨'];

  private apiUrl = 'https://meditek-backend.onrender.com/api';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadAllData();
    this.getAdminName();
  }

  getAdminName(): void {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.adminName = userData.name || 'Administrador';
      } catch (e) {
        this.adminName = 'Administrador';
      }
    }
  }

  loadAllData(): void {
    this.loadSpecialties();
    this.loadDoctors();
    this.loadProducts();
  }

  loadSpecialties(): void {
    this.http.get<Specialty[]>(`${this.apiUrl}/specialties`).subscribe({
      next: (data) => {
        this.specialties = data;
        this.updateAnalytics();
      },
      error: (error) => console.error('Error loading specialties:', error)
    });
  }

  loadDoctors(): void {
    this.http.get<any[]>(`${this.apiUrl}/doctors`).subscribe({
      next: (data) => {
        this.doctors = data.map(doctor => ({
          ...doctor,
          name: doctor.user?.name,
          email: doctor.user?.email,
          phone: doctor.user?.phone
        }));
        this.updateAnalytics();
      },
      error: (error) => console.error('Error loading doctors:', error)
    });
  }


  loadProducts(): void {
    this.http.get<Product[]>(`${this.apiUrl}/products`).subscribe({
      next: (data) => {
        this.products = data;
        this.updateAnalytics();
      },
      error: (error) => console.error('Error loading products:', error)
    });
  }

  updateAnalytics(): void {
    this.totalDoctors = this.doctors.length;
    this.totalProducts = this.products.length;
    this.totalStock = this.products.reduce((sum, p) => sum + (p.stock || 0), 0);
    this.totalValue = this.products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
  }

  // ==================== ESPECIALIDADES ====================
  openSpecialtyModal(specialty?: Specialty): void {
    if (specialty) {
      this.editingSpecialty = specialty;
      this.specialtyForm = {
        name: specialty.name,
        icon: specialty.icon,
        description: specialty.description
      };
    } else {
      this.editingSpecialty = null;
      this.specialtyForm = { name: '', icon: '🏥', description: '' };
    }
    this.showSpecialtyModal = true;
  }

  saveSpecialty(): void {
    if (!this.specialtyForm.name) return;

    if (this.editingSpecialty) {
      this.http.put(`${this.apiUrl}/specialties/${this.editingSpecialty.id}`, this.specialtyForm)
        .subscribe({
          next: () => {
            this.loadSpecialties();
            this.closeSpecialtyModal();
          },
          error: (error) => console.error('Error updating specialty:', error)
        });
    } else {
      this.http.post(`${this.apiUrl}/specialties`, this.specialtyForm)
        .subscribe({
          next: () => {
            this.loadSpecialties();
            this.closeSpecialtyModal();
          },
          error: (error) => console.error('Error creating specialty:', error)
        });
    }
  }

  deleteSpecialty(id: number): void {
    if (confirm('¿Eliminar esta especialidad? Se eliminarán los doctores asociados.')) {
      this.http.delete(`${this.apiUrl}/specialties/${id}`).subscribe({
        next: () => {
          this.loadSpecialties();
          this.loadDoctors();
        },
        error: (error) => console.error('Error deleting specialty:', error)
      });
    }
  }

  closeSpecialtyModal(): void {
    this.showSpecialtyModal = false;
    this.editingSpecialty = null;
  }

  // ==================== DOCTORES ====================

  openDoctorModal(doctor?: Doctor): void {
    if (doctor) {
      this.editingDoctor = doctor;
      // Los datos vienen de doctor.user
      this.doctorForm = {
        name: doctor.user?.name || '',
        email: doctor.user?.email || '',
        phone: doctor.user?.phone || '',
        specialtyId: doctor.specialtyId,
        dni: doctor.user?.dni || '',
        age: doctor.user?.age || null
      };
    } else {
      this.editingDoctor = null;
      this.doctorForm = {
        name: '',
        email: '',
        phone: '',
        specialtyId: null,
        dni: '',
        age: null
      };
    }
    this.showDoctorModal = true;
  }

  saveDoctor(): void {
    if (!this.doctorForm.name || !this.doctorForm.specialtyId) return;

    const doctorData = {
      name: this.doctorForm.name,
      email: this.doctorForm.email,
      phone: this.doctorForm.phone,
      specialtyId: this.doctorForm.specialtyId,
      dni: this.doctorForm.dni,
      age: this.doctorForm.age
    };

    if (this.editingDoctor) {
      this.http.put(`${this.apiUrl}/doctors/${this.editingDoctor.id}`, doctorData)
        .subscribe({
          next: () => {
            this.loadDoctors();
            this.closeDoctorModal();
          },
          error: (error) => console.error('Error updating doctor:', error)
        });
    } else {
      this.http.post(`${this.apiUrl}/doctors`, doctorData)
        .subscribe({
          next: () => {
            this.loadDoctors();
            this.closeDoctorModal();
          },
          error: (error) => console.error('Error creating doctor:', error)
        });
    }
  }

  deleteDoctor(id: number): void {
    if (confirm('¿Eliminar este doctor?')) {
      this.http.delete(`${this.apiUrl}/doctors/${id}`).subscribe({
        next: () => this.loadDoctors(),
        error: (error) => console.error('Error deleting doctor:', error)
      });
    }
  }

  closeDoctorModal(): void {
    this.showDoctorModal = false;
    this.editingDoctor = null;
  }

  getSpecialtyName(specialtyId: number): string {
    const specialty = this.specialties.find(s => s.id === specialtyId);
    return specialty?.name || 'No asignada';
  }

  // ==================== FARMACIA ====================
  openProductModal(product?: Product): void {
    if (product) {
      this.editingProduct = product;
      this.productForm = {
        name: product.name,
        price: product.price,
        stock: product.stock,
        description: product.description
      };
    } else {
      this.editingProduct = null;
      this.productForm = { name: '', price: null, stock: null, description: '' };
    }
    this.showProductModal = true;
  }

  saveProduct(): void {
    if (!this.productForm.name || this.productForm.price === null || this.productForm.stock === null) return;

    if (this.editingProduct) {
      this.http.put(`${this.apiUrl}/products/${this.editingProduct.id}`, this.productForm)
        .subscribe({
          next: () => {
            this.loadProducts();
            this.closeProductModal();
          },
          error: (error) => console.error('Error updating product:', error)
        });
    } else {
      this.http.post(`${this.apiUrl}/products`, this.productForm)
        .subscribe({
          next: () => {
            this.loadProducts();
            this.closeProductModal();
          },
          error: (error) => console.error('Error creating product:', error)
        });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('¿Eliminar este producto?')) {
      this.http.delete(`${this.apiUrl}/products/${id}`).subscribe({
        next: () => this.loadProducts(),
        error: (error) => console.error('Error deleting product:', error)
      });
    }
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProduct = null;
  }

  // ==================== UTILIDADES ====================
  changeTab(tab: string): void {
    this.activeTab = tab;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  closeModalOnBackdrop(event: MouseEvent, modalType: string): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      switch (modalType) {
        case 'specialty':
          this.closeSpecialtyModal();
          break;
        case 'doctor':
          this.closeDoctorModal();
          break;
        case 'product':
          this.closeProductModal();
          break;
      }
    }
  }
}